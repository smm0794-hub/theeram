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
const RESET_DAYS = 30

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

function QRToggle() {
  const [show, setShow] = useState(false)
  return (
    <div style={{ textAlign: 'center' }}>
      <button onClick={() => setShow(v => !v)} style={{ ...sans, fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        {show ? 'Hide QR' : 'or scan QR instead'}
      </button>
      {show && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 88, height: 88, border: `1px solid ${C.cream3}`, overflow: 'hidden' }}>
            <img src="/upi-qr.png" alt="UPI QR" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
          </div>
          <p style={{ ...sans, fontSize: 11, color: C.muted }}>GPay · PhonePe · any UPI app</p>
        </div>
      )}
    </div>
  )
}

export default function GratitudeModal({ isOpen, onClose, property, eventType, onWhatsApp }: Props) {
  const [skip, setSkip] = useState(false)
  const [thanked, setThanked] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const done = hasPaidOrSkipped()
      setSkip(done)
      if (done) { onWhatsApp(); onClose() }
    }
  }, [isOpen])

  if (!isOpen || skip) return null

  function handleUPI() {
    window.location.href = `upi://pay?pa=smm0794@okhdfcbank&pn=Theeram&am=20&cu=INR&tn=Theeram+coffee`
    markDone()
    setTimeout(() => setThanked(true), 800)
  }

  function proceed() { markDone(); onWhatsApp(); onClose() }

  if (thanked) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(22,48,35,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={proceed}>
      <div style={{ background: 'white', width: 300, padding: '32px 24px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ ...serif, fontSize: 32, color: C.gold, marginBottom: 12 }}>🪔</div>
        <h2 style={{ ...serif, fontSize: 20, color: C.text, fontWeight: 400, marginBottom: 10, lineHeight: 1.3 }}>Thank you for supporting Theeram.</h2>
        <p style={{ ...sans, fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>You're helping keep this little corner of Kerala independent and free.</p>
        <button onClick={proceed} style={{ ...sans, width: '100%', background: C.wa, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '13px 0', border: 'none', cursor: 'pointer' }}>Continue to WhatsApp</button>
      </div>
    </div>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(22,48,35,.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'white', width: 300, padding: '28px 22px', display: 'flex', flexDirection: 'column', gap: 14 }} onClick={e => e.stopPropagation()}>
        {/* Gold top rule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
          <span style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.1em', textTransform: 'uppercase' }}>You found your space</span>
          <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
        </div>

        <h2 style={{ ...serif, fontSize: 17, color: C.text, fontWeight: 400, lineHeight: 1.4, textAlign: 'center' }}>
          Buy Theeram a coffee<br/>
          <span style={{ ...sans, fontSize: 12, color: C.muted, fontWeight: 300 }}>Keep this directory free · ₹20</span>
        </h2>

        {/* UPI pay button */}
        <button onClick={handleUPI} style={{ ...sans, width: '100%', background: 'linear-gradient(135deg,#5F259F,#8B3FC8)', color: 'white', fontSize: 13, fontWeight: 700, padding: '13px 0', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg viewBox="0 0 20 20" fill="none" width={16} height={16}><rect width="20" height="20" rx="3" fill="rgba(255,255,255,.2)"/><path d="M10 3L5 12h4v2l7-9h-5V3z" fill="white"/></svg>
          Pay ₹20 with UPI
        </button>

        <QRToggle/>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
          <span style={{ ...sans, fontSize: 10, color: C.muted }}>then</span>
          <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
        </div>

        <button onClick={proceed} style={{ ...sans, width: '100%', background: C.wa, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '13px 0', border: 'none', cursor: 'pointer' }}>
          Continue to WhatsApp
        </button>

        <button onClick={proceed} style={{ ...sans, fontSize: 11, color: C.muted, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
          Skip for now
        </button>
      </div>
    </div>
  )
}
