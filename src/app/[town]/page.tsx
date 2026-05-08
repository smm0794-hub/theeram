import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Town } from '@/lib/supabase'
import TownPage from '@/components/TownPage'

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

  // Fetch all active towns for the "Browse other towns" row
  const { data: allTowns } = await supabaseServer
    .from('towns').select('*').eq('is_active', true).order('sort_order', { ascending: true })

  return <TownPage town={town as Town} allTowns={(allTowns ?? []) as Town[]}/>
}
