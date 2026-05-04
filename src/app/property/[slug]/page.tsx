import { Metadata } from 'next'
import { createServiceClient, PROPERTY_TYPE_LABELS, EVENT_TYPE_LABELS } from '@/lib/supabase'
import PropertyDetailClient from './client'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const supabase = createServiceClient()
    const { data: property } = await supabase
      .from('properties')
      .select('name, tagline, property_type, price_guide, property_event_types(event_type)')
      .eq('slug', params.slug)
      .eq('is_active', true)
      .single()

    if (!property) return { title: 'Property Not Found' }

    const eventTypes = (property.property_event_types ?? [])
      .map((e: any) => EVENT_TYPE_LABELS[e.event_type as keyof typeof EVENT_TYPE_LABELS] ?? e.event_type)
      .join(', ')

    const typeLabel = PROPERTY_TYPE_LABELS[property.property_type as keyof typeof PROPERTY_TYPE_LABELS] ?? ''

    return {
      title: `${property.name} — ${typeLabel} in Pala Kerala`,
      description: `${property.tagline} · ${property.price_guide} · Suitable for ${eventTypes}. Contact owner directly on WhatsApp.`,
      openGraph: {
        title: `${property.name} | Theeram Spaces`,
        description: property.tagline,
        url: `https://www.theeramspaces.in/property/${params.slug}`,
      },
      alternates: {
        canonical: `https://www.theeramspaces.in/property/${params.slug}`,
      },
    }
  } catch {
    return { title: 'Property | Theeram Spaces' }
  }
}

export default function PropertyDetailPage({ params }: PageProps) {
  return <PropertyDetailClient slug={params.slug} />
}
