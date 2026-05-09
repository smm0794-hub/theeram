'use client'

import { useEffect, useState } from 'react'
import { supabase, Town } from '@/lib/supabase'
import TownPage from '@/components/TownPage'

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
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 8000)
    async function load() {
      try {
        const [tr, ar] = await Promise.all([
          supabase.from('towns').select('*').eq('slug', 'pala').single(),
          supabase.from('towns').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        ])
        if (!tr.error && tr.data) setTown(tr.data as Town)
        else setLoadError(true)
        if (!ar.error && ar.data) setAllTowns(ar.data as Town[])
      } catch {
        setLoadError(true)
      } finally {
        clearTimeout(timeout)
        setLoading(false)
      }
    }
    load()
    return () => clearTimeout(timeout)
  }, [])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #9B3D1E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (loadError) return (
    <div style={{ minHeight: '100vh', background: '#F5F0E8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center' }}>
      <p style={{ fontFamily: 'Georgia,serif', fontSize: 18, color: '#1C1C1A' }}>Having trouble connecting.</p>
      <p style={{ fontFamily: 'system-ui,sans-serif', fontSize: 13, color: '#6B5E4E', fontWeight: 300 }}>Please check your connection and refresh the page.</p>
      <button onClick={() => window.location.reload()} style={{ fontFamily: 'system-ui,sans-serif', background: '#1C3A2B', color: 'white', border: 'none', padding: '11px 24px', fontSize: 12, cursor: 'pointer', letterSpacing: '.08em' }}>Refresh</button>
    </div>
  )

  return <TownPage town={town} allTowns={allTowns}/>
}