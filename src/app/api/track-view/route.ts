import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// Simple in-memory rate limit — resets on server restart
// Good enough for a hobby project; replace with Redis for production
const viewCache = new Map<string, number>()
const VIEW_COOLDOWN_MS = 30 * 60 * 1000 // 30 minutes per property per IP

export async function POST(req: NextRequest) {
  try {
    const { property_id } = await req.json()
    if (!property_id) return NextResponse.json({ ok: false }, { status: 400 })

    // Rate limit: one view per property per IP per 30 minutes
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const cacheKey = `${ip}:${property_id}`
    const lastView = viewCache.get(cacheKey)
    if (lastView && Date.now() - lastView < VIEW_COOLDOWN_MS) {
      return NextResponse.json({ ok: true, skipped: true })
    }
    viewCache.set(cacheKey, Date.now())

    const supabase = createServiceClient()
    await supabase.from('property_views').insert({ property_id })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
