import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Theeram Spaces - Hand-curated Event Venues and Villas in Kerala'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#1C3A2B',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          color: '#FFFFFF',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: '2px solid #C9A84C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C9A84C',
              fontSize: 22,
            }}
          >
            ✦
          </div>
          <span style={{ fontSize: 24, letterSpacing: '0.14em', color: '#C9A84C', fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
            Theeram Spaces · Kerala
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 940 }}>
          <div style={{ fontSize: 64, lineHeight: 1.12, fontWeight: 400 }}>
            Event venues, heritage tharavadus &amp; villas across Kerala.
          </div>
          <div style={{ width: 64, height: 3, background: '#C9A84C' }} />
          <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.78)', fontFamily: 'sans-serif', lineHeight: 1.4 }}>
            Hand-curated spaces &amp; trusted local makers · No booking fees · Talk directly on WhatsApp
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 20, color: 'rgba(255,255,255,0.55)', fontFamily: 'sans-serif' }}>
          <span>www.theeramspaces.in</span>
          <span>Pala · Thodupuzha · Kanjirappally · Theekoy</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
