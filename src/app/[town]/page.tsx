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
  return {
    title: `Event Spaces in ${t.name}, ${t.district} - Theeram Spaces`,
    description: t.hero_subtext || `Find event spaces, villas, and venues in ${t.name}, ${t.district} district, Kerala.`,
    alternates: { canonical: `https://www.theeramspaces.in/${t.slug}` },
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

  return (
    <TownPage
      town={town as Town}
      allTowns={(ar.data ?? []) as Town[]}
      initialProperties={(!pr.error && pr.data) ? (pr.data as Property[]) : undefined}
      initialVendors={initialVendors}
    />
  )
}
