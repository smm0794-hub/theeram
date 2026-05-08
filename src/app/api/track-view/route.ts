import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { property_id } = await req.json()
    if (!property_id) return NextResponse.json({ ok: false }, { status: 400 })
    const supabase = createServiceClient()
    await supabase.from('property_views').insert({ property_id })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
