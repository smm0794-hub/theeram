import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// Mirrors track-view's structure exactly — one POST handler, two branches:
// duration report (sendBeacon) vs normal view log. Ready for when a standalone
// maker detail page exists; currently nothing calls this yet since makers are
// only shown as cards, not individual pages.

const recentViews = new Map<string, { id: string; time: number }>()
const RATE_LIMIT_MS = 30 * 60 * 1000

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India', US: 'United States', GB: 'United Kingdom', AE: 'United Arab Emirates',
  SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait', OM: 'Oman', BH: 'Bahrain',
  AU: 'Australia', CA: 'Canada', SG: 'Singapore', MY: 'Malaysia', DE: 'Germany',
  IE: 'Ireland', NZ: 'New Zealand',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (body.view_id && typeof body.duration_seconds === 'number') {
      const clamped = Math.max(0, Math.min(body.duration_seconds, 3600))
      const supabase = createServiceClient()
      await supabase.from('vendor_views').update({ duration_seconds: clamped }).eq('id', body.view_id)
      return NextResponse.json({ ok: true })
    }

    const { vendor_id, session_id } = body
    if (!vendor_id) return NextResponse.json({ ok: false }, { status: 400 })

    const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
    const key = `${ip}:${vendor_id}`
    const existing = recentViews.get(key)
    const now = Date.now()

    if (existing && now - existing.time < RATE_LIMIT_MS) {
      return NextResponse.json({ ok: true, view_id: existing.id, deduped: true })
    }

    const countryCode = req.headers.get('x-vercel-ip-country') || null
    const visitor_country = countryCode ? (COUNTRY_NAMES[countryCode] ?? countryCode) : null
    const visitor_country_code = countryCode
    const visitor_region = req.headers.get('x-vercel-ip-country-region') || null

    const supabase = createServiceClient()
    let { data, error } = await supabase
      .from('vendor_views')
      .insert({
        vendor_id,
        session_id: session_id || null,
        visitor_country,
        visitor_country_code,
        visitor_region,
      })
      .select('id')
      .single()

    if (error || !data) {
      const fallback = await supabase.from('vendor_views').insert({ vendor_id }).select('id').single()
      data = fallback.data
      error = fallback.error
    }
    if (error || !data) return NextResponse.json({ ok: false }, { status: 500 })

    recentViews.set(key, { id: data.id, time: now })
    return NextResponse.json({ ok: true, view_id: data.id })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
