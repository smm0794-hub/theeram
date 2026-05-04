import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  try { return cookies().get('curator_session')?.value === 'authenticated' } catch { return false }
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const db = createServiceClient()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Total inquiries this week
    const { count: weekTotal } = await db
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo)

    // Total inquiries all time
    const { count: allTime } = await db
      .from('inquiries')
      .select('*', { count: 'exact', head: true })

    // Top properties by inquiry count
    const { data: topProps } = await db
      .from('inquiries')
      .select('property_id, properties(name, slug)')
      .gte('created_at', sevenDaysAgo)

    // Count by property
    const propCounts: Record<string, { name: string; slug: string; count: number }> = {}
    for (const row of topProps ?? []) {
      const id = row.property_id
      if (!id) continue
      const prop = (row as any).properties
      if (!propCounts[id]) propCounts[id] = { name: prop?.name ?? 'Unknown', slug: prop?.slug ?? '', count: 0 }
      propCounts[id].count++
    }
    const topProperties = Object.values(propCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Top event types this week
    const { data: eventRows } = await db
      .from('inquiries')
      .select('event_type')
      .gte('created_at', sevenDaysAgo)

    const eventCounts: Record<string, number> = {}
    for (const row of eventRows ?? []) {
      const et = row.event_type ?? 'general'
      eventCounts[et] = (eventCounts[et] ?? 0) + 1
    }
    const topEventTypes = Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([event_type, count]) => ({ event_type, count }))

    // Daily inquiries for last 7 days
    const { data: allWeekRows } = await db
      .from('inquiries')
      .select('created_at')
      .gte('created_at', sevenDaysAgo)

    const dailyCounts: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      dailyCounts[key] = 0
    }
    for (const row of allWeekRows ?? []) {
      const d = new Date(row.created_at)
      const key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      if (key in dailyCounts) dailyCounts[key]++
    }
    const dailyData = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))

    // Active properties count
    const { count: activeProperties } = await db
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Active vendors count
    const { count: activeVendors } = await db
      .from('vendors')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .throwOnError()
      .maybeSingle()
      .then(() => ({ count: 0 }))
      .catch(() => ({ count: 0 }))

    // Pending vendor submissions
    const { count: pendingVendors } = await db
      .from('vendor_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    return NextResponse.json({
      weekTotal: weekTotal ?? 0,
      allTime: allTime ?? 0,
      topProperties,
      topEventTypes,
      dailyData,
      activeProperties: activeProperties ?? 0,
      pendingVendors: pendingVendors ?? 0,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
