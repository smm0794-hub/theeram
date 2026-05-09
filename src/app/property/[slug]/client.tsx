'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, Property, EVENT_TYPE_LABELS } from '@/lib/supabase'
import { C, sans, serif } from '@/lib/design'
import Header from '@/components/Header'
import GratitudeModal from '@/components/GratitudeModal'

const TYPE_LABEL: Record<string, string> = {
  villa_with_pool: 'Villa with pool', villa_without_pool: 'Villa',
  heritage_home: 'Tharavadu', open_event_space: 'Event lawn',
  auditorium: 'Auditorium', river_frontage: 'Riverside',
  lodging: 'Lodging', resort: 'Resort',
}

const CARD_BG: Record<string, string> = {
  villa_with_pool: '#1C3A2B', villa_without_pool: '#2E5C4E',
  heritage_home: '#8A7040', open_event_space: '#4A6741',
  auditorium: '#2E5C4E', river_frontage: '#7B3B2A',
  lodging: '#1C3A2B', resort: '#2E5C4E',
}

export default function PropertyDetailClient({ slug }: { slug: string }) {
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activePhoto, setActivePhoto] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('properties')
        .select('*, property_attributes(*), property_event_types(event_type)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      setProperty(data as Property)
      setLoading(false)
      // Track view
      if (data?.id) {
        fetch('/api/track-view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ property_id: data.id }) }).catch(() => {})
      }
    }
    load()
  }, [slug])

  async function handleWhatsApp() {
    if (!property) return
    try { await supabase.from('inquiries').insert({ property_id: property.id, event_type: property.property_event_types?.[0]?.event_type ?? 'general' }) } catch {}
    setShowModal(true)
  }

  function openWhatsApp() {
    if (!property) return
    const msg = encodeURIComponent(`Hi! I found ${property.name} on Theeram and I'm interested in booking. Could you share availability and pricing?`)
    window.open(`https://wa.me/${property.owner_whatsapp}?text=${msg}`, '_blank')
  }

  async function handleShare() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: property?.name ?? 'Theeram', url })
      else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    } catch {}
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${C.terra}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!property) return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ ...sans, color: C.muted }}>Property not found.</p>
      <Link href="/" style={{ ...sans, fontSize: 13, color: C.terra, textDecoration: 'underline' }}>Back to listings</Link>
    </div>
  )

  const attrs = property.property_attributes
  const photos = property.photos ?? []
  const eventTypes = property.property_event_types ?? []
  const firstEvent = eventTypes[0]?.event_type ?? 'general'
  const heroBg = CARD_BG[property.property_type] ?? C.green

  const facilities = [
    { label: 'Bedrooms', value: attrs?.room_count, show: (attrs?.room_count ?? 0) > 0 },
    { label: 'Bathrooms', value: attrs?.bathroom_count, show: (attrs?.bathroom_count ?? 0) > 0 },
    { label: 'Pool', value: null, show: attrs?.has_pool },
    { label: `AC hall ${attrs?.ac_hall_capacity ? `· ${attrs.ac_hall_capacity}` : ''}`, value: null, show: attrs?.has_ac_hall },
    { label: `Open lawn ${attrs?.open_lawn_sqft ? `· ${attrs.open_lawn_sqft} sqft` : ''}`, value: null, show: attrs?.has_open_lawn },
    { label: 'Kitchen', value: null, show: attrs?.has_kitchen },
    { label: `Parking ${attrs?.parking_count ? `· ${attrs.parking_count}` : ''}`, value: null, show: attrs?.has_parking },
    { label: 'Generator', value: null, show: attrs?.has_generator },
    { label: 'Alcohol', value: null, show: attrs?.alcohol_allowed },
  ]

  return (
    <div style={{ background: C.cream, minHeight: '100vh', paddingBottom: 90 }}>
      <Header/>
      {/* JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: property.name,
        description: property.description ?? property.tagline,
        url: `https://www.theeramspaces.in/property/${property.slug}`,
        telephone: property.owner_whatsapp ? `+${property.owner_whatsapp}` : undefined,
        image: property.photos?.[0],
        priceRange: property.price_guide ?? '₹₹₹',
        address: { '@type': 'PostalAddress', addressRegion: 'Kerala', addressCountry: 'IN' },
        amenityFeature: [
          property.property_attributes?.has_pool && { '@type': 'LocationFeatureSpecification', name: 'Swimming Pool', value: true },
          property.property_attributes?.has_ac_hall && { '@type': 'LocationFeatureSpecification', name: 'AC Hall', value: true },
          property.property_attributes?.has_open_lawn && { '@type': 'LocationFeatureSpecification', name: 'Open Lawn', value: true },
          property.property_attributes?.has_kitchen && { '@type': 'LocationFeatureSpecification', name: 'Kitchen', value: true },
          property.property_attributes?.has_parking && { '@type': 'LocationFeatureSpecification', name: 'Parking', value: true },
          property.property_attributes?.has_generator && { '@type': 'LocationFeatureSpecification', name: 'Generator', value: true },
        ].filter(Boolean),
      }) }}/>


      {/* Hero — coloured illustration zone */}
      <div style={{ background: heroBg, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background pattern */}
        <div style={{ opacity: .12, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 120 120" fill="none" width={200} height={200} stroke="white" strokeWidth={.8}>
            <circle cx="60" cy="60" r="50"/><circle cx="60" cy="60" r="35"/><circle cx="60" cy="60" r="20"/>
            <line x1="60" y1="10" x2="60" y2="110"/><line x1="10" y1="60" x2="110" y2="60"/>
          </svg>
        </div>
        {photos.length > 0 ? (
          <img src={photos[0]} alt={property.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }}/>
        ) : null}
        {/* Back + share */}
        <button onClick={() => router.back()} style={{ position: 'absolute', top: 16, left: 16, width: 36, height: 36, background: 'rgba(0,0,0,.4)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5L7 10l5 5"/></svg>
        </button>
        <button onClick={handleShare} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, background: 'rgba(0,0,0,.4)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          {copied
            ? <svg viewBox="0 0 20 20" fill="none" width={16} height={16} stroke="white" strokeWidth={2}><path d="M4 10l5 5 7-9" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg viewBox="0 0 14 14" fill="none" width={14} height={14} stroke="white" strokeWidth={1.3} strokeLinecap="round"><circle cx="11" cy="2.5" r="1.5"/><circle cx="3" cy="7" r="1.5"/><circle cx="11" cy="11.5" r="1.5"/><path d="M4.5 6.3l5-3.2M4.5 7.7l5 3.2"/></svg>
          }
        </button>
        {/* Property type label bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 16px 14px', background: 'linear-gradient(to top, rgba(0,0,0,.55), transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div style={{ width: 10, height: 1, background: C.gold }}/>
            <span style={{ ...serif, fontSize: 11, color: C.gold, fontStyle: 'italic' }}>{TYPE_LABEL[property.property_type] ?? property.property_type}</span>
            <div style={{ width: 10, height: 1, background: C.gold }}/>
          </div>
          <h1 style={{ ...serif, fontSize: 24, color: 'white', fontWeight: 400, lineHeight: 1.2 }}>{property.name}</h1>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 16px 0' }}>
        {/* Tagline */}
        <p style={{ ...sans, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 16, fontWeight: 300 }}>{property.tagline}</p>

        {/* Event type pills */}
        {eventTypes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {eventTypes.map(({ event_type }) => (
              <span key={event_type} style={{ ...sans, fontSize: 10, color: C.terra, border: `1px solid ${C.terra}`, padding: '3px 10px', letterSpacing: '.04em' }}>
                {EVENT_TYPE_LABELS[event_type as keyof typeof EVENT_TYPE_LABELS] ?? event_type}
              </span>
            ))}
          </div>
        )}

        {/* About */}
        <div style={{ borderTop: `1px solid ${C.cream3}`, paddingTop: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
            <div style={{ width: 14, height: 1, background: C.terra }}/>
            <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>ഇടം</span>
            <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
          </div>
          <h2 style={{ ...serif, fontSize: 18, fontWeight: 400, color: C.text, marginBottom: 10 }}>About this space</h2>
          <p style={{ ...sans, fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 300 }}>{property.description}</p>
        </div>

        {/* Facilities grid */}
        {attrs && (
          <div style={{ borderTop: `1px solid ${C.cream3}`, paddingTop: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{ width: 14, height: 1, background: C.terra }}/>
              <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>സൗകര്യങ്ങൾ</span>
              <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
            </div>
            <h2 style={{ ...serif, fontSize: 18, fontWeight: 400, color: C.text, marginBottom: 12 }}>What's here</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {facilities.map(({ label, value, show }) => (
                <div key={label} style={{ border: `1px solid ${show ? C.terra : C.cream3}`, padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ ...sans, fontSize: 10, color: show ? C.terra : C.cream3, lineHeight: 1.4, fontWeight: show ? 500 : 300 }}>
                    {value ? `${value} ` : ''}{label.split('·')[0].trim()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Capacity */}
        {attrs && (attrs.max_guests_day_event || attrs.max_guests_overnight) && (
          <div style={{ background: C.cream2, padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 20 }}>
            {attrs.max_guests_day_event && (
              <div>
                <div style={{ ...serif, fontSize: 24, color: C.terra, fontWeight: 300 }}>{attrs.max_guests_day_event}</div>
                <div style={{ ...sans, fontSize: 10, color: C.muted, letterSpacing: '.06em' }}>DAY EVENT</div>
              </div>
            )}
            {attrs.max_guests_overnight && (
              <div>
                <div style={{ ...serif, fontSize: 24, color: C.terra, fontWeight: 300 }}>{attrs.max_guests_overnight}</div>
                <div style={{ ...sans, fontSize: 10, color: C.muted, letterSpacing: '.06em' }}>OVERNIGHT</div>
              </div>
            )}
          </div>
        )}

        {/* Photo gallery */}
        {photos.length > 1 && (
          <div style={{ borderTop: `1px solid ${C.cream3}`, paddingTop: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{ width: 14, height: 1, background: C.terra }}/>
              <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>ഫോട്ടോ</span>
              <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {photos.map((url, i) => (
                <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setActivePhoto(url)}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price */}
        <div style={{ borderTop: `1px solid ${C.cream3}`, paddingTop: 16 }}>
          <p style={{ ...sans, fontSize: 13, color: C.muted, fontStyle: 'italic', fontWeight: 300 }}>{property.price_guide} · Contact owner for full details</p>
          <p style={{ ...sans, fontSize: 11, color: C.muted, lineHeight: 1.6, marginTop: 10, fontWeight: 300, borderTop: `1px solid ${C.cream3}`, paddingTop: 10 }}>
            Details reviewed and curated at time of listing. Facilities, pricing, and availability may change — please confirm directly with the owner before booking. Theeram Spaces is a discovery directory and is not party to any booking arrangement.
          </p>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
          {(property as any).maps_url && (
            <a href={(property as any).maps_url} target="_blank" rel="noopener noreferrer" style={{ ...sans, fontSize: 12, color: C.terra, textDecoration: 'none', borderBottom: `1px solid ${C.terra}`, paddingBottom: 1 }}>View on Maps →</a>
          )}
          {(property as any).instagram_url && (
            <a href={(property as any).instagram_url} target="_blank" rel="noopener noreferrer" style={{ ...sans, fontSize: 12, color: C.terra, textDecoration: 'none', borderBottom: `1px solid ${C.terra}`, paddingBottom: 1 }}>Instagram →</a>
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.cream, borderTop: `1px solid ${C.cream3}`, padding: '12px 16px', display: 'flex', gap: 10, zIndex: 30 }}>
        <Link href="/" style={{ width: 44, height: 44, border: `1px solid ${C.cream3}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, textDecoration: 'none', flexShrink: 0 }}>
          <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5L7 10l5 5"/></svg>
        </Link>
        <button onClick={handleWhatsApp} style={{ ...sans, flex: 1, background: C.green, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '0 16px', height: 44, border: 'none', cursor: 'pointer' }}>
          Talk to owner on WhatsApp
        </button>
      </div>

      {/* Lightbox */}
      {activePhoto && (
        <div onClick={() => setActivePhoto(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={activePhoto} alt="" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }} onClick={e => e.stopPropagation()}/>
          <button onClick={() => setActivePhoto(null)} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, background: 'rgba(255,255,255,.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={1.8}><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round"/></svg>
          </button>
        </div>
      )}

      <GratitudeModal isOpen={showModal} onClose={() => setShowModal(false)} property={property} eventType={firstEvent} onWhatsApp={openWhatsApp}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
