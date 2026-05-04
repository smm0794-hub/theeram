'use client'

import { useEffect, useState } from 'react'
import { supabase, Property, EventType, EVENT_TYPE_LABELS } from '@/lib/supabase'
import PropertyCard from '@/components/PropertyCard'
import LandmarkHero from '@/components/LandmarkHero'
import FilterBar, { GuestRange, GUEST_RANGES } from '@/components/FilterBar'

function EmailIcon() {
  const [showTooltip, setShowTooltip] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowTooltip((v) => !v)}
        onBlur={() => setTimeout(() => setShowTooltip(false), 200)}
        aria-label="Contact by email"
        style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'transparent', border: '0.5px solid #D6C9B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C5C3E', flexShrink: 0 }}
      >
        <svg viewBox="0 0 20 20" fill="none" width={16} height={16} stroke="currentColor" strokeWidth={1.4}>
          <rect x="2" y="5" width="16" height="11" rx="1.5"/>
          <path d="M2 7l8 5 8-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {showTooltip && (
        <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, backgroundColor: '#2C1A0E', borderRadius: 10, padding: '10px 14px', whiteSpace: 'nowrap', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
          <div style={{ position: 'absolute', top: -5, right: 12, width: 10, height: 10, backgroundColor: '#2C1A0E', transform: 'rotate(45deg)', borderRadius: 2 }} />
          <p style={{ fontSize: 10, color: '#C4A882', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Get in touch</p>
          <a href="mailto:smm0794@gmail.com" style={{ fontSize: 13, color: 'white', textDecoration: 'none', fontWeight: 500 }}>smm0794@gmail.com</a>
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

    // Filter by event type
    if (selectedEvents.length > 0) {
      result = result.filter((p) => {
        const types = p.property_event_types?.map((t) => t.event_type) ?? []
        return selectedEvents.some((e) => types.includes(e))
      })
    }

    // Filter by guest count
    if (selectedGuests) {
      const range = GUEST_RANGES.find((r) => r.value === selectedGuests)
      if (range) {
        result = result.filter((p) => {
          const maxGuests = p.property_attributes?.max_guests_day_event ?? 0
          return maxGuests >= range.min && maxGuests <= range.max
        })
      }
    }

    // Filter by search query
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

  const activeFilters = selectedEvents.length > 0 || selectedGuests
  const countLabel = activeFilters
    ? `${filtered.length} ${filtered.length === 1 ? 'property' : 'properties'} match your filters`
    : `${filtered.length} properties in Pala`

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAF7F2' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#FAF7F2', borderBottom: '0.5px solid #D6C9B8', padding: '10px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#2C1A0E', letterSpacing: '-0.01em' }}>Theeram</span>
            <span style={{ color: '#C9A84C', fontSize: 14, lineHeight: 1 }}>·</span>
            <span style={{ fontSize: 11, color: '#7C5C3E', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500, lineHeight: 1 }}>
              Spaces for every occasion
            </span>
          </div>
          <EmailIcon />
        </div>
      </header>

      {/* Landmark hero with pins */}
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
            style={{ width: '100%', border: '1px solid #D6C9B8', borderRadius: 12, padding: '11px 16px 11px 38px', fontSize: 14, color: '#2C1A0E', backgroundColor: 'white', outline: 'none', boxSizing: 'border-box' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#B4A898', fontSize: 16 }}>×</button>
          )}
        </div>
      </div>

      {/* Filter bar — two rows */}
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
              <div key={i} style={{ height: 400, backgroundColor: 'white', borderRadius: 16, border: '0.5px solid #D6C9B8' }} />
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
                target="_blank"
                rel="noopener noreferrer"
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

      {/* Footer */}
      <footer style={{ borderTop: '0.5px solid #D6C9B8', padding: '20px 16px 80px', textAlign: 'center' }}>
        <a
          href={`https://wa.me/919447000000?text=${encodeURIComponent('Hi! I need help finding the right event space in Pala.')}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', fontSize: 13, color: '#25D366', fontWeight: 600, textDecoration: 'none', marginBottom: 16, border: '1px solid #25D366', borderRadius: 999, padding: '8px 18px' }}
        >
          💬 Need help choosing? Ask us
        </a>
        <p style={{ fontSize: 10, color: '#B4A898', lineHeight: 1.7 }}>
          © {new Date().getFullYear()} Theeram Spaces · Pala, Kerala<br />
          All photographs are the property of their respective owners.<br />
          Theeram Spaces is a discovery platform and is not responsible for the accuracy of listing details.
        </p>
        <a href="/privacy" style={{ fontSize: 10, color: '#B4A898', textDecoration: 'underline', display: 'inline-block', marginTop: 6 }}>Privacy Policy</a>
      </footer>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FAF7F2', borderTop: '0.5px solid #D6C9B8', padding: '10px 16px', display: 'flex', gap: 8, zIndex: 30 }}>
        <Link href="/" style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 12, backgroundColor: '#2C1A0E', color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          🏡 Spaces
        </Link>
        <Link href="/services" style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 12, border: '1px solid #D6C9B8', color: '#7C5C3E', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
          ✨ Services
        </Link>
      </div>
    </main>
  )
}
