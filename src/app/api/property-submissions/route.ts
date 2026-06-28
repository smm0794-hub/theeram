import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  try { return cookies().get('curator_session')?.value === 'authenticated' } catch { return false }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = createServiceClient()
    const { error } = await db.from('property_submissions').insert(body)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const notifyUrl = 'https://wa.me/' + (process.env.CURATOR_WHATSAPP ?? '919447000000') + '?text=' + encodeURIComponent('New property listing request on Theeram!\n\nProperty: ' + body.name + '\nOwner: ' + body.owner_name + '\nWhatsApp: ' + body.whatsapp + '\n\nReview at: https://www.theeramspaces.in/curator/submissions')
    return NextResponse.json({ success: true, notifyUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Returns ALL submissions (pending/approved/rejected) so the curator UI can show
// a full history with status badges, matching the vendor submissions pattern.
export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = createServiceClient()
    const { data, error } = await db.from('property_submissions').select('*').order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, status } = await req.json()
    const db = createServiceClient()
    const { error } = await db.from('property_submissions').update({ status }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
