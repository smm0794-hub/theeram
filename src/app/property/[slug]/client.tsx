'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, Property } from '@/lib/supabase'
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

export default function PropertyDetailClient({ slug, initialProperty }: { slug: string; initialProperty?: Property | null }) {
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(initialProperty ?? null)
  const [loading, setLoading] = useState(!initialProperty)
  const [showModal, setShowModal] = useState(false)
  const [activePhoto, setActivePhoto] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [currentViewId, setCurrentViewId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function trackView(propId: string) {
      try {
        const res = await fetch('/api/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ property_id: propId, session_id: getSessionId() }),
        })
        const { view_id } = await res.json()
        if (!cancelled && view_id) {
          setCurrentViewId(view_id)
          startDurationTracking(view_id)
        }
      } catch {}
    }

    async function load() {
      if (initialProperty?.id) {
        setLoading(false)
        trackView(initialProperty.id)
        return
      }
      const { data } = await supabase
        .from('properties')
        .select('*, property_attributes(*), property_event_types(event_type), towns(name, slug, district)')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()
      if (!cancelled) {
        setProperty(data as Property)
        setLoading(false)
        if (data?.id) trackView(data.id)
      }
    }
    load()
    return () => { cancelled = true }
  }, [slug, initialProperty])

  function startDurationTracking(viewId: string) {
    let activeMs = 0
    let lastResumeAt = Date.now()
    let isVisible = document.visibilityState === 'visible'

    function onVisibilityChange() {
      const now = Date.now()
      if (document.visibilityState === 'hidden' && isVisible) {
        activeMs += now - lastResumeAt
        isVisible = false
      } else if (document.visibilityState === 'visible' && !isVisible) {
        lastResumeAt = now
        isVisible = true
      }
    }

    function sendDuration() {
      if (isVisible) activeMs += Date.now() - lastResumeAt
      const seconds = Math.round(activeMs / 1000)
      if (seconds < 1) return
      const payload = JSON.stringify({ view_id: viewId, duration_seconds: seconds })
      try {
        navigator.sendBeacon('/api/track-view', new Blob([payload], { type: 'application/json' }))
      } catch {}
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', sendDuration)
    window.addEventListener('beforeunload', sendDuration)
  }

  function logInquiry() {
    if (!property) return
    supabase.from('inquiries').insert({
      property_id: property.id,
      event_type: property.property_event_types?.[0]?.event_type ?? 'general',
      ...(currentViewId ? { view_id: currentViewId } : {}),
    }).then(() => {}, () => {})
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

  const rawAttrs = (property as any).property_attributes
  const attrs = Array.isArray(rawAttrs) ? rawAttrs[0] : rawAttrs
  const rawTown = (property as any).towns
  const townObj = Array.isArray(rawTown) ? rawTown[0] : rawTown
  const backHref = townObj?.slug ? `/${townObj.slug}` : '/'
  const backLabel = townObj?.name ? `Back to ${townObj.name}` : 'Back to spaces'

  const photos = property.photos ?? []
  const heroBg = CARD_BG[property.property_type] ?? C.green

  const ownerPhone = (property.owner_whatsapp ?? '').replace(/\D/g, '')
  const waMessage = encodeURIComponent(
    `Hi! I found ${property.name} on Theeram (theeramspaces.in) and I'm interested in booking. Could you share availability and pricing?`
  )
  const waUrl = `https://wa.me/${ownerPhone}?text=${waMessage}`

  // 1-Tap Direct WhatsApp: opens WhatsApp immediately and shows the gratitude modal for when they return
  function handleWhatsApp() {
    logInquiry()
    const w = window.open(waUrl, '_blank', 'noopener,noreferrer')
    if (!w) window.location.href = waUrl
    setShowModal(true)
  }

  // Only show facilities that are actually available (no greyed-out negative boxes)
  const availableFacilities = [
    (attrs?.room_count ?? 0) > 0 ? `${attrs.room_count} ${attrs.room_count === 1 ? 'Bedroom' : 'Bedrooms'}` : null,
    (attrs?.bathroom_count ?? 0) > 0 ? `${attrs.bathroom_count} ${attrs.bathroom_count === 1 ? 'Bathroom' : 'Bathrooms'}` : null,
    attrs?.has_pool ? 'Swimming Pool' : null,
    attrs?.has_ac_hall ? `AC Hall${attrs?.ac_hall_capacity ? ` · ${attrs.ac_hall_capacity} guests` : ''}` : null,
    attrs?.has_non_ac_hall ? `Hall${attrs?.non_ac_hall_capacity ? ` · ${attrs.non_ac_hall_capacity} guests` : ''}` : null,
    attrs?.has_open_lawn ? `Open Lawn${attrs?.open_lawn_sqft ? ` · ${attrs.open_lawn_sqft} sqft` : ''}` : null,
    attrs?.has_kitchen ? 'Kitchen' : null,
    attrs?.outside_catering ? 'Outside Catering Allowed' : null,
    attrs?.has_parking ? `Parking${attrs?.parking_count ? ` · ${attrs.parking_count} cars` : ''}` : null,
    attrs?.has_generator ? 'Generator Backup' : null,
    attrs?.alcohol_allowed ? 'Alcohol Permitted' : null,
  ].filter(Boolean) as string[]

  return (
    <div style={{ background: C.cream, minHeight: '100vh', paddingBottom: 112 }}>
      <Header/>

      {/* JSON-LD structured data (EventVenue for stronger Google Rich Results) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': ['EventVenue', 'LocalBusiness'],
        name: property.name,
        description: property.description ?? property.tagline,
        url: `https://www.theeramspaces.in/property/${property.slug}`,
        telephone: ownerPhone ? `+${ownerPhone}` : undefined,
        image: property.photos?.[0],
        priceRange: property.price_guide ?? '₹₹₹',
        maximumAttendeeCapacity: attrs?.max_guests_day_event || undefined,
        address: {
          '@type': 'PostalAddress',
          addressLocality: townObj?.name || 'Pala',
          addressRegion: 'Kerala',
          addressCountry: 'IN',
        },
        amenityFeature: availableFacilities.map(name => ({
          '@type': 'LocationFeatureSpecification',
          name,
          value: true,
        })),
      }) }}/>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* Top Back + Share Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <Link href={backHref} style={{
            ...sans, fontSize: 12, color: C.text, background: C.cream2, border: `1px solid ${C.cream3}`,
            padding: '7px 14px', borderRadius: 999, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            ← {backLabel}
          </Link>
          <button onClick={handleShare} style={{
            ...sans, fontSize: 12, color: C.text, background: 'white', border: `1px solid ${C.cream3}`,
            padding: '7px 14px', borderRadius: 999, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            {copied ? '✓ Link copied' : '↗ Share'}
          </button>
        </div>

        {/* Rounded Hero Card */}
        <div style={{ background: 'white', borderRadius: 26, border: `1px solid ${C.cream3}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.04)', marginBottom: 18 }}>
          <div style={{ background: heroBg, height: 270, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ opacity: .12, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 120 120" fill="none" width={200} height={200} stroke="white" strokeWidth={.8}>
                <circle cx="60" cy="60" r="50"/><circle cx="60" cy="60" r="35"/><circle cx="60" cy="60" r="20"/>
                <line x1="60" y1="10" x2="60" y2="110"/><line x1="10" y1="60" x2="110" y2="60"/>
              </svg>
            </div>
            {photos.length > 0 ? (
              <img src={photos[0]} alt={property.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0, cursor: 'pointer' }} onClick={() => setActivePhoto(photos[0])}/>
            ) : null}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 20px 16px', background: 'linear-gradient(to top, rgba(0,0,0,.62), transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ width: 10, height: 1, background: C.gold }}/>
                <span style={{ ...serif, fontSize: 12, color: C.gold, fontStyle: 'italic' }}>
                  {TYPE_LABEL[property.property_type] ?? property.property_type}
                  {townObj?.name ? ` · ${townObj.name}` : ''}
                </span>
              </div>
              <h1 style={{ ...serif, fontSize: 26, color: 'white', fontWeight: 400, lineHeight: 1.2 }}>{property.name}</h1>
            </div>
          </div>

          <div style={{ padding: '18px 20px 20px' }}>
            <p style={{ ...sans, fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 16, fontWeight: 300 }}>{property.tagline}</p>

            {/* Key Capacity & Price Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
              {attrs?.max_guests_day_event ? (
                <div style={{ background: C.cream, padding: '12px 14px', borderRadius: 16 }}>
                  <div style={{ ...serif, fontSize: 22, color: C.terra, fontWeight: 400 }}>{attrs.max_guests_day_event}</div>
                  <div style={{ ...sans, fontSize: 9.5, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase' }}>Day Event Guests</div>
                </div>
              ) : null}
              {attrs?.max_guests_overnight ? (
                <div style={{ background: C.cream, padding: '12px 14px', borderRadius: 16 }}>
                  <div style={{ ...serif, fontSize: 22, color: C.terra, fontWeight: 400 }}>{attrs.max_guests_overnight}</div>
                  <div style={{ ...sans, fontSize: 9.5, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase' }}>Overnight Guests</div>
                </div>
              ) : null}
              <div style={{ background: C.cream, padding: '12px 14px', borderRadius: 16 }}>
                <div style={{ ...serif, fontSize: 18, color: C.text, fontWeight: 400 }}>{property.price_guide || 'Ask owner'}</div>
                <div style={{ ...sans, fontSize: 9.5, color: C.muted, letterSpacing: '.06em', textTransform: 'uppercase' }}>Typical Price Guide</div>
              </div>
            </div>
          </div>
        </div>

        {/* About Card */}
        {property.description && (
          <div style={{ background: 'white', borderRadius: 24, border: `1px solid ${C.cream3}`, padding: '20px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <div style={{ width: 14, height: 1, background: C.terra }}/>
              <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>ഇടം</span>
              <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
            </div>
            <h2 style={{ ...serif, fontSize: 19, fontWeight: 400, color: C.text, marginBottom: 10 }}>About this space</h2>
            <p style={{ ...sans, fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 300 }}>{property.description}</p>
          </div>
        )}

        {/* Available Facilities Card (Only shows what IS present — no greyed-out negative boxes) */}
        {availableFacilities.length > 0 && (
          <div style={{ background: 'white', borderRadius: 24, border: `1px solid ${C.cream3}`, padding: '20px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <div style={{ width: 14, height: 1, background: C.terra }}/>
              <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>സൗകര്യങ്ങൾ</span>
              <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
            </div>
            <h2 style={{ ...serif, fontSize: 19, fontWeight: 400, color: C.text, marginBottom: 12 }}>What’s here</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
              {availableFacilities.map(label => (
                <div key={label} style={{ background: '#FDF4EF', border: `1px solid rgba(155,61,30,.28)`, borderRadius: 14, padding: '11px 12px', textAlign: 'center' }}>
                  <p style={{ ...sans, fontSize: 11.5, color: C.terra, lineHeight: 1.35, fontWeight: 500, margin: 0 }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo Gallery Card */}
        {photos.length > 1 && (
          <div style={{ background: 'white', borderRadius: 24, border: `1px solid ${C.cream3}`, padding: '20px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{ width: 14, height: 1, background: C.terra }}/>
              <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>ഫോട്ടോ · GALLERY</span>
              <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {photos.map((url, i) => (
                <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 14, cursor: 'pointer' }} onClick={() => setActivePhoto(url)}>
                  <img src={url} alt={`${property.name} photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Price note & External Links */}
        <div style={{ background: 'white', borderRadius: 24, border: `1px solid ${C.cream3}`, padding: '18px 20px' }}>
          <p style={{ ...sans, fontSize: 13, color: C.text, fontStyle: 'italic', fontWeight: 400, marginBottom: 10 }}>
            {property.price_guide ? `Typically ${property.price_guide}. Owner confirms the exact price for your date.` : 'Ask the owner for pricing for your date.'}
          </p>
          {((property as any).maps_url || (property as any).instagram_url) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              {(property as any).maps_url && (
                <a href={(property as any).maps_url} target="_blank" rel="noopener noreferrer"
                  style={{ ...sans, fontSize: 12, color: C.terra, background: '#FDF4EF', border: `1px solid rgba(155,61,30,.28)`, padding: '7px 14px', borderRadius: 999, textDecoration: 'none' }}>
                  📍 View on Google Maps →
                </a>
              )}
              {(property as any).instagram_url && (
                <a href={(property as any).instagram_url} target="_blank" rel="noopener noreferrer"
                  style={{ ...sans, fontSize: 12, color: C.terra, background: '#FDF4EF', border: `1px solid rgba(155,61,30,.28)`, padding: '7px 14px', borderRadius: 999, textDecoration: 'none' }}>
                  Instagram →
                </a>
              )}
            </div>
          )}
          <p style={{ ...sans, fontSize: 11, color: C.muted, lineHeight: 1.6, margin: 0, fontWeight: 300, borderTop: `1px solid ${C.cream3}`, paddingTop: 10 }}>
            Details reviewed and curated at time of listing. Facilities, pricing, and availability may change — please confirm directly with the owner before booking. Theeram Spaces is a discovery directory and is not party to any booking arrangement.
          </p>
        </div>
      </div>

      {/* Sticky bottom bar — constrained width + rounded buttons + 1-Tap Call & 1-Tap WhatsApp */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(245,240,232,.96)', backdropFilter: 'blur(8px)', borderTop: `1px solid ${C.cream3}`, padding: '12px 16px', zIndex: 30 }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href={backHref} style={{ width: 48, height: 50, borderRadius: 14, border: `1px solid ${C.cream3}`, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, textDecoration: 'none', flexShrink: 0 }}>
            <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5L7 10l5 5"/></svg>
          </Link>
          {ownerPhone && (
            <a href={`tel:+${ownerPhone}`} onClick={logInquiry} aria-label="Call the owner"
              style={{ ...sans, height: 50, padding: '0 16px', borderRadius: 14, border: `1px solid ${C.green}`, color: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none', flexShrink: 0, background: 'white', fontSize: 12, fontWeight: 600 }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/></svg>
              Call
            </a>
          )}
          <button onClick={handleWhatsApp} style={{ ...sans, flex: 1, background: C.green, color: 'white', padding: '0 16px', height: 50, borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, boxShadow: '0 3px 10px rgba(28,58,43,.22)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z"/></svg>
              Check availability &amp; price
            </span>
            <span style={{ fontSize: 10, fontWeight: 300, letterSpacing: '.02em', opacity: .85 }}>Opens WhatsApp directly · No commission</span>
          </button>
        </div>
      </div>

      {/* Photo lightbox */}
      {activePhoto && (
        <div onClick={() => setActivePhoto(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={activePhoto} alt="" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 14 }} onClick={e => e.stopPropagation()}/>
          <button onClick={() => setActivePhoto(null)} style={{ position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={1.8}><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round"/></svg>
          </button>
        </div>
      )}

      {/* Post-enquiry gratitude modal */}
      {showModal && (
        <GratitudeModal
          propertyName={property.name}
          whatsappUrl={waUrl}
          reviewUrl="https://g.page/r/Cav0otb1aGpEEBM/review"
          upiUrl="upi://pay?pa=smm0794@okhdfcbank&pn=Theeram&am=20&cu=INR&tn=Theeram+chai"
          onClose={() => setShowModal(false)}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
