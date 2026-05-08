import { Metadata } from 'next'
import { createServiceClient, PROPERTY_TYPE_LABELS, EVENT_TYPE_LABELS } from '@/lib/supabase'
import PropertyDetailClient from './client'

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const supabase = createServiceClient()
    const { data: p } = await supabase
      .from('properties')
      .select('name, tagline, description, property_type, price_guide, photos, property_event_types(event_type), towns(name, district)')
      .eq('slug', params.slug)
      .eq('is_active', true)
      .single()

    if (!p) return { title: 'Property Not Found | Theeram Spaces' }

    const eventTypes = (p.property_event_types ?? [])
      .map((e: any) => EVENT_TYPE_LABELS[e.event_type as keyof typeof EVENT_TYPE_LABELS] ?? e.event_type)
      .join(', ')

    const typeLabel = PROPERTY_TYPE_LABELS[p.property_type as keyof typeof PROPERTY_TYPE_LABELS] ?? ''
    const town = (p as any).towns
    const location = town ? `${town.name}, ${town.district} district, Kerala` : 'Kerala'
    const title = `${p.name} — ${typeLabel} in ${location}`
    const desc = `${p.tagline} · ${p.price_guide ?? 'Contact owner for pricing'} · Ideal for ${eventTypes}. Book directly on WhatsApp — no commission, no middleman.`
    const firstPhoto = (p as any).photos?.[0]

    return {
      title,
      description: desc,
      keywords: [
        `${typeLabel} ${town?.name ?? 'Kerala'}`,
        `event space ${town?.name ?? 'Kerala'}`,
        `wedding venue ${town?.name ?? 'Kerala'}`,
        `${p.name}`,
        `party hall ${town?.name ?? 'Kerala'}`,
      ],
      openGraph: {
        title: `${p.name} | Theeram Spaces`,
        description: p.tagline,
        url: `https://www.theeramspaces.in/property/${params.slug}`,
        images: firstPhoto ? [{ url: firstPhoto, alt: p.name }] : [],
        type: 'website',
      },
      twitter: {
        card: firstPhoto ? 'summary_large_image' : 'summary',
        title: `${p.name} | Theeram Spaces`,
        description: p.tagline,
        images: firstPhoto ? [firstPhoto] : [],
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
