import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Town, Property, Vendor } from '@/lib/supabase'
import TownPage from '@/components/TownPage'

export const revalidate = 60

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Pre-render known town slugs
export async function generateStaticParams() {
  const { data } = await supabaseServer.from('towns').select('slug').eq('is_active', true)
  return (data ?? []).map(t => ({ town: t.slug }))
}

export async function generateMetadata({ params }: { params: { town: string } }): Promise<Metadata> {
  const { data } = await supabaseServer.from('towns').select('*').eq('slug', params.town).single()
  if (!data) return { title: 'Not found' }
  const t = data as Town
  const title = `Event Spaces & Villas in ${t.name}, ${t.district}`
  const description = t.hero_subtext || `Find hand-curated event spaces, wedding venues, villas, and halls in ${t.name}, ${t.district} district, Kerala. Talk directly to owners on WhatsApp.`
  const canonicalUrl = t.slug === 'pala' ? 'https://www.theeramspaces.in' : `https://www.theeramspaces.in/${t.slug}`

  return {
    title,
    description,
    keywords: [
      `event space ${t.name}`,
      `wedding venue ${t.name}`,
      `party hall ${t.name}`,
      `villa for rent ${t.name}`,
      `event venues ${t.district} Kerala`,
    ],
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: `https://www.theeramspaces.in/${t.slug}`,
      siteName: 'Theeram Spaces',
      title: `${title} | Theeram Spaces`,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Theeram Spaces`,
      description,
    },
    alternates: { canonical: canonicalUrl },
  }
}

export default async function TownRoute({ params }: { params: { town: string } }) {
  // Fetch town
  const { data: town } = await supabaseServer
    .from('towns').select('*').eq('slug', params.town).eq('is_active', true).single()
  if (!town) notFound()

  const [ar, pr, vr] = await Promise.all([
    supabaseServer.from('towns').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
    supabaseServer.from('properties').select('*, property_attributes(*), property_event_types(event_type)')
      .eq('is_active', true).eq('town_id', town.id)
      .order('sort_order', { ascending: false }).order('created_at', { ascending: false }),
    supabaseServer.from('vendors').select('*, vendor_attributes(*)').eq('is_active', true)
      .order('is_featured', { ascending: false }).order('created_at', { ascending: false }),
  ])

  const initialVendors = (!vr.error && vr.data)
    ? vr.data.map((v: any) => ({
        ...v,
        vendor_attributes: Array.isArray(v.vendor_attributes) ? v.vendor_attributes[0] : v.vendor_attributes,
      })) as Vendor[]
    : undefined

  const t = town as Town
  const props = (!pr.error && pr.data) ? (pr.data as Property[]) : []

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Theeram Spaces', item: 'https://www.theeramspaces.in' },
      { '@type': 'ListItem', position: 2, name: `${t.name}, ${t.district}`, item: `https://www.theeramspaces.in/${t.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <TownPage
        town={t}
        allTowns={(ar.data ?? []) as Town[]}
        initialProperties={!pr.error && pr.data ? props : undefined}
        initialVendors={initialVendors}
      />
    </>
  )
}
