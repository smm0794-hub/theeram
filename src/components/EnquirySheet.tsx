'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { C, sans, serif } from '@/lib/design'

// Quick enquiry sheet — replaces the old GratitudeModal flow.
// Goals: zero artificial delay, a specific pre-filled WhatsApp message (so owners
// reply faster), a Call fallback for people who prefer the phone, and no money
// ask until *after* the visitor has actually reached the owner.

const EVENTS = [
  { id: 'wedding', label: 'Wedding' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'baptism', label: 'Baptism' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'family_gathering', label: 'Family get-together' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'staycation', label: 'Stay' },
]

const GUESTS = ['Under 50', '50–150', '150–300', '300+']

const REVIEW_URL = 'https://g.page/r/Cav0otb1aGpEEBM/review'
const UPI_URL = 'upi://pay?pa=smm0794@okhdfcbank&pn=Theeram&am=20&cu=INR&tn=Theeram+chai'

interface Props {
  property: { id: string; name: string; owner_whatsapp?: string | null }
  viewId?: string | null
  onClose: () => void
}

function formatDate(v: string): string {
  // v is YYYY-MM-DD from <input type="date">; build a local date to avoid TZ shifts
  const [y, m, d] = v.split('-').map(Number)
  if (!y || !m || !d) return v
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function buildEnquiryMessage(name: string, event?: string, date?: string, guests?: string): string {
  const evLabel = EVENTS.find(e => e.id === event)?.label.toLowerCase()
  let plan = ''
  if (evLabel || date || guests) {
    plan = `I'm planning ${evLabel ? `${/^[aeiou]/.test(evLabel) ? 'an' : 'a'} ${evLabel}` : 'an event'}`
    if (date) plan += ` on ${formatDate(date)}`
    if (guests) plan += ` for ${guests === 'Under 50' ? 'under 50' : `around ${guests}`} guests`
    plan += '.\n'
  }
  return `Hi! I found ${name} on Theeram (theeramspaces.in).\n${plan}Is it available${date ? ' on that date' : ''}, and what would the price be?`
}

export default function EnquirySheet({ property, viewId, onClose }: Props) {
  const [event, setEvent] = useState('')
  const [date, setDate] = useState('')
  const [guests, setGuests] = useState('')
  const [sent, setSent] = useState(false)

  const phone = (property.owner_whatsapp ?? '').replace(/\D/g, '')
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(buildEnquiryMessage(property.name, event, date, guests))}`
  const telUrl = `tel:+${phone}`

  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey) }
  }, [])

  function logInquiry() {
    // Fire-and-forget: never block the visitor on analytics
    supabase.from('inquiries').insert({
      property_id: property.id,
      event_type: event || 'general',
      ...(viewId ? { view_id: viewId } : {}),
    }).then(() => {}, () => {})
  }

  function openWhatsApp() {
    logInquiry()
    // Open synchronously inside the click handler so it isn't treated as a popup
    const w = window.open(waUrl, '_blank', 'noopener,noreferrer')
    if (!w) window.location.href = waUrl
    setSent(true)
  }

  function call() {
    logInquiry()
    window.location.href = telUrl
    setSent(true)
  }

  const chip = (active: boolean): React.CSSProperties => ({
    ...sans, fontSize: 12, padding: '8px 12px', cursor: 'pointer', borderRadius: 20,
    border: `1px solid ${active ? C.green : C.cream3}`,
    background: active ? C.green : 'white', color: active ? 'white' : C.text,
    transition: 'all .12s',
  })
  const label: React.CSSProperties = { ...sans, fontSize: 11, color: C.muted, letterSpacing: '.04em', margin: '0 0 8px' }

  return (
    <div onClick={onClose} role="dialog" aria-modal="true" aria-label={`Enquire at ${property.name}`}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <style>{`@keyframes sheetUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div onClick={e => e.stopPropagation()}
        style={{ background: C.cream, width: '100%', maxWidth: 520, maxHeight: '92vh', overflowY: 'auto', borderRadius: '16px 16px 0 0', padding: '18px 20px 24px', animation: 'sheetUp .22s ease-out', boxSizing: 'border-box' }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.cream3, margin: '0 auto 14px' }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <p style={{ ...sans, fontSize: 11, color: C.muted, margin: '0 0 2px' }}>{sent ? 'Enquiry sent to' : 'Enquire at'}</p>
            <p style={{ ...serif, fontSize: 20, color: C.text, margin: 0, lineHeight: 1.25 }}>{property.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: C.muted, fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {!sent ? (
          <>
            <p style={{ ...sans, fontSize: 12, color: C.muted, margin: '8px 0 18px', lineHeight: 1.5 }}>
              Talk to the owner directly. No commission. Add a few details for a faster, exact quote <span style={{ opacity: .7 }}>(all optional)</span>.
            </p>

            <p style={label}>OCCASION</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {EVENTS.map(e => (
                <button key={e.id} onClick={() => setEvent(v => v === e.id ? '' : e.id)} style={chip(event === e.id)}>{e.label}</button>
              ))}
            </div>

            <p style={label}>DATE</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              style={{ ...sans, width: '100%', boxSizing: 'border-box', border: `1px solid ${C.cream3}`, background: 'white', padding: '10px 12px', fontSize: 14, color: C.text, marginBottom: 16, borderRadius: 8 }}/>

            <p style={label}>GUESTS</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
              {GUESTS.map(g => (
                <button key={g} onClick={() => setGuests(v => v === g ? '' : g)} style={chip(guests === g)}>{g}</button>
              ))}
            </div>

            <button onClick={openWhatsApp} disabled={!phone}
              style={{ ...sans, width: '100%', height: 50, background: C.wa, color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: phone ? 1 : .5 }}>
              <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8 0-1.4.7-2 1-2.3.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1 1 2 1.3 2.3 1.4.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z"/></svg>
              Send on WhatsApp
            </button>
            <button onClick={call} disabled={!phone}
              style={{ ...sans, width: '100%', height: 46, marginTop: 10, background: 'white', color: C.green, border: `1px solid ${C.green}`, borderRadius: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.4 1.8.7 2.7a2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.6 2.7.7a2 2 0 011.7 2z"/></svg>
              Call the owner
            </button>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 6px' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.wa, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 20 20" width={14} height={14} fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M4 10l4 4 8-8"/></svg>
              </div>
              <p style={{ ...sans, fontSize: 14, color: C.text, margin: 0 }}>You're connected. The owner will reply to you directly.</p>
            </div>
            <p style={{ ...sans, fontSize: 12, color: C.muted, margin: '0 0 16px 38px' }}>
              Didn't open?{' '}
              <a href={waUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.terra }}>Try WhatsApp again</a>
              {' · '}
              <a href={telUrl} style={{ color: C.terra }}>Call instead</a>
            </p>

            <div style={{ height: 1, background: C.cream3, margin: '4px 0 14px' }}/>
            <p style={{ ...sans, fontSize: 12, color: C.muted, textAlign: 'center', margin: '0 0 10px' }}>Theeram is free. If it helped you, you can</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <a href={REVIEW_URL} target="_blank" rel="noopener noreferrer" style={{ ...sans, flex: 1, textAlign: 'center', fontSize: 12, color: C.text, border: `1px solid ${C.cream3}`, background: 'white', borderRadius: 8, padding: '10px 6px', textDecoration: 'none' }}>⭐ Leave a review</a>
              <a href={UPI_URL} style={{ ...sans, flex: 1, textAlign: 'center', fontSize: 12, color: C.text, border: `1px solid ${C.cream3}`, background: 'white', borderRadius: 8, padding: '10px 6px', textDecoration: 'none' }}>☕ Buy us a chai</a>
            </div>
            <button onClick={onClose} style={{ ...sans, width: '100%', height: 44, background: C.green, color: 'white', border: 'none', borderRadius: 10, fontSize: 13, cursor: 'pointer' }}>
              Keep browsing
            </button>
          </>
        )}
      </div>
    </div>
  )
}
