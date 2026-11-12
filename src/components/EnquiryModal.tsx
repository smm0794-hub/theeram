'use client'

import { useEffect, useRef, useState } from 'react'
import { C, sans, serif } from '@/lib/design'

export interface EnquiryDetails {
  date: string | null // ISO yyyy-mm-dd, or null when flexible
  pax: number
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export function buildEnquiryMessage(propertyName: string, details?: EnquiryDetails) {
  const lines = [`Hi! I found ${propertyName} on Theeram (theeramspaces.in) and I'm interested in booking.`]
  if (details) {
    lines.push('')
    lines.push(`📅 Tentative date: ${details.date ? formatDate(details.date) : 'Flexible / not fixed yet'}`)
    lines.push(`👥 Guests: approx. ${details.pax}`)
  }
  lines.push('')
  lines.push('Could you share availability and pricing?')
  return lines.join('\n')
}

export function buildEnquiryWaUrl(phone: string | null | undefined, propertyName: string, details?: EnquiryDetails) {
  const digits = (phone ?? '').replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(buildEnquiryMessage(propertyName, details))}`
}

// Open WhatsApp in a new tab; fall back to same-tab navigation only if the popup was blocked.
// (Passing 'noopener' as a feature makes window.open always return null, so we null the opener manually.)
export function openWhatsApp(url: string) {
  const w = window.open(url, '_blank')
  if (w) { try { w.opener = null } catch {} }
  else window.location.href = url
}

const PAX_PRESETS = [25, 50, 100, 200, 300, 500]

interface EnquiryModalProps {
  propertyName: string
  maxGuests?: number | null
  onSubmit: (details: EnquiryDetails) => void
  onClose: () => void
}

// Asks for tentative date + guest count, then hands off to WhatsApp.
// onSubmit is called directly from the button's click handler so window.open
// stays inside the user gesture and isn't blocked as a popup.
export default function EnquiryModal({ propertyName, maxGuests, onSubmit, onClose }: EnquiryModalProps) {
  const [date, setDate] = useState('')
  const [flexible, setFlexible] = useState(false)
  const [pax, setPax] = useState('')
  const [touched, setTouched] = useState(false)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  const today = new Date()
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const paxNum = parseInt(pax, 10)
  const dateOk = flexible || !!date
  const paxOk = !isNaN(paxNum) && paxNum > 0
  const overCapacity = paxOk && !!maxGuests && paxNum > maxGuests

  function submit() {
    setTouched(true)
    if (!dateOk || !paxOk) return
    onSubmit({ date: flexible ? null : date, pax: paxNum })
  }

  const label = { ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em', textTransform: 'uppercase' as const, marginBottom: 8, display: 'block' }
  const input = (bad: boolean) => ({
    width: '100%', boxSizing: 'border-box' as const, height: 46, borderRadius: 12,
    border: `1px solid ${bad ? C.terra : C.cream3}`, background: 'white', padding: '0 14px',
    ...sans, fontSize: 14, color: C.text, outline: 'none',
  })

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Enquire about ${propertyName}`} style={{
        background: C.cream, width: '100%', maxWidth: 460, borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.18)', overflow: 'hidden',
        animation: 'enqUp .25s ease',
      }}>
        <style>{`@keyframes enqUp{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}`}</style>

        <div style={{ background: C.green, padding: '20px 22px 18px', position: 'relative' }}>
          <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 20 20" fill="none" width={14} height={14} stroke="white" strokeWidth={1.8} strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 12, height: 1, background: C.gold }}/>
            <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.08em' }}>അന്വേഷണം · ENQUIRY</span>
          </div>
          <div style={{ ...serif, fontSize: 20, color: 'white', fontWeight: 300, lineHeight: 1.25, paddingRight: 36 }}>{propertyName}</div>
          <div style={{ ...sans, fontSize: 11.5, color: 'rgba(255,255,255,.65)', fontWeight: 300, marginTop: 6 }}>
            Two quick details so the owner can reply with exact availability &amp; price.
          </div>
        </div>

        <div style={{ padding: '20px 22px 24px' }}>
          {/* Date */}
          <span style={label}>Tentative date</span>
          <input type="date" min={minDate} value={date} disabled={flexible}
            onChange={e => setDate(e.target.value)}
            style={{ ...input(touched && !dateOk), opacity: flexible ? .5 : 1 }}/>
          <label style={{ ...sans, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.muted, marginTop: 10, cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={flexible} onChange={e => setFlexible(e.target.checked)} style={{ accentColor: C.green, width: 16, height: 16 }}/>
            Dates not fixed yet / flexible
          </label>
          {touched && !dateOk && <div style={{ ...sans, fontSize: 11, color: C.terra, marginTop: 6 }}>Pick a date or tick “flexible”.</div>}

          {/* Pax */}
          <span style={{ ...label, marginTop: 20 }}>Number of guests</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {PAX_PRESETS.map(n => {
              const active = paxNum === n
              return (
                <button key={n} type="button" onClick={() => setPax(String(n))}
                  style={{
                    ...sans, fontSize: 12, padding: '7px 13px', borderRadius: 10, cursor: 'pointer',
                    border: `1px solid ${active ? C.green : C.cream3}`,
                    background: active ? C.green : 'white', color: active ? 'white' : C.text,
                  }}>
                  {n}{n === 500 ? '+' : ''}
                </button>
              )
            })}
          </div>
          <input type="number" inputMode="numeric" min={1} placeholder="Or type a number, e.g. 150" value={pax}
            onChange={e => setPax(e.target.value)} style={input(touched && !paxOk)}/>
          {touched && !paxOk && <div style={{ ...sans, fontSize: 11, color: C.terra, marginTop: 6 }}>Enter an approximate guest count.</div>}
          {overCapacity && (
            <div style={{ ...sans, fontSize: 11, color: C.muted, marginTop: 6 }}>
              Heads up: this space lists up to {maxGuests} guests. You can still ask the owner.
            </div>
          )}

          <button onClick={submit} style={{
            ...sans, width: '100%', height: 50, marginTop: 22, borderRadius: 14, border: 'none', cursor: 'pointer',
            background: C.green, color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 3px 10px rgba(28,58,43,.22)',
          }}>
            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z"/></svg>
            Send on WhatsApp
          </button>
          <div style={{ ...sans, fontSize: 10.5, color: C.muted, textAlign: 'center', marginTop: 10, fontWeight: 300 }}>
            Goes straight to the owner · No commission · No login
          </div>
        </div>
      </div>
    </div>
  )
}
