import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  try { return cookies().get('curator_session')?.value === 'authenticated' } catch { return false }
}

// GET — public callers only ever see active vendors (mirrors the old RLS policy).
// Curator callers (with ?all=1, and a valid session) see everything, drafts included.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const all = searchParams.get('all') === '1'
    const db = createServiceClient()

    let query = db.from('vendors').select('*').order('is_featured', { ascending: false }).order('created_at', { ascending: false })
    if (all) {
      if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      // no filter — curator sees drafts too
    } else {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const db = createServiceClient()
    const { data, error } = await db.from('vendors').insert(body).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const db = createServiceClient()
    const { data, error } = await db.from('vendors').update(updates).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE — cascades through child tables first, same pattern as /api/properties.
// This is the piece that was completely missing for vendors: no RLS DELETE policy
// existed, so the anon client could never actually delete a vendor row.
export async function DELETE(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = createServiceClient()
    await db.from('vendor_districts').delete().eq('vendor_id', id)
    await db.from('vendor_attributes').delete().eq('vendor_id', id)
    await db.from('vendor_inquiries').delete().eq('vendor_id', id)
    await db.from('vendor_views').delete().eq('vendor_id', id)
    const { error } = await db.from('vendors').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
