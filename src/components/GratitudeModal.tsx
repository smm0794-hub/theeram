'use client'

import { useEffect, useRef } from 'react'

const C = {
  green: '#1C3A2B', cream: '#F5F0E8', cream2: '#EDE8DC', cream3: '#E5DFD0',
  gold: '#C9A84C', terra: '#9B3D1E', text: '#1C1C1A', muted: '#6B5E4E',
  wa: '#25D366',
}
const sans = { fontFamily: 'system-ui, sans-serif' } as const
const serif = { fontFamily: 'Georgia, serif' } as const

interface GratitudeModalProps {
  propertyName: string
  whatsappUrl: string
  reviewUrl?: string
  upiUrl?: string
  onClose: () => void
}

// Post-enquiry gratitude sheet — shown *after* WhatsApp has already been opened
// synchronously on the visitor's tap. Zero artificial delay.
export default function GratitudeModal({ propertyName, whatsappUrl, reviewUrl, upiUrl, onClose }: GratitudeModalProps) {
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: 0,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.cream, width: '100%', maxWidth: 460,
        borderRadius: '24px 24px 0 0', overflow: 'hidden',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{ background: C.green, padding: '24px 24px 22px', textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: 'rgba(37,211,102,0.18)',
            color: C.wa, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, marginBottom: 10,
          }}>✓</div>
          <p style={{ ...sans, fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 4px', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            Connected on WhatsApp
          </p>
          <p style={{ ...serif, fontSize: 20, color: C.gold, margin: 0, fontWeight: 400, lineHeight: 1.3 }}>
            {propertyName}
          </p>
          <p style={{ ...sans, fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '8px 0 0', fontWeight: 300 }}>
            Didn’t open?{' '}
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.gold, textDecoration: 'underline' }}>
              Tap here to open WhatsApp
            </a>
          </p>
        </div>

        <div style={{ padding: '22px 24px 26px' }}>
          <p style={{ ...serif, fontSize: 16, color: C.text, textAlign: 'center', margin: '0 0 4px', fontWeight: 400 }}>
            Theeram is free, always.
          </p>
          <p style={{ ...sans, fontSize: 12, color: C.muted, textAlign: 'center', fontWeight: 300, margin: '0 0 18px', lineHeight: 1.6 }}>
            If it helped you find the right place, you can leave a review or keep us going with a chai.
          </p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {upiUrl && (
              <a href={upiUrl} style={{
                flex: 1, background: C.green, color: 'white', textDecoration: 'none',
                ...sans, fontSize: 12, fontWeight: 500, padding: '12px 10px', borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                ☕ Buy us a chai
              </a>
            )}
            {reviewUrl && (
              <a href={reviewUrl} target="_blank" rel="noopener noreferrer" style={{
                flex: 1, background: 'white', border: `1px solid ${C.cream3}`, color: C.text, textDecoration: 'none',
                ...sans, fontSize: 12, fontWeight: 500, padding: '12px 10px', borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                ⭐ Leave a review
              </a>
            )}
          </div>

          <button onClick={onClose} style={{
            width: '100%', height: 42, borderRadius: 14,
            background: C.cream2, border: `1px solid ${C.cream3}`, cursor: 'pointer',
            ...sans, fontSize: 12, color: C.terra, fontWeight: 500,
          }}>
            ← Back to browsing
          </button>
        </div>
      </div>
    </div>
  )
}
