'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase, Property, Vendor, Town, VENDOR_CATEGORY_LABELS, VendorCategory } from '@/lib/supabase'
import { C, sans, serif } from '@/lib/design'
import Header from '@/components/Header'
import GratitudeModal from '@/components/GratitudeModal'

const CARD_BG: Record<string, string> = {
  villa_with_pool: '#1C3A2B', villa_without_pool: '#2E5C4E',
  heritage_home: '#8A7040', open_event_space: '#4A6741',
  auditorium: '#2E5C4E', river_frontage: '#7B3B2A',
  lodging: '#4A3E6A', resort: '#2E5C4E',
}

const TYPE_LABEL: Record<string, string> = {
  villa_with_pool: 'Villa with pool', villa_without_pool: 'Villa',
  heritage_home: 'Tharavadu', open_event_space: 'Event lawn',
  auditorium: 'Auditorium', river_frontage: 'Riverside',
  lodging: 'Lodging', resort: 'Resort',
}

function PropIllustration({ type, photos }: { type: string; photos: string[] }) {
  if (photos && photos.length > 0) {
    return <img src={photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }}/>
  }
  const stroke = 'rgba(255,255,255,0.45)'
  const sw = 1
  if (type === 'heritage_home') return (
    <svg viewBox="0 0 70 56" fill="none" width={70} height={56} stroke={stroke} strokeWidth={sw}>
      <path d="M8 30L35 12L62 30V52H8Z"/><rect x="24" y="36" width="22" height="16"/><line x1="12" y1="30" x2="58" y2="30"/>
      <line x1="35" y1="12" x2="35" y2="30"/><rect x="29" y="36" width="12" height="16" opacity=".5"/>
    </svg>
  )
  if (type === 'river_frontage') return (
    <svg viewBox="0 0 70 56" fill="none" width={70} height={56} stroke={stroke} strokeWidth={sw}>
      <circle cx="25" cy="16" r="7"/><circle cx="44" cy="12" r="6"/>
      <path d="M5 38Q14 32 25 38Q36 44 45 38Q56 32 66 38"/>
      <path d="M5 48Q14 42 25 48Q36 54 45 48Q56 42 66 48"/>
      <line x1="35" y1="14" x2="35" y2="32"/>
    </svg>
  )
  if (type === 'villa_with_pool') return (
    <svg viewBox="0 0 70 56" fill="none" width={70} height={56} stroke={stroke} strokeWidth={sw}>
      <path d="M8 28L35 10L62 28V50H8Z"/><rect x="26" y="34" width="18" height="16"/>
      <ellipse cx="50" cy="45" rx="10" ry="5" strokeDasharray="2 1"/>
      <line x1="12" y1="28" x2="58" y2="28"/>
    </svg>
  )
  if (type === 'villa_without_pool') return (
    <svg viewBox="0 0 70 56" fill="none" width={70} height={56} stroke={stroke} strokeWidth={sw}>
      <path d="M8 28L35 10L62 28V50H8Z"/><rect x="26" y="34" width="18" height="16"/>
      <line x1="12" y1="28" x2="58" y2="28"/>
      <rect x="14" y="30" width="8" height="8" opacity=".5"/><rect x="48" y="30" width="8" height="8" opacity=".5"/>
    </svg>
  )
  if (type === 'auditorium') return (
    <svg viewBox="0 0 70 56" fill="none" width={70} height={56} stroke={stroke} strokeWidth={sw}>
      <rect x="10" y="20" width="50" height="30"/><path d="M10 20L35 8L60 20"/>
      <line x1="22" y1="50" x2="22" y2="34"/><line x1="35" y1="50" x2="35" y2="34"/><line x1="48" y1="50" x2="48" y2="34"/>
      <line x1="10" y1="30" x2="60" y2="30"/>
    </svg>
  )
  if (type === 'open_event_space') return (
    <svg viewBox="0 0 70 56" fill="none" width={70} height={56} stroke={stroke} strokeWidth={sw}>
      <rect x="5" y="25" width="60" height="25"/>
      <path d="M5 25L35 8L65 25"/>
      <line x1="5" y1="38" x2="65" y2="38"/>
      <circle cx="20" cy="32" r="3"/><circle cx="50" cy="32" r="3"/>
    </svg>
  )
  if (type === 'lodging') return (
    <svg viewBox="0 0 70 56" fill="none" width={70} height={56} stroke={stroke} strokeWidth={sw}>
      <rect x="10" y="18" width="50" height="34"/>
      <path d="M10 18L35 6L60 18"/>
      <rect x="20" y="30" width="10" height="10"/><rect x="40" y="30" width="10" height="10"/>
      <rect x="28" y="36" width="14" height="16"/>
      <line x1="35" y1="6" x2="35" y2="18"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 70 56" fill="none" width={70} height={56} stroke={stroke} strokeWidth={sw}>
      <path d="M8 28L35 10L62 28V50H8Z"/><rect x="26" y="34" width="18" height="16"/><line x1="12" y1="28" x2="58" y2="28"/>
    </svg>
  )
}

const FEEL_FILTERS = [
  { id: 'all', ml: 'എല്ലാം', en: 'All spaces', desc: 'Browse everything' },
  { id: 'heritage_home', ml: 'താവഴി', en: 'Tharavadu', desc: 'Heritage ancestral homes' },
  { id: 'river_frontage', ml: 'പുഴയോരം', en: 'Riverside', desc: 'River views and lawns' },
  { id: 'villa', ml: 'വില്ല', en: 'Villa', desc: 'Private villas — pool or garden' },
  { id: 'auditorium', ml: 'വിശാലം', en: 'Grand halls', desc: 'For 200+ guests' },
  { id: 'open_event_space', ml: 'ഇടം', en: 'Event lawn', desc: 'Open air celebrations' },
  { id: 'lodging', ml: 'താമസം', en: 'Lodging', desc: 'Homestays & stays' },
]

const MAKER_FILTERS = [
  { id: 'all', ml: 'എല്ലാം', en: 'Everyone', desc: 'Browse all makers' },
  { id: 'photography_video', ml: 'ഫോട്ടോ', en: 'Photography', desc: '& Video' },
  { id: 'catering', ml: 'സദ്യ', en: 'Catering', desc: 'Food & sadhya' },
  { id: 'decoration_florals', ml: 'അലങ്കാരം', en: 'Décor', desc: 'Mandapam & florals' },
  { id: 'event_management', ml: 'ഇവന്റ്', en: 'Event Mgmt', desc: 'Planning & coordination' },
  { id: 'beauty_styling', ml: 'ഭംഗി', en: 'Beauty', desc: 'Bridal & styling' },
]

function matchesFilter(propertyType: string, filter: string): boolean {
  if (filter === 'all') return true
  if (filter === 'villa') return propertyType === 'villa_with_pool' || propertyType === 'villa_without_pool'
  return propertyType === filter
}

function FilterRow({ filters, active, onSelect }: { filters: typeof FEEL_FILTERS; active: string; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [dot, setDot] = useState(0)
  return (
    <>
      <div ref={ref} onScroll={() => ref.current && setDot(Math.round(ref.current.scrollLeft / 158))}
        style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 14px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        className="no-scrollbar">
        {filters.map(f => (
          <div key={f.id} onClick={() => onSelect(f.id)}
            style={{ minWidth: 148, flexShrink: 0, background: active === f.id ? '#fdf0eb' : 'white', border: active === f.id ? `1.5px solid ${C.terra}` : `1px solid ${C.cream3}`, padding: '14px 12px', cursor: 'pointer', scrollSnapAlign: 'start', transition: 'all .15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <div style={{ width: 8, height: 1, background: C.terra }}/>
              <span style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.06em' }}>{f.ml}</span>
              <div style={{ width: 8, height: 1, background: C.terra }}/>
            </div>
            <div style={{ ...serif, fontSize: 14, color: C.text, marginBottom: 3 }}>{f.en}</div>
            <div style={{ ...sans, fontSize: 11, color: C.muted, fontWeight: 300 }}>{f.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, paddingBottom: 14 }}>
        {filters.map((_, i) => <div key={i} style={{ width: dot === i ? 14 : 5, height: 5, borderRadius: 3, background: dot === i ? C.terra : C.cream3, transition: 'width .2s' }}/>)}
      </div>
    </>
  )
}

export default function TownPage({ town, allTowns }: { town: Town; allTowns: Town[] }) {
  const [tab, setTab] = useState<'spaces' | 'makers'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('tab') === 'makers') return 'makers'
    }
    return 'spaces'
  })
  const [properties, setProperties] = useState<Property[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [spaceFilter, setSpaceFilter] = useState('all')
  const [modalProperty, setModalProperty] = useState<Property | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [makerFilter, setMakerFilter] = useState('all')
  const [search, setSearch] = useState('')
  const heroBg = town.hero_bg_color || C.green
  const otherTowns = allTowns.filter(t => t.slug !== town.slug)
  const topBarText = `${town.name} · ${town.district} · Kerala`

  useEffect(() => {
    async function load() {
      const [pr, vr] = await Promise.all([
        supabase.from('properties').select('*, property_attributes(*), property_event_types(event_type)')
          .eq('is_active', true).eq('town_id', town.id)
          .order('sort_order', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('vendors').select('*').eq('is_active', true)
          .order('is_featured', { ascending: false }).order('created_at', { ascending: false }),
      ])
      if (!pr.error && pr.data) setProperties(pr.data as Property[])
      if (!vr.error && vr.data) setVendors(vr.data as Vendor[])
      setLoading(false)
    }
    load()
  }, [town.id])

  async function handleWhatsApp(p: Property) {
    try {
      await supabase.from('inquiries').insert({
        property_id: p.id,
        event_type: p.property_event_types?.[0]?.event_type ?? 'general',
      })
    } catch {}
    setModalProperty(p)
    setShowModal(true)
  }

  async function share(slug: string, name: string) {
    const url = `${window.location.origin}/property/${slug}`
    try {
      if (navigator.share) await navigator.share({ title: name, url })
      else await navigator.clipboard.writeText(url)
    } catch {}
  }

  const filteredProps = properties.filter(p => {
    if (!matchesFilter(p.property_type, spaceFilter)) return false
    if (search.trim()) return p.name.toLowerCase().includes(search.toLowerCase()) || p.tagline?.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const filteredVendors = vendors.filter(v => {
    if (makerFilter !== 'all' && v.category !== makerFilter) return false
    if (search.trim()) return v.name.toLowerCase().includes(search.toLowerCase())
    return true
  })

  return (
    <div style={{ background: C.cream, minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

      {/* Top bar */}
      <div style={{ background: heroBg, padding: '6px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em' }}>തീരം · theeram</span>
        <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.04em' }}>{topBarText}</span>
      </div>

      <Header/>

      {/* Hero */}
      <section style={{ background: heroBg, padding: '50px 20px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, opacity: .06, pointerEvents: 'none' }}>
          <svg viewBox="0 0 200 200" fill="none" width={220} height={220}>
            <circle cx="100" cy="100" r="90" stroke="white" strokeWidth={1}/>
            <circle cx="100" cy="100" r="60" stroke="white" strokeWidth={1}/>
            <circle cx="100" cy="100" r="30" stroke="white" strokeWidth={1}/>
            <line x1="10" y1="100" x2="190" y2="100" stroke="white" strokeWidth={1}/>
            <line x1="100" y1="10" x2="100" y2="190" stroke="white" strokeWidth={1}/>
          </svg>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 18, background: 'rgba(255,255,255,.1)', padding: '4px 12px' }}>
          <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.7)', letterSpacing: '.08em' }}>{town.district} District · Kerala</span>
        </div>
        <h1 style={{ ...serif, fontSize: 34, lineHeight: 1.18, color: 'white', marginBottom: 16, fontWeight: 300 }}
          dangerouslySetInnerHTML={{ __html: town.hero_headline || `Event spaces in <em style="color:${C.gold}">${town.name}</em>` }}/>
        <div style={{ width: 34, height: 2, background: C.gold, marginBottom: 18 }}/>
        <p style={{ ...sans, fontSize: 13, color: 'rgba(255,255,255,.68)', lineHeight: 1.75, maxWidth: 300, marginBottom: 30, fontWeight: 300 }}>
          {town.hero_subtext}
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => document.getElementById('main-listing')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ ...sans, background: C.gold, color: C.text, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', padding: '12px 22px', border: 'none', cursor: 'pointer' }}>
            Find a space
          </button>
          <Link href="/about" style={{ ...sans, background: 'transparent', color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', padding: '12px 22px', border: `1px solid ${C.gold}`, textDecoration: 'none' }}>
            Our story
          </Link>
        </div>
      </section>

      {/* Trust bar */}
      <div style={{ background: C.cream2, borderBottom: `1px solid ${C.cream3}`, padding: '18px 16px', display: 'flex' }}>
        {[['No fees', 'Speak to the owner'], ['Individually reviewed', 'Every listing, by us'], ['WhatsApp first', 'The Kerala way']].map(([title, sub], i) => (
          <div key={title} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4, padding: '0 6px', borderLeft: i > 0 ? `1px solid ${C.cream3}` : 'none' }}>
            <div style={{ width: 7, height: 7, background: C.terra, transform: 'rotate(45deg)', marginBottom: 4 }}/>
            <div style={{ ...sans, fontSize: 11, fontWeight: 500, color: C.text }}>{title}</div>
            <div style={{ ...sans, fontSize: 10, color: C.muted, fontWeight: 300 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Other towns */}
      {otherTowns.length > 0 && (
        <section style={{ background: C.cream, padding: '22px 0 4px', borderBottom: `1px solid ${C.cream3}` }}>
          <div style={{ padding: '0 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 14, height: 1, background: C.terra }}/>
              <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>മറ്റ് ഇടങ്ങൾ</span>
              <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
              <span style={{ ...sans, fontSize: 10, color: C.muted }}>Browse other towns →</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 16px' }} className="no-scrollbar">
            {otherTowns.map(t => (
              <Link key={t.slug} href={`/${t.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <div style={{ background: t.hero_bg_color || C.green, padding: '12px 14px', minWidth: 130 }}>
                  <div style={{ ...sans, fontSize: 9, color: C.gold, letterSpacing: '.07em', marginBottom: 4 }}>{t.district}</div>
                  <div style={{ ...serif, fontSize: 15, color: 'white', lineHeight: 1.2 }}>{t.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Filter section */}
      <section style={{ background: C.cream, paddingTop: 24 }}>
        <div style={{ padding: '0 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{ width: 14, height: 1, background: C.terra }}/>
            <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>{tab === 'spaces' ? 'ഭാവം' : 'കൈവഴക്കം'}</span>
            <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
          </div>
          <div style={{ ...serif, fontSize: 20, fontWeight: 400, color: C.text, marginBottom: 4 }}>
            {tab === 'spaces' ? 'Find a space by feel' : 'Find by craft'}
          </div>
          <div style={{ ...sans, fontSize: 12, color: C.muted, fontWeight: 300 }}>
            {tab === 'spaces' ? 'Swipe to browse. Tap to filter.' : 'What do you need for your event?'}
          </div>
        </div>
        {tab === 'spaces'
          ? <FilterRow filters={FEEL_FILTERS} active={spaceFilter} onSelect={setSpaceFilter}/>
          : <FilterRow filters={MAKER_FILTERS} active={makerFilter} onSelect={setMakerFilter}/>}
      </section>

      {/* Toggle + listing */}
      <section id="main-listing" style={{ background: C.sage }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 10, background: C.sage, borderBottom: `1px solid rgba(0,0,0,.07)`, position: 'sticky', top: 55, zIndex: 40 }}>
          <div style={{ flex: 1, display: 'flex', background: 'rgba(255,255,255,.5)', border: `1px solid ${C.cream3}`, borderRadius: 3, overflow: 'hidden' }}>
            {(['spaces', 'makers'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setSearch('') }}
                style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 500, textAlign: 'center', cursor: 'pointer', border: 'none', fontFamily: 'system-ui,sans-serif', letterSpacing: '.02em', transition: 'all .15s', background: tab === t ? C.green : 'transparent', color: tab === t ? 'white' : C.muted }}>
                {t === 'spaces' ? 'Spaces' : 'Makers'}
              </button>
            ))}
          </div>
          <Link href={tab === 'spaces' ? '/list' : '/join'}
            style={{ ...sans, fontSize: 10, color: C.muted, border: `1px solid ${C.cream3}`, padding: '7px 10px', whiteSpace: 'nowrap', background: 'white', textDecoration: 'none' }}>
            + List yours
          </Link>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px 8px', position: 'relative' }}>
          <svg viewBox="0 0 16 16" fill="none" width={13} height={13} stroke={C.muted} strokeWidth={1.4} strokeLinecap="round"
            style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="7" cy="7" r="5"/><path d="M11 11l2 2"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'spaces' ? `Search spaces in ${town.name}...` : 'Search makers...'}
            style={{ width: '100%', border: `1px solid rgba(0,0,0,.12)`, padding: '10px 12px 10px 34px', fontSize: 13, fontFamily: 'system-ui,sans-serif', background: 'rgba(255,255,255,.65)', outline: 'none', color: C.text, fontWeight: 300, boxSizing: 'border-box' as const }}/>
        </div>

        {/* Spaces panel */}
        {tab === 'spaces' && (
          <div style={{ padding: '8px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loading ? [1,2,3].map(i => <div key={i} style={{ height: 340, background: 'rgba(255,255,255,.4)', border: `1px solid ${C.cream3}` }}/>)
            : filteredProps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                <p style={{ ...serif, fontSize: 18, color: C.muted, marginBottom: 8, fontWeight: 300 }}>
                  {properties.length === 0 ? `No spaces listed in ${town.name} yet.` : 'No spaces match your filter.'}
                </p>
                {properties.length === 0
                  ? <Link href="/list" style={{ ...sans, fontSize: 13, color: C.terra, textDecoration: 'underline' }}>Be the first to list →</Link>
                  : <button onClick={() => { setSpaceFilter('all'); setSearch('') }} style={{ ...sans, fontSize: 12, color: C.terra, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
                }
              </div>
            ) : filteredProps.map(p => {
              const attrs = p.property_attributes
              const photos = Array.isArray(p.photos) ? p.photos : []
              const chips = [
                attrs?.has_pool && 'Pool',
                attrs?.has_open_lawn && 'Open lawn',
                attrs?.has_ac_hall && 'AC hall',
                attrs?.max_guests_day_event ? `Up to ${attrs.max_guests_day_event}` : null,
              ].filter(Boolean) as string[]
              return (
                <div key={p.id} style={{ background: 'white', border: `1px solid ${C.cream3}`, overflow: 'hidden', position: 'relative' }}>
                  {(p as any).is_featured && <div style={{ position: 'absolute', top: 0, left: 0, background: C.gold, padding: '4px 10px', zIndex: 2 }}><span style={{ ...sans, fontSize: 9, fontWeight: 700, color: C.text }}>Theeram pick</span></div>}
                  <Link href={`/property/${p.slug}`} style={{ display: 'block', height: 180, background: CARD_BG[p.property_type] ?? C.green, textDecoration: 'none', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                    <PropIllustration type={p.property_type} photos={photos}/>
                    {photos.length > 0 && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.3) 0%, transparent 60%)' }}/>}
                    <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 8, height: 1, background: C.gold }}/>
                      <span style={{ ...serif, fontSize: 11, color: C.gold, fontStyle: 'italic' }}>{TYPE_LABEL[p.property_type] ?? p.property_type}</span>
                    </div>
                  </Link>
                  <div style={{ padding: '14px 14px 12px' }}>
                    <Link href={`/property/${p.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{ ...serif, fontSize: 20, color: C.text, marginBottom: 3, lineHeight: 1.15 }}>{p.name}</div>
                      <div style={{ ...sans, fontSize: 11, color: C.muted, marginBottom: 9, fontWeight: 300 }}>{town.name} · {p.tagline?.split('—')[0]?.trim()}</div>
                    </Link>
                    {chips.length > 0 && <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                      {chips.slice(0,4).map(ch => <span key={ch} style={{ ...sans, fontSize: 10, color: C.muted, background: '#F0EBE0', padding: '3px 9px', border: `1px solid ${C.cream3}`, fontWeight: 300 }}>{ch}</span>)}
                    </div>}
                    <div style={{ width: '100%', height: 1, background: C.cream3, marginBottom: 10 }}/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ ...sans, fontSize: 14, fontWeight: 500 }}>{p.price_guide?.split('–')[0] ?? '₹12,000'} / day</span>
                      <div style={{ display: 'flex', gap: 7 }}>
                        <button onClick={() => share(p.slug, p.name)} style={{ width: 32, height: 32, border: `1px solid ${C.cream3}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
                          <svg viewBox="0 0 14 14" fill="none" width={12} height={12} stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"><circle cx="11" cy="2.5" r="1.5"/><circle cx="3" cy="7" r="1.5"/><circle cx="11" cy="11.5" r="1.5"/><path d="M4.5 6.3l5-3.2M4.5 7.7l5 3.2"/></svg>
                        </button>
                        <button onClick={() => handleWhatsApp(p)} style={{ ...sans, background: C.green, color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase' as const, padding: '9px 13px', border: 'none', cursor: 'pointer' }}>Talk to owner</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Makers panel */}
        {tab === 'makers' && (
          <div style={{ padding: '8px 16px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? [1,2,3].map(i => <div key={i} style={{ height: 160, background: 'rgba(255,255,255,.4)', border: `1px solid ${C.cream3}` }}/>)
            : filteredVendors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ ...sans, fontSize: 14, color: C.muted, marginBottom: 10 }}>No makers found.</p>
                <button onClick={() => { setMakerFilter('all'); setSearch('') }} style={{ ...sans, fontSize: 12, color: C.terra, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
              </div>
            ) : filteredVendors.map(v => (
              <div key={v.id} style={{ background: 'white', border: `1px solid ${C.cream3}`, padding: '18px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                  <div style={{ width: 8, height: 1, background: C.terra }}/>
                  <span style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em' }}>{VENDOR_CATEGORY_LABELS[v.category as VendorCategory]}</span>
                  <div style={{ width: 8, height: 1, background: C.terra }}/>
                </div>
                <div style={{ ...serif, fontSize: 18, color: C.text, marginBottom: 4 }}>{v.name}</div>
                <div style={{ ...sans, fontSize: 12, color: C.muted, fontWeight: 300, marginBottom: 12 }}>{v.tagline}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {v.whatsapp && <button onClick={() => { const msg = encodeURIComponent(`Hi! I found ${v.name} on Theeram.`); window.open(`https://wa.me/${v.whatsapp}?text=${msg}`, '_blank') }} style={{ ...sans, flex: 1, background: C.green, color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase' as const, padding: '9px 0', border: 'none', cursor: 'pointer' }}>WhatsApp</button>}
                  {v.phone && <a href={`tel:${v.phone}`} style={{ ...sans, padding: '9px 12px', border: `1px solid ${C.cream3}`, color: C.text, fontSize: 10, textDecoration: 'none' }}>📞 Call</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Why this town */}
      <section style={{ background: C.green2, padding: '46px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
          <div style={{ width: 15, height: 1, background: C.gold }}/>
          <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.08em' }}>എന്തുകൊണ്ട് {town.name}?</span>
          <div style={{ width: 15, height: 1, background: C.gold }}/>
        </div>
        <h2 style={{ ...serif, fontSize: 28, fontWeight: 300, color: 'white', marginBottom: 15, lineHeight: 1.25 }}>
          {town.why_here_heading || `Why ${town.name}?`}
        </h2>
        <p style={{ ...sans, fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.8, marginBottom: 26, fontWeight: 300 }}>
          {town.why_here_text}
        </p>
        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,.1)', marginBottom: 24 }}/>
        <div style={{ display: 'flex' }}>
          {[[town.stat_1_value, town.stat_1_label], [town.stat_2_value, town.stat_2_label], [town.stat_3_value, town.stat_3_label]].map(([val, label], i) => val ? (
            <div key={i} style={{ flex: 1, borderLeft: i > 0 ? '1px solid rgba(255,255,255,.1)' : 'none', paddingLeft: i > 0 ? 16 : 0 }}>
              <div style={{ ...serif, fontSize: 24, color: C.gold, marginBottom: 3, fontWeight: 300 }}>{val}</div>
              <div style={{ ...sans, fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em' }}>{label}</div>
            </div>
          ) : null)}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: C.dark, padding: '40px 16px 32px', textAlign: 'center' }}>
        <div style={{ ...serif, fontSize: 19, color: C.gold, marginBottom: 5, fontWeight: 300 }}>തീരം · theeram</div>
        <div style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em', marginBottom: 20 }}>Spaces for every occasion · Kerala</div>
        <div style={{ width: 38, height: 1, background: 'rgba(255,255,255,.1)', margin: '0 auto 18px' }}/>
        <div style={{ marginBottom: 10 }}>
          <div style={{ ...sans, fontSize: 9, color: 'rgba(255,255,255,.25)', letterSpacing: '.1em', marginBottom: 8 }}>LOCATIONS</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' as const }}>
            {[['Pala', '/pala'], ['Thodupuzha', '/thodupuzha'], ['Kanjirappally', '/kanjirappally'], ['Theekoy', '/theekoy']].map(([label, href]) => (
              <Link key={label} href={href} style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.45)', textDecoration: 'none', letterSpacing: '.04em' }}>{label}</Link>
            ))}
          </div>
        </div>
        <div style={{ width: 38, height: 1, background: 'rgba(255,255,255,.08)', margin: '12px auto' }}/>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 14, flexWrap: 'wrap' as const }}>
          {[['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
            <Link key={label} href={href} style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.28)', textDecoration: 'none', letterSpacing: '.04em' }}>{label}</Link>
          ))}
        </div>
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_CURATOR_WHATSAPP}?text=${encodeURIComponent('Hi! I need help finding the right event space.')}`}
          target="_blank" rel="noopener noreferrer"
          style={{ ...sans, fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 8 }}>
          💬 Need help? Ask us on WhatsApp
        </a>
        <div style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.14)', lineHeight: 1.6, marginBottom: 6 }}>We use anonymous page view analytics to understand which spaces are most popular. No personal data is collected.</div>
        <div style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.18)', lineHeight: 1.6 }}>© {new Date().getFullYear()} Theeram Spaces · Kerala</div>
      </footer>

      {/* Gratitude modal */}
      {modalProperty && showModal && (
        <GratitudeModal
          propertyName={modalProperty.name}
          whatsappUrl={`https://wa.me/${modalProperty.owner_whatsapp}?text=${encodeURIComponent(`Hi! I found ${modalProperty.name} on Theeram and I'm interested in booking. Could you share availability and pricing?`)}`}
          reviewUrl="https://g.page/r/Cav0otb1aGpEEBM/review"
          upiUrl="upi://pay?pa=smm0794@okhdfcbank&pn=Theeram&tn=Theeram+chai"
          onClose={() => { setShowModal(false); setModalProperty(null) }}
        />
      )}
    </div>
  )
}
