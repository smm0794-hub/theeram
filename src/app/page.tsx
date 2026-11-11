import { createClient } from '@supabase/supabase-js'
import { Metadata } from 'next'
import { Town, Property, Vendor } from '@/lib/supabase'
import TownPage from '@/components/TownPage'

export const revalidate = 60

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.theeramspaces.in' },
}

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const PALA_FALLBACK: Town = {
  id: '', name: 'Pala', slug: 'pala', district: 'Kottayam',
  tagline: 'Where the Meenachilar bends and the tharavadu stands',
  description: '',
  hero_headline: 'Where the <em>Meenachilar</em> bends and the <em>tharavadu</em> stands.',
  hero_subtext: "A hand-curated home for Pala's most beloved venues - heritage tharavadus, riverside lawns, rubber-estate bungalows. Talk to the owners, the way it has always been done here.",
  why_here_heading: 'Why Pala?',
  why_here_text: 'Pala has always been a place of gathering - of weddings under coconut palms, of sadhya served on banana leaves, of evenings that drift into conversations and meen curry shared from a single plate.',
  stat_1_value: '45 min', stat_1_label: 'FROM KOTTAYAM',
  stat_2_value: '90 min', stat_2_label: 'FROM KOCHI',
  stat_3_value: '200+', stat_3_label: 'YEARS OF TRADITION',
  hero_bg_color: '#1C3A2B',
  is_active: true, sort_order: 1, created_at: '',
}

export default async function HomePage() {
  try {
    const [tr, ar, vr] = await Promise.all([
      supabaseServer.from('towns').select('*').eq('slug', 'pala').single(),
      supabaseServer.from('towns').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      supabaseServer.from('vendors').select('*, vendor_attributes(*)').eq('is_active', true)
        .order('is_featured', { ascending: false }).order('created_at', { ascending: false }),
    ])

    const town = (!tr.error && tr.data ? tr.data : PALA_FALLBACK) as Town
    const allTowns = (!ar.error && ar.data ? ar.data : []) as Town[]

    let initialProperties: Property[] | undefined = undefined
    if (town.id) {
      const pr = await supabaseServer
        .from('properties')
        .select('*, property_attributes(*), property_event_types(event_type)')
        .eq('is_active', true)
        .eq('town_id', town.id)
        .order('sort_order', { ascending: false })
        .order('created_at', { ascending: false })
      if (!pr.error && pr.data) initialProperties = pr.data as Property[]
    }

    const initialVendors = (!vr.error && vr.data)
      ? vr.data.map((v: any) => ({
          ...v,
          vendor_attributes: Array.isArray(v.vendor_attributes) ? v.vendor_attributes[0] : v.vendor_attributes,
        })) as Vendor[]
      : undefined

    return (
      <TownPage
        town={town}
        allTowns={allTowns}
        initialProperties={initialProperties}
        initialVendors={initialVendors}
      />
    )
  } catch {
    return <TownPage town={PALA_FALLBACK} allTowns={[]}/>
  }
}