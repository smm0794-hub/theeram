'use client'

import { useEffect, useRef } from 'react'
import { C, display, sans } from '@/lib/design'

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
      background: 'rgba(17, 18, 17, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: 0,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.cream, width: '100%', maxWidth: 460,
        borderRadius: '20px 44px 0 0', overflow: 'hidden',
        boxShadow: '0 -12px 40px rgba(0,0,0,0.22)',
      }}>
        <div style={{ background: C.green, padding: '26px 24px 22px', textAlign: 'center' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', background: C.limePill,
            color: C.green, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, marginBottom: 10,
          }}>✓</div>
          <p style={{ ...sans, fontSize: 10.5, fontWeight: 700, color: C.lime, margin: '0 0 4px', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            &gt;&gt; Connected on WhatsApp
          </p>
          <p style={{ ...display, fontSize: 20, color: 'white', margin: 0, fontWeight: 800, lineHeight: 1.25 }}>
            {propertyName}
          </p>
          <p style={{ ...sans, fontSize: 11.5, color: 'rgba(255,255,255,0.72)', margin: '8px 0 0', fontWeight: 400 }}>
            Didn’t open?{' '}
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.gold, textDecoration: 'underline', fontWeight: 600 }}>
              Tap here to open WhatsApp
            </a>
          </p>
        </div>

        <div style={{ padding: '22px 24px 26px', background: 'white' }}>
          <p style={{ ...display, fontSize: 16, color: C.text, textAlign: 'center', margin: '0 0 4px', fontWeight: 800 }}>
            Theeram is free, always.
          </p>
          <p style={{ ...sans, fontSize: 12.5, color: C.muted, textAlign: 'center', fontWeight: 400, margin: '0 0 18px', lineHeight: 1.6 }}>
            If it helped you find the right place, you can leave a review or keep us going with a chai.
          </p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {upiUrl && (
              <a href={upiUrl} style={{
                flex: 1, background: C.lime, color: C.dark, textDecoration: 'none',
                ...display, fontSize: 12, fontWeight: 800, padding: '12px 10px', borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                ☕ Buy us a chai
              </a>
            )}
            {reviewUrl && (
              <a href={reviewUrl} target="_blank" rel="noopener noreferrer" style={{
                flex: 1, background: C.butterSoft, border: `1px solid ${C.cream3}`, color: C.dark, textDecoration: 'none',
                ...display, fontSize: 12, fontWeight: 700, padding: '12px 10px', borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                ⭐ Leave a review
              </a>
            )}
          </div>

          <button onClick={onClose} style={{
            width: '100%', height: 42, borderRadius: 14,
            background: C.cream, border: `1px solid ${C.cream3}`, cursor: 'pointer',
            ...sans, fontSize: 12, color: C.dark, fontWeight: 600,
          }}>
            ← Back to browsing
          </button>
        </div>
      </div>
    </div>
  )
}
