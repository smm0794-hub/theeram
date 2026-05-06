'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase, Property, Vendor, VENDOR_CATEGORY_LABELS, VendorCategory } from '@/lib/supabase'

// ── Tokens ──────────────────────────────────────────────────────────────────
const C = {
  green:   '#1C3A2B',
  green2:  '#163023',
  cream:   '#F5F0E8',
  cream2:  '#EDE8DC',
  cream3:  '#E5DFD0',
  gold:    '#C9A84C',
  terra:   '#9B3D1E',
  sage:    '#D9E4DB',
  dark:    '#0F0F0D',
  text:    '#1C1C1A',
  muted:   '#6B5E4E',
  chip:    '#F0EBE0',
}

// ── Card bg by property type ─────────────────────────────────────────────────
const CARD_BG: Record<string, string> = {
  villa_with_pool:    '#1C3A2B',
  villa_without_pool: '#2E5C4E',
  heritage_home:      '#8A7040',
  open_event_space:   '#4A6741',
  auditorium:         '#2E5C4E',
  river_frontage:     '#7B3B2A',
  lodging:            '#1C3A2B',
  resort:             '#2E5C4E',
}

const CARD_BG_DEFAULT = '#1C3A2B'

// ── Property type label ──────────────────────────────────────────────────────
const TYPE_LABEL: Record<string, string> = {
  villa_with_pool:    'Villa with pool',
  villa_without_pool: 'Villa',
  heritage_home:      'Tharavadu',
  open_event_space:   'Event lawn',
  auditorium:         'Auditorium',
  river_frontage:     'Riverside',
  lodging:            'Lodging',
  resort:             'Resort',
}

// ── Space feel filters ───────────────────────────────────────────────────────
const FEEL_FILTERS = [
  { id: 'all',         ml: 'എല്ലാം',         en: 'All spaces',    desc: 'Browse the full collection',          icon: <svg viewBox="0 0 28 28" fill="none" width={24} height={24} stroke={C.terra} strokeWidth={1.2} strokeLinecap="round"><circle cx="14" cy="14" r="10"/><line x1="10" y1="14" x2="18" y2="14"/><line x1="14" y1="10" x2="14" y2="18"/></svg> },
  { id: 'heritage_home', ml: 'താവഴി',        en: 'Tharavadu',     desc: 'Heritage ancestral homes',             icon: <svg viewBox="0 0 28 28" fill="none" width={24} height={24} stroke={C.terra} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 12L14 5L24 12V24H4Z"/><rect x="10" y="16" width="8" height="8"/></svg> },
  { id: 'river_frontage', ml: 'പുഴയോരം',    en: 'Riverside',     desc: 'Meenachilar flows past your reception',icon: <svg viewBox="0 0 28 28" fill="none" width={24} height={24} stroke={C.terra} strokeWidth={1.2} strokeLinecap="round"><circle cx="10" cy="9" r="2.5"/><circle cx="18" cy="7" r="2"/><path d="M3 18Q7 15 11 18Q15 21 19 18Q23 15 27 18"/><path d="M3 23Q7 20 11 23Q15 26 19 23Q23 20 27 23"/></svg> },
  { id: 'villa_with_pool', ml: 'റബ്ബർ',    en: 'Rubber estate',  desc: 'Plantation bungalows in green',         icon: <svg viewBox="0 0 28 28" fill="none" width={24} height={24} stroke={C.terra} strokeWidth={1.2} strokeLinecap="round"><line x1="14" y1="26" x2="14" y2="12"/><circle cx="14" cy="8" r="3"/><circle cx="8" cy="11" r="2.5"/><circle cx="20" cy="11" r="2.5"/><circle cx="5" cy="16" r="2"/><circle cx="23" cy="16" r="2"/></svg> },
  { id: 'auditorium',  ml: 'വിശാലം',        en: 'Grand halls',   desc: 'For 200 guests and a sadhya',          icon: <svg viewBox="0 0 28 28" fill="none" width={24} height={24} stroke={C.terra} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="12" width="22" height="12"/><path d="M3 12L14 4L25 12"/><line x1="9" y1="24" x2="9" y2="17"/><line x1="14" y1="24" x2="14" y2="17"/><line x1="19" y1="24" x2="19" y2="17"/></svg> },
  { id: 'open_event_space', ml: 'ശാന്തം',  en: 'Quiet retreat',  desc: 'For the stay that asks for nothing',   icon: <svg viewBox="0 0 28 28" fill="none" width={24} height={24} stroke={C.terra} strokeWidth={1.2} strokeLinecap="round"><circle cx="14" cy="12" r="5"/><line x1="14" y1="19" x2="14" y2="24"/><circle cx="14" cy="25.5" r="1.5" fill={C.terra} stroke="none"/></svg> },
]

// ── Maker craft filters ──────────────────────────────────────────────────────
const MAKER_FILTERS = [
  { id: 'all',                 ml: 'എല്ലാം',    en: 'Everyone',     desc: 'Browse all makers',        icon: <svg viewBox="0 0 28 28" fill="none" width={24} height={24} stroke={C.terra} strokeWidth={1.2} strokeLinecap="round"><circle cx="14" cy="14" r="10"/><line x1="10" y1="14" x2="18" y2="14"/><line x1="14" y1="10" x2="14" y2="18"/></svg> },
  { id: 'photography_video',  ml: 'ഫോട്ടോ',    en: 'Photography',  desc: '& Video',                  icon: <svg viewBox="0 0 28 28" fill="none" width={24} height={24} stroke={C.terra} strokeWidth={1.2} strokeLinecap="round"><rect x="3" y="8" width="22" height="15" rx="1"/><circle cx="14" cy="15" r="4"/><path d="M11 8L12.5 5H15.5L17 8"/></svg> },
  { id: 'catering',           ml: 'സദ്യ',      en: 'Catering',     desc: 'Food & sadhya',            icon: <svg viewBox="0 0 28 28" fill="none" width={24} height={24} stroke={C.terra} strokeWidth={1.2} strokeLinecap="round"><path d="M5 9Q14 5 23 9L21 20Q14 24 7 20Z"/><path d="M3 7Q14 3 25 7"/><line x1="14" y1="9" x2="14" y2="22"/></svg> },
  { id: 'decoration_florals', ml: 'അലങ്കാരം',  en: 'Décor',        desc: 'Mandapam & florals',       icon: <svg viewBox="0 0 28 28" fill="none" width={24} height={24} stroke={C.terra} strokeWidth={1.2} strokeLinecap="round"><path d="M7 19L14 7L21 19Q14 26 7 19Z"/><path d="M10 15Q14 11 18 15"/><circle cx="14" cy="21" r="2"/></svg> },
  { id: 'event_management',   ml: 'ഇവന്റ്',   en: 'Event Mgmt',   desc: 'Planning & coordination',  icon: <svg viewBox="0 0 28 28" fill="none" width={24} height={24} stroke={C.terra} strokeWidth={1.2} strokeLinecap="round"><rect x="4" y="6" width="20" height="18" rx="1"/><line x1="4" y1="11" x2="24" y2="11"/><line x1="9" y1="4" x2="9" y2="9"/><line x1="19" y1="4" x2="19" y2="9"/><line x1="8" y1="16" x2="20" y2="16"/><line x1="8" y1="20" x2="16" y2="20"/></svg> },
  { id: 'beauty_styling',     ml: 'ഭംഗി',     en: 'Beauty',       desc: 'Bridal & styling',         icon: <svg viewBox="0 0 28 28" fill="none" width={24} height={24} stroke={C.terra} strokeWidth={1.2} strokeLinecap="round"><ellipse cx="14" cy="14" rx="8" ry="10"/><ellipse cx="14" cy="14" rx="5" ry="7"/><line x1="10" y1="9" x2="8" y2="6"/><line x1="18" y1="9" x2="20" y2="6"/><line x1="14" y1="7" x2="14" y2="4"/></svg> },
]

// ── Prop card illustration ───────────────────────────────────────────────────
function PropIllustration({ type }: { type: string }) {
  const stroke = 'rgba(255,255,255,0.42)'
  const sw = 1
  if (type === 'heritage_home') return (
    <svg viewBox="0 0 70 56" fill="none" width={70} height={56} stroke={stroke} strokeWidth={sw}>
      <path d="M8 30L35 12L62 30V52H8Z"/><rect x="24" y="36" width="22" height="16"/><line x1="12" y1="30" x2="58" y2="30"/>
    </svg>
  )
  if (type === 'river_frontage') return (
    <svg viewBox="0 0 70 56" fill="none" width={70} height={56} stroke={stroke} strokeWidth={sw}>
      <circle cx="25" cy="16" r="7"/><circle cx="44" cy="12" r="6"/>
      <path d="M5 38Q14 32 25 38Q36 44 45 38Q56 32 66 38"/>
      <path d="M5 48Q14 42 25 48Q36 54 45 48Q56 42 66 48"/>
    </svg>
  )
  if (type === 'auditorium' || type === 'open_event_space') return (
    <svg viewBox="0 0 70 56" fill="none" width={70} height={56} stroke={stroke} strokeWidth={sw}>
      <rect x="10" y="20" width="50" height="30"/><path d="M10 20L35 8L60 20"/>
      <line x1="22" y1="50" x2="22" y2="34"/><line x1="35" y1="50" x2="35" y2="34"/><line x1="48" y1="50" x2="48" y2="34"/>
    </svg>
  )
  // default villa
  return (
    <svg viewBox="0 0 70 56" fill="none" width={70} height={56} stroke={stroke} strokeWidth={sw}>
      <path d="M8 28L35 10L62 28V50H8Z"/><rect x="26" y="34" width="18" height="16"/>
      <path d="M14 38Q20 34 26 38Q32 42 38 38"/><line x1="12" y1="28" x2="58" y2="28"/>
    </svg>
  )
}

// ── Horizontal filter row ────────────────────────────────────────────────────
function FilterRow({ filters, active, onSelect }: { filters: typeof FEEL_FILTERS; active: string; onSelect: (id: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [dotIdx, setDotIdx] = useState(0)

  function onScroll() {
    if (!scrollRef.current) return
    const idx = Math.round(scrollRef.current.scrollLeft / 158)
    setDotIdx(Math.max(0, Math.min(idx, filters.length - 1)))
  }

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '0 16px 14px', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        className="no-scrollbar"
      >
        {filters.map((f) => (
          <div
            key={f.id}
            onClick={() => onSelect(f.id)}
            style={{ minWidth: 148, maxWidth: 148, flexShrink: 0, backgroundColor: 'white', border: active === f.id ? `1.5px solid ${C.terra}` : `1px solid ${C.cream3}`, padding: '14px 12px', cursor: 'pointer', scrollSnapAlign: 'start', transition: 'border-color .15s' }}
          >
            <div style={{ marginBottom: 10 }}>{f.icon}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
              <div style={{ width: 8, height: 1, backgroundColor: C.terra }}/>
              <span style={{ fontSize: 9, color: C.terra, letterSpacing: '.06em', fontFamily: 'sans-serif' }}>{f.ml}</span>
              <div style={{ width: 8, height: 1, backgroundColor: C.terra }}/>
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 14, fontWeight: 400, color: C.text, marginBottom: 3 }}>{f.en}</div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, fontFamily: 'sans-serif', fontWeight: 300 }}>{f.desc}</div>
          </div>
        ))}
      </div>
      {/* Scroll dots */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 4, paddingBottom: 14 }}>
        {filters.map((_, i) => (
          <div key={i} style={{ width: dotIdx === i ? 14 : 5, height: 5, borderRadius: 3, backgroundColor: dotIdx === i ? C.terra : C.cream3, transition: 'width .2s, background .2s' }}/>
        ))}
      </div>
    </>
  )
}

// ── Share helper ─────────────────────────────────────────────────────────────
async function share(slug: string, name: string) {
  const url = `${window.location.origin}/property/${slug}`
  try { if (navigator.share) await navigator.share({ title: name, url }); else await navigator.clipboard.writeText(url) } catch {}
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [tab, setTab] = useState<'spaces' | 'makers'>('spaces')
  const [properties, setProperties] = useState<Property[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [spaceFilter, setSpaceFilter] = useState('all')
  const [makerFilter, setMakerFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [pr, vr] = await Promise.all([
      supabase.from('properties').select('*, property_attributes(*), property_event_types(event_type)').eq('is_active', true).order('sort_order', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('vendors').select('*').eq('is_active', true).order('is_featured', { ascending: false }).order('created_at', { ascending: false }),
    ])
    if (!pr.error && pr.data) setProperties(pr.data as Property[])
    if (!vr.error && vr.data) setVendors(vr.data as Vendor[])
    setLoading(false)
  }

  async function handleWhatsApp(p: Property) {
    try { await supabase.from('inquiries').insert({ property_id: p.id, event_type: p.property_event_types?.[0]?.event_type ?? 'general' }) } catch {}
    const msg = encodeURIComponent(`Hi! I found ${p.name} on Theeram and I'm interested in booking. Could you share availability and pricing?`)
    window.open(`https://wa.me/${p.owner_whatsapp}?text=${msg}`, '_blank')
  }

  function handleVendorWhatsApp(v: Vendor) {
    const msg = encodeURIComponent(`Hi! I found ${v.name} on Theeram and I'm interested in your services. Could you share more details?`)
    window.open(`https://wa.me/${v.whatsapp}?text=${msg}`, '_blank')
  }

  const filteredProps = properties.filter((p) => {
    if (spaceFilter !== 'all' && p.property_type !== spaceFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.tagline?.toLowerCase().includes(q)
    }
    return true
  })

  const filteredVendors = vendors.filter((v) => {
    if (makerFilter !== 'all' && v.category !== makerFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return v.name.toLowerCase().includes(q) || v.tagline?.toLowerCase().includes(q)
    }
    return true
  })

  const s: Record<string, React.CSSProperties> = {
    serif: { fontFamily: 'Georgia, serif' },
    sans: { fontFamily: 'system-ui, sans-serif' },
  }

  return (
    <div style={{ backgroundColor: C.cream, color: C.text, overflowX: 'hidden', minHeight: '100vh' }}>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

      {/* ── Top bar ────────────────────────────────────────────── */}
      <div style={{ background: C.green, padding: '6px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...s.sans, fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em' }}>തീരം · theeram</span>
        <span style={{ ...s.sans, fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.04em' }}>Pala · Meenachilar · Kottayam</span>
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}`, padding: '11px 16px', position: 'sticky', top: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 33, height: 33, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 20 20" fill="none" width={17} height={17}>
              <circle cx="10" cy="10" r="6" stroke={C.gold} strokeWidth={1}/>
              <path d="M10 6Q13 9 10 14Q7 9 10 6Z" fill={C.gold} opacity=".85"/>
            </svg>
          </div>
          <span style={{ ...s.serif, fontSize: 21, letterSpacing: '-.01em' }}>Theeram</span>
        </div>
        <button onClick={() => setMenuOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <svg viewBox="0 0 20 20" fill="none" width={20} height={20} stroke={C.text} strokeWidth={1.4} strokeLinecap="round">
            <line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/>
          </svg>
        </button>
      </header>

      {/* Mobile nav */}
      {menuOpen && (
        <div style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}`, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }} onClick={() => setMenuOpen(false)}>
          {[['Spaces', '/'], ['Services', '/services'], ['About', '/about'], ['List your space', '/list'], ['List your service', '/join']].map(([label, href]) => (
            <Link key={label} href={href} onClick={() => setMenuOpen(false)} style={{ ...s.sans, fontSize: 15, color: label.startsWith('List') ? C.muted : C.text, textDecoration: 'none', fontWeight: label.startsWith('List') ? 400 : 500 } as React.CSSProperties}>{label}</Link>
          ))}
        </div>
      )}

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section style={{ background: C.green, padding: '50px 20px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -8, bottom: 0, opacity: .1, pointerEvents: 'none' }}>
          <svg viewBox="0 0 150 220" fill="none" width={150} height={220}>
            <line x1="75" y1="220" x2="75" y2="58" stroke="white" strokeWidth={3}/>
            <ellipse cx="75" cy="48" rx="22" ry="16" fill="white"/>
            <ellipse cx="46" cy="76" rx="18" ry="13" fill="white"/>
            <ellipse cx="106" cy="72" rx="20" ry="14" fill="white"/>
            <ellipse cx="34" cy="108" rx="15" ry="11" fill="white"/>
            <ellipse cx="118" cy="103" rx="16" ry="12" fill="white"/>
            <line x1="75" y1="58" x2="46" y2="76" stroke="white" strokeWidth={1.5}/>
            <line x1="75" y1="67" x2="106" y2="72" stroke="white" strokeWidth={1.5}/>
            <line x1="75" y1="88" x2="34" y2="108" stroke="white" strokeWidth={1.5}/>
            <line x1="75" y1="93" x2="118" y2="103" stroke="white" strokeWidth={1.5}/>
          </svg>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 20, height: 1, background: C.gold }}/>
          <span style={{ ...s.sans, fontSize: 11, color: C.gold, letterSpacing: '.08em' }}>താവഴികളും തീരങ്ങളും</span>
          <div style={{ width: 20, height: 1, background: C.gold }}/>
        </div>
        <h1 style={{ ...s.serif, fontSize: 34, lineHeight: 1.18, color: 'white', marginBottom: 16, fontWeight: 300 }}>
          Where the <em style={{ color: C.gold }}>Meenachilar</em> bends and the <em style={{ color: C.gold }}>tharavadu</em> stands.
        </h1>
        <div style={{ width: 34, height: 2, background: C.gold, marginBottom: 18 }}/>
        <p style={{ ...s.sans, fontSize: 13, color: 'rgba(255,255,255,.68)', lineHeight: 1.75, maxWidth: 300, marginBottom: 30, fontWeight: 300 }}>
          A hand-curated home for Pala's most beloved venues — heritage tharavadus, riverside lawns, rubber-estate bungalows. Talk to the owners, the way it has always been done here.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => document.getElementById('main-listing')?.scrollIntoView({ behavior: 'smooth' })} style={{ ...s.sans, background: C.gold, color: C.text, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', padding: '12px 22px', border: 'none', cursor: 'pointer' }}>Find a space</button>
          <Link href="/about" style={{ ...s.sans, background: 'transparent', color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', padding: '12px 22px', border: `1px solid ${C.gold}`, textDecoration: 'none', display: 'inline-block' }}>Our story</Link>
        </div>
      </section>

      {/* ── Trust bar ──────────────────────────────────────────── */}
      <div style={{ background: C.cream2, borderBottom: `1px solid ${C.cream3}`, padding: '18px 16px', display: 'flex' }}>
        {[['No fees', 'Speak to the owner'], ['Personally visited', 'Every space, by us'], ['WhatsApp first', 'The Pala way']].map(([title, sub], i) => (
          <div key={title} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4, padding: '0 6px', borderLeft: i > 0 ? `1px solid ${C.cream3}` : 'none' }}>
            <div style={{ width: 7, height: 7, background: C.terra, transform: 'rotate(45deg)', marginBottom: 4 }}/>
            <div style={{ ...s.sans, fontSize: 11, fontWeight: 500, color: C.text, lineHeight: 1.3 }}>{title}</div>
            <div style={{ ...s.sans, fontSize: 10, color: C.muted, fontWeight: 300, lineHeight: 1.3 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Context-aware filter ────────────────────────────────── */}
      <section style={{ background: C.cream, paddingTop: 28 }}>
        <div style={{ padding: '0 16px', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <div style={{ width: 14, height: 1, background: C.terra }}/>
            <span style={{ ...s.sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>{tab === 'spaces' ? 'ഭാവം' : 'കൈവഴക്കം'}</span>
            <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
          </div>
          <div style={{ ...s.serif, fontSize: 20, fontWeight: 400, color: C.text, marginBottom: 4 }}>
            {tab === 'spaces' ? 'Find a space by feel' : 'Find by craft'}
          </div>
          <div style={{ ...s.sans, fontSize: 12, color: C.muted, fontWeight: 300 }}>
            {tab === 'spaces' ? 'Swipe to browse. Tap to filter.' : 'What do you need for your event?'}
          </div>
        </div>
        {tab === 'spaces'
          ? <FilterRow filters={FEEL_FILTERS} active={spaceFilter} onSelect={setSpaceFilter}/>
          : <FilterRow filters={MAKER_FILTERS} active={makerFilter} onSelect={setMakerFilter}/>
        }
      </section>

      {/* ── Spaces / Makers toggle + listing ───────────────────── */}
      <section id="main-listing" style={{ background: C.sage }}>

        {/* Sticky toggle bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 10, background: C.sage, borderBottom: `1px solid rgba(0,0,0,.07)`, position: 'sticky', top: 55, zIndex: 40 }}>
          <div style={{ flex: 1, display: 'flex', background: 'rgba(255,255,255,.5)', border: `1px solid ${C.cream3}`, borderRadius: 3, overflow: 'hidden' }}>
            {(['spaces', 'makers'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setSearch('') }}
                style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 500, textAlign: 'center', cursor: 'pointer', border: 'none', fontFamily: 'system-ui, sans-serif', letterSpacing: '.02em', transition: 'all .15s', background: tab === t ? C.green : 'transparent', color: tab === t ? 'white' : C.muted }}
              >
                {t === 'spaces' ? 'Spaces' : 'Makers'}
              </button>
            ))}
          </div>
          <Link
            href={tab === 'spaces' ? '/list' : '/join'}
            style={{ ...s.sans, fontSize: 10, color: C.muted, border: `1px solid ${C.cream3}`, padding: '7px 10px', whiteSpace: 'nowrap', background: 'white', textDecoration: 'none', letterSpacing: '.02em' }}
          >
            + List yours
          </Link>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px 8px', position: 'relative' }}>
          <svg viewBox="0 0 16 16" fill="none" width={13} height={13} stroke={C.muted} strokeWidth={1.4} strokeLinecap="round" style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="7" cy="7" r="5"/><path d="M11 11l2 2"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'spaces' ? 'Search a space...' : 'Search makers...'}
            style={{ width: '100%', border: `1px solid rgba(0,0,0,.12)`, padding: '10px 12px 10px 34px', fontSize: 13, fontFamily: 'system-ui, sans-serif', background: 'rgba(255,255,255,.65)', outline: 'none', color: C.text, fontWeight: 300, boxSizing: 'border-box' }}
          />
        </div>

        {/* ── SPACES PANEL ─────────────────────────────────────── */}
        {tab === 'spaces' && (
          <div style={{ padding: '8px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loading ? [1,2,3].map(i => <div key={i} style={{ height: 360, background: 'rgba(255,255,255,.4)', border: `1px solid ${C.cream3}` }}/>)
            : filteredProps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ ...s.sans, fontSize: 14, color: C.muted, marginBottom: 10 }}>No spaces found.</p>
                <button onClick={() => { setSpaceFilter('all'); setSearch('') }} style={{ ...s.sans, fontSize: 12, color: C.terra, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
              </div>
            ) : filteredProps.map((p) => {
              const attrs = p.property_attributes
              const chips = [
                attrs?.has_pool && 'Pool',
                attrs?.has_open_lawn && 'Open lawn',
                attrs?.has_ac_hall && 'AC hall',
                attrs?.max_guests_day_event ? `Up to ${attrs.max_guests_day_event}` : null,
              ].filter(Boolean) as string[]
              return (
                <div key={p.id} style={{ background: 'white', border: `1px solid ${C.cream3}`, overflow: 'hidden', position: 'relative' }}>
                  {(p as any).is_featured && (
                    <div style={{ position: 'absolute', top: 0, left: 0, background: C.gold, padding: '4px 10px', zIndex: 2 }}>
                      <span style={{ ...s.sans, fontSize: 9, fontWeight: 700, letterSpacing: '.07em', color: C.text }}>Theeram pick</span>
                    </div>
                  )}
                  <Link href={`/property/${p.slug}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 158, background: CARD_BG[p.property_type] ?? CARD_BG_DEFAULT, textDecoration: 'none' }}>
                    <PropIllustration type={p.property_type}/>
                  </Link>
                  <div style={{ padding: '14px 14px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                      <div style={{ width: 10, height: 1, background: C.terra }}/>
                      <span style={{ ...s.serif, fontSize: 11, color: C.terra, fontStyle: 'italic' }}>{TYPE_LABEL[p.property_type] ?? p.property_type} —</span>
                      <div style={{ width: 10, height: 1, background: C.terra }}/>
                    </div>
                    <Link href={`/property/${p.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{ ...s.serif, fontSize: 20, fontWeight: 400, color: C.text, marginBottom: 3, lineHeight: 1.15 }}>{p.name}</div>
                      <div style={{ ...s.sans, fontSize: 11, color: C.muted, marginBottom: 9, fontWeight: 300 }}>Pala · {p.tagline?.split('—')[0]?.trim() ?? p.tagline}</div>
                    </Link>
                    {chips.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                        {chips.slice(0,4).map(ch => <span key={ch} style={{ ...s.sans, fontSize: 10, color: C.muted, background: C.chip, padding: '3px 9px', border: `1px solid ${C.cream3}`, fontWeight: 300 }}>{ch}</span>)}
                      </div>
                    )}
                    <div style={{ width: '100%', height: 1, background: C.cream3, marginBottom: 10 }}/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ ...s.sans, fontSize: 14, fontWeight: 500, color: C.text }}>{p.price_guide?.split('–')[0] ?? '₹12,000'} / day</span>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                        <button onClick={() => share(p.slug, p.name)} style={{ width: 32, height: 32, border: `1px solid ${C.cream3}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
                          <svg viewBox="0 0 14 14" fill="none" width={12} height={12} stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"><circle cx="11" cy="2.5" r="1.5"/><circle cx="3" cy="7" r="1.5"/><circle cx="11" cy="11.5" r="1.5"/><path d="M4.5 6.3l5-3.2M4.5 7.7l5 3.2"/></svg>
                        </button>
                        <button onClick={() => handleWhatsApp(p)} style={{ ...s.sans, background: C.green, color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', padding: '9px 13px', border: 'none', cursor: 'pointer' }}>Talk to owner</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── MAKERS PANEL ─────────────────────────────────────── */}
        {tab === 'makers' && (
          <div style={{ padding: '8px 16px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? [1,2,3].map(i => <div key={i} style={{ height: 160, background: 'rgba(255,255,255,.4)', border: `1px solid ${C.cream3}` }}/>)
            : filteredVendors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <p style={{ ...s.sans, fontSize: 14, color: C.muted, marginBottom: 10 }}>No makers found.</p>
                <button onClick={() => { setMakerFilter('all'); setSearch('') }} style={{ ...s.sans, fontSize: 12, color: C.terra, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
              </div>
            ) : filteredVendors.map((v) => (
              <div key={v.id} style={{ background: 'white', border: v.is_featured ? `1.5px solid ${C.gold}` : `1px solid ${C.cream3}`, padding: '18px 16px', position: 'relative' }}>
                {v.is_featured && <div style={{ position: 'absolute', top: 0, left: 0, background: C.gold, padding: '3px 8px' }}><span style={{ ...s.sans, fontSize: 9, fontWeight: 700, color: C.text }}>Featured</span></div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                  <div style={{ width: 8, height: 1, background: C.terra }}/>
                  <span style={{ ...s.sans, fontSize: 9, color: C.terra, letterSpacing: '.07em' }}>{VENDOR_CATEGORY_LABELS[v.category]}</span>
                  <div style={{ width: 8, height: 1, background: C.terra }}/>
                </div>
                <div style={{ ...s.serif, fontSize: 18, fontWeight: 400, color: C.text, marginBottom: 4 }}>{v.name}</div>
                <div style={{ ...s.sans, fontSize: 12, color: C.muted, fontWeight: 300, lineHeight: 1.5, marginBottom: 12 }}>{v.tagline}</div>
                {v.area_served && <div style={{ ...s.sans, fontSize: 11, color: C.muted, marginBottom: 10 }}>📍 {v.area_served}</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  {v.whatsapp && <button onClick={() => handleVendorWhatsApp(v)} style={{ ...s.sans, flex: 1, background: C.green, color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', padding: '9px 0', border: 'none', cursor: 'pointer' }}>WhatsApp</button>}
                  {v.phone && <a href={`tel:${v.phone}`} style={{ ...s.sans, padding: '9px 12px', border: `1px solid ${C.cream3}`, color: C.text, fontSize: 10, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>📞 Call</a>}
                  <button onClick={async () => { const url = `${window.location.origin}/vendor/${v.slug}`; try { if (navigator.share) await navigator.share({ title: v.name, url }); else await navigator.clipboard.writeText(url) } catch {} }} style={{ width: 34, height: 34, border: `1px solid ${C.cream3}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
                    <svg viewBox="0 0 14 14" fill="none" width={12} height={12} stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"><circle cx="11" cy="2.5" r="1.5"/><circle cx="3" cy="7" r="1.5"/><circle cx="11" cy="11.5" r="1.5"/><path d="M4.5 6.3l5-3.2M4.5 7.7l5 3.2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Why Pala ────────────────────────────────────────────── */}
      <section style={{ background: C.green2, padding: '46px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 18 }}>
          <div style={{ width: 15, height: 1, background: C.gold }}/>
          <span style={{ ...s.sans, fontSize: 10, color: C.gold, letterSpacing: '.08em' }}>എന്തുകൊണ്ട് പാലാ?</span>
          <div style={{ width: 15, height: 1, background: C.gold }}/>
        </div>
        <h2 style={{ ...s.serif, fontSize: 30, fontWeight: 300, color: 'white', marginBottom: 15, lineHeight: 1.22 }}>
          The land between the <em style={{ color: C.gold }}>Meenachilar</em> and the <em style={{ color: C.gold }}>rubber</em>.
        </h2>
        <p style={{ ...s.sans, fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.8, marginBottom: 26, fontWeight: 300 }}>
          Pala has always been a place of gathering — of weddings under coconut palms, of sadhya served on banana leaves, of evenings that drift into conversations and meen curry shared from a single plate. Our spaces don't just host events. They carry the warmth of how Pala has always celebrated.
        </p>
        <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,.1)', marginBottom: 24 }}/>
        <div style={{ display: 'flex' }}>
          {[['45 min', 'FROM KOTTAYAM'], ['90 min', 'FROM KOCHI'], ['200+', 'YEARS OF TRADITION']].map(([num, label], i) => (
            <div key={label} style={{ flex: 1, borderLeft: i > 0 ? '1px solid rgba(255,255,255,.1)' : 'none', paddingLeft: i > 0 ? 16 : 0 }}>
              <div style={{ ...s.serif, fontSize: 26, color: C.gold, marginBottom: 3, fontWeight: 300 }}>{num}</div>
              <div style={{ ...s.sans, fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em' }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer style={{ background: C.dark, padding: '40px 16px 32px', textAlign: 'center' }}>
        <div style={{ ...s.serif, fontSize: 19, color: C.gold, marginBottom: 5, fontWeight: 300 }}>തീരം · theeram</div>
        <div style={{ ...s.sans, fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em', marginBottom: 20 }}>Spaces for every occasion · Pala, Kerala</div>
        <div style={{ width: 38, height: 1, background: 'rgba(255,255,255,.1)', margin: '0 auto 18px' }}/>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginBottom: 14, flexWrap: 'wrap' }}>
          {[['Spaces', '/'], ['Services', '/services'], ['About', '/about'], ['Privacy', '/privacy']].map(([label, href]) => (
            <Link key={label} href={href} style={{ ...s.sans, fontSize: 10, color: 'rgba(255,255,255,.38)', textDecoration: 'none', letterSpacing: '.04em' }}>{label}</Link>
          ))}
        </div>
        <a href={`https://wa.me/919447000000?text=${encodeURIComponent('Hi! I need help finding the right event space in Pala.')}`} target="_blank" rel="noopener noreferrer" style={{ ...s.sans, fontSize: 11, color: 'rgba(255,255,255,.4)', display: 'block', marginBottom: 8 }}>💬 Need help? Ask us on WhatsApp</a>
        <a href="mailto:smm0794@gmail.com" style={{ ...s.sans, fontSize: 11, color: 'rgba(255,255,255,.25)', textDecoration: 'none', display: 'block', marginBottom: 18 }}>smm0794@gmail.com</a>
        <div style={{ ...s.sans, fontSize: 10, color: 'rgba(255,255,255,.18)', lineHeight: 1.6 }}>© {new Date().getFullYear()} Theeram Spaces · All photographs are the property of their respective owners.</div>
      </footer>
    </div>
  )
}
