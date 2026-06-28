import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { vendor_id } = await req.json()
    if (!vendor_id) return NextResponse.json({ error: 'vendor_id required' }, { status: 400 })
    const db = createServiceClient()
    const { error } = await db.from('vendor_inquiries').insert({ vendor_id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
