import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  try {
    return cookies().get('curator_session')?.value === 'authenticated'
  } catch { return false }
}

// Public — get active vendors by category
export async function GET(req: NextRequest) {
  const category = new URL(req.url).searchParams.get('category')
  const allForCurator = new URL(req.url).searchParams.get('all')

  const db = allForCurator && isAuthed()
    ? createServiceClient()
    : createServiceClient()

  try {
    let query = db
      .from('vendors')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (!allForCurator) {
      query = query.eq('is_active', true)
    }
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Curator — upsert vendor
export async function POST(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const vendor = await req.json()
    const db = createServiceClient()
    const { data, error } = await db
      .from('vendors')
      .upsert(vendor, { onConflict: 'slug' })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Curator — patch (toggle active/featured)
export async function PATCH(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, ...updates } = await req.json()
    const db = createServiceClient()
    const { error } = await db.from('vendors').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// Curator — delete vendor
export async function DELETE(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const db = createServiceClient()
    const { error } = await db.from('vendors').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
