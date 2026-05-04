import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase'

function isAuthed(): boolean {
  try {
    const store = cookies()
    return store.get('curator_session')?.value === 'authenticated'
  } catch {
    return false
  }
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from('properties')
      .select('*, property_attributes(*), property_event_types(event_type)')
      .order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { property, attributes, eventTypes } = await req.json()
    const db = createServiceClient()

    const { data: prop, error: propErr } = await db
      .from('properties')
      .upsert(property, { onConflict: 'slug' })
      .select()
      .single()
    if (propErr) return NextResponse.json({ error: propErr.message }, { status: 500 })

    if (attributes) {
      const { error: attrErr } = await db
        .from('property_attributes')
        .upsert({ ...attributes, property_id: prop.id }, { onConflict: 'property_id' })
      if (attrErr) return NextResponse.json({ error: attrErr.message }, { status: 500 })
    }

    await db.from('property_event_types').delete().eq('property_id', prop.id)
    if (eventTypes?.length > 0) {
      const { error: etErr } = await db
        .from('property_event_types')
        .insert(eventTypes.map((et: string) => ({ property_id: prop.id, event_type: et })))
      if (etErr) return NextResponse.json({ error: etErr.message }, { status: 500 })
    }

    return NextResponse.json({ data: prop })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, ...updates } = await req.json()
    const db = createServiceClient()
    const { error } = await db.from('properties').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const db = createServiceClient()
    await db.from('property_event_types').delete().eq('property_id', id)
    await db.from('property_attributes').delete().eq('property_id', id)
    const { error } = await db.from('properties').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
