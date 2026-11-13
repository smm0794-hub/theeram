'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase, Property } from '@/lib/supabase'
import { C, sans, serif } from '@/lib/design'
import Header from '@/components/Header'
import GratitudeModal from '@/components/GratitudeModal'
import EnquiryModal, { EnquiryDetails, buildEnquiryWaUrl, openWhatsApp } from '@/components/EnquiryModal'

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

export default function PropertyDetailClient({ slug, initialProperty, similarProperties = [] }: { slug: string; initialProperty?: Property | null; similarProperties?: Property[] }) {
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(initialProperty ?? null)
  const [loading, setLoading] = useState(!initialProperty)
  const [showModal, setShowModal] = useState(false)
  const [showEnquiry, setShowEnquiry] = useState(false)
  const [enquiryDetails, setEnquiryDetails] = useState<EnquiryDetails | undefined>(undefined)
  const [heroPhotoIdx, setHeroPhotoIdx] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ down: boolean; startX: number; scrollLeft: number; moved: boolean }>({ down: false, startX: 0, scrollLeft: 0, moved: false })
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
  const waUrl = buildEnquiryWaUrl(property.owner_whatsapp, property.name, enquiryDetails)

  // Step 1: ask for tentative date + guest count
  function handleWhatsApp() {
    setShowEnquiry(true)
  }

  // Step 2: open WhatsApp with details pre-filled (inside the click gesture), then show gratitude sheet
  function sendEnquiry(details: EnquiryDetails) {
    if (!property) return
    logInquiry()
    openWhatsApp(buildEnquiryWaUrl(property.owner_whatsapp, property.name, details))
    setEnquiryDetails(details)
    setShowEnquiry(false)
    setShowModal(true)
  }

  // Skip date/pax when visitor just wants to ask a quick question
  function skipEnquiry() {
    if (!property) return
    logInquiry()
    openWhatsApp(buildEnquiryWaUrl(property.owner_whatsapp, property.name))
    setEnquiryDetails(undefined)
    setShowEnquiry(false)
    setShowModal(true)
  }

  const shareText = [
    `Check out ${property.name}${townObj?.name ? ` (${townObj.name})` : ''} on Theeram:`,
    property.price_guide ? `Price guide: ${property.price_guide}` : null,
    attrs?.max_guests_day_event ? `Capacity: up to ${attrs.max_guests_day_event} guests` : null,
    `https://www.theeramspaces.in/property/${property.slug}`,
  ].filter(Boolean).join('\n')
  const familyShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`

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
          <style>{`.hero-carousel::-webkit-scrollbar{display:none}`}</style>
          <div style={{ background: heroBg, height: 270, position: 'relative', overflow: 'hidden' }}>
            <div style={{ opacity: .12, position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <svg viewBox="0 0 120 120" fill="none" width={200} height={200} stroke="white" strokeWidth={.8}>
                <circle cx="60" cy="60" r="50"/><circle cx="60" cy="60" r="35"/><circle cx="60" cy="60" r="20"/>
                <line x1="60" y1="10" x2="60" y2="110"/><line x1="10" y1="60" x2="110" y2="60"/>
              </svg>
            </div>
            {photos.length > 0 ? (
              <div
                ref={carouselRef}
                className="hero-carousel"
                onScroll={e => {
                  const el = e.currentTarget
                  if (el.clientWidth > 0) {
                    const idx = Math.round(el.scrollLeft / el.clientWidth)
                    if (idx !== heroPhotoIdx) setHeroPhotoIdx(idx)
                  }
                }}
                onMouseDown={e => {
                  const el = carouselRef.current
                  if (!el || photos.length <= 1) return
                  dragState.current = { down: true, startX: e.pageX, scrollLeft: el.scrollLeft, moved: false }
                }}
                onMouseMove={e => {
                  const el = carouselRef.current
                  if (!dragState.current.down || !el) return
                  const dx = e.pageX - dragState.current.startX
                  if (Math.abs(dx) > 6) dragState.current.moved = true
                  el.scrollLeft = dragState.current.scrollLeft - dx
                }}
                onMouseUp={() => { dragState.current.down = false }}
                onMouseLeave={() => { dragState.current.down = false }}
                style={{
                  width: '100%', height: '100%', display: 'flex',
                  overflowX: 'auto', overflowY: 'hidden',
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none',
                  position: 'relative', zIndex: 1,
                }}
              >
                {photos.map((url, idx) => (
                  <div
                    key={`${url}-${idx}`}
                    onClick={() => {
                      if (dragState.current.moved) {
                        dragState.current.moved = false
                        return
                      }
                      setActivePhoto(url)
                    }}
                    style={{
                      flex: '0 0 100%', minWidth: '100%', width: '100%', height: '100%',
                      scrollSnapAlign: 'start', scrollSnapStop: 'always',
                      cursor: photos.length > 1 ? 'grab' : 'pointer', position: 'relative',
                    }}
                  >
                    <img
                      src={url}
                      alt={`${property.name} photo ${idx + 1}`}
                      draggable={false}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', userSelect: 'none' }}
                    />
                  </div>
                ))}
              </div>
            ) : null}

            {/* Photo counter + prev/next arrows + dots */}
            {photos.length > 1 && (
              <>
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(15,15,13,.62)', backdropFilter: 'blur(4px)', color: 'white', padding: '4px 10px', borderRadius: 999, ...sans, fontSize: 10.5, fontWeight: 500, zIndex: 3, pointerEvents: 'none' }}>
                  {heroPhotoIdx + 1} / {photos.length} photos
                </div>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={e => {
                    e.stopPropagation()
                    const nextIdx = (heroPhotoIdx - 1 + photos.length) % photos.length
                    setHeroPhotoIdx(nextIdx)
                    if (carouselRef.current) carouselRef.current.scrollTo({ left: nextIdx * carouselRef.current.clientWidth, behavior: 'smooth' })
                  }}
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: 999, background: 'rgba(15,15,13,.45)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={e => {
                    e.stopPropagation()
                    const nextIdx = (heroPhotoIdx + 1) % photos.length
                    setHeroPhotoIdx(nextIdx)
                    if (carouselRef.current) carouselRef.current.scrollTo({ left: nextIdx * carouselRef.current.clientWidth, behavior: 'smooth' })
                  }}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: 999, background: 'rgba(15,15,13,.45)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }}
                >
                  ›
                </button>
                <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 5, zIndex: 3 }}>
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Photo ${i + 1}`}
                      onClick={e => {
                        e.stopPropagation()
                        setHeroPhotoIdx(i)
                        if (carouselRef.current) carouselRef.current.scrollTo({ left: i * carouselRef.current.clientWidth, behavior: 'smooth' })
                      }}
                      style={{
                        width: heroPhotoIdx === i ? 14 : 6, height: 6, borderRadius: 999, border: 'none', padding: 0, cursor: 'pointer',
                        background: heroPhotoIdx === i ? C.gold : 'rgba(255,255,255,.55)', transition: 'width .2s',
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 20px 16px', background: 'linear-gradient(to top, rgba(0,0,0,.62), transparent)', pointerEvents: 'none', zIndex: 2 }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <p style={{ ...sans, fontSize: 14, color: C.muted, lineHeight: 1.65, margin: 0, fontWeight: 300, flex: '1 1 260px' }}>{property.tagline}</p>
              {(property as any).maps_url && (
                <a href={(property as any).maps_url} target="_blank" rel="noopener noreferrer"
                  style={{ ...sans, fontSize: 11.5, color: C.terra, background: '#FDF4EF', border: `1px solid rgba(155,61,30,.25)`, padding: '6px 12px', borderRadius: 999, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  📍 View location ↗
                </a>
              )}
            </div>

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

        {/* Inline Enquiry + Family WhatsApp Share Card */}
        <div style={{ background: C.green, borderRadius: 24, padding: '20px 20px', marginBottom: 16, color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 14, height: 1, background: C.gold }}/>
            <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.08em' }}>നേരിട്ട് സംസാരിക്കാം · DIRECT OWNER CONTACT</span>
          </div>
          <h2 style={{ ...serif, fontSize: 20, fontWeight: 300, color: 'white', margin: '0 0 6px' }}>
            Planning an event here?
          </h2>
          <p style={{ ...sans, fontSize: 12.5, color: 'rgba(255,255,255,.72)', fontWeight: 300, lineHeight: 1.6, margin: '0 0 16px' }}>
            Message the owner directly on WhatsApp for exact date availability &amp; pricing — usually replies within a few hours, with zero brokerage.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleWhatsApp} style={{ ...sans, flex: '1 1 200px', height: 46, borderRadius: 12, border: 'none', cursor: 'pointer', background: C.gold, color: C.text, fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z"/></svg>
              Check availability &amp; price
            </button>
            <a href={familyShareUrl} target="_blank" rel="noopener noreferrer"
              style={{ ...sans, flex: '1 1 180px', height: 46, borderRadius: 12, border: `1px solid rgba(255,255,255,.28)`, background: 'rgba(255,255,255,.08)', color: 'white', fontSize: 12, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              Share with family on WhatsApp
            </a>
          </div>
        </div>

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
        <div style={{ background: 'white', borderRadius: 24, border: `1px solid ${C.cream3}`, padding: '18px 20px', marginBottom: 16 }}>
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

        {/* Similar spaces in same town — prevents dead-end bounce */}
        {similarProperties.length > 0 && (
          <div style={{ marginTop: 22, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 12, height: 1, background: C.terra }}/>
                  <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>കൂടുതൽ ഇടങ്ങൾ</span>
                </div>
                <h2 style={{ ...serif, fontSize: 19, fontWeight: 400, color: C.text, margin: 0 }}>
                  More spaces in {townObj?.name ?? 'this area'}
                </h2>
              </div>
              <Link href={backHref} style={{ ...sans, fontSize: 12, color: C.terra, textDecoration: 'none' }}>
                See all →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              {similarProperties.map(sp => {
                const spPhotos = Array.isArray(sp.photos) ? sp.photos : []
                const spRawAttrs = (sp as any).property_attributes
                const spAttrs = Array.isArray(spRawAttrs) ? spRawAttrs[0] : spRawAttrs
                return (
                  <Link key={sp.id} href={`/property/${sp.slug}`} style={{ background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}`, overflow: 'hidden', textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 116, background: CARD_BG[sp.property_type] ?? C.green, position: 'relative' }}>
                      {spPhotos[0] && (
                        <img src={spPhotos[0]} alt={sp.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                      )}
                      <div style={{ position: 'absolute', bottom: 8, left: 10, background: 'rgba(15,15,13,.6)', color: C.gold, padding: '2px 8px', borderRadius: 999, ...serif, fontSize: 10.5, fontStyle: 'italic' }}>
                        {TYPE_LABEL[sp.property_type] ?? sp.property_type}
                      </div>
                    </div>
                    <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 6 }}>
                      <div>
                        <div style={{ ...serif, fontSize: 15.5, color: C.text, lineHeight: 1.25, marginBottom: 4 }}>{sp.name}</div>
                        <div style={{ ...sans, fontSize: 11.5, color: C.muted, fontWeight: 300, lineHeight: 1.4 }}>{sp.tagline?.split('—')[0]?.trim()}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.cream3}`, paddingTop: 8, marginTop: 4 }}>
                        <span style={{ ...sans, fontSize: 12, fontWeight: 600, color: C.text }}>{sp.price_guide || 'Ask owner'}</span>
                        {spAttrs?.max_guests_day_event ? (
                          <span style={{ ...sans, fontSize: 10.5, color: C.muted }}>Up to {spAttrs.max_guests_day_event}</span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
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
            <span style={{ fontSize: 10, fontWeight: 300, letterSpacing: '.02em', opacity: .85 }}>Straight to owner on WhatsApp · No commission</span>
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

      {/* Enquiry sheet: tentative date + guest count → WhatsApp */}
      {showEnquiry && (
        <EnquiryModal
          propertyName={property.name}
          maxGuests={attrs?.max_guests_day_event ?? null}
          onSubmit={sendEnquiry}
          onSkip={skipEnquiry}
          onClose={() => setShowEnquiry(false)}
        />
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
