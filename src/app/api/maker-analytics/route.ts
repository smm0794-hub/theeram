import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = createServiceClient()

    const [eResult, vResult, vendorsResult] = await Promise.all([
      db.from('vendor_inquiries').select('id, created_at, vendor_id, vendors(id, name, slug, category, is_featured)').order('created_at', { ascending: false }),
      db.from('vendor_views').select('id, viewed_at, vendor_id, vendors(id, name, slug, category, is_featured)').order('viewed_at', { ascending: false }),
      db.from('vendors').select('id, name, slug, category, is_active, is_featured').eq('is_active', true),
    ])

    const enquiryRows = eResult.data ?? []
    const viewRows = vResult.data ?? []
    const vendors = vendorsResult.data ?? []

    const now = Date.now()
    const day7 = 7 * 24 * 60 * 60 * 1000
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

    // Per-maker stats
    const makerMap: Record<string, { name: string; slug: string; category: string; is_featured: boolean; enquiries: number; views: number }> = {}
    enquiryRows.forEach((r: any) => {
      const v = r.vendors
      if (!v) return
      if (!makerMap[v.id]) makerMap[v.id] = { name: v.name, slug: v.slug, category: v.category, is_featured: v.is_featured, enquiries: 0, views: 0 }
      makerMap[v.id].enquiries++
    })
    viewRows.forEach((r: any) => {
      const v = r.vendors
      if (!v) return
      if (!makerMap[v.id]) makerMap[v.id] = { name: v.name, slug: v.slug, category: v.category, is_featured: v.is_featured, enquiries: 0, views: 0 }
      makerMap[v.id].views++
    })
    const topMakers = Object.values(makerMap).sort((a, b) => (b.enquiries + b.views) - (a.enquiries + a.views)).slice(0, 10)

    // Category breakdown
    const catMap: Record<string, { enquiries: number; views: number }> = {}
    enquiryRows.forEach((r: any) => { const c = r.vendors?.category; if (c) { catMap[c] = catMap[c] ?? { enquiries: 0, views: 0 }; catMap[c].enquiries++ } })
    viewRows.forEach((r: any) => { const c = r.vendors?.category; if (c) { catMap[c] = catMap[c] ?? { enquiries: 0, views: 0 }; catMap[c].views++ } })
    const categoryBreakdown = Object.entries(catMap).map(([category, v]) => ({ category, ...v })).sort((a, b) => (b.enquiries + b.views) - (a.enquiries + a.views))

    return NextResponse.json({ stats, trend, topMakers, categoryBreakdown, totalMakers: vendors.length })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
