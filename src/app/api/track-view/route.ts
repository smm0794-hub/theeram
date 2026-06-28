import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// Simple in-memory rate limit — one view logged per IP+property per 30 min.
const recentViews = new Map<string, { id: string; time: number }>()
const RATE_LIMIT_MS = 30 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // ── Branch 1: duration report via navigator.sendBeacon (POST-only by spec) ──
    if (body.view_id && typeof body.duration_seconds === 'number') {
      const clamped = Math.max(0, Math.min(body.duration_seconds, 3600))
      const supabase = createServiceClient()
      await supabase.from('property_views').update({ duration_seconds: clamped }).eq('id', body.view_id)
      return NextResponse.json({ ok: true })
    }

    // ── Branch 2: normal view log on page load ──────────────────────────────
    const { property_id } = body
    if (!property_id) return NextResponse.json({ ok: false }, { status: 400 })

    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const key = `${ip}:${property_id}`
    const existing = recentViews.get(key)
    const now = Date.now()

    if (existing && now - existing.time < RATE_LIMIT_MS) {
      return NextResponse.json({ ok: true, view_id: existing.id, deduped: true })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase.from('property_views').insert({ property_id }).select('id').single()
    if (error || !data) return NextResponse.json({ ok: false }, { status: 500 })

    recentViews.set(key, { id: data.id, time: now })
    return NextResponse.json({ ok: true, view_id: data.id })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
