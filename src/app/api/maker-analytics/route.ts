import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = createServiceClient()

    const [eResult, vResult, vendorsResult] = await Promise.all([
      db.from('vendor_inquiries').select('id, created_at, vendor_id, vendors(id, name, slug, category, is_featured)').order('created_at', { ascending: false }),
      db.from('vendor_views').select('id, viewed_at, vendor_id, vendors(id, name, slug, category, is_featured)').order('viewed_at', { ascending: false }),
      db.from('vendors').select('id, name, slug, category, is_active, is_featured, photos').eq('is_active', true),
    ])

    const enquiryRows = eResult.data ?? []
    const viewRows = vResult.data ?? []
    const vendors = vendorsResult.data ?? []

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

    const makerMap: Record<string, { name: string; slug: string; category: string; is_featured: boolean; enquiries: number; views: number; photo_count: number }> = {}
    vendors.forEach((v: any) => {
      makerMap[v.id] = { name: v.name, slug: v.slug, category: v.category, is_featured: !!v.is_featured, enquiries: 0, views: 0, photo_count: Array.isArray(v.photos) ? v.photos.length : 0 }
    })
    enquiryRows.forEach((r: any) => { const v = r.vendors; if (v && makerMap[v.id]) makerMap[v.id].enquiries++ })
    viewRows.forEach((r: any) => { const v = r.vendors; if (v && makerMap[v.id]) makerMap[v.id].views++ })

    const allMakerStats = Object.values(makerMap).map(m => ({
      ...m,
      conversion_pct: m.views > 0 ? Math.round((m.enquiries / m.views) * 1000) / 10 : 0,
    }))

    const topMakers = [...allMakerStats].sort((a, b) => (b.enquiries + b.views) - (a.enquiries + a.views)).slice(0, 10)

    const catMap: Record<string, { enquiries: number; views: number }> = {}
    enquiryRows.forEach((r: any) => { const c = r.vendors?.category; if (c) { catMap[c] = catMap[c] ?? { enquiries: 0, views: 0 }; catMap[c].enquiries++ } })
    viewRows.forEach((r: any) => { const c = r.vendors?.category; if (c) { catMap[c] = catMap[c] ?? { enquiries: 0, views: 0 }; catMap[c].views++ } })
    const categoryBreakdown = Object.entries(catMap).map(([category, v]) => ({ category, ...v })).sort((a, b) => (b.enquiries + b.views) - (a.enquiries + a.views))

    // ── Growth / decline per maker, same logic as properties ───────────────
    const movement = vendors.map((v: any) => {
      const makerViews = viewRows.filter((r: any) => r.vendors?.id === v.id)
      const last7 = makerViews.filter((r: any) => now - new Date(r.viewed_at).getTime() < day7).length
      const prev7 = makerViews.filter((r: any) => {
        const age = now - new Date(r.viewed_at).getTime()
        return age >= day7 && age < day14
      }).length
      const delta = last7 - prev7
      return {
        name: v.name, slug: v.slug, last7, prev7, delta,
        pct_change: prev7 > 0 ? Math.round(((last7 - prev7) / prev7) * 100) : (last7 > 0 ? 100 : 0),
      }
    }).filter((m: any) => m.last7 > 0 || m.prev7 > 0)

    const topGainer = movement.length ? [...movement].sort((a, b) => b.delta - a.delta)[0] : null
    const topDecliner = movement.length ? [...movement].sort((a, b) => a.delta - b.delta)[0] : null

    return NextResponse.json({
      stats, trend, topMakers, categoryBreakdown, totalMakers: vendors.length,
      movement: { topGainer, topDecliner },
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
