'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase, Property, Vendor, Town } from '@/lib/supabase'
import { C, sans, serif } from '@/lib/design'
import GratitudeModal from '@/components/GratitudeModal'
import MakerCard from '@/components/MakerCard'
import EnquiryModal, { EnquiryDetails, buildEnquiryWaUrl, openWhatsApp } from '@/components/EnquiryModal'

const CARD_BG: Record<string, string> = {
  villa_with_pool: '#173B13', villa_without_pool: '#0F290C',
  heritage_home: '#173B13', open_event_space: '#0F290C',
  auditorium: '#173B13', river_frontage: '#0F290C',
  lodging: '#173B13', resort: '#0F290C',
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
  const stroke = 'rgba(255,255,255,0.85)'
  const accentStroke = C.lime
  const sw = 1.6
  const svg = (() => {
    if (type === 'heritage_home') return (
      <svg viewBox="0 0 70 56" fill="none" width={74} height={60} stroke={stroke} strokeWidth={sw}>
        <path d="M8 30L35 12L62 30V52H8Z"/><rect x="24" y="36" width="22" height="16" stroke={accentStroke}/><line x1="12" y1="30" x2="58" y2="30"/>
        <line x1="35" y1="12" x2="35" y2="30"/><rect x="29" y="36" width="12" height="16" opacity=".6"/>
      </svg>
    )
    if (type === 'river_frontage') return (
      <svg viewBox="0 0 70 56" fill="none" width={74} height={60} stroke={stroke} strokeWidth={sw}>
        <circle cx="25" cy="16" r="7" fill={accentStroke} stroke="none"/><circle cx="44" cy="12" r="5" stroke={C.gold}/>
        <path d="M5 38Q14 32 25 38Q36 44 45 38Q56 32 66 38"/>
        <path d="M5 48Q14 42 25 48Q36 54 45 48Q56 42 66 48" stroke={C.gold}/>
      </svg>
    )
    if (type === 'villa_with_pool') return (
      <svg viewBox="0 0 70 56" fill="none" width={74} height={60} stroke={stroke} strokeWidth={sw}>
        <path d="M8 28L35 10L62 28V50H8Z"/><rect x="26" y="34" width="18" height="16" stroke={accentStroke}/>
        <ellipse cx="50" cy="45" rx="10" ry="5" stroke={C.gold} strokeDasharray="2 1"/>
        <line x1="12" y1="28" x2="58" y2="28"/>
      </svg>
    )
    if (type === 'villa_without_pool') return (
      <svg viewBox="0 0 70 56" fill="none" width={74} height={60} stroke={stroke} strokeWidth={sw}>
        <path d="M8 28L35 10L62 28V50H8Z"/><rect x="26" y="34" width="18" height="16" stroke={accentStroke}/>
        <line x1="12" y1="28" x2="58" y2="28"/>
        <rect x="14" y="30" width="8" height="8" opacity=".6"/><rect x="48" y="30" width="8" height="8" opacity=".6"/>
      </svg>
    )
    if (type === 'auditorium') return (
      <svg viewBox="0 0 70 56" fill="none" width={74} height={60} stroke={stroke} strokeWidth={sw}>
        <rect x="10" y="20" width="50" height="30"/><path d="M10 20L35 8L60 20" stroke={accentStroke}/>
        <line x1="22" y1="50" x2="22" y2="34"/><line x1="35" y1="50" x2="35" y2="34"/><line x1="48" y1="50" x2="48" y2="34"/>
        <line x1="10" y1="30" x2="60" y2="30"/>
      </svg>
    )
    if (type === 'open_event_space') return (
      <svg viewBox="0 0 70 56" fill="none" width={74} height={60} stroke={stroke} strokeWidth={sw}>
        <rect x="5" y="25" width="60" height="25"/>
        <path d="M5 25L35 8L65 25" stroke={accentStroke}/>
        <line x1="5" y1="38" x2="65" y2="38"/>
        <circle cx="20" cy="32" r="3" fill={C.gold} stroke="none"/><circle cx="50" cy="32" r="3" fill={C.gold} stroke="none"/>
      </svg>
    )
    if (type === 'lodging') return (
      <svg viewBox="0 0 70 56" fill="none" width={74} height={60} stroke={stroke} strokeWidth={sw}>
        <rect x="10" y="18" width="50" height="34"/>
        <path d="M10 18L35 6L60 18" stroke={accentStroke}/>
        <rect x="20" y="30" width="10" height="10"/><rect x="40" y="30" width="10" height="10"/>
        <rect x="28" y="36" width="14" height="16" stroke={C.gold}/>
      </svg>
    )
    return (
      <svg viewBox="0 0 70 56" fill="none" width={74} height={60} stroke={stroke} strokeWidth={sw}>
        <path d="M8 28L35 10L62 28V50H8Z"/><rect x="26" y="34" width="18" height="16" stroke={accentStroke}/><line x1="12" y1="28" x2="58" y2="28"/>
      </svg>
    )
  })()

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="dot-grid-light" style={{ position: 'absolute', inset: 0, opacity: 0.65 }}/>
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

function SectionDivider({ label, fill = false, accent = C.green, chevronColor = C.limeDark }: { label: string; variant?: 'line-left' | 'line-right' | 'glyph'; fill?: boolean; accent?: string; chevronColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ ...serif, fontSize: 11, fontWeight: 900, color: chevronColor }}>&gt;&gt;</span>
      <span style={{ ...sans, fontSize: 10.5, fontWeight: 700, color: accent, letterSpacing: '.08em', textTransform: 'uppercase' }}>{label}</span>
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
        style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 14px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        className="no-scrollbar">
        {filters.map((f, i) => {
          const isActive = active === f.id
          return (
            <div key={f.id} onClick={() => onSelect(f.id)}
              className="tap-press"
              style={{
                minWidth: 152, flexShrink: 0,
                background: isActive ? C.dark : 'white',
                border: isActive ? `1.5px solid ${C.dark}` : `1px solid ${C.cream3}`,
                borderRadius: 14,
                padding: '13px 14px', cursor: 'pointer', scrollSnapAlign: 'start',
                transition: 'all .15s',
                boxShadow: isActive ? '0 4px 12px rgba(17,18,17,.14)' : '0 1px 3px rgba(0,0,0,.04)',
                opacity: 0, animation: 'cardFadeUp .4s ease forwards', animationDelay: `${i * 0.04}s`,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                <span style={{ ...sans, fontSize: 9.5, fontWeight: 700, color: isActive ? C.lime : C.limeDark, letterSpacing: '.06em' }}>{f.ml}</span>
              </div>
              <div style={{ ...serif, fontSize: 14.5, fontWeight: 800, color: isActive ? 'white' : C.dark, marginBottom: 2 }}>{f.en}</div>
              <div style={{ ...sans, fontSize: 11, color: isActive ? 'rgba(255,255,255,.7)' : C.muted, fontWeight: 400 }}>{f.desc}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, paddingBottom: 14 }}>
        {filters.map((_, i) => <div key={i} style={{ width: dot === i ? 16 : 5, height: 5, borderRadius: 3, background: dot === i ? C.green : C.cream3, transition: 'width .2s' }}/>)}
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

  function getSessionId(): string {
    try {
      let id = sessionStorage.getItem('theeram_session_id')
      if (!id) {
        id = crypto.randomUUID()
        sessionStorage.setItem('theeram_session_id', id)
      }
      return id
    } catch {
      return 'unknown'
    }
  }

  function logPropertyInquiry(p: Property, opts?: {
    details?: EnquiryDetails
    channel?: 'whatsapp' | 'whatsapp_skip' | 'phone' | 'share_link'
  }) {
    const details = opts?.details
    const channel = opts?.channel ?? 'whatsapp'
    const rawAttrs = (p as any).property_attributes
    const attrs = Array.isArray(rawAttrs) ? rawAttrs[0] : rawAttrs
    const maxGuests = attrs?.max_guests_day_event ?? null

    const basePayload: Record<string, any> = {
      property_id: p.id,
      event_type: details?.occasion || p.property_event_types?.[0]?.event_type || 'general',
    }
    const enrichedPayload: Record<string, any> = {
      ...basePayload,
      channel,
      session_id: getSessionId(),
      ...(details ? {
        event_date: details.date || null,
        is_flexible_date: !details.date,
        guest_count: details.pax,
        is_over_capacity: !!(maxGuests && details.pax > maxGuests),
      } : {}),
    }
    supabase.from('inquiries').insert(enrichedPayload).then(({ error }) => {
      if (error && (channel === 'whatsapp' || channel === 'whatsapp_skip' || channel === 'phone')) {
        supabase.from('inquiries').insert(basePayload).then(() => {}, () => {})
      }
    }, () => {})
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
    logPropertyInquiry(p, { details, channel: 'whatsapp' })
    openWhatsApp(buildWaUrl(p, details))
    setEnquiryDetails(details)
    setEnquiryProperty(null)
    setModalProperty(p)
    setShowModal(true)
  }

  function skipEnquiry(p: Property) {
    logPropertyInquiry(p, { channel: 'whatsapp_skip' })
    openWhatsApp(buildWaUrl(p))
    setEnquiryDetails(undefined)
    setEnquiryProperty(null)
    setModalProperty(p)
    setShowModal(true)
  }

  async function share(p: Property) {
    logPropertyInquiry(p, { channel: 'share_link' })
    const url = `${window.location.origin}/property/${p.slug}`
    try {
      if (navigator.share) await navigator.share({ title: p.name, url })
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
      <div style={{ height: 4, background: C.cream2, position: 'sticky', top: 0, zIndex: 60 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${scrollPct}%`, background: C.lime, transition: 'width .1s linear' }}/>
      </div>

      {/* Hero — Olive Garden + Concentric Octagon + Chamfered Butter Card */}
      <section style={{ background: heroBg === '#1C3A2B' ? C.green : heroBg, padding: '22px 20px 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -40, top: -40, opacity: .09, pointerEvents: 'none' }}>
          <svg viewBox="0 0 200 200" fill="none" width={300} height={300}>
            <polygon points="100,10 163,36 190,100 163,163 100,190 36,163 10,100 36,36" stroke="white" strokeWidth={1}/>
            <polygon points="100,28 150,49 172,100 150,150 100,172 49,150 28,100 49,49" stroke="white" strokeWidth={1}/>
            <polygon points="100,46 138,62 154,100 138,138 100,154 62,138 46,100 62,62" stroke="white" strokeWidth={1}/>
            <polygon points="100,64 125,75 136,100 125,125 100,136 75,125 64,100 75,75" stroke={C.lime} strokeWidth={1.2}/>
          </svg>
        </div>

        <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {/* Top row — wordmark left, hamburger right */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 28 28" fill="none" width={20} height={20}>
                  <path d="M5 17C8.5 11 12.5 11 14 14C15.5 17 19.5 17 23 11" stroke={C.lime} strokeWidth={2.6} strokeLinecap="round"/>
                  <path d="M5 11.5C8.5 5.5 12.5 5.5 14 8.5C15.5 11.5 19.5 11.5 23 5.5" stroke={C.gold} strokeWidth={2.2} strokeLinecap="round" opacity=".9"/>
                  <circle cx="14" cy="21.5" r="2" fill={C.lime}/>
                </svg>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <span style={{ ...serif, fontSize: 19, fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>theeram</span>
                <span style={{ ...sans, fontSize: 12, color: 'rgba(255,255,255,.6)' }}>തീരം</span>
              </div>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link href="/list" style={{ ...sans, fontSize: 11, fontWeight: 700, background: C.lime, color: C.dark, textDecoration: 'none', padding: '7px 14px', borderRadius: 999 }}>
                + List space
              </Link>
              <button onClick={() => setNavOpen(v => !v)} aria-label="Menu" className="tap-press" style={{ background: 'rgba(255,255,255,.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 10 }}>
                {navOpen ? (
                  <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={1.6} strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
                ) : (
                  <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={1.6} strokeLinecap="round">
                    <line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {navOpen && (
            <div style={{ background: C.green2, border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: '6px 16px', marginBottom: 22 }}>
              {[
                { label: 'Spaces', href: '/', note: null },
                { label: 'Makers', href: '/?tab=makers', note: null },
                { label: 'About', href: '/about', note: null },
                { label: 'List your space', href: '/list', note: 'Owner' },
                { label: 'List your service', href: '/join', note: 'Maker' },
              ].map(({ label, href, note }, i) => (
                <Link key={label} href={href} onClick={() => setNavOpen(false)}
                  style={{ ...sans, fontSize: 13.5, color: 'white', textDecoration: 'none', fontWeight: 500, padding: '11px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,.1)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {label}
                  {note && <span style={{ fontSize: 10, fontWeight: 700, color: C.dark, background: C.limePill, padding: '2px 9px', borderRadius: 999 }}>{note}</span>}
                </Link>
              ))}
            </div>
          )}

          {/* Town pill */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.limePill, color: C.dark, padding: '5px 14px', borderRadius: 999, marginBottom: 18 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.green }}/>
            <span style={{ ...sans, fontSize: 11.5, fontWeight: 700 }}>{town.name} · {town.district} District, Kerala</span>
          </div>

          {/* Hero headline */}
          <h1 style={{ ...serif, fontSize: 'clamp(32px, 5vw, 48px)', lineHeight: 1.08, color: 'white', marginBottom: 14, fontWeight: 900, maxWidth: 680 }}
            dangerouslySetInnerHTML={{ __html: (town.hero_headline || `Event spaces in <em style="color:${C.lime}">${town.name}</em>`).replace(/<em>/g, `<span style="color:${C.lime}">`).replace(/<\/em>/g, '</span>') }}/>
          <h2 style={{ ...sans, fontSize: 11.5, color: C.gold, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 14px' }}>
            Event spaces, wedding venues &amp; villas in {town.name}, {town.district}
          </h2>
          <p style={{ ...sans, fontSize: 14.5, color: 'rgba(255,255,255,.78)', lineHeight: 1.7, maxWidth: 520, marginBottom: 28, fontWeight: 400 }}>
            {town.hero_subtext}
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {hasWhyContent && (
              <button onClick={() => setWhyOpen(o => !o)} className="tap-press"
                style={{ ...serif, background: whyOpen ? C.gold : C.lime, color: C.dark, fontSize: 12, fontWeight: 800, padding: '13px 22px', borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                Why {town.name} <span className={`why-chevron${whyOpen ? ' rotated' : ''}`} style={{ fontSize: 12 }}>⌄</span>
              </button>
            )}
            <button onClick={() => document.getElementById('other-locations')?.scrollIntoView({ behavior: 'smooth' })} className="tap-press"
              style={{ ...sans, background: 'rgba(255,255,255,.1)', color: 'white', fontSize: 12, fontWeight: 600, padding: '13px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,.22)', cursor: 'pointer' }}>
              Other locations
            </button>
          </div>

          {hasWhyContent && (
            <div className={`why-expand${whyOpen ? ' open' : ''}`}>
              <div style={{ borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: 22 }}>
                <SectionDivider label={`എന്തുകൊണ്ട് ${town.name}?`} accent={C.lime} chevronColor={C.lime}/>
                <div style={{ ...serif, fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 10, lineHeight: 1.3 }}>
                  {town.why_here_heading || `Why ${town.name}?`}
                </div>
                <p style={{ ...sans, fontSize: 13.5, color: 'rgba(255,255,255,.78)', lineHeight: 1.75, fontWeight: 400, marginBottom: 20, maxWidth: 640 }}>
                  {town.why_here_text}
                </p>
                {(town.stat_1_value || town.stat_2_value || town.stat_3_value) && (
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[[town.stat_1_value, town.stat_1_label], [town.stat_2_value, town.stat_2_label], [town.stat_3_value, town.stat_3_label]].map(([val, label], i) => val ? (
                      <div key={i} style={{ background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, padding: '12px 16px', minWidth: 130 }}>
                        <div style={{ ...serif, fontSize: 21, color: C.gold, marginBottom: 2, fontWeight: 900 }}>{val}</div>
                        <div style={{ ...sans, fontSize: 9.5, fontWeight: 600, color: 'rgba(255,255,255,.6)', letterSpacing: '.06em' }}>{label}</div>
                      </div>
                    ) : null)}
                  </div>
                )}
                <button onClick={() => setWhyOpen(false)} className="tap-press"
                  style={{ ...sans, marginTop: 18, background: 'none', border: 'none', color: 'rgba(255,255,255,.55)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  ↑ Collapse
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Trust bar — Ink Black with >> Grass Green chevrons */}
      <div style={{ background: C.dark, padding: '12px 0', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,.08)', position: 'relative' }}>
        <div style={{ display: 'flex', width: 'max-content', animation: 'tickerScroll 24s linear infinite' }}>
          {[0, 1].map(rep => (
            <div key={rep} style={{ display: 'flex', alignItems: 'center', gap: 32, paddingRight: 32 }}>
              {['No middlemen', 'Best direct owner price', 'Individually reviewed', 'Zero login required'].map(text => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...serif, fontSize: 11, fontWeight: 900, color: C.lime }}>&gt;&gt;</span>
                  <span style={{ ...sans, fontSize: 11.5, color: 'rgba(255,255,255,.88)', fontWeight: 600, whiteSpace: 'nowrap' }}>{text}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Filter section */}
      <section style={{ background: C.cream, paddingTop: 28, maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ padding: '0 16px', marginBottom: 14 }}>
          <SectionDivider label={tab === 'spaces' ? 'ഭാവം · FIND BY FEEL' : 'കൈവഴക്കം · FIND BY CRAFT'} fill/>
          <div style={{ ...serif, fontSize: 22, fontWeight: 900, color: C.dark }}>
            {tab === 'spaces' ? 'Find a space by feel' : 'Find by craft'}
          </div>
        </div>
        {tab === 'spaces'
          ? <FilterRow filters={FEEL_FILTERS} active={spaceFilter} onSelect={setSpaceFilter}/>
          : <FilterRow filters={MAKER_FILTERS} active={makerFilter} onSelect={setMakerFilter}/>}
      </section>

      {/* Toggle + listing */}
      <section id="main-listing" style={{ background: C.cream }}>
        <div style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}` }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 10 }}>
            <div style={{ flex: 1, display: 'flex', background: 'white', border: `1px solid ${C.cream3}`, borderRadius: 12, padding: 4, overflow: 'hidden' }}>
              {(['spaces', 'makers'] as const).map(t => (
                <button key={t} onClick={() => { setTab(t); setSearch('') }} className="tap-press"
                  style={{
                    flex: 1, padding: '9px 0', fontSize: 12.5, fontWeight: 700, textAlign: 'center', cursor: 'pointer', border: 'none',
                    borderRadius: 9, ...sans, letterSpacing: '.01em', transition: 'all .15s',
                    background: tab === t ? C.green : 'transparent',
                    color: tab === t ? 'white' : C.muted,
                  }}>
                  {t === 'spaces' ? 'Spaces' : 'Makers'}
                </button>
              ))}
            </div>
            <Link href={tab === 'spaces' ? '/list' : '/join'} className="tap-press"
              style={{ ...sans, fontSize: 11, fontWeight: 700, color: C.dark, border: `1px solid ${C.cream3}`, borderRadius: 12, padding: '10px 14px', whiteSpace: 'nowrap', background: 'white', textDecoration: 'none' }}>
              + List yours
            </Link>
          </div>
        </div>

        <div style={{ position: 'sticky', top: 4, zIndex: 40, background: C.cream, borderBottom: `1px solid ${C.cream3}` }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '12px 16px' }}>
            <div style={{ position: 'relative' }}>
              <svg viewBox="0 0 16 16" fill="none" width={14} height={14} stroke={C.muted} strokeWidth={1.6} strokeLinecap="round"
                style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="7" cy="7" r="5"/><path d="M11 11l2 2"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={tab === 'spaces' ? `Search spaces in ${town.name}...` : 'Search makers...'}
                style={{
                  width: '100%', border: `1px solid ${C.cream3}`, borderRadius: 12,
                  padding: '11px 12px 11px 36px', fontSize: 13.5, ...sans,
                  background: 'white', outline: 'none', color: C.dark, fontWeight: 400,
                  boxSizing: 'border-box',
                }}/>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '18px 16px 48px' }}>
          {/* Spaces panel */}
          {tab === 'spaces' && (
            loading ? (
              <div className="theeram-grid">
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ height: 340, background: 'white', borderRadius: '18px 40px 18px 18px', border: `1px solid ${C.cream3}`, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                      <span style={{ ...serif, fontSize: 14, fontWeight: 800, color: C.green }}>ഇടം തേടുന്നു...</span>
                      <span style={{ ...sans, fontSize: 11, color: C.muted }}>finding spaces</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '44px 16px', background: 'white', borderRadius: '18px 40px 18px 18px', border: `1px solid ${C.cream3}` }}>
                <p style={{ ...serif, fontSize: 18, fontWeight: 800, color: C.dark, marginBottom: 8 }}>
                  {properties.length === 0 ? `No spaces listed in ${town.name} yet.` : 'No spaces match your filter.'}
                </p>
                {properties.length === 0
                  ? <Link href="/list" style={{ ...sans, fontSize: 13, fontWeight: 700, color: C.green, textDecoration: 'underline' }}>Be the first to list →</Link>
                  : <button onClick={() => { setSpaceFilter('all'); setSearch('') }} style={{ ...sans, fontSize: 12.5, fontWeight: 700, color: C.green, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
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
                      background: isPick ? C.mintTint : 'white',
                      border: `1px solid ${C.cream3}`,
                      borderRadius: '18px 40px 18px 18px',
                      boxShadow: '0 2px 10px rgba(17,18,17,.04)',
                      overflow: 'hidden', position: 'relative',
                      display: 'flex', flexDirection: 'column',
                      opacity: 0, animation: 'cardFadeUp .45s ease forwards', animationDelay: `${Math.min(idx * 0.05, 0.35)}s`,
                    }}>
                      {isPick && (
                        <div style={{ position: 'absolute', top: 20, left: 20, background: C.lime, padding: '4px 12px', borderRadius: 999, zIndex: 2, boxShadow: '0 2px 6px rgba(0,0,0,.15)' }}>
                          <span style={{ ...serif, fontSize: 9.5, fontWeight: 800, color: C.dark }}>★ Theeram pick</span>
                        </div>
                      )}
                      <div style={{ padding: '12px 12px 0' }}>
                        <Link href={`/property/${p.slug}`} style={{ display: 'block', height: 188, background: CARD_BG[p.property_type] ?? C.green, textDecoration: 'none', position: 'relative', overflow: 'hidden', flexShrink: 0, borderRadius: '14px 32px 14px 14px' }}>
                          <PropIllustration type={p.property_type} photos={photos} name={p.name}/>
                          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(17,18,17,.5) 0%, transparent 55%)' }}/>
                          <div style={{ position: 'absolute', bottom: 12, left: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ ...sans, fontSize: 11, fontWeight: 700, color: C.gold }}>{TYPE_LABEL[p.property_type] ?? p.property_type}</span>
                          </div>
                        </Link>
                      </div>

                      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <Link href={`/property/${p.slug}`} style={{ textDecoration: 'none' }}>
                            <div style={{ ...serif, fontSize: 19, fontWeight: 800, color: C.dark, marginBottom: 4, lineHeight: 1.2 }}>{p.name}</div>
                            <div style={{ ...sans, fontSize: 12, color: C.muted, marginBottom: 11, fontWeight: 400, lineHeight: 1.5 }}>{town.name} · {p.tagline?.split('—')[0]?.trim()}</div>
                          </Link>
                          {chips.length > 0 && (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                              {chips.slice(0, 4).map(ch => (
                                <span key={ch} style={{ ...sans, fontSize: 10.5, color: C.dark, background: C.cream, padding: '4px 10px', borderRadius: 999, border: `1px solid ${C.cream3}`, fontWeight: 500 }}>
                                  {ch}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <div style={{ width: '100%', height: 1, background: C.cream3, marginBottom: 11 }}/>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
                            <span style={{ ...serif, fontSize: 14.5, fontWeight: 800, color: C.dark }}>{p.price_guide || 'Ask for price'}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Link href={`/property/${p.slug}`} style={{ ...sans, fontSize: 11.5, fontWeight: 700, color: C.green, textDecoration: 'none' }}>Details →</Link>
                              <button onClick={() => share(p)} aria-label={`Share ${p.name}`} className="tap-press" style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${C.cream3}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
                                <svg viewBox="0 0 14 14" fill="none" width={12} height={12} stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"><circle cx="11" cy="2.5" r="1.5"/><circle cx="3" cy="7" r="1.5"/><circle cx="11" cy="11.5" r="1.5"/><path d="M4.5 6.3l5-3.2M4.5 7.7l5 3.2"/></svg>
                              </button>
                            </div>
                          </div>

                          {/* 1-Tap Direct WhatsApp + 1-Tap Call */}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleWhatsApp(p)} className="tap-press"
                              style={{
                                ...serif, flex: 1, height: 44, background: C.dark, color: 'white', fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
                                border: 'none', borderRadius: 14, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.lime }}/>
                              Check availability
                            </button>
                            {ownerPhone && (
                              <a href={`tel:+${ownerPhone}`} onClick={() => logPropertyInquiry(p, { channel: 'phone' })} aria-label={`Call ${p.name} owner`} className="tap-press"
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
                {[1,2,3,4].map(i => <div key={i} style={{ height: 220, background: 'white', borderRadius: '18px 40px 18px 18px', border: `1px solid ${C.cream3}` }}/>)}
              </div>
            ) : filteredVendors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '44px 20px', background: 'white', borderRadius: '18px 40px 18px 18px', border: `1px solid ${C.cream3}` }}>
                <p style={{ ...sans, fontSize: 14, color: C.muted, marginBottom: 10 }}>No makers found.</p>
                <button onClick={() => { setMakerFilter('all'); setSearch('') }} style={{ ...sans, fontSize: 12.5, fontWeight: 700, color: C.green, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
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
      <section id="other-locations" className="dot-grid-light" style={{ background: C.green, padding: '52px 0' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 999, background: C.limePill, color: C.dark, ...sans, fontSize: 11, fontWeight: 700, marginBottom: 14 }}>
            More spaces added every week
          </div>
          <div style={{ ...serif, fontSize: 24, color: 'white', fontWeight: 900, marginBottom: 8, lineHeight: 1.3 }}>
            Exploring outside {town.name}?
          </div>
          <p style={{ ...sans, fontSize: 13.5, color: 'rgba(255,255,255,.75)', fontWeight: 400, marginBottom: 24, lineHeight: 1.6 }}>
            Check curated spaces in other towns on Theeram.
          </p>

          {otherTowns.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
              {otherTowns.map(t => (
                <Link key={t.slug} href={`/${t.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="tap-press" style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.22)', borderRadius: 999, color: 'white', fontSize: 12, fontWeight: 600, padding: '9px 20px', whiteSpace: 'nowrap', ...sans }}>
                    {t.name} →
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: C.dark, padding: '40px 16px 32px', textAlign: 'center' }}>
        <div style={{ ...serif, fontSize: 20, color: C.lime, marginBottom: 5, fontWeight: 900 }}>തീരം · theeram</div>
        <div style={{ ...sans, fontSize: 11, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em', marginBottom: 20 }}>Spaces for every occasion · Kerala</div>
        <div style={{ width: 38, height: 1, background: 'rgba(255,255,255,.12)', margin: '0 auto 18px' }}/>
        <div style={{ marginBottom: 12 }}>
          <div style={{ ...sans, fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,.35)', letterSpacing: '.1em', marginBottom: 8 }}>LOCATIONS</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {(allTowns.length > 0
              ? allTowns.map(t => [t.name, t.slug === 'pala' ? '/' : `/${t.slug}`])
              : [['Pala', '/'], ['Thodupuzha', '/thodupuzha'], ['Kanjirappally', '/kanjirappally'], ['Theekoy', '/theekoy']]
            ).map(([label, href]) => (
              <Link key={label} href={href} style={{ ...sans, fontSize: 11, color: 'rgba(255,255,255,.6)', textDecoration: 'none', fontWeight: 500 }}>{label}</Link>
            ))}
          </div>
        </div>
        <div style={{ width: 38, height: 1, background: 'rgba(255,255,255,.08)', margin: '12px auto' }}/>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
          {[['About', '/about'], ['Privacy', '/privacy'], ['Terms', '/terms']].map(([label, href]) => (
            <Link key={label} href={href} style={{ ...sans, fontSize: 11, color: 'rgba(255,255,255,.45)', textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_CURATOR_WHATSAPP}?text=${encodeURIComponent('Hi! I need help finding the right event space.')}`}
          target="_blank" rel="noopener noreferrer"
          style={{ ...sans, fontSize: 11.5, fontWeight: 600, color: C.lime, display: 'block', marginBottom: 10, textDecoration: 'none' }}>
          💬 Need help? Ask us on WhatsApp
        </a>
        <div style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.25)', lineHeight: 1.6, marginBottom: 6 }}>We use anonymous page view analytics to understand which spaces are most popular. No personal data is collected.</div>
        <div style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.3)', lineHeight: 1.6 }}>© {new Date().getFullYear()} Theeram Spaces · Kerala</div>
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
            onSkip={() => skipEnquiry(enquiryProperty)}
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
