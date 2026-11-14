import { Metadata } from 'next'
import { createServiceClient, Vendor, VENDOR_CATEGORY_LABELS } from '@/lib/supabase'
import { cloudinaryOgImage } from '@/lib/seo'
import VendorDetailClient from './client'

export const revalidate = 60

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const supabase = createServiceClient()
    const { data: v } = await supabase
      .from('vendors')
      .select('name, category, tagline, area_served, price_guide, photos')
      .eq('slug', params.slug)
      .eq('is_active', true)
      .single()

    if (!v) return { title: 'Maker Not Found | Theeram Spaces' }

    const categoryLabel = VENDOR_CATEGORY_LABELS[v.category as keyof typeof VENDOR_CATEGORY_LABELS] ?? v.category
    const area = v.area_served || 'Kerala'
    const title = `${v.name} — ${categoryLabel} in ${area}`
    const desc = `${v.tagline || categoryLabel}${v.price_guide ? ` · ${v.price_guide}` : ''}. Connect directly on WhatsApp via Theeram Spaces — no commission.`
    const ogPhoto = cloudinaryOgImage((v as any).photos?.[0])

    return {
      title,
      description: desc,
      keywords: [
        `${categoryLabel} ${area}`,
        `${v.name}`,
        `wedding ${categoryLabel.toLowerCase()} Kerala`,
        `event vendors ${area}`,
      ],
      openGraph: {
        type: 'website',
        locale: 'en_IN',
        url: `https://www.theeramspaces.in/vendor/${params.slug}`,
        siteName: 'Theeram Spaces',
        title,
        description: desc,
        images: ogPhoto ? [{ url: ogPhoto, width: 1200, height: 630, alt: `${v.name} — ${categoryLabel}` }] : [],
      },
      twitter: {
        card: ogPhoto ? 'summary_large_image' : 'summary',
        title,
        description: desc,
        images: ogPhoto ? [ogPhoto] : [],
      },
      alternates: {
        canonical: `https://www.theeramspaces.in/vendor/${params.slug}`,
      },
    }
  } catch {
    return { title: 'Maker | Theeram Spaces' }
  }
}

export default async function VendorDetailPage({ params }: PageProps) {
  let initialVendor: Vendor | null = null
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('vendors')
      .select('*')
      .eq('slug', params.slug)
      .eq('is_active', true)
      .single()
    if (data) initialVendor = data as Vendor
  } catch {}

  const categoryLabel = initialVendor
    ? VENDOR_CATEGORY_LABELS[initialVendor.category as keyof typeof VENDOR_CATEGORY_LABELS] ?? initialVendor.category
    : 'Event Vendor'

  const phoneDigits = initialVendor ? (initialVendor.phone || initialVendor.whatsapp || '').replace(/\D/g, '') : ''

  const jsonLd = initialVendor
    ? [
        {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: initialVendor.name,
          description: initialVendor.description || initialVendor.tagline,
          url: `https://www.theeramspaces.in/vendor/${initialVendor.slug}`,
          telephone: phoneDigits ? `+${phoneDigits}` : undefined,
          image: initialVendor.photos?.[0],
          priceRange: initialVendor.price_guide || '₹₹',
          areaServed: initialVendor.area_served || 'Kerala',
          sameAs: initialVendor.instagram_url
            ? [
                initialVendor.instagram_url.startsWith('http')
                  ? initialVendor.instagram_url
                  : `https://instagram.com/${initialVendor.instagram_url.replace('@', '')}`,
              ]
            : undefined,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Theeram Spaces', item: 'https://www.theeramspaces.in' },
            { '@type': 'ListItem', position: 2, name: 'Makers & Services', item: 'https://www.theeramspaces.in/services' },
            { '@type': 'ListItem', position: 3, name: `${initialVendor.name} (${categoryLabel})`, item: `https://www.theeramspaces.in/vendor/${initialVendor.slug}` },
          ],
        },
      ]
    : null

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <VendorDetailClient slug={params.slug} initialVendor={initialVendor} />
    </>
  )
}
