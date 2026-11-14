'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase, Property, Vendor, Town } from '@/lib/supabase'
import { C, sans, serif } from '@/lib/design'
import GratitudeModal from '@/components/GratitudeModal'
import MakerCard from '@/components/MakerCard'
import EnquiryModal, { EnquiryDetails, buildEnquiryWaUrl, openWhatsApp } from '@/components/EnquiryModal'

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

function PropIllustration({ type, photos, name }: { type: string; photos: string[]; name: string }) {
  const isPlaceholder = !photos || photos.length === 0
  if (!isPlaceholder) {
    return <img src={photos[0]} alt={name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }}/>
  }
  const stroke = 'rgba(255,255,255,0.45)'
  const sw = 1
  const svg = (() => {
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
  })()

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.5,
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,.025) 0px, rgba(255,255,255,.025) 1px, transparent 1px, transparent 14px)',
      }}/>
      {svg}
    </div>
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

function SectionDivider({ label, variant = 'line-left', fill = false, accent = C.terra }: { label: string; variant?: 'line-left' | 'line-right' | 'glyph'; fill?: boolean; accent?: string }) {
  if (variant === 'glyph') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
        <span style={{ color: accent, fontSize: 11 }}>❋</span>
        <span style={{ ...sans, fontSize: 10, color: accent, letterSpacing: '.08em' }}>{label}</span>
        {fill && <div style={{ flex: 1, height: 1, background: C.cream3 }}/>}
      </div>
    )
  }
  if (variant === 'line-right') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
        {fill && <div style={{ flex: 1, height: 1, background: C.cream3 }}/>}
        <span style={{ ...sans, fontSize: 10, color: accent, letterSpacing: '.08em' }}>{label}</span>
        <div style={{ width: 14, height: 1, background: accent }}/>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
      <div style={{ width: 14, height: 1, background: accent }}/>
      <span style={{ ...sans, fontSize: 10, color: accent, letterSpacing: '.08em' }}>{label}</span>
      {fill && <div style={{ flex: 1, height: 1, background: C.cream3 }}/>}
    </div>
  )
}

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
        style={{ display: 'flex', gap: 9, overflowX: 'auto', padding: '0 16px 14px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        className="no-scrollbar">
        {filters.map((f, i) => (
          <div key={f.id} onClick={() => onSelect(f.id)}
            className="tap-press"
            style={{
              minWidth: 148, flexShrink: 0,
              background: active === f.id ? '#fdf0eb' : 'white',
              border: active === f.id ? `1.5px solid ${C.terra}` : `1px solid ${C.cream3}`,
              borderRadius: 12,
              padding: '13px 13px', cursor: 'pointer', scrollSnapAlign: 'start',
              transition: 'all .15s',
              boxShadow: active === f.id ? '0 2px 8px rgba(155,61,30,.12)' : '0 1px 3px rgba(0,0,0,.04)',
              opacity: 0, animation: 'cardFadeUp .4s ease forwards', animationDelay: `${i * 0.05}s`,
            }}>
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

interface TownPageProps {
  town: Town
  allTowns: Town[]
  initialProperties?: Property[]
  initialVendors?: Vendor[]
}

export default function TownPage({ town, allTowns, initialProperties, initialVendors }: TownPageProps) {
  const [tab, setTab] = useState<'spaces' | 'makers'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('tab') === 'makers') return 'makers'
    }
    return 'spaces'
  })
  const [properties, setProperties] = useState<Property[]>(initialProperties ?? [])
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors ?? [])
  const [loading, setLoading] = useState(!initialProperties)
  const [spaceFilter, setSpaceFilter] = useState('all')
  const [modalProperty, setModalProperty] = useState<Property | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [makerFilter, setMakerFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [whyOpen, setWhyOpen] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)
  const heroBg = town.hero_bg_color || C.green
  const otherTowns = allTowns.filter(t => t.slug !== town.slug)

  useEffect(() => {
    // If server already passed initialProperties for this town, skip client re-fetch
    if (initialProperties && initialProperties.length > 0) {
      setLoading(false)
      return
    }
    async function load() {
      const [pr, vr] = await Promise.all([
        supabase.from('properties').select('*, property_attributes(*), property_event_types(event_type)')
          .eq('is_active', true).eq('town_id', town.id)
          .order('sort_order', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('vendors').select('*, vendor_attributes(*)').eq('is_active', true)
          .order('is_featured', { ascending: false }).order('created_at', { ascending: false }),
      ])
      if (!pr.error && pr.data) setProperties(pr.data as Property[])
      if (!vr.error && vr.data) {
        const normalised = vr.data.map((v: any) => ({
          ...v,
          vendor_attributes: Array.isArray(v.vendor_attributes) ? v.vendor_attributes[0] : v.vendor_attributes,
        }))
        setVendors(normalised as Vendor[])
      }
      setLoading(false)
    }
    load()
    setWhyOpen(false)
  }, [town.id, initialProperties])

  useEffect(() => {
    function onScroll() {
      const h = document.documentElement
      const scrollTop = h.scrollTop || document.body.scrollTop
      const scrollHeight = h.scrollHeight - h.clientHeight
      setScrollPct(scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function logPropertyInquiry(p: Property) {
    supabase.from('inquiries').insert({
      property_id: p.id,
      event_type: p.property_event_types?.[0]?.event_type ?? 'general',
    }).then(() => {}, () => {})
  }

  const [enquiryProperty, setEnquiryProperty] = useState<Property | null>(null)
  const [enquiryDetails, setEnquiryDetails] = useState<EnquiryDetails | undefined>(undefined)

  function buildWaUrl(p: Property, details?: EnquiryDetails) {
    return buildEnquiryWaUrl(p.owner_whatsapp, p.name, details)
  }

  // Step 1: tap "Check availability" → ask for tentative date + guest count
  function handleWhatsApp(p: Property) {
    setModalProperty(p)
    setShowModal(false)
    setEnquiryProperty(p)
  }

  // Step 2: submit → open WhatsApp (inside the click gesture) with date & pax pre-filled,
  // then show the gratitude sheet for when they come back.
  function sendEnquiry(p: Property, details: EnquiryDetails) {
    logPropertyInquiry(p)
    openWhatsApp(buildWaUrl(p, details))
    setEnquiryDetails(details)
    setEnquiryProperty(null)
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

  const hasPhotos = (p: Property) => Array.isArray(p.photos) && p.photos.length > 0
  const filteredProps = properties.filter(p => {
    if (!matchesFilter(p.property_type, spaceFilter)) return false
    if (search.trim()) return p.name.toLowerCase().includes(search.toLowerCase()) || p.tagline?.toLowerCase().includes(search.toLowerCase())
    return true
  })
    .sort((a, b) => Number(hasPhotos(b)) - Number(hasPhotos(a)))

  const filteredVendors = vendors.filter(v => {
    if (makerFilter !== 'all' && v.category !== makerFilter) return false
    if (search.trim()) return v.name.toLowerCase().includes(search.toLowerCase())
    return true
  })

  const hasWhyContent = !!(town.why_here_text || town.why_here_heading)

  return (
    <div style={{ background: C.cream, minHeight: '100vh' }}>
      <style>{`
        .no-scrollbar::-webkit-scrollbar{display:none}
        .why-expand { max-height: 0; overflow: hidden; opacity: 0; margin-top: 0; transition: max-height .45s ease, opacity .35s ease, margin-top .35s ease; }
        .why-expand.open { max-height: 600px; opacity: 1; margin-top: 22px; }
        .why-chevron { display:inline-block; transition: transform .35s ease; }
        .why-chevron.rotated { transform: rotate(180deg); }
        @keyframes trustPulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
        @keyframes tickerScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes cardFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .tap-press { transition: transform .12s ease; }
        .tap-press:active { transform: scale(0.97); }
        .theeram-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
        }
        @media (min-width: 720px) {
          .theeram-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 20px;
          }
        }
      `}</style>

      {/* Thin accent strip */}
      <div style={{ height: 5, background: C.cream2, position: 'sticky', top: 0, zIndex: 60 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${scrollPct}%`, background: C.gold, transition: 'width .1s linear' }}/>
      </div>

      {/* Hero */}
      <section style={{ background: heroBg, padding: '24px 20px 52px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, opacity: .06, pointerEvents: 'none' }}>
          <svg viewBox="0 0 200 200" fill="none" width={220} height={220}>
            <circle cx="100" cy="100" r="90" stroke="white" strokeWidth={1}/>
            <circle cx="100" cy="100" r="60" stroke="white" strokeWidth={1}/>
            <circle cx="100" cy="100" r="30" stroke="white" strokeWidth={1}/>
            <line x1="10" y1="100" x2="190" y2="100" stroke="white" strokeWidth={1}/>
            <line x1="100" y1="10" x2="100" y2="190" stroke="white" strokeWidth={1}/>
          </svg>
        </div>
        <div style={{ position: 'absolute', left: -60, bottom: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,.10), transparent 70%)', pointerEvents: 'none' }}/>

        <div style={{ maxWidth: 1020, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Top row — wordmark left, hamburger right */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ ...serif, fontSize: 14, color: 'rgba(255,255,255,.55)' }}>തീരം</span>
              <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 12 }}>·</span>
              <span style={{ ...serif, fontSize: 14, color: 'rgba(255,255,255,.55)', letterSpacing: '.03em' }}>theeram</span>
            </div>
            <button onClick={() => setNavOpen(v => !v)} aria-label="Menu" className="tap-press" style={{ background: 'rgba(255,255,255,.08)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8 }}>
              {navOpen ? (
                <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={1.4} strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={1.4} strokeLinecap="round">
                  <line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/>
                </svg>
              )}
            </button>
          </div>

          {navOpen && (
            <div style={{ background: 'rgba(0,0,0,.18)', borderRadius: 12, padding: '6px 16px', marginBottom: 20 }}>
              {[
                { label: 'Spaces', href: '/', note: null },
                { label: 'Makers', href: '/?tab=makers', note: null },
                { label: 'About', href: '/about', note: null },
                { label: 'List your space', href: '/list', note: 'Owner' },
                { label: 'List your service', href: '/join', note: 'Maker' },
              ].map(({ label, href, note }, i) => (
                <Link key={label} href={href} onClick={() => setNavOpen(false)}
                  style={{ ...sans, fontSize: 13, color: 'white', textDecoration: 'none', fontWeight: 300, padding: '11px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,.1)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {label}
                  {note && <span style={{ fontSize: 9, color: C.gold, letterSpacing: '.06em', border: `1px solid ${C.gold}`, padding: '2px 7px', borderRadius: 6 }}>{note}</span>}
                </Link>
              ))}
            </div>
          )}

          {/* Town name — prominent */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 18, flexWrap: 'wrap' as const }}>
            <span style={{ ...serif, fontSize: 22, color: C.gold, fontWeight: 400 }}>{town.name}</span>
            <span style={{ ...sans, fontSize: 11, color: 'rgba(255,255,255,.55)', letterSpacing: '.03em' }}>{town.district} District · Kerala</span>
          </div>

          {/* Hero headline */}
          <h1 style={{ ...serif, fontSize: 36, lineHeight: 1.15, color: 'white', marginBottom: 12, fontWeight: 300 }}
            dangerouslySetInnerHTML={{ __html: town.hero_headline || `Event spaces in <em style="color:${C.gold}">${town.name}</em>` }}/>
          <h2 style={{ ...sans, fontSize: 12, color: C.gold, letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 500, margin: '0 0 14px' }}>
            Event spaces, wedding venues &amp; villas in {town.name}, {town.district}
          </h2>
          <div style={{ width: 34, height: 2, background: C.gold, marginBottom: 18 }}/>
          <p style={{ ...sans, fontSize: 13, color: 'rgba(255,255,255,.68)', lineHeight: 1.75, maxWidth: 420, marginBottom: 28, fontWeight: 300 }}>
            {town.hero_subtext}
          </p>

          {/* Buttons — "Why Town" first, "Other locations" second */}
          <div style={{ display: 'flex', gap: 12 }}>
            {hasWhyContent && (
              <button onClick={() => setWhyOpen(o => !o)} className="tap-press"
                style={{ ...sans, background: whyOpen ? C.green : C.gold, color: whyOpen ? C.gold : C.text, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', padding: '12px 20px', borderRadius: 8, border: `1px solid ${C.gold}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                Why {town.name} <span className={`why-chevron${whyOpen ? ' rotated' : ''}`} style={{ fontSize: 11 }}>⌄</span>
              </button>
            )}
            <button onClick={() => document.getElementById('other-locations')?.scrollIntoView({ behavior: 'smooth' })} className="tap-press"
              style={{ ...sans, background: 'transparent', color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', padding: '12px 18px', borderRadius: 8, border: `1px solid ${C.gold}`, cursor: 'pointer' }}>
              Other locations
            </button>
          </div>

          {hasWhyContent && (
            <div className={`why-expand${whyOpen ? ' open' : ''}`}>
              <div style={{ borderTop: '1px solid rgba(255,255,255,.12)', paddingTop: 20 }}>
                <SectionDivider label={`എന്തുകൊണ്ട് ${town.name}?`} variant="line-left" accent={C.gold}/>
                <div style={{ ...serif, fontSize: 21, fontWeight: 300, color: 'white', marginBottom: 12, lineHeight: 1.3 }}>
                  {town.why_here_heading || `Why ${town.name}?`}
                </div>
                <p style={{ ...sans, fontSize: 12.5, color: 'rgba(255,255,255,.65)', lineHeight: 1.75, fontWeight: 300, marginBottom: 20 }}>
                  {town.why_here_text}
                </p>
                {(town.stat_1_value || town.stat_2_value || town.stat_3_value) && (
                  <>
                    <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,.1)', marginBottom: 18 }}/>
                    <div style={{ display: 'flex' }}>
                      {[[town.stat_1_value, town.stat_1_label], [town.stat_2_value, town.stat_2_label], [town.stat_3_value, town.stat_3_label]].map(([val, label], i) => val ? (
                        <div key={i} style={{ flex: 1, borderLeft: i > 0 ? '1px solid rgba(255,255,255,.1)' : 'none', paddingLeft: i > 0 ? 14 : 0 }}>
                          <div style={{ ...serif, fontSize: 21, color: C.gold, marginBottom: 2, fontWeight: 300 }}>{val}</div>
                          <div style={{ ...sans, fontSize: 8.5, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em' }}>{label}</div>
                        </div>
                      ) : null)}
                    </div>
                  </>
                )}
                <button onClick={() => setWhyOpen(false)} className="tap-press"
                  style={{ ...sans, marginTop: 18, background: 'none', border: 'none', color: 'rgba(255,255,255,.45)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  ↑ Collapse
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Trust bar — running ticker */}
      <div style={{ background: C.green2, padding: '11px 0', overflow: 'hidden', boxShadow: 'inset 0 2px 8px rgba(0,0,0,.12)', position: 'relative' }}>
        <div style={{ display: 'flex', width: 'max-content', animation: 'tickerScroll 22s linear infinite' }}>
          {[0, 1].map(rep => (
            <div key={rep} style={{ display: 'flex', alignItems: 'center', gap: 28, paddingRight: 28 }}>
              {['No middlemen', 'Best price', 'Individually reviewed', 'No login required'].map(text => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.gold, animation: 'trustPulse 2s ease-in-out infinite' }}/>
                  <span style={{ ...sans, fontSize: 10.5, color: 'rgba(255,255,255,.8)', fontWeight: 400, whiteSpace: 'nowrap' as const }}>{text}</span>
                  <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 10, marginLeft: 8 }}>·</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Filter section */}
      <section style={{ background: C.cream, paddingTop: 24, maxWidth: 1052, margin: '0 auto' }}>
        <div style={{ padding: '0 16px', marginBottom: 14 }}>
          <SectionDivider label={tab === 'spaces' ? 'ഭാവം' : 'കൈവഴക്കം'} variant="line-left" fill/>
          <div style={{ ...serif, fontSize: 20, fontWeight: 400, color: C.text }}>
            {tab === 'spaces' ? 'Find a space by feel' : 'Find by craft'}
          </div>
        </div>
        {tab === 'spaces'
          ? <FilterRow filters={FEEL_FILTERS} active={spaceFilter} onSelect={setSpaceFilter}/>
          : <FilterRow filters={MAKER_FILTERS} active={makerFilter} onSelect={setMakerFilter}/>}
      </section>

      {/* Toggle + listing */}
      <section id="main-listing" style={{ background: C.sage }}>
        <div style={{ background: C.sage, borderBottom: `1px solid rgba(0,0,0,.07)` }}>
          <div style={{ maxWidth: 1052, margin: '0 auto', display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', background: 'rgba(255,255,255,.55)', border: `1px solid ${C.cream3}`, borderRadius: 10, padding: 3, overflow: 'hidden' }}>
              {(['spaces', 'makers'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setSearch('') }} className="tap-press"
                  style={{
                    flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 500, textAlign: 'center', cursor: 'pointer', border: 'none',
                    borderRadius: 7, fontFamily: 'system-ui,sans-serif', letterSpacing: '.02em', transition: 'all .15s',
                    background: tab === t ? C.green : 'transparent',
                    color: tab === t ? 'white' : C.muted,
                    boxShadow: tab === t ? '0 2px 6px rgba(28,58,43,.28)' : 'none',
                  }}>
                  {t === 'spaces' ? 'Spaces' : 'Makers'}
                </button>
              ))}
            </div>
            <Link href={tab === 'spaces' ? '/list' : '/join'} className="tap-press"
              style={{ ...sans, fontSize: 10.5, color: C.muted, border: `1px solid ${C.cream3}`, borderRadius: 10, padding: '8px 12px', whiteSpace: 'nowrap', background: 'white', textDecoration: 'none' }}>
              + List yours
            </Link>
          </div>
        </div>

        <div style={{ position: 'sticky', top: 5, zIndex: 40, background: C.sage, borderBottom: `1px solid rgba(0,0,0,.07)`, boxShadow: '0 2px 6px rgba(0,0,0,.04)' }}>
          <div style={{ maxWidth: 1052, margin: '0 auto', padding: '12px 16px' }}>
            <div style={{ position: 'relative' }}>
              <svg viewBox="0 0 16 16" fill="none" width={13} height={13} stroke={C.muted} strokeWidth={1.4} strokeLinecap="round"
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="7" cy="7" r="5"/><path d="M11 11l2 2"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={tab === 'spaces' ? `Search spaces in ${town.name}...` : 'Search makers...'}
                style={{
                  width: '100%', border: `1px solid rgba(0,0,0,.11)`, borderRadius: 10,
                  padding: '10px 12px 10px 34px', fontSize: 13, fontFamily: 'system-ui,sans-serif',
                  background: 'rgba(255,255,255,.88)', outline: 'none', color: C.text, fontWeight: 300,
                  boxSizing: 'border-box' as const, boxShadow: 'inset 0 1px 3px rgba(0,0,0,.04)',
                }}/>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1052, margin: '0 auto', padding: '14px 16px 44px' }}>
          {/* Spaces panel */}
          {tab === 'spaces' && (
            loading ? (
              <div className="theeram-grid">
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ height: 340, background: 'rgba(255,255,255,.45)', borderRadius: 20, border: `1px solid ${C.cream3}`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                      <span style={{ ...serif, fontSize: 13, color: C.muted, fontStyle: 'italic' }}>ഇടം തേടുന്നു...</span>
                      <span style={{ ...sans, fontSize: 10, color: C.muted }}>finding spaces</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px' }}>
                <svg viewBox="0 0 70 56" fill="none" width={56} height={45} stroke={C.cream3} strokeWidth={1} style={{ margin: '0 auto 14px' }}>
                  <path d="M8 28L35 10L62 28V50H8Z"/><rect x="26" y="34" width="18" height="16"/><line x1="12" y1="28" x2="58" y2="28"/>
                </svg>
                <p style={{ ...serif, fontSize: 18, color: C.muted, marginBottom: 8, fontWeight: 300 }}>
                  {properties.length === 0 ? `No spaces listed in ${town.name} yet.` : 'No spaces match your filter.'}
                </p>
                {properties.length === 0
                  ? <Link href="/list" style={{ ...sans, fontSize: 13, color: C.terra, textDecoration: 'underline' }}>Be the first to list →</Link>
                  : <button onClick={() => { setSpaceFilter('all'); setSearch('') }} style={{ ...sans, fontSize: 12, color: C.terra, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
                }
              </div>
            ) : (
              <div className="theeram-grid">
                {filteredProps.map((p, idx) => {
                  const rawAttrs = (p as any).property_attributes
                  const attrs = Array.isArray(rawAttrs) ? rawAttrs[0] : rawAttrs
                  const photos = Array.isArray(p.photos) ? p.photos : []
                  const chips = [
                    attrs?.has_pool && 'Pool',
                    attrs?.has_open_lawn && 'Open lawn',
                    attrs?.has_ac_hall && 'AC hall',
                    attrs?.room_count ? `${attrs.room_count} ${attrs.room_count === 1 ? 'room' : 'rooms'}` : null,
                    attrs?.max_guests_day_event ? `Up to ${attrs.max_guests_day_event}` : null,
                  ].filter(Boolean) as string[]
                  const isPick = (p as any).is_featured
                  const ownerPhone = (p.owner_whatsapp ?? '').replace(/\D/g, '')

                  return (
                    <article key={p.id} style={{
                      background: 'white',
                      border: `1px solid ${C.cream3}`,
                      borderRadius: 24,
                      boxShadow: '0 2px 10px rgba(0,0,0,.04)',
                      overflow: 'hidden', position: 'relative',
                      display: 'flex', flexDirection: 'column',
                      opacity: 0, animation: 'cardFadeUp .45s ease forwards', animationDelay: `${Math.min(idx * 0.05, 0.35)}s`,
                    }}>
                      {isPick && (
                        <div style={{ position: 'absolute', top: 12, left: 12, background: C.gold, padding: '4px 12px', borderRadius: 999, zIndex: 2, boxShadow: '0 2px 6px rgba(0,0,0,.15)' }}>
                          <span style={{ ...sans, fontSize: 9.5, fontWeight: 700, color: C.text }}>★ Theeram pick</span>
                        </div>
                      )}
                      <Link href={`/property/${p.slug}`} style={{ display: 'block', height: 196, background: CARD_BG[p.property_type] ?? C.green, textDecoration: 'none', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                        <PropIllustration type={p.property_type} photos={photos} name={p.name}/>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.45) 0%, transparent 55%)' }}/>
                        <div style={{ position: 'absolute', bottom: 12, left: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 8, height: 1, background: C.gold }}/>
                          <span style={{ ...serif, fontSize: 12, color: C.gold, fontStyle: 'italic' }}>{TYPE_LABEL[p.property_type] ?? p.property_type}</span>
                        </div>
                      </Link>

                      <div style={{ padding: '16px 16px 15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <Link href={`/property/${p.slug}`} style={{ textDecoration: 'none' }}>
                            <div style={{ ...serif, fontSize: 20, color: C.text, marginBottom: 4, lineHeight: 1.2 }}>{p.name}</div>
                            <div style={{ ...sans, fontSize: 11.5, color: C.muted, marginBottom: 11, fontWeight: 300, lineHeight: 1.5 }}>{town.name} · {p.tagline?.split('—')[0]?.trim()}</div>
                          </Link>
                          {chips.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 12 }}>
                              {chips.slice(0, 4).map(ch => (
                                <span key={ch} style={{ ...sans, fontSize: 10.5, color: C.muted, background: '#F0EBE0', padding: '4px 10px', borderRadius: 999, border: `1px solid ${C.cream3}`, fontWeight: 300 }}>
                                  {ch}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <div style={{ width: '100%', height: 1, background: C.cream3, marginBottom: 11 }}/>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
                            <span style={{ ...sans, fontSize: 14, fontWeight: 600, color: C.text }}>{p.price_guide || 'Ask for price'}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Link href={`/property/${p.slug}`} style={{ ...sans, fontSize: 11, color: C.terra, textDecoration: 'none' }}>Details →</Link>
                              <button onClick={() => share(p.slug, p.name)} aria-label={`Share ${p.name}`} className="tap-press" style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${C.cream3}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
                                <svg viewBox="0 0 14 14" fill="none" width={12} height={12} stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"><circle cx="11" cy="2.5" r="1.5"/><circle cx="3" cy="7" r="1.5"/><circle cx="11" cy="11.5" r="1.5"/><path d="M4.5 6.3l5-3.2M4.5 7.7l5 3.2"/></svg>
                              </button>
                            </div>
                          </div>

                          {/* 1-Tap Direct WhatsApp + 1-Tap Call */}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleWhatsApp(p)} className="tap-press"
                              style={{
                                ...sans, flex: 1, height: 44, background: C.green, color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const,
                                border: 'none', borderRadius: 14, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: '0 3px 10px rgba(28,58,43,.2)',
                              }}>
                              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z"/></svg>
                              Check availability
                            </button>
                            {ownerPhone && (
                              <a href={`tel:+${ownerPhone}`} onClick={() => logPropertyInquiry(p)} aria-label={`Call ${p.name} owner`} className="tap-press"
                                style={{
                                  width: 44, height: 44, borderRadius: 14, border: `1px solid ${C.cream3}`, background: C.cream,
                                  color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flexShrink: 0,
                                }}>
                                <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/></svg>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )
          )}

          {/* Makers panel */}
          {tab === 'makers' && (
            loading ? (
              <div className="theeram-grid">
                {[1,2,3,4].map(i => <div key={i} style={{ height: 220, background: 'rgba(255,255,255,.45)', borderRadius: 22, border: `1px solid ${C.cream3}` }}/>)}
              </div>
            ) : filteredVendors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '44px 20px', background: C.cream, borderRadius: 24, border: `1px solid ${C.cream3}` }}>
                <p style={{ ...sans, fontSize: 14, color: C.muted, marginBottom: 10 }}>No makers found.</p>
                <button onClick={() => { setMakerFilter('all'); setSearch('') }} style={{ ...sans, fontSize: 12, color: C.terra, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
              </div>
            ) : (
              <div className="theeram-grid">
                {filteredVendors.map((v, idx) => (
                  <div key={v.id} style={{ opacity: 0, animation: 'cardFadeUp .45s ease forwards', animationDelay: `${Math.min(idx * 0.05, 0.35)}s` }}>
                    <MakerCard maker={v as any}/>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      </section>

      {/* End-of-list section — other locations */}
      <section id="other-locations" style={{ background: C.green2, padding: '44px 0' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontSize: 20, marginBottom: 10 }}>🌿</div>
          <div style={{ ...serif, fontSize: 20, color: 'white', fontWeight: 300, marginBottom: 8, lineHeight: 1.4 }}>
            More spaces being added<br/>every week
          </div>
          <p style={{ ...sans, fontSize: 12.5, color: 'rgba(255,255,255,.6)', fontWeight: 300, marginBottom: 22, lineHeight: 1.6 }}>
            Can’t find what you’re looking for?<br/>Check other locations on Theeram.
          </p>

          {otherTowns.length > 0 && (
            <>
              <div style={{ width: 30, height: 1, background: 'rgba(255,255,255,.15)', margin: '0 auto 20px' }}/>
              <div style={{ marginBottom: 12 }}>
                <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.08em' }}>OTHER LOCATIONS</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {otherTowns.map(t => (
                  <Link key={t.slug} href={`/${t.slug}`} style={{ textDecoration: 'none' }}>
                    <div className="tap-press" style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.2)', borderRadius: 999, color: 'white', fontSize: 11.5, padding: '9px 20px', whiteSpace: 'nowrap', ...sans }}>
                      {t.name}
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
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
            {(allTowns.length > 0
              ? allTowns.map(t => [t.name, t.slug === 'pala' ? '/' : `/${t.slug}`])
              : [['Pala', '/'], ['Thodupuzha', '/thodupuzha'], ['Kanjirappally', '/kanjirappally'], ['Theekoy', '/theekoy']]
            ).map(([label, href]) => (
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

      {/* Enquiry sheet: tentative date + guest count → WhatsApp */}
      {enquiryProperty && (() => {
        const raw = (enquiryProperty as any).property_attributes
        const a = Array.isArray(raw) ? raw[0] : raw
        return (
          <EnquiryModal
            propertyName={enquiryProperty.name}
            maxGuests={a?.max_guests_day_event ?? null}
            onSubmit={details => sendEnquiry(enquiryProperty, details)}
            onClose={() => setEnquiryProperty(null)}
          />
        )
      })()}

      {/* Post-enquiry gratitude sheet (shown after WhatsApp has already been opened) */}
      {modalProperty && showModal && (
        <GratitudeModal
          propertyName={modalProperty.name}
          whatsappUrl={buildWaUrl(modalProperty, enquiryDetails)}
          reviewUrl="https://g.page/r/Cav0otb1aGpEEBM/review"
          upiUrl="upi://pay?pa=smm0794@okhdfcbank&pn=Theeram&am=20&cu=INR&tn=Theeram+chai"
          onClose={() => { setShowModal(false); setModalProperty(null) }}
        />
      )}
    </div>
  )
}
