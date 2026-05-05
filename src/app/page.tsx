'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Property, EventType, EVENT_TYPE_LABELS } from '@/lib/supabase'
import PropertyCard from '@/components/PropertyCard'
import LandmarkHero from '@/components/LandmarkHero'
import FilterBar, { GuestRange, GUEST_RANGES } from '@/components/FilterBar'

// Collapsed About + FAQ accordion — SEO content, not visually prominent
function AboutAccordion() {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderTop: '0.5px solid #D6C9B8', margin: '0 16px' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B4A898', fontWeight: 500 }}>About Theeram</span>
        <svg viewBox="0 0 20 20" fill="none" width={14} height={14} stroke="#B4A898" strokeWidth={1.8} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path d="M5 7l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{ paddingBottom: 20 }}>
          <p style={{ fontSize: 13, color: '#7C5C3E', lineHeight: 1.8, marginBottom: 14 }}>
            Theeram is a hand-curated directory of event spaces, villas, and venues in and around Pala, Kottayam district, Kerala. Whether you are planning a wedding, a family gathering, a corporate offsite, a birthday celebration, or a quiet retreat — Theeram connects you directly with the right space and the right people to make it happen. Every listing is personally visited and verified. We cover villas with private pools, open lawns, AC banquet halls, heritage nalukettu homes, riverside properties, and event vendors including photographers, caterers, decorators, and more — across Pala, Ettumanoor, Erattupetta, Changanassery, and the wider Meenachil region. No booking fees. No middlemen. Just a WhatsApp conversation away.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { q: 'What event spaces are available in Pala, Kerala?', a: 'Theeram lists private villas with swimming pools, open event lawns, AC and non-AC banquet halls, heritage nalukettu homes, riverside properties, and auditoriums across Pala, Ettumanoor, Erattupetta, Kanjirappally, and Changanassery in Kottayam district. Spaces accommodate 30 to 300+ guests.' },
              { q: 'How do I contact a property owner?', a: 'Tap the WhatsApp button on any listing and you are connected directly to the property owner. No booking fee, no commission, no middleman. You discuss availability and pricing one-on-one.' },
              { q: 'What is the price range for event venues in Pala?', a: 'Venues range from approximately ₹8,000 to ₹35,000 per day depending on size, facilities, and season. Contact the owner directly for current pricing and availability.' },
              { q: 'Are venues suitable for weddings in Kerala?', a: 'Yes. Many properties on Theeram are well-suited for Kerala weddings — including Christian weddings, Hindu ceremonies, and receptions — with AC halls, open lawns, outside catering permissions, and generator backup.' },
              { q: 'Does Theeram cover event vendors like photographers and caterers?', a: 'Yes. Theeram connects you with trusted local vendors in Pala — photographers, videographers, caterers, decorators, florists, and bridal stylists. Visit the Services section to find them.' },
              { q: 'Which areas near Pala does Theeram cover?', a: 'Theeram covers Pala and the Meenachil region — Ettumanoor, Erattupetta, Kanjirappally, Changanassery, Ramapuram, and nearby panchayats in Kottayam district, Kerala.' },
            ].map(({ q, a }, i) => (
              <div key={i} style={{ paddingBottom: 12, borderBottom: '0.5px solid #EEE8DF' }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E', marginBottom: 4, lineHeight: 1.4 }}>{q}</p>
                <p style={{ fontSize: 12, color: '#7C5C3E', lineHeight: 1.7 }}>{a}</p>
              </div>
            ))}
          </div>

          <Link href="/about" style={{ display: 'inline-block', marginTop: 14, fontSize: 11, color: '#B4A898', textDecoration: 'underline' }}>
            Read more about Theeram →
          </Link>
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [filtered, setFiltered] = useState<Property[]>([])
  const [selectedEvents, setSelectedEvents] = useState<EventType[]>([])
  const [selectedGuests, setSelectedGuests] = useState<GuestRange>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchProperties() }, [])

  useEffect(() => {
    let result = properties
    if (selectedEvents.length > 0) {
      result = result.filter((p) => {
        const types = p.property_event_types?.map((t) => t.event_type) ?? []
        return selectedEvents.some((e) => types.includes(e))
      })
    }
    if (selectedGuests) {
      const range = GUEST_RANGES.find((r) => r.value === selectedGuests)
      if (range) {
        result = result.filter((p) => {
          const maxGuests = p.property_attributes?.max_guests_day_event ?? 0
          return maxGuests >= range.min && maxGuests <= range.max
        })
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.tagline?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }, [selectedEvents, selectedGuests, searchQuery, properties])

  async function fetchProperties() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*, property_attributes(*), property_event_types(event_type)')
        .eq('is_active', true)
        .order('sort_order', { ascending: false })
        .order('created_at', { ascending: false })
      if (!error && data) {
        setProperties(data as Property[])
        setFiltered(data as Property[])
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  function toggleEvent(event: EventType) {
    setSelectedEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event])
  }

  const activeFilters = selectedEvents.length > 0 || selectedGuests || searchQuery.trim()
  const countLabel = activeFilters
    ? `${filtered.length} ${filtered.length === 1 ? 'property' : 'properties'} match your filters`
    : `${filtered.length} properties in Pala`

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAF7F2' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#FAF7F2', borderBottom: '0.5px solid #D6C9B8', padding: '10px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Left — wordmark + tagline */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#2C1A0E', letterSpacing: '-0.01em' }}>Theeram</span>
            <span style={{ color: '#C9A84C', fontSize: 14, lineHeight: 1 }}>·</span>
            <span style={{ fontSize: 11, color: '#7C5C3E', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, lineHeight: 1 }}>
              Spaces for every occasion
            </span>
          </div>
          {/* Right — List your space */}
          <Link
            href="/list"
            style={{ fontSize: 11, color: '#D4735E', border: '1px solid #D4735E', borderRadius: 999, padding: '5px 12px', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.03em', flexShrink: 0 }}
          >
            + List your space
          </Link>
        </div>
      </header>

      {/* Landmark hero */}
      <LandmarkHero properties={properties} />

      {/* Search bar */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ position: 'relative' }}>
          <svg viewBox="0 0 20 20" fill="none" width={16} height={16} stroke="#B4A898" strokeWidth={1.5} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="9" cy="9" r="6"/>
            <path d="M15 15l-3-3" strokeLinecap="round"/>
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search properties..."
            style={{ width: '100%', border: '1px solid #D6C9B8', borderRadius: 999, padding: '11px 16px 11px 38px', fontSize: 14, color: '#2C1A0E', backgroundColor: 'white', outline: 'none', boxSizing: 'border-box' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#B4A898', fontSize: 18, lineHeight: 1 }}>×</button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar
        selectedEvents={selectedEvents}
        onToggle={toggleEvent}
        onReset={() => setSelectedEvents([])}
        selectedGuests={selectedGuests}
        onGuestRange={setSelectedGuests}
        countLabel={countLabel}
      />

      {/* Property cards */}
      <section style={{ padding: '16px 16px 48px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 400, backgroundColor: 'white', borderRadius: 24, border: '0.5px solid #D6C9B8' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <p style={{ color: '#7C5C3E', fontSize: 14, marginBottom: 12 }}>No properties match your search.</p>
            <button
              onClick={() => { setSelectedEvents([]); setSelectedGuests(''); setSearchQuery('') }}
              style={{ fontSize: 13, color: '#D4735E', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24 }}
            >
              Clear all filters
            </button>
            <div style={{ borderTop: '0.5px solid #D6C9B8', paddingTop: 24 }}>
              <p style={{ fontSize: 13, color: '#7C5C3E', marginBottom: 10 }}>Need help finding the right space?</p>
              <a
                href={`https://wa.me/919447000000?text=${encodeURIComponent('Hi! I need help finding the right event space in Pala.')}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#25D366', fontWeight: 600, textDecoration: 'none' }}
              >
                💬 Ask us on WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((property, index) => (
              <PropertyCard key={property.id} property={property} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Collapsed About + FAQ — SEO content */}
      <AboutAccordion />

      {/* Footer */}
      <footer style={{ padding: '20px 16px 90px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <a
            href={`https://wa.me/919447000000?text=${encodeURIComponent('Hi! I need help finding the right event space in Pala.')}`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 13, color: '#25D366', fontWeight: 600, textDecoration: 'none', border: '1px solid #25D366', borderRadius: 999, padding: '8px 18px' }}
          >
            💬 Need help choosing? Ask us
          </a>
          <a
            href="mailto:smm0794@gmail.com"
            style={{ fontSize: 12, color: '#B4A898', textDecoration: 'none' }}
          >
            smm0794@gmail.com
          </a>
        </div>
        <p style={{ fontSize: 10, color: '#B4A898', lineHeight: 1.7 }}>
          © {new Date().getFullYear()} Theeram Spaces · Pala, Kerala<br />
          All photographs are the property of their respective owners.<br />
          Theeram Spaces is a discovery platform and is not responsible for the accuracy of listing details.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
          <a href="/privacy" style={{ fontSize: 10, color: '#B4A898', textDecoration: 'underline' }}>Privacy Policy</a>
          <a href="/about" style={{ fontSize: 10, color: '#B4A898', textDecoration: 'underline' }}>About</a>
        </div>
      </footer>

      {/* Bottom nav — pill styled */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FAF7F2', borderTop: '0.5px solid #D6C9B8', padding: '10px 16px', display: 'flex', gap: 8, zIndex: 30 }}>
        <Link href="/" style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 999, backgroundColor: '#2C1A0E', color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          🏡 Spaces
        </Link>
        <Link href="/services" style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 999, border: '1px solid #D6C9B8', color: '#7C5C3E', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
          ✨ Services
        </Link>
      </div>
    </main>
  )
}
