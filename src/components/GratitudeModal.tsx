'use client'

import { useEffect, useState } from 'react'
import { Property } from '@/lib/supabase'
import { C, sans, serif } from '@/lib/design'

interface Props {
  isOpen: boolean
  onClose: () => void
  property: Property
  eventType: string
  onWhatsApp: () => void
}

const STORAGE_KEY = 'theeram_coffee_done'
const RESET_DAYS = 7
const GOOGLE_REVIEW_URL = 'https://g.page/r/Cav0otb1aGpEEBM/review'

function hasPaidOrSkipped(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const { ts } = JSON.parse(raw)
    return (Date.now() - ts) / (1000 * 60 * 60 * 24) < RESET_DAYS
  } catch { return false }
}

function markDone() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now() })) } catch {}
}

type Stage = 'coffee' | 'thanked' | 'review'

export default function GratitudeModal({ isOpen, onClose, property, eventType, onWhatsApp }: Props) {
  const [stage, setStage] = useState<Stage>('coffee')
  const [skip, setSkip] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStage('coffee')
      const done = hasPaidOrSkipped()
      setSkip(done)
      if (done) { onWhatsApp(); onClose() }
    }
  }, [isOpen])

  if (!isOpen || skip) return null

  function handleUPI() {
    window.location.href = `upi://pay?pa=smm0794@okhdfcbank&pn=Theeram&am=20&cu=INR&tn=Theeram+coffee`
    markDone()
    setTimeout(() => setStage('thanked'), 800)
  }

  function proceedToWhatsApp() {
    markDone()
    onWhatsApp()
    onClose()
  }

  function handleSkip() {
    // Show Google review prompt instead of closing immediately
    setStage('review')
  }

  function handleReview() {
    window.open(GOOGLE_REVIEW_URL, '_blank')
    markDone()
    onWhatsApp()
    onClose()
  }

  function handleSkipReview() {
    markDone()
    onWhatsApp()
    onClose()
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 60,
    background: 'rgba(22,48,35,.78)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  }
  const card: React.CSSProperties = {
    background: 'white', width: 300, padding: '26px 22px',
    display: 'flex', flexDirection: 'column', gap: 14,
  }
  const divider = (label: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
      <span style={{ ...sans, fontSize: 10, color: C.muted }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
    </div>
  )

  // ── Thanked stage ─────────────────────────────────────────────────────────
  if (stage === 'thanked') return (
    <div style={overlay} onClick={proceedToWhatsApp}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...serif, fontSize: 36, color: C.gold, marginBottom: 12 }}>🪔</div>
          <h2 style={{ ...serif, fontSize: 20, color: C.text, fontWeight: 400, marginBottom: 10, lineHeight: 1.3 }}>Thank you for supporting Theeram.</h2>
          <p style={{ ...sans, fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 20, fontWeight: 300 }}>You are helping keep this little corner of Kerala independent and free.</p>
        </div>
        <button onClick={proceedToWhatsApp} style={{ ...sans, width: '100%', background: '#25D366', color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, padding: '13px 0', border: 'none', cursor: 'pointer' }}>
          Continue to WhatsApp →
        </button>
      </div>
    </div>
  )

  // ── Google review stage ───────────────────────────────────────────────────
  if (stage === 'review') return (
    <div style={overlay}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
          <span style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.1em', textTransform: 'uppercase' as const }}>One small favour</span>
          <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⭐</div>
          <h2 style={{ ...serif, fontSize: 18, color: C.text, fontWeight: 400, marginBottom: 8, lineHeight: 1.35 }}>Leave us a Google review?</h2>
          <p style={{ ...sans, fontSize: 12, color: C.muted, lineHeight: 1.7, fontWeight: 300 }}>It takes 30 seconds and helps other families in Kerala discover Theeram. That is worth more than a coffee.</p>
        </div>
        <button onClick={handleReview} style={{ ...sans, width: '100%', background: C.green, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, padding: '13px 0', border: 'none', cursor: 'pointer' }}>
          ⭐ Leave a Google review
        </button>
        <button onClick={proceedToWhatsApp} style={{ ...sans, fontSize: 11, color: '#25D366', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' as const, fontWeight: 600 }}>
          Continue to WhatsApp →
        </button>
        <button onClick={handleSkipReview} style={{ ...sans, fontSize: 11, color: C.muted, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' as const }}>
          Skip
        </button>
      </div>
    </div>
  )

  // ── Coffee stage (default) ────────────────────────────────────────────────
  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
          <span style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.1em', textTransform: 'uppercase' as const }}>You found your space</span>
          <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ ...serif, fontSize: 17, color: C.text, fontWeight: 400, lineHeight: 1.4, marginBottom: 4 }}>
            Buy Theeram a coffee
          </h2>
          <p style={{ ...sans, fontSize: 12, color: C.muted, fontWeight: 300 }}>Keep this directory free · ₹20</p>
        </div>

        {/* UPI pay button */}
        <button onClick={handleUPI} style={{ ...sans, width: '100%', background: 'linear-gradient(135deg,#5F259F,#8B3FC8)', color: 'white', fontSize: 13, fontWeight: 700, padding: '13px 0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg viewBox="0 0 20 20" fill="none" width={16} height={16}><rect width="20" height="20" rx="3" fill="rgba(255,255,255,.2)"/><path d="M10 3L5 12h4v2l7-9h-5V3z" fill="white"/></svg>
          Pay ₹20 with UPI
        </button>

        {/* QR toggle */}
        <QRToggle/>

        {divider('then')}

        <button onClick={proceedToWhatsApp} style={{ ...sans, width: '100%', background: '#25D366', color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, padding: '13px 0', border: 'none', cursor: 'pointer' }}>
          Continue to WhatsApp →
        </button>

        <button onClick={handleSkip} style={{ ...sans, fontSize: 11, color: C.muted, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' as const }}>
          Skip for now
        </button>
      </div>
    </div>
  )
}

function QRToggle() {
  const [show, setShow] = useState(false)
  return (
    <div style={{ textAlign: 'center' }}>
      <button onClick={() => setShow(v => !v)} style={{ ...sans, fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        {show ? 'Hide QR' : 'or scan QR instead'}
      </button>
      {show && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 88, height: 88, border: `1px solid ${C.cream3}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
            <img src="/upi-qr.png" alt="UPI QR" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display='none' }}/>
          </div>
          <p style={{ ...sans, fontSize: 10, color: C.muted }}>GPay · PhonePe · any UPI app</p>
        </div>
      )}
    </div>
  )
}
