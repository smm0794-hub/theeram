import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { vendor_id, channel, view_id, event_date, guest_count } = await req.json()
    if (!vendor_id) return NextResponse.json({ error: 'vendor_id required' }, { status: 400 })
    const db = createServiceClient()
    const enriched: Record<string, any> = {
      vendor_id,
      ...(channel ? { channel } : {}),
      ...(view_id ? { view_id } : {}),
      ...(event_date ? { event_date } : {}),
      ...(typeof guest_count === 'number' ? { guest_count } : {}),
    }
    const { error } = await db.from('vendor_inquiries').insert(enriched)
    if (error) {
      // Fallback to base schema if v4 columns aren't added yet
      if ( !channel || channel === 'whatsapp' || channel === 'phone') {
        await db.from('vendor_inquiries').insert({ vendor_id })
      }
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
