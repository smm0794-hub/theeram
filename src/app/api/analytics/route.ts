import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const WEEKS_WINDOW = 8

export async function GET() {
  try {
    const db = createServiceClient()

    const [eResult, vResult, propsResult] = await Promise.all([
      db.from('inquiries').select('id, created_at, property_id, view_id, properties(id, name, slug, town_id, is_featured, photos, towns(id, name, hero_bg_color))').order('created_at', { ascending: false }),
      db.from('property_views').select('id, viewed_at, duration_seconds, property_id, session_id, properties(id, name, slug, town_id, is_featured, photos, towns(id, name, hero_bg_color))').order('viewed_at', { ascending: false }),
      db.from('properties').select('id, name, slug, town_id, is_active, is_featured, photos, created_at, towns(id, name, hero_bg_color)').eq('is_active', true),
    ])

    const enquiryRows = eResult.data ?? []
    const viewRows = vResult.data ?? []
    const allProps = propsResult.data ?? []

    const now = Date.now()
    const day7 = 7 * 24 * 60 * 60 * 1000
    const day14 = 14 * 24 * 60 * 60 * 1000
    const day30 = 30 * 24 * 60 * 60 * 1000

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

    // ── 14-day daily trend (reusable — also used per-property below) ────────
    function dailyTrend(views: any[], enquiries: any[]) {
      const arr = []
      for (let d = 13; d >= 0; d--) {
        const date = new Date(now - d * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().slice(0, 10)
        arr.push({
          date: dateStr,
          label: date.toISOString().slice(5, 10).replace('-', '/'),
          views: views.filter((r: any) => new Date(r.viewed_at).toISOString().slice(0, 10) === dateStr).length,
          enquiries: enquiries.filter((r: any) => new Date(r.created_at).toISOString().slice(0, 10) === dateStr).length,
        })
      }
      return arr
    }
    const trend = dailyTrend(viewRows, enquiryRows)

    // ── Weekly buckets, trailing WEEKS_WINDOW weeks (0 = most recent 7 days) ─
    function weeklyBuckets(rows: any[], dateField: string) {
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
    const weeklyStats = {
      avg_views_per_week: Math.round((siteViewBuckets.reduce((s, n) => s + n, 0) / WEEKS_WINDOW) * 10) / 10,
      avg_enquiries_per_week: Math.round((siteEnqBuckets.reduce((s, n) => s + n, 0) / WEEKS_WINDOW) * 10) / 10,
      weeks_window: WEEKS_WINDOW,
    }

    // ── Per-property stats ──────────────────────────────────────────────────
    const propMap: Record<string, any> = {}
    allProps.forEach((p: any) => {
      propMap[p.id] = {
        name: p.name, slug: p.slug,
        town_name: p.towns?.name ?? '', town_color: p.towns?.hero_bg_color ?? '#1C3A2B',
        enquiries: 0, views: 0,
        photo_count: Array.isArray(p.photos) ? p.photos.length : 0,
        is_featured: !!p.is_featured,
        durationSum: 0, durationCount: 0,
        created_at: p.created_at,
      }
    })
    enquiryRows.forEach((r: any) => { const p = r.properties; if (p && propMap[p.id]) propMap[p.id].enquiries++ })
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
      stats, trend, topProperties, townBreakdown,
      movement: { topGainer, topDecliner },
      durationStats, sessionStats, weeklyStats,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
