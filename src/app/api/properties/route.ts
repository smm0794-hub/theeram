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
    const body = await req.json()
    const db = createServiceClient()

    const saveOne = async (item: { property: any; attributes?: any; eventTypes?: string[] }) => {
      const { property, attributes, eventTypes } = item
      const { data: prop, error: propErr } = await db
        .from('properties')
        .upsert(property, { onConflict: 'slug' })
        .select()
        .single()
      if (propErr) throw new Error(`${property?.name || property?.slug || 'Venue'}: ${propErr.message}`)

      if (attributes) {
        const { error: attrErr } = await db
          .from('property_attributes')
          .upsert({ ...attributes, property_id: prop.id }, { onConflict: 'property_id' })
        if (attrErr) throw new Error(`${property?.name || prop.slug} attributes: ${attrErr.message}`)
      }

      if (Array.isArray(eventTypes)) {
        await db.from('property_event_types').delete().eq('property_id', prop.id)
        if (eventTypes.length > 0) {
          const { error: etErr } = await db
            .from('property_event_types')
            .insert(eventTypes.map((et: string) => ({ property_id: prop.id, event_type: et })))
          if (etErr) throw new Error(`${property?.name || prop.slug} event types: ${etErr.message}`)
        }
      }

      return prop
    }

    // Bulk mode for Listing Agent 1-tap mobile save
    if (Array.isArray(body.items)) {
      const saved: any[] = []
      const errors: string[] = []
      for (const item of body.items) {
        try {
          const p = await saveOne(item)
          saved.push(p)
        } catch (err: any) {
          errors.push(err.message ?? 'Failed to save venue')
        }
      }
      if (saved.length === 0 && errors.length > 0) {
        return NextResponse.json({ error: errors.join(' · '), errors }, { status: 500 })
      }
      return NextResponse.json({
        data: saved,
        savedCount: saved.length,
        savedSlugs: saved.map(p => p.slug),
        errors,
      })
    }

    // Single property mode (used by PropertyForm)
    const prop = await saveOne(body)
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
