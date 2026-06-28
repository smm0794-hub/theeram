import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = createServiceClient()

    const [eResult, vResult, propsResult] = await Promise.all([
      db.from('inquiries').select('id, created_at, event_type, property_id, properties(id, name, slug, town_id, is_featured, photos, towns(id, name, hero_bg_color))').order('created_at', { ascending: false }),
      db.from('property_views').select('id, viewed_at, property_id, properties(id, name, slug, town_id, is_featured, photos, towns(id, name, hero_bg_color))').order('viewed_at', { ascending: false }),
      db.from('properties').select('id, name, slug, town_id, is_active, is_featured, photos, towns(id, name, hero_bg_color)').eq('is_active', true),
    ])

    const enquiryRows = eResult.data ?? []
    const viewRows = vResult.data ?? []
    const allProps = propsResult.data ?? []

    const now = Date.now()
    const day7 = 7 * 24 * 60 * 60 * 1000
    const day14 = 14 * 24 * 60 * 60 * 1000
    const day30 = 30 * 24 * 60 * 60 * 1000

    const stats = {
      enquiries_7d: enquiryRows.filter((r: any) => now - new Date(r.created_at).getTime() < day7).length,
      enquiries_30d: enquiryRows.filter((r: any) => now - new Date(r.created_at).getTime() < day30).length,
      enquiries_all: enquiryRows.length,
      views_7d: viewRows.filter((r: any) => now - new Date(r.viewed_at).getTime() < day7).length,
      views_30d: viewRows.filter((r: any) => now - new Date(r.viewed_at).getTime() < day30).length,
      views_all: viewRows.length,
    }

    // 14-day trend
    const trend = []
    for (let d = 13; d >= 0; d--) {
      const date = new Date(now - d * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().slice(0, 10)
      trend.push({
        date: dateStr,
        label: date.toISOString().slice(5, 10).replace('-', '/'),
        enquiries: enquiryRows.filter((r: any) => new Date(r.created_at).toISOString().slice(0, 10) === dateStr).length,
        views: viewRows.filter((r: any) => new Date(r.viewed_at).toISOString().slice(0, 10) === dateStr).length,
      })
    }

    // Per-property stats — now includes conversion rate, photo count, town
    const propMap: Record<string, { name: string; slug: string; town_name: string; town_color: string; enquiries: number; views: number; photo_count: number; is_featured: boolean }> = {}
    allProps.forEach((p: any) => {
      propMap[p.id] = {
        name: p.name, slug: p.slug,
        town_name: p.towns?.name ?? '', town_color: p.towns?.hero_bg_color ?? '#1C3A2B',
        enquiries: 0, views: 0,
        photo_count: Array.isArray(p.photos) ? p.photos.length : 0,
        is_featured: !!p.is_featured,
      }
    })
    enquiryRows.forEach((r: any) => { const p = r.properties; if (p && propMap[p.id]) propMap[p.id].enquiries++ })
    viewRows.forEach((r: any) => { const p = r.properties; if (p && propMap[p.id]) propMap[p.id].views++ })

    const allPropertyStats = Object.values(propMap).map(p => ({
      ...p,
      conversion_pct: p.views > 0 ? Math.round((p.enquiries / p.views) * 1000) / 10 : 0,
    }))

    const topProperties = [...allPropertyStats].sort((a, b) => (b.enquiries + b.views) - (a.enquiries + a.views)).slice(0, 10)

    // ── Pitch-ready insights ──────────────────────────────────────────────
    // Best converter — the strongest "proof of demand" story, min 2 views to avoid noise
    const eligibleForBest = allPropertyStats.filter(p => p.views >= 2)
    const bestConverter = eligibleForBest.length
      ? [...eligibleForBest].sort((a, b) => b.conversion_pct - a.conversion_pct)[0]
      : null

    // Most enquired — simplest, most shareable "demand" stat
    const mostEnquired = [...allPropertyStats].sort((a, b) => b.enquiries - a.enquiries)[0] ?? null

    // Photo correlation — average conversion for listings with 8+ photos vs under 5
    const wellPhotographed = allPropertyStats.filter(p => p.photo_count >= 8 && p.views > 0)
    const underPhotographed = allPropertyStats.filter(p => p.photo_count < 5 && p.views > 0)
    const avgConv = (arr: typeof allPropertyStats) => arr.length ? arr.reduce((s, p) => s + p.conversion_pct, 0) / arr.length : null
    const photoInsight = {
      well_photographed_avg: avgConv(wellPhotographed),
      under_photographed_avg: avgConv(underPhotographed),
      well_photographed_count: wellPhotographed.length,
      under_photographed_count: underPhotographed.length,
    }

    // Momentum — this 7 days vs previous 7 days
    const last7 = trend.slice(7, 14).reduce((s, d) => s + d.enquiries, 0)
    const prev7 = trend.slice(0, 7).reduce((s, d) => s + d.enquiries, 0)
    const momentum = {
      this_week: last7,
      last_week: prev7,
      multiplier: prev7 > 0 ? Math.round((last7 / prev7) * 10) / 10 : null,
    }

    // Town breakdown
    const townMap: Record<string, { name: string; color: string; enquiries: number; views: number }> = {}
    allProps.forEach((p: any) => {
      const t = p.towns
      if (t && !townMap[t.id]) townMap[t.id] = { name: t.name, color: t.hero_bg_color, enquiries: 0, views: 0 }
    })
    enquiryRows.forEach((r: any) => { const tid = r.properties?.town_id; if (tid && townMap[tid]) townMap[tid].enquiries++ })
    viewRows.forEach((r: any) => { const tid = r.properties?.town_id; if (tid && townMap[tid]) townMap[tid].views++ })
    const townBreakdown = Object.values(townMap).sort((a, b) => (b.enquiries + b.views) - (a.enquiries + a.views))

    // Event type breakdown
    const etMap: Record<string, number> = {}
    enquiryRows.forEach((r: any) => { etMap[r.event_type] = (etMap[r.event_type] || 0) + 1 })
    const eventTypes = Object.entries(etMap).sort((a, b) => b[1] - a[1])

    return NextResponse.json({
      stats, trend, topProperties, townBreakdown, eventTypes,
      pitchInsights: { bestConverter, mostEnquired, photoInsight, momentum },
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
