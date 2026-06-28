import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// Simple per-IP rate limit to reduce duplicate view counts, mirroring track-view
const recentViews = new Map<string, number>()
const RATE_LIMIT_MS = 30 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const { vendor_id } = await req.json()
    if (!vendor_id) return NextResponse.json({ error: 'vendor_id required' }, { status: 400 })

    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const key = `${ip}:${vendor_id}`
    const last = recentViews.get(key)
    const now = Date.now()
    if (last && now - last < RATE_LIMIT_MS) {
      return NextResponse.json({ success: true, skipped: true })
    }
    recentViews.set(key, now)

    const db = createServiceClient()
    const { error } = await db.from('vendor_views').insert({ vendor_id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
