import { Metadata } from 'next'
import { createServiceClient, Vendor } from '@/lib/supabase'
import ServicesClient from './client'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Event Makers & Vendors in Kerala — Photographers, Caterers & Décor',
  description: 'Trusted local wedding photographers, sadhya caterers, mandapam decorators, event managers, and bridal stylists across Kerala. Talk directly on WhatsApp — no middleman.',
  keywords: [
    'wedding photographers Kerala',
    'sadhya caterers Pala Kottayam',
    'event decorators Kerala',
    'bridal makeup artist Kerala',
    'event management Kerala',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.theeramspaces.in/services',
    siteName: 'Theeram Spaces',
    title: 'Event Makers & Vendors in Kerala | Theeram Spaces',
    description: 'Trusted local photographers, caterers, decorators, and stylists across Kerala. Connect directly on WhatsApp.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Event Makers & Vendors in Kerala | Theeram Spaces',
    description: 'Trusted local photographers, caterers, decorators, and stylists across Kerala.',
  },
  alternates: { canonical: 'https://www.theeramspaces.in/services' },
}

export default async function ServicesPage() {
  let initialVendors: Vendor[] | undefined = undefined
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('vendors')
      .select('*, vendor_attributes(*)')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (data) {
      initialVendors = data.map((v: any) => ({
        ...v,
        vendor_attributes: Array.isArray(v.vendor_attributes) ? v.vendor_attributes[0] : v.vendor_attributes,
      })) as Vendor[]
    }
  } catch {}

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Theeram Spaces', item: 'https://www.theeramspaces.in' },
      { '@type': 'ListItem', position: 2, name: 'Makers & Services', item: 'https://www.theeramspaces.in/services' },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ServicesClient initialVendors={initialVendors} />
    </>
  )
}
