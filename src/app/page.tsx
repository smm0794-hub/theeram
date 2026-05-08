'use client'

import { useEffect, useState } from 'react'
import { supabase, Town } from '@/lib/supabase'
import TownPage from '@/components/TownPage'
import { C, sans, serif } from '@/lib/design'

const PALA_FALLBACK: Town = {
  id: '', name: 'Pala', slug: 'pala', district: 'Kottayam',
  tagline: 'Where the Meenachilar bends and the tharavadu stands',
  description: '',
  hero_headline: 'Where the <em>Meenachilar</em> bends and the <em>tharavadu</em> stands.',
  hero_subtext: 'A hand-curated home for Pala\'s most beloved venues - heritage tharavadus, riverside lawns, rubber-estate bungalows. Talk to the owners, the way it has always been done here.',
  why_here_heading: 'Why Pala?',
  why_here_text: 'Pala has always been a place of gathering - of weddings under coconut palms, of sadhya served on banana leaves, of evenings that drift into conversations and meen curry shared from a single plate.',
  stat_1_value: '45 min', stat_1_label: 'FROM KOTTAYAM',
  stat_2_value: '90 min', stat_2_label: 'FROM KOCHI',
  stat_3_value: '200+', stat_3_label: 'YEARS OF TRADITION',
  hero_bg_color: '#1C3A2B',
  is_active: true, sort_order: 1, created_at: '',
}

export default function HomePage() {
  const [town, setTown] = useState<Town>(PALA_FALLBACK)
  const [allTowns, setAllTowns] = useState<Town[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [tr, ar] = await Promise.all([
        supabase.from('towns').select('*').eq('slug', 'pala').single(),
        supabase.from('towns').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      ])
      if (!tr.error && tr.data) setTown(tr.data as Town)
      if (!ar.error && ar.data) setAllTowns(ar.data as Town[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #9B3D1E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return <TownPage town={town} allTowns={allTowns}/>
}