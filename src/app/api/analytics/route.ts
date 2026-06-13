import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const db = createServiceClient()
    const { searchParams } = new URL(req.url)
    const townId = searchParams.get('townId') // null = all towns

    // Build town filter
    const townFilter = townId ? `AND t.id = '${townId}'` : ''

    // Enquiries with property + town info
    const { data: enquiries, error: eErr } = await db.rpc('get_analytics', {
      p_town_id: townId ?? null
    })

    // Since we can't use RPC easily, use raw queries via execute
    // Get enquiries
    const enquiriesQuery = `
      SELECT 
        i.id, i.created_at, i.event_type,
        p.id as property_id, p.name as property_name, p.slug as property_slug,
        t.id as town_id, t.name as town_name, t.hero_bg_color
      FROM inquiries i
      JOIN properties p ON p.id = i.property_id
      LEFT JOIN towns t ON t.id = p.town_id
      ${townId ? `WHERE t.id = '${townId}'` : ''}
      ORDER BY i.created_at DESC
    `

    const viewsQuery = `
      SELECT 
        pv.id, pv.viewed_at,
        p.id as property_id, p.name as property_name, p.slug as property_slug,
        t.id as town_id, t.name as town_name, t.hero_bg_color
      FROM property_views pv
      JOIN properties p ON p.id = pv.property_id
      LEFT JOIN towns t ON t.id = p.town_id
      ${townId ? `WHERE t.id = '${townId}'` : ''}
      ORDER BY pv.viewed_at DESC
    `

    const townsQuery = `SELECT id, name, slug, hero_bg_color FROM towns WHERE is_active = true ORDER BY sort_order`

    const [eResult, vResult, tResult] = await Promise.all([
      db.from('inquiries').select('id, created_at, event_type, properties!inner(id, name, slug, town_id, towns(id, name, hero_bg_color))').order('created_at', { ascending: false }),
      db.from('property_views').select('id, viewed_at, properties!inner(id, name, slug, town_id, towns(id, name, hero_bg_color))').order('viewed_at', { ascending: false }),
      db.from('towns').select('id, name, slug, hero_bg_color').eq('is_active', true).order('sort_order'),
    ])

    // Filter by town if specified
    const filterByTown = (rows: any[]) => {
      if (!townId) return rows
      return rows.filter((r: any) => r.properties?.town_id === townId)
    }

    const enquiryRows = filterByTown(eResult.data ?? [])
    const viewRows = filterByTown(vResult.data ?? [])
    const towns = tResult.data ?? []

    const now = Date.now()
    const day7 = 7 * 24 * 60 * 60 * 1000
    const day14 = 14 * 24 * 60 * 60 * 1000
    const day30 = 30 * 24 * 60 * 60 * 1000

    // Key stats
    const stats = {
      enquiries_7d: enquiryRows.filter((r: any) => now - new Date(r.created_at).getTime() < day7).length,
      enquiries_30d: enquiryRows.filter((r: any) => now - new Date(r.created_at).getTime() < day30).length,
      enquiries_all: enquiryRows.length,
      views_7d: viewRows.filter((r: any) => now - new Date(r.viewed_at).getTime() < day7).length,
      views_30d: viewRows.filter((r: any) => now - new Date(r.viewed_at).getTime() < day30).length,
      views_all: viewRows.length,
    }

    // 14-day trend — using UTC dates consistently
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

    // Per property stats
    const propMap: Record<string, { name: string; slug: string; town_name: string; town_color: string; enquiries: number; views: number }> = {}

    enquiryRows.forEach((r: any) => {
      const p = r.properties
      if (!p) return
      const key = p.id
      if (!propMap[key]) propMap[key] = { name: p.name, slug: p.slug, town_name: p.towns?.name ?? '', town_color: p.towns?.hero_bg_color ?? '#1C3A2B', enquiries: 0, views: 0 }
      propMap[key].enquiries++
    })

    viewRows.forEach((r: any) => {
      const p = r.properties
      if (!p) return
      const key = p.id
      if (!propMap[key]) propMap[key] = { name: p.name, slug: p.slug, town_name: p.towns?.name ?? '', town_color: p.towns?.hero_bg_color ?? '#1C3A2B', enquiries: 0, views: 0 }
      propMap[key].views++
    })

    const topProperties = Object.values(propMap)
      .sort((a, b) => (b.enquiries + b.views) - (a.enquiries + a.views))
      .slice(0, 10)

    // By town breakdown
    const townMap: Record<string, { name: string; color: string; enquiries: number; views: number }> = {}
    towns.forEach((t: any) => {
      townMap[t.id] = { name: t.name, color: t.hero_bg_color, enquiries: 0, views: 0 }
    })
    enquiryRows.forEach((r: any) => {
      const tid = r.properties?.town_id
      if (tid && townMap[tid]) townMap[tid].enquiries++
    })
    viewRows.forEach((r: any) => {
      const tid = r.properties?.town_id
      if (tid && townMap[tid]) townMap[tid].views++
    })
    const townBreakdown = Object.values(townMap).sort((a, b) => (b.enquiries + b.views) - (a.enquiries + a.views))

    // Event type breakdown
    const etMap: Record<string, number> = {}
    enquiryRows.forEach((r: any) => { etMap[r.event_type] = (etMap[r.event_type] || 0) + 1 })
    const eventTypes = Object.entries(etMap).sort((a, b) => b[1] - a[1])

    return NextResponse.json({ stats, trend, topProperties, townBreakdown, eventTypes, towns })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
