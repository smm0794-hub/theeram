import { createServiceClient } from '@/lib/supabase'
import PropertyForm from '@/components/PropertyForm'
import { notFound } from 'next/navigation'
import type { EventType } from '@/lib/supabase'

export default async function EditPropertyPage({ params }: { params: { slug: string } }) {
  const db = createServiceClient()
  const { data: property } = await db
    .from('properties')
    .select('*, property_attributes(*), property_event_types(event_type)')
    .eq('slug', params.slug)
    .single()

  if (!property) notFound()

  // Cast event_type strings to EventType to satisfy TypeScript
  const initial = {
    ...property,
    property_event_types: (property.property_event_types ?? []).map((e: { event_type: string }) => ({
      event_type: e.event_type as EventType,
    })),
  }

  return <PropertyForm initial={initial} mode="edit" />
}
