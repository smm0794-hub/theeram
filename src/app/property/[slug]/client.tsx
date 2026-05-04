'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, Property, PROPERTY_TYPE_LABELS, EVENT_TYPE_LABELS } from '@/lib/supabase'
import GratitudeModal from '@/components/GratitudeModal'

export default function PropertyDetailClient({ slug }: { slug: string }) {
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activePhoto, setActivePhoto] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('properties')
          .select('*, property_attributes(*), property_event_types(event_type)')
          .eq('slug', slug)
          .eq('is_active', true)
          .single()
        setProperty(data as Property)
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [slug])

  function openWhatsApp() {
    if (!property) return
    const firstEvent = property.property_event_types?.[0]?.event_type ?? 'general'
    const eventLabel = EVENT_TYPE_LABELS[firstEvent as keyof typeof EVENT_TYPE_LABELS] ?? firstEvent
    const message = encodeURIComponent(
      `Hi! I found ${property.name} on Theeram and I'm interested in booking for a ${eventLabel}. Could you share availability and pricing? Thank you!`
    )
    window.open(`https://wa.me/${property.owner_whatsapp}?text=${message}`, '_blank')
  }

  async function handleWhatsApp() {
    if (!property) return
    const firstEvent = property.property_event_types?.[0]?.event_type ?? 'general'
    try { await supabase.from('inquiries').insert({ property_id: property.id, event_type: firstEvent }) } catch {}
    setShowModal(true)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #7C5C3E', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!property) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ color: '#7C5C3E' }}>Property not found.</p>
      <Link href="/" style={{ color: '#7C5C3E', fontSize: 13, textDecoration: 'underline' }}>Back to listings</Link>
    </div>
  )

  const attrs = property.property_attributes
  const eventTypes = property.property_event_types ?? []
  const illustrationSrc = `/illustrations/property-types/${(property.property_type ?? 'villa-with-pool').replace(/_/g, '-')}.svg`
  const firstEvent = eventTypes[0]?.event_type ?? 'general'
  const photos = property.photos ?? []

  const grid = [
    { label: 'Bedrooms', value: attrs?.room_count, available: (attrs?.room_count ?? 0) > 0 },
    { label: 'Bathrooms', value: attrs?.bathroom_count, available: (attrs?.bathroom_count ?? 0) > 0 },
    { label: 'Pool', available: attrs?.has_pool ?? false },
    { label: 'AC Hall', available: attrs?.has_ac_hall ?? false },
    { label: 'Lawn', available: attrs?.has_open_lawn ?? false },
    { label: 'Kitchen', available: attrs?.has_kitchen ?? false },
    { label: 'Parking', available: attrs?.has_parking ?? false },
    { label: 'Generator', available: attrs?.has_generator ?? false },
    { label: 'Alcohol', available: attrs?.alcohol_allowed ?? false },
  ]

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', paddingBottom: 100 }}>

      {/* Hero illustration */}
      <div style={{ position: 'relative', height: 260, overflow: 'hidden' }}>
        <img src={illustrationSrc} alt={PROPERTY_TYPE_LABELS[property.property_type] ?? 'Property'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <button onClick={() => router.back()} style={{ position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 20 20" fill="none" width={20} height={20} stroke="white" strokeWidth={2}><path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', padding: '32px 16px 16px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: 'white', lineHeight: 1.2 }}>{property.name}</h1>
        </div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <p style={{ fontSize: 14, color: '#7C5C3E', marginBottom: 14 }}>{property.tagline}</p>

        {/* Event pills + social icons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flex: 1 }}>
            {eventTypes.map(({ event_type }) => (
              <span key={event_type} style={{ fontSize: 11, border: '1px solid #D6C9B8', color: '#7C5C3E', padding: '4px 12px', borderRadius: 999 }}>
                {EVENT_TYPE_LABELS[event_type as keyof typeof EVENT_TYPE_LABELS] ?? event_type}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0, marginLeft: 12 }}>
            {property.maps_url && (
              <a href={property.maps_url} target="_blank" rel="noopener noreferrer" title="View on Google Maps"
                style={{ width: 34, height: 34, borderRadius: '50%', border: '0.5px solid #D6C9B8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C5C3E', textDecoration: 'none' }}>
                <svg viewBox="0 0 20 20" fill="none" width={16} height={16} stroke="currentColor" strokeWidth={1.4}>
                  <circle cx="10" cy="8" r="3"/>
                  <path d="M10 2C6.686 2 4 4.686 4 8c0 5 6 10 6 10s6-5 6-10c0-3.314-2.686-6-6-6z"/>
                </svg>
              </a>
            )}
            {property.instagram_url && (
              <a href={property.instagram_url.startsWith('http') ? property.instagram_url : `https://instagram.com/${property.instagram_url.replace('@', '')}`}
                target="_blank" rel="noopener noreferrer" title="Instagram"
                style={{ width: 34, height: 34, borderRadius: '50%', border: '0.5px solid #D6C9B8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C5C3E', textDecoration: 'none' }}>
                <svg viewBox="0 0 20 20" fill="none" width={16} height={16} stroke="currentColor" strokeWidth={1.4}>
                  <rect x="2" y="2" width="16" height="16" rx="4"/>
                  <circle cx="10" cy="10" r="3.5"/>
                  <circle cx="14.5" cy="5.5" r="0.8" fill="currentColor"/>
                </svg>
              </a>
            )}
          </div>
        </div>

        {/* About */}
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2C1A0E', marginBottom: 8 }}>About this space</h2>
          <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7 }}>{property.description}</p>
        </section>

        {/* Photo gallery */}
        {photos.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2C1A0E', marginBottom: 12 }}>Photos</h2>
            <div style={{ width: '100%', height: 220, borderRadius: 12, overflow: 'hidden', marginBottom: 8, cursor: 'pointer', position: 'relative' }} onClick={() => setActivePhoto(photos[0])}>
              <img src={photos[0]} alt={`${property.name} photo`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)', padding: '16px 10px 6px', display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>© Theeram Spaces</span>
              </div>
            </div>
            {photos.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {photos.slice(1, 7).map((url, i) => (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative' }} onClick={() => setActivePhoto(url)}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', bottom: 2, right: 4 }}>
                      <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>© Theeram</span>
                    </div>
                    {i === 5 && photos.length > 7 && (
                      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color: 'white', fontSize: 16, fontWeight: 700 }}>+{photos.length - 7}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Attributes grid */}
        {attrs && (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2C1A0E', marginBottom: 12 }}>What&apos;s here</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {grid.map(({ label, value, available }) => (
                <div key={label} style={{ border: `1px solid ${available ? '#6B8F71' : '#D6C9B8'}`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: available ? '#6B8F71' : '#D6C9B8', fontWeight: 500 }}>
                    {value !== undefined && available ? `${value} ` : ''}{label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <p style={{ fontSize: 13, color: '#7C5C3E', fontStyle: 'italic', marginBottom: 20 }}>{property.price_guide} · Contact owner for full details</p>

        {/* Legal disclaimer */}
        <div style={{ borderTop: '0.5px solid #D6C9B8', paddingTop: 16, marginBottom: 8 }}>
          <p style={{ fontSize: 10, color: '#B4A898', lineHeight: 1.6 }}>
            All photographs are the property of their respective owners and are protected under applicable copyright laws. Reproduction or redistribution without prior written permission is strictly prohibited. Theeram Spaces is a discovery platform and is not responsible for the accuracy of property details provided by owners.
          </p>
        </div>
      </div>

      {/* Sticky WhatsApp bar */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FAF7F2', borderTop: '0.5px solid #D6C9B8', padding: '12px 16px', zIndex: 30, display: 'flex', gap: 8 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: 12, border: '1px solid #D6C9B8', color: '#7C5C3E', textDecoration: 'none', flexShrink: 0 }}>
          <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="currentColor" strokeWidth={2}><path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <button onClick={handleWhatsApp} style={{ flex: 1, backgroundColor: '#25D366', color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 12, height: 48, border: 'none', cursor: 'pointer' }}>
          Check availability on WhatsApp
        </button>
      </div>

      {/* Lightbox */}
      {activePhoto && (
        <div onClick={() => setActivePhoto(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <button onClick={() => setActivePhoto(null)} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={2}><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round"/></svg>
          </button>
          <div style={{ position: 'relative' }}>
            <img src={activePhoto} alt="" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 8, objectFit: 'contain', display: 'block' }} onClick={(e) => e.stopPropagation()} />
            <div style={{ position: 'absolute', bottom: 8, right: 10 }}>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>© Theeram Spaces</span>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 24, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8 }}>
            {photos.map((url, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setActivePhoto(url) }}
                style={{ width: 6, height: 6, borderRadius: '50%', border: 'none', cursor: 'pointer', backgroundColor: url === activePhoto ? 'white' : 'rgba(255,255,255,0.35)', padding: 0 }} />
            ))}
          </div>
        </div>
      )}

      <GratitudeModal isOpen={showModal} onClose={() => setShowModal(false)} property={property} eventType={firstEvent} onWhatsApp={openWhatsApp} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )
}
