'use client'

import { useState } from 'react'
import Link from 'next/link'
import { C, sans, serif } from '@/lib/design'
import GratitudeModal from '@/components/GratitudeModal'

const CATEGORY_LABEL: Record<string, { en: string; ml: string }> = {
  photography_video: { en: 'Photography & Video', ml: 'ഫോട്ടോഗ്രാഫി' },
  catering: { en: 'Catering', ml: 'കാറ്ററിംഗ്' },
  decoration_florals: { en: 'Decoration & Florals', ml: 'അലങ്കാരം' },
  event_management: { en: 'Event Management', ml: 'ഇവന്റ്' },
  beauty_styling: { en: 'Beauty & Styling', ml: 'ബ്യൂട്ടി' },
}

const VISUAL_CATEGORIES = ['photography_video', 'decoration_florals', 'beauty_styling']

interface MakerCardProps {
  maker: {
    id: string; name: string; slug: string; category: string
    tagline: string; description: string
    whatsapp: string; phone: string
    instagram_url: string; photos: string[]
    price_guide: string; is_featured: boolean
    vendor_attributes?: {
      years_experience: number; team_size: number
      min_guests: number; max_guests: number
      offers_trial: boolean; home_service: boolean
      instagram_followers?: number
      category_details: Record<string, any>
    }
  }
}

function formatFollowers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `${n}`
}

export default function MakerCard({ maker }: MakerCardProps) {
  const [showModal, setShowModal] = useState(false)
  const cat = CATEGORY_LABEL[maker.category] ?? { en: maker.category, ml: '' }
  const isVisual = VISUAL_CATEGORIES.includes(maker.category)
  const attrs = maker.vendor_attributes
  const photos = maker.photos ?? []
  const details = attrs?.category_details ?? {}

  const waDigits = (maker.whatsapp ?? '').replace(/\D/g, '')
  const phoneDigits = (maker.phone || maker.whatsapp || '').replace(/\D/g, '')
  const waUrl = `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hi! I found ${maker.name} on Theeram (theeramspaces.in) and I'm interested in your services. Could you share availability and pricing?`)}`

  function logInquiry(channel: 'whatsapp' | 'phone' | 'instagram' = 'whatsapp') {
    fetch('/api/vendor-inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor_id: maker.id, channel }),
    }).catch(() => {})
  }

  function handleContact() {
    logInquiry('whatsapp')
    const w = window.open(waUrl, '_blank', 'noopener,noreferrer')
    if (!w) window.location.href = waUrl
    setShowModal(true)
  }

  // Build quick-fact chips per category
  const chips: string[] = []
  if (maker.category === 'photography_video') {
    if (details.offers_video) chips.push('📹 Video')
    if (details.has_drone) chips.push('🚁 Drone')
    if (attrs?.team_size) chips.push(`Team of ${attrs.team_size}`)
  } else if (maker.category === 'catering') {
    if (details.live_counters) chips.push('🔥 Live counters')
    if (attrs?.min_guests || attrs?.max_guests) chips.push(`${attrs.min_guests}-${attrs.max_guests} guests`)
  } else if (maker.category === 'decoration_florals') {
    if (details.does_mandapam) chips.push('Mandapam specialist')
    if (details.includes_lighting) chips.push('💡 Lighting incl.')
  } else if (maker.category === 'event_management') {
    if (details.has_vendor_network) chips.push('🔗 Vendor network')
    if (attrs?.team_size) chips.push(`Team of ${attrs.team_size}`)
  } else if (maker.category === 'beauty_styling') {
    if (attrs?.offers_trial) chips.push('✓ Trial available')
    if (attrs?.home_service) chips.push('🏠 Home service')
  }

  return (
    <>
      <div style={{
        background: 'white', border: `1px solid ${C.cream3}`, borderRadius: 22,
        overflow: 'hidden', position: 'relative',
        boxShadow: '0 2px 10px rgba(0,0,0,.04)',
        display: 'flex', flexDirection: 'column', height: '100%',
      }}>
        {maker.is_featured && (
          <div style={{ position: 'absolute', top: 12, right: 12, background: C.gold, padding: '4px 11px', borderRadius: 999, zIndex: 2, boxShadow: '0 2px 6px rgba(0,0,0,.15)' }}>
            <span style={{ ...sans, fontSize: 9, fontWeight: 700, color: C.text }}>★ Theeram pick</span>
          </div>
        )}

        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 16px 0' }}>
          <div style={{ width: 8, height: 1, background: C.terra }}/>
          <span style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em' }}>{cat.ml} · {cat.en.toUpperCase()}</span>
        </div>

        {/* Visual categories: photo grid. Stat categories: single banner + stat row */}
        {isVisual ? (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 4, padding: '10px 14px', height: 148 }}>
            <div style={{ gridRow: 'span 2', background: C.green, position: 'relative', overflow: 'hidden', borderRadius: 14 }}>
              {photos[0] && <img src={photos[0]} alt={`${maker.name} — ${cat.en}`} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
            </div>
            <div style={{ background: '#8A7040', position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
              {photos[1] && <img src={photos[1]} alt={`${maker.name} portfolio 2`} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
            </div>
            <div style={{ background: C.green2, position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
              {photos[2] && <img src={photos[2]} alt={`${maker.name} portfolio 3`} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
            </div>
          </div>
        ) : (
          <>
            <div style={{ height: 118, background: '#7B3B2A', position: 'relative', margin: '10px 14px 0', overflow: 'hidden', borderRadius: 14 }}>
              {photos[0] && <img src={photos[0]} alt={`${maker.name} — ${cat.en}`} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
            </div>
            {(attrs?.min_guests || attrs?.years_experience) && (
              <div style={{ display: 'flex', padding: '10px 14px 0' }}>
                {attrs?.min_guests && attrs?.max_guests ? (
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ ...serif, fontSize: 16, color: C.terra }}>{attrs.min_guests}-{attrs.max_guests}</div>
                    <div style={{ ...sans, fontSize: 8, color: C.muted, letterSpacing: '.05em' }}>GUEST RANGE</div>
                  </div>
                ) : null}
                {attrs?.years_experience ? (
                  <div style={{ flex: 1, textAlign: 'center', borderLeft: `1px solid ${C.cream3}` }}>
                    <div style={{ ...serif, fontSize: 16, color: C.terra }}>{attrs.years_experience} yrs</div>
                    <div style={{ ...sans, fontSize: 8, color: C.muted, letterSpacing: '.05em' }}>EXPERIENCE</div>
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}

        <div style={{ padding: '10px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <Link href={`/vendor/${maker.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{ ...serif, fontSize: 19, color: C.text, marginBottom: 3 }}>{maker.name}</div>
            </Link>
            <div style={{ ...sans, fontSize: 11, color: C.muted, fontWeight: 300, marginBottom: 10, lineHeight: 1.5 }}>{maker.tagline}</div>

            {chips.length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                {chips.map(ch => <span key={ch} style={{ ...sans, fontSize: 10, color: C.muted, background: '#F0EBE0', padding: '3px 10px', borderRadius: 999, border: `1px solid ${C.cream3}`, fontWeight: 300 }}>{ch}</span>)}
              </div>
            )}

            {maker.instagram_url && (
              <a href={maker.instagram_url} onClick={() => logInquiry('instagram')} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '8px 10px', background: '#fdf0eb', borderRadius: 10, textDecoration: 'none' }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', flexShrink: 0 }}/>
                <span style={{ ...sans, fontSize: 11, color: C.terra, fontWeight: 500 }}>{maker.instagram_url.replace(/https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}</span>
                {!!attrs?.instagram_followers && attrs.instagram_followers > 0 && (
                  <span style={{ ...sans, fontSize: 10, color: C.muted, fontWeight: 300 }}>· {formatFollowers(attrs.instagram_followers)} followers</span>
                )}
                <span style={{ ...sans, fontSize: 9, color: C.terra, marginLeft: 'auto' }}>View work →</span>
              </a>
            )}
          </div>

          <div>
            <div style={{ width: '100%', height: 1, background: C.cream3, marginBottom: 10 }}/>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ ...sans, fontSize: 14, fontWeight: 600, color: C.text }}>{maker.price_guide || 'Ask for price'}</div>
              <Link href={`/vendor/${maker.slug}`} style={{ ...sans, fontSize: 11, color: C.terra, textDecoration: 'none' }}>Details →</Link>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleContact}
                style={{
                  ...sans, flex: 1, height: 44, background: C.green, color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const,
                  border: 'none', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 3px 10px rgba(28,58,43,.2)',
                }}>
                <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z"/></svg>
                Check availability
              </button>
              {phoneDigits && (
                <a href={`tel:+${phoneDigits}`} onClick={() => logInquiry('phone')} aria-label={`Call ${maker.name}`}
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
      </div>

      {showModal && (
        <GratitudeModal
          propertyName={maker.name}
          whatsappUrl={waUrl}
          reviewUrl="https://g.page/r/Cav0otb1aGpEEBM/review"
          upiUrl="upi://pay?pa=smm0794@okhdfcbank&pn=Theeram&am=20&cu=INR&tn=Theeram+chai"
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
