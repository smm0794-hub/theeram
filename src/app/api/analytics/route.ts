import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = createServiceClient()

    const [eResult, vResult, propsResult] = await Promise.all([
      db.from('inquiries').select('id, created_at, property_id, properties(id, name, slug, town_id, is_featured, photos, towns(id, name, hero_bg_color))').order('created_at', { ascending: false }),
      db.from('property_views').select('id, viewed_at, duration_seconds, property_id, properties(id, name, slug, town_id, is_featured, photos, towns(id, name, hero_bg_color))').order('viewed_at', { ascending: false }),
      db.from('properties').select('id, name, slug, town_id, is_active, is_featured, photos, towns(id, name, hero_bg_color)').eq('is_active', true),
    ])

    const enquiryRows = eResult.data ?? []
    const viewRows = vResult.data ?? []
    const allProps = propsResult.data ?? []

    const now = Date.now()
    const day7 = 7 * 24 * 60 * 60 * 1000
    const day30 = 30 * 24 * 60 * 60 * 1000

    const viewsWithDuration = viewRows.filter((r: any) => typeof r.duration_seconds === 'number' && r.duration_seconds > 0)
    const avgDurationSeconds = viewsWithDuration.length
      ? Math.round(viewsWithDuration.reduce((s: number, r: any) => s + r.duration_seconds, 0) / viewsWithDuration.length)
      : null

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

    // 14-day views trend — single series, plain daily count
    const trend = []
    for (let d = 13; d >= 0; d--) {
      const date = new Date(now - d * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().slice(0, 10)
      trend.push({
        date: dateStr,
        label: date.toISOString().slice(5, 10).replace('-', '/'),
        views: viewRows.filter((r: any) => new Date(r.viewed_at).toISOString().slice(0, 10) === dateStr).length,
        enquiries: enquiryRows.filter((r: any) => new Date(r.created_at).toISOString().slice(0, 10) === dateStr).length,
      })
    }

    // Per-property stats
    const propMap: Record<string, { name: string; slug: string; town_name: string; town_color: string; enquiries: number; views: number; photo_count: number; is_featured: boolean; durationSum: number; durationCount: number }> = {}
    allProps.forEach((p: any) => {
      propMap[p.id] = {
        name: p.name, slug: p.slug,
        town_name: p.towns?.name ?? '', town_color: p.towns?.hero_bg_color ?? '#1C3A2B',
        enquiries: 0, views: 0,
        photo_count: Array.isArray(p.photos) ? p.photos.length : 0,
        is_featured: !!p.is_featured,
        durationSum: 0, durationCount: 0,
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

    const allPropertyStats = Object.values(propMap).map(p => ({
      name: p.name, slug: p.slug, town_name: p.town_name, town_color: p.town_color,
      enquiries: p.enquiries, views: p.views, photo_count: p.photo_count, is_featured: p.is_featured,
      conversion_pct: p.views > 0 ? Math.round((p.enquiries / p.views) * 1000) / 10 : 0,
      avg_duration_seconds: p.durationCount > 0 ? Math.round(p.durationSum / p.durationCount) : null,
    }))

    const topProperties = [...allPropertyStats].sort((a, b) => (b.enquiries + b.views) - (a.enquiries + a.views)).slice(0, 10)

    // ── Growth / decline — split last 14 days into two 7-day windows per property ──
    const day14 = 14 * 24 * 60 * 60 * 1000
    const propIdByName = new Map<string, string>()
    allProps.forEach((p: any) => propIdByName.set(p.id, p.id))

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
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
