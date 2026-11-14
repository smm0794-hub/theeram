import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { fetchAll } from '@/lib/fetch-all'

export const dynamic = 'force-dynamic'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const WEEKS_WINDOW = 8

export async function GET() {
  try {
    const db = createServiceClient()

    // Try selecting the v4 enriched inquiry columns first; fall back cleanly if migration hasn't been applied yet
    const fetchEnquiries = async () => {
      try {
        return await fetchAll((from, to) =>
          db.from('inquiries')
            .select('id, created_at, property_id, view_id, event_type, event_date, is_flexible_date, guest_count, is_over_capacity, channel, session_id, properties(id, name, slug, town_id, is_featured, photos, towns(id, name, hero_bg_color))')
            .order('created_at', { ascending: false }).order('id').range(from, to)
        )
      } catch {
        return await fetchAll((from, to) =>
          db.from('inquiries')
            .select('id, created_at, property_id, view_id, event_type, properties(id, name, slug, town_id, is_featured, photos, towns(id, name, hero_bg_color))')
            .order('created_at', { ascending: false }).order('id').range(from, to)
        )
      }
    }

    // fetchAll pages past Supabase's 1000-row response cap (this was why totals stuck at 1000)
    const [rawEnquiryRows, viewRows, propsResult] = await Promise.all([
      fetchEnquiries(),
      fetchAll((from, to) => db.from('property_views').select('id, viewed_at, duration_seconds, property_id, session_id, visitor_country, visitor_region, properties(id, name, slug, town_id, is_featured, photos, towns(id, name, hero_bg_color))').order('viewed_at', { ascending: false }).order('id').range(from, to)),
      db.from('properties').select('id, name, slug, town_id, is_active, is_featured, photos, created_at, towns(id, name, hero_bg_color)').eq('is_active', true),
    ])

    // Direct owner contact (WhatsApp / phone) vs micro-signals (share / maps / instagram)
    const isDirectLead = (r: any) => !r.channel || r.channel === 'whatsapp' || r.channel === 'whatsapp_skip' || r.channel === 'phone'
    const enquiryRows = rawEnquiryRows.filter(isDirectLead)

    const allProps = propsResult.data ?? []

    const now = Date.now()
    const day7 = 7 * 24 * 60 * 60 * 1000
    const day14 = 14 * 24 * 60 * 60 * 1000
    const day30 = 30 * 24 * 60 * 60 * 1000

    // ── Demand Intelligence (Dates, Pax, Over-Capacity, Channels, Cross-Shopping) ──
    const dateCountMap: Record<string, { date: string; count: number; totalPax: number; properties: Set<string> }> = {}
    const paxBuckets: Record<string, number> = {
      'Up to 50 (Intimate)': 0,
      '51–100 (Gathering)': 0,
      '101–200 (Celebration)': 0,
      '201–350 (Large)': 0,
      '350+ (Grand)': 0,
    }
    const channelCounts: Record<string, number> = {
      whatsapp: 0,
      whatsapp_skip: 0,
      phone: 0,
      share_family: 0,
      share_link: 0,
      maps: 0,
      instagram: 0,
    }
    const occasionCounts: Record<string, number> = {}
    let flexibleDateCount = 0
    let fixedDateCount = 0
    let overCapacityCount = 0
    let leadTimeDaysSum = 0
    let leadTimeCount = 0
    let paxSum = 0
    let paxCount = 0

    rawEnquiryRows.forEach((r: any) => {
      const ch = r.channel || 'whatsapp'
      channelCounts[ch] = (channelCounts[ch] ?? 0) + 1

      if (!isDirectLead(r)) return

      if (r.event_type && r.event_type !== 'general') {
        occasionCounts[r.event_type] = (occasionCounts[r.event_type] ?? 0) + 1
      }
      if (r.is_flexible_date) flexibleDateCount++
      if (r.event_date) {
        fixedDateCount++
        const dStr = String(r.event_date).slice(0, 10)
        if (!dateCountMap[dStr]) dateCountMap[dStr] = { date: dStr, count: 0, totalPax: 0, properties: new Set() }
        dateCountMap[dStr].count++
        if (typeof r.guest_count === 'number' && r.guest_count > 0) dateCountMap[dStr].totalPax += r.guest_count
        if (r.properties?.name) dateCountMap[dStr].properties.add(r.properties.name)

        const eventMs = new Date(`${dStr}T00:00:00Z`).getTime()
        const createdMs = new Date(r.created_at).getTime()
        const diffDays = Math.round((eventMs - createdMs) / (24 * 60 * 60 * 1000))
        if (diffDays >= 0 && diffDays <= 730) {
          leadTimeDaysSum += diffDays
          leadTimeCount++
        }
      }
      if (typeof r.guest_count === 'number' && r.guest_count > 0) {
        const g = r.guest_count
        paxSum += g
        paxCount++
        if (g <= 50) paxBuckets['Up to 50 (Intimate)']++
        else if (g <= 100) paxBuckets['51–100 (Gathering)']++
        else if (g <= 200) paxBuckets['101–200 (Celebration)']++
        else if (g <= 350) paxBuckets['201–350 (Large)']++
        else paxBuckets['350+ (Grand)']++
      }
      if (r.is_over_capacity) overCapacityCount++
    })

    const hotDates = Object.values(dateCountMap)
      .sort((a, b) => b.count - a.count || a.date.localeCompare(b.date))
      .slice(0, 8)
      .map(d => ({
        date: d.date,
        count: d.count,
        avg_pax: d.count > 0 && d.totalPax > 0 ? Math.round(d.totalPax / d.count) : null,
        properties: Array.from(d.properties),
      }))

    const demandInsights = {
      hot_dates: hotDates,
      fixed_date_count: fixedDateCount,
      flexible_date_count: flexibleDateCount,
      avg_lead_time_days: leadTimeCount > 0 ? Math.round(leadTimeDaysSum / leadTimeCount) : null,
      avg_guest_count: paxCount > 0 ? Math.round(paxSum / paxCount) : null,
      over_capacity_count: overCapacityCount,
      pax_breakdown: Object.entries(paxBuckets).map(([label, count]) => ({ label, count })),
      channel_breakdown: channelCounts,
      occasion_breakdown: Object.entries(occasionCounts)
        .map(([occasion, count]) => ({ occasion, count }))
        .sort((a, b) => b.count - a.count),
    }

    const viewsWithDuration = viewRows.filter((r: any) => typeof r.duration_seconds === 'number' && r.duration_seconds > 0)
    const avgDurationSeconds = viewsWithDuration.length
      ? Math.round(viewsWithDuration.reduce((s: number, r: any) => s + r.duration_seconds, 0) / viewsWithDuration.length)
      : null

    // ── Duration split: views that led to an enquiry vs. views that didn't ──
    // (view_id on inquiries already links back to the exact property_views row)
    const inquiredViewIds = new Set(enquiryRows.map((r: any) => r.view_id).filter(Boolean))
    const durationsWithEnquiry = viewsWithDuration.filter((r: any) => inquiredViewIds.has(r.id))
    const durationsNoEnquiry = viewsWithDuration.filter((r: any) => !inquiredViewIds.has(r.id))
    const avgOf = (arr: any[]) => arr.length ? Math.round(arr.reduce((s, r) => s + r.duration_seconds, 0) / arr.length) : null

    const durationStats = {
      avg_all: avgDurationSeconds,
      avg_viewed_only: avgOf(durationsNoEnquiry),
      avg_viewed_and_enquired: avgOf(durationsWithEnquiry),
      count_viewed_only: durationsNoEnquiry.length,
      count_viewed_and_enquired: durationsWithEnquiry.length,
    }

    // ── Session behaviour: how many distinct properties per session? ────────
    // A session that only ever touches 1 property looks like targeted/direct
    // traffic (Googled the property name, WhatsApp share link, etc). A session
    // touching 2+ properties looks like generic discovery browsing.
    const sessionMap: Record<string, Set<string>> = {}
    viewRows.forEach((r: any) => {
      const sid = r.session_id
      if (!sid || !r.property_id) return
      if (!sessionMap[sid]) sessionMap[sid] = new Set()
      sessionMap[sid].add(r.property_id)
    })
    const sessionSizes = Object.values(sessionMap).map(s => s.size)
    const totalSessions = sessionSizes.length
    const singlePropertySessions = sessionSizes.filter(n => n === 1).length
    const multiPropertySessions = totalSessions - singlePropertySessions
    const sessionStats = {
      total_sessions: totalSessions,
      single_property_sessions: singlePropertySessions,
      multi_property_sessions: multiPropertySessions,
      single_pct: totalSessions > 0 ? Math.round((singlePropertySessions / totalSessions) * 100) : 0,
      multi_pct: totalSessions > 0 ? Math.round((multiPropertySessions / totalSessions) * 100) : 0,
      avg_properties_per_session: totalSessions > 0 ? Math.round((sessionSizes.reduce((s, n) => s + n, 0) / totalSessions) * 10) / 10 : 0,
    }

    // ── Location breakdown: country, and region within India ────────────────
    // City-level geo-IP is unreliable for smaller Kerala towns (often resolves
    // to the nearest major POP like Kochi/Bengaluru), so we stop at region —
    // this is precise enough to tell "local Kerala traffic" apart from
    // "diaspora searching from abroad" without pretending to know the town.
    const countryMap: Record<string, { country: string; views: number }> = {}
    const regionMap: Record<string, { region: string; country: string; views: number }> = {}
    let viewsWithLocation = 0
    viewRows.forEach((r: any) => {
      if (!r.visitor_country) return
      viewsWithLocation++
      const c = r.visitor_country
      countryMap[c] = countryMap[c] ?? { country: c, views: 0 }
      countryMap[c].views++
      if (r.visitor_region) {
        const key = `${c}::${r.visitor_region}`
        regionMap[key] = regionMap[key] ?? { region: r.visitor_region, country: c, views: 0 }
        regionMap[key].views++
      }
    })
    const locationStats = {
      views_with_location: viewsWithLocation,
      by_country: Object.values(countryMap).sort((a, b) => b.views - a.views),
      by_region: Object.values(regionMap).sort((a, b) => b.views - a.views).slice(0, 8),
    }

    const stats = {
      enquiries_7d: enquiryRows.filter((r: any) => now - new Date(r.created_at).getTime() < day7).length,
      enquiries_30d: enquiryRows.filter((r: any) => now - new Date(r.created_at).getTime() < day30).length,
      enquiries_all: enquiryRows.length,
      views_7d: viewRows.filter((r: any) => now - new Date(r.viewed_at).getTime() < day7).length,
      views_30d: viewRows.filter((r: any) => now - new Date(r.viewed_at).getTime() < day30).length,
      views_all: viewRows.length,
      avg_duration_seconds: avgDurationSeconds,
      views_with_duration_count: viewsWithDuration.length,
    }

    // ── Day bucketing in IST (UTC+5:30) ─────────────────────────────────────
    // Your visitors are in Kerala, so a "day" should roll over at midnight IST,
    // not midnight UTC (which would split an evening's traffic across two days).
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
    const DAY_MS = 24 * 60 * 60 * 1000
    const istDay = (t: number | string) => new Date(new Date(t).getTime() + IST_OFFSET_MS).toISOString().slice(0, 10)
    const lastNDays = (n: number) => Array.from({ length: n }, (_, i) => istDay(now - (n - 1 - i) * DAY_MS)) // oldest → newest

    // ── 14-day daily trend (reusable — also used per-property below) ────────
    const dailyTrend = (views: any[], enquiries: any[]) => {
      const vCount: Record<string, number> = {}
      const eCount: Record<string, number> = {}
      views.forEach((r: any) => { const k = istDay(r.viewed_at); vCount[k] = (vCount[k] ?? 0) + 1 })
      enquiries.forEach((r: any) => { const k = istDay(r.created_at); eCount[k] = (eCount[k] ?? 0) + 1 })
      return lastNDays(14).map(date => ({
        date,
        label: date.slice(5).replace('-', '/'),
        views: vCount[date] ?? 0,
        enquiries: eCount[date] ?? 0,
      }))
    }
    const trend = dailyTrend(viewRows, enquiryRows)

    // ── Day-by-day detail: which listings were viewed / enquired each day ───
    type DayRow = { slug: string; name: string; count: number }
    const dayKeys = lastNDays(14)
    const dayMap: Record<string, { views: Record<string, DayRow>; enqs: Record<string, DayRow> }> = {}
    dayKeys.forEach(k => { dayMap[k] = { views: {}, enqs: {} } })
    const tally = (bucket: Record<string, DayRow>, p: any) => {
      if (!bucket[p.id]) bucket[p.id] = { slug: p.slug, name: p.name, count: 0 }
      bucket[p.id].count++
    }
    viewRows.forEach((r: any) => { const d = dayMap[istDay(r.viewed_at)]; if (d && r.properties) tally(d.views, r.properties) })
    enquiryRows.forEach((r: any) => { const d = dayMap[istDay(r.created_at)]; if (d && r.properties) tally(d.enqs, r.properties) })
    const byCount = (a: DayRow, b: DayRow) => b.count - a.count || a.name.localeCompare(b.name)
    const daily = [...dayKeys].reverse().map(date => { // newest first
      const viewed = Object.values(dayMap[date].views).sort(byCount)
      const enquired = Object.values(dayMap[date].enqs).sort(byCount)
      const dt = new Date(date + 'T00:00:00Z')
      return {
        date,
        weekday: dt.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }),
        label: dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
        total_views: viewed.reduce((s, x) => s + x.count, 0),
        total_enquiries: enquired.reduce((s, x) => s + x.count, 0),
        viewed,
        enquired,
      }
    })

    // ── Weekly buckets, trailing WEEKS_WINDOW weeks (0 = most recent 7 days) ─
    const weeklyBuckets = (rows: any[], dateField: string) => {
      const buckets = new Array(WEEKS_WINDOW).fill(0)
      rows.forEach((r: any) => {
        const age = now - new Date(r[dateField]).getTime()
        const idx = Math.floor(age / WEEK_MS)
        if (idx >= 0 && idx < WEEKS_WINDOW) buckets[idx]++
      })
      return buckets
    }
    const siteViewBuckets = weeklyBuckets(viewRows, 'viewed_at')
    const siteEnqBuckets = weeklyBuckets(enquiryRows, 'created_at')
    const avgEnquiriesPerWeek = Math.round((siteEnqBuckets.reduce((s, n) => s + n, 0) / WEEKS_WINDOW) * 10) / 10
    const weeklyStats = {
      avg_views_per_week: Math.round((siteViewBuckets.reduce((s, n) => s + n, 0) / WEEKS_WINDOW) * 10) / 10,
      avg_enquiries_per_week: avgEnquiriesPerWeek,
      weeks_window: WEEKS_WINDOW,
    }

    // ── Vendor-fee readiness: your own threshold, avg 100 enquiries/week ────
    const VENDOR_FEE_THRESHOLD = 100
    const readinessStats = {
      threshold: VENDOR_FEE_THRESHOLD,
      current: avgEnquiriesPerWeek,
      pct_of_threshold: Math.min(999, Math.round((avgEnquiriesPerWeek / VENDOR_FEE_THRESHOLD) * 100)),
      ready: avgEnquiriesPerWeek >= VENDOR_FEE_THRESHOLD,
    }

    // ── Per-property stats ──────────────────────────────────────────────────
    const propMap: Record<string, any> = {}
    allProps.forEach((p: any) => {
      propMap[p.id] = {
        name: p.name, slug: p.slug,
        town_name: p.towns?.name ?? '', town_color: p.towns?.hero_bg_color ?? '#1C3A2B',
        enquiries: 0, views: 0,
        shares: 0, maps_clicks: 0, phone_calls: 0, over_capacity_enquiries: 0,
        paxSum: 0, paxCount: 0,
        photo_count: Array.isArray(p.photos) ? p.photos.length : 0,
        is_featured: !!p.is_featured,
        durationSum: 0, durationCount: 0,
        created_at: p.created_at,
      }
    })
    rawEnquiryRows.forEach((r: any) => {
      const p = r.properties
      if (!p || !propMap[p.id]) return
      const ch = r.channel || 'whatsapp'
      if (isDirectLead(r)) {
        propMap[p.id].enquiries++
        if (ch === 'phone') propMap[p.id].phone_calls++
        if (r.is_over_capacity) propMap[p.id].over_capacity_enquiries++
        if (typeof r.guest_count === 'number' && r.guest_count > 0) {
          propMap[p.id].paxSum += r.guest_count
          propMap[p.id].paxCount++
        }
      } else if (ch === 'share_family' || ch === 'share_link') {
        propMap[p.id].shares++
      } else if (ch === 'maps') {
        propMap[p.id].maps_clicks++
      }
    })
    viewRows.forEach((r: any) => {
      const p = r.properties
      if (p && propMap[p.id]) {
        propMap[p.id].views++
        if (typeof r.duration_seconds === 'number' && r.duration_seconds > 0) {
          propMap[p.id].durationSum += r.duration_seconds
          propMap[p.id].durationCount++
        }
      }
    })

    const allPropertyStats = Object.entries(propMap).map(([id, p]: [string, any]) => {
      // Weekly avg per property is divided by weeks-since-launch (capped at the
      // window), so a listing that went live 2 weeks ago isn't diluted by weeks
      // it didn't exist yet.
      const weeksSinceLaunch = p.created_at ? Math.max(1, Math.ceil((now - new Date(p.created_at).getTime()) / WEEK_MS)) : WEEKS_WINDOW
      const cappedWeeks = Math.min(WEEKS_WINDOW, weeksSinceLaunch)
      const propViewBuckets = weeklyBuckets(viewRows.filter((r: any) => r.property_id === id), 'viewed_at').slice(0, cappedWeeks)
      const propEnqBuckets = weeklyBuckets(enquiryRows.filter((r: any) => r.property_id === id), 'created_at').slice(0, cappedWeeks)
      return {
        id, name: p.name, slug: p.slug, town_name: p.town_name, town_color: p.town_color,
        enquiries: p.enquiries, views: p.views, photo_count: p.photo_count, is_featured: p.is_featured,
        shares: p.shares, maps_clicks: p.maps_clicks, phone_calls: p.phone_calls,
        over_capacity_enquiries: p.over_capacity_enquiries,
        avg_pax: p.paxCount > 0 ? Math.round(p.paxSum / p.paxCount) : null,
        conversion_pct: p.views > 0 ? Math.round((p.enquiries / p.views) * 1000) / 10 : 0,
        avg_duration_seconds: p.durationCount > 0 ? Math.round(p.durationSum / p.durationCount) : null,
        avg_weekly_views: cappedWeeks > 0 ? Math.round((propViewBuckets.reduce((s, n) => s + n, 0) / cappedWeeks) * 10) / 10 : 0,
        avg_weekly_enquiries: cappedWeeks > 0 ? Math.round((propEnqBuckets.reduce((s, n) => s + n, 0) / cappedWeeks) * 10) / 10 : 0,
      }
    })

    const topPropertiesBase = [...allPropertyStats].sort((a, b) => (b.enquiries + b.views) - (a.enquiries + a.views)).slice(0, 10)

    // Per-property 14-day trend, only computed for the top 10 actually shown
    const topProperties = topPropertiesBase.map(p => ({
      ...p,
      trend14: dailyTrend(
        viewRows.filter((r: any) => r.property_id === p.id),
        enquiryRows.filter((r: any) => r.property_id === p.id)
      ),
    }))

    // ── Growth / decline — split last 14 days into two 7-day windows per property ──
    const movement = allProps.map((p: any) => {
      const propViews = viewRows.filter((r: any) => r.properties?.id === p.id)
      const last7 = propViews.filter((r: any) => now - new Date(r.viewed_at).getTime() < day7).length
      const prev7 = propViews.filter((r: any) => {
        const age = now - new Date(r.viewed_at).getTime()
        return age >= day7 && age < day14
      }).length
      const delta = last7 - prev7
      return {
        name: p.name, slug: p.slug,
        last7, prev7, delta,
        pct_change: prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : (last7 > 0 ? 100 : 0),
      }
    }).filter((m: any) => m.last7 > 0 || m.prev7 > 0)

    const topGainer = movement.length ? [...movement].sort((a, b) => b.delta - a.delta)[0] : null
    const topDecliner = movement.length ? [...movement].sort((a, b) => a.delta - b.delta)[0] : null

    // Town breakdown
    const townMap: Record<string, { name: string; color: string; enquiries: number; views: number }> = {}
    allProps.forEach((p: any) => {
      const t = p.towns
      if (t && !townMap[t.id]) townMap[t.id] = { name: t.name, color: t.hero_bg_color, enquiries: 0, views: 0 }
    })
    enquiryRows.forEach((r: any) => { const tid = r.properties?.town_id; if (tid && townMap[tid]) townMap[tid].enquiries++ })
    viewRows.forEach((r: any) => { const tid = r.properties?.town_id; if (tid && townMap[tid]) townMap[tid].views++ })
    const townBreakdown = Object.values(townMap).sort((a, b) => (b.enquiries + b.views) - (a.enquiries + a.views))

    return NextResponse.json({
      stats, trend, daily, topProperties, townBreakdown,
      movement: { topGainer, topDecliner },
      durationStats, sessionStats, weeklyStats, locationStats, readinessStats,
      demandInsights,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
