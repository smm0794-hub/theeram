'use client'

import { useState } from 'react'
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
      category_details: Record<string, any>
    }
  }
}

export default function MakerCard({ maker }: MakerCardProps) {
  const [showModal, setShowModal] = useState(false)
  const cat = CATEGORY_LABEL[maker.category] ?? { en: maker.category, ml: '' }
  const isVisual = VISUAL_CATEGORIES.includes(maker.category)
  const attrs = maker.vendor_attributes
  const photos = maker.photos ?? []
  const details = attrs?.category_details ?? {}

  async function handleContact() {
    try {
      await fetch('/api/vendor-inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendor_id: maker.id }),
      })
    } catch {}
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

  const waUrl = `https://wa.me/${maker.whatsapp}?text=${encodeURIComponent(`Hi! I found ${maker.name} on Theeram (theeramspaces.in) and I'm interested in your services.`)}`

  return (
    <>
      <div style={{
        background: 'white', border: `1px solid ${C.cream3}`, overflow: 'hidden', position: 'relative',
        boxShadow: '0 2px 8px rgba(0,0,0,.04)',
      }}>
        {maker.is_featured && (
          <div style={{ position: 'absolute', top: 0, left: 0, background: C.gold, padding: '4px 10px', zIndex: 2, boxShadow: '0 2px 6px rgba(0,0,0,.15)' }}>
            <span style={{ ...sans, fontSize: 9, fontWeight: 700, color: C.text }}>★ Theeram pick</span>
          </div>
        )}

        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 14px 0' }}>
          <div style={{ width: 8, height: 1, background: C.terra }}/>
          <span style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em' }}>{cat.ml} · {cat.en.toUpperCase()}</span>
        </div>

        {/* Visual categories: photo grid. Stat categories: single banner + stat row */}
        {isVisual ? (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 3, padding: '10px 14px', height: 140 }}>
            <div style={{ gridRow: 'span 2', background: C.green, position: 'relative', overflow: 'hidden' }}>
              {photos[0] && <img src={photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
            </div>
            <div style={{ background: '#8A7040', position: 'relative', overflow: 'hidden' }}>
              {photos[1] && <img src={photos[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
            </div>
            <div style={{ background: C.green2, position: 'relative', overflow: 'hidden' }}>
              {photos[2] && <img src={photos[2]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
            </div>
          </div>
        ) : (
          <>
            <div style={{ height: 110, background: '#7B3B2A', position: 'relative', margin: '10px 14px 0', overflow: 'hidden' }}>
              {photos[0] && <img src={photos[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>}
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

        <div style={{ padding: '10px 14px 14px' }}>
          <div style={{ ...serif, fontSize: 18, color: C.text, marginBottom: 3 }}>{maker.name}</div>
          <div style={{ ...sans, fontSize: 11, color: C.muted, fontWeight: 300, marginBottom: 10, lineHeight: 1.5 }}>{maker.tagline}</div>

          {chips.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const, marginBottom: 10 }}>
              {chips.map(ch => <span key={ch} style={{ ...sans, fontSize: 10, color: C.muted, background: '#F0EBE0', padding: '3px 9px', border: `1px solid ${C.cream3}`, fontWeight: 300 }}>{ch}</span>)}
            </div>
          )}

          {maker.instagram_url && (
            <a href={maker.instagram_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: '8px 10px', background: '#fdf0eb', borderRadius: 6, textDecoration: 'none' }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', flexShrink: 0 }}/>
              <span style={{ ...sans, fontSize: 11, color: C.terra, fontWeight: 500 }}>{maker.instagram_url.replace(/https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '')}</span>
              <span style={{ ...sans, fontSize: 9, color: C.terra, marginLeft: 'auto' }}>View work →</span>
            </a>
          )}

          <div style={{ width: '100%', height: 1, background: C.cream3, marginBottom: 10 }}/>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ ...sans, fontSize: 14, fontWeight: 600, color: C.text }}>{maker.price_guide || 'Contact for pricing'}</div>
            </div>
            <button
              onClick={handleContact}
              style={{
                ...sans, background: C.green, color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const,
                padding: '9px 13px', border: 'none', cursor: 'pointer',
                boxShadow: maker.is_featured ? undefined : '0 3px 10px rgba(28,58,43,.25)',
                animation: maker.is_featured ? 'makerPickPulse 1.8s ease-in-out infinite' : 'none',
              }}>
              Contact owner
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <GratitudeModal
          propertyName={maker.name}
          whatsappUrl={waUrl}
          reviewUrl="https://g.page/r/Cav0otb1aGpEEBM/review"
          upiUrl="upi://pay?pa=smm0794@okhdfcbank&pn=Theeram&tn=Theeram+chai"
          onClose={() => setShowModal(false)}
        />
      )}

      <style>{`
        @keyframes makerPickPulse {
          0%,100% { transform: scale(1); box-shadow: 0 3px 10px rgba(28,58,43,.3); }
          50% { transform: scale(1.045); box-shadow: 0 6px 22px rgba(45,122,79,.6); }
        }
      `}</style>
    </>
  )
}
