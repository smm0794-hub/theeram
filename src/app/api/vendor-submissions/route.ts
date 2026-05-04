import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  try {
    return cookies().get('curator_session')?.value === 'authenticated'
  } catch { return false }
}

// Public — submit vendor application
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = createServiceClient()
    const { error } = await db.from('vendor_submissions').insert(body)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Build a notification URL (curator opens this to see the submission)
    const notifyUrl = `https://wa.me/${process.env.CURATOR_WHATSAPP ?? '919447000000'}?text=${encodeURIComponent(
      `New vendor application on Theeram!\n\nName: ${body.name}\nCategory: ${body.category}\nWhatsApp: ${body.whatsapp}\n\nReview at: https://www.theeramspaces.in/curator/vendors`
    )}`

    return NextResponse.json({ success: true, notifyUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Curator — get all submissions
export async function GET(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const status = new URL(req.url).searchParams.get('status') ?? 'pending'
    const db = createServiceClient()
    const { data, error } = await db
      .from('vendor_submissions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Curator — approve or reject submission
export async function PATCH(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, action, vendorData } = await req.json()
    const db = createServiceClient()

    if (action === 'approve' && vendorData) {
      // Insert into vendors table
      const { error: vendorError } = await db.from('vendors').insert(vendorData)
      if (vendorError) return NextResponse.json({ error: vendorError.message }, { status: 500 })
    }

    // Update submission status
    const { error } = await db
      .from('vendor_submissions')
      .update({ status: action === 'approve' ? 'approved' : 'rejected' })
      .eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
