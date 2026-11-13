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

const PAX_PRESETS = [
  { n: 25, ml: 'ചെറുത്', desc: 'Intimate' },
  { n: 50, ml: 'കുടുംബം', desc: 'Family' },
  { n: 100, ml: 'ഒത്തുചേരൽ', desc: 'Gathering' },
  { n: 200, ml: 'ആഘോഷം', desc: 'Celebration' },
  { n: 300, ml: 'വലുത്', desc: 'Large' },
  { n: 500, ml: 'വിശാലം', desc: 'Grand' },
]

interface EnquiryModalProps {
  propertyName: string
  maxGuests?: number | null
  onSubmit: (details: EnquiryDetails) => void
  onSkip?: () => void
  onClose: () => void
}

function Label({ ml, en }: { ml: string; en: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
      <div style={{ width: 14, height: 1, background: C.terra, flexShrink: 0 }}/>
      <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>{ml} · {en}</span>
      <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
    </div>
  )
}

// Asks for tentative date + guest count, then hands off to WhatsApp.
// onSubmit is called directly from the button's click handler so window.open
// stays inside the user gesture and isn't blocked as a popup.
export default function EnquiryModal({ propertyName, maxGuests, onSubmit, onSkip, onClose }: EnquiryModalProps) {
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

  const field = (bad: boolean): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box', height: 44, borderRadius: 10,
    border: `1px solid ${bad ? C.terra : 'rgba(0,0,0,.11)'}`, background: 'rgba(255,255,255,.88)',
    padding: '0 14px', ...sans, fontSize: 13.5, color: C.text, fontWeight: 300, outline: 'none',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,.04)',
  })
  const hint = { ...sans, fontSize: 11, color: C.terra, marginTop: 6, fontWeight: 300 } as React.CSSProperties

  return (
    <div onClick={onClose} className="enq-backdrop" style={{
      position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15,15,13,0.5)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <style>{`
        @keyframes enqUp{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
        .enq-sheet{border-radius:20px 20px 0 0}
        @media (min-width:720px){.enq-backdrop{align-items:center !important;padding:24px}.enq-sheet{border-radius:20px}}
        .enq-chip{transition:all .15s}
        .enq-chip:active{transform:scale(.97)}
        .enq-scroll::-webkit-scrollbar{display:none}
      `}</style>

      <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Enquire about ${propertyName}`}
        className="enq-sheet"
        style={{
          background: C.cream, width: '100%', maxWidth: 460, overflow: 'hidden',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.18)', animation: 'enqUp .25s ease',
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        }}>

        {/* Header — same forest-green + concentric motif as the town hero */}
        <div style={{ background: C.green, padding: '22px 22px 20px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ position: 'absolute', right: -30, top: -30, opacity: .07, pointerEvents: 'none' }}>
            <svg viewBox="0 0 200 200" fill="none" width={150} height={150}>
              <circle cx="100" cy="100" r="90" stroke="white" strokeWidth={1}/>
              <circle cx="100" cy="100" r="60" stroke="white" strokeWidth={1}/>
              <circle cx="100" cy="100" r="30" stroke="white" strokeWidth={1}/>
              <line x1="10" y1="100" x2="190" y2="100" stroke="white" strokeWidth={1}/>
              <line x1="100" y1="10" x2="100" y2="190" stroke="white" strokeWidth={1}/>
            </svg>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,.08)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <svg viewBox="0 0 20 20" fill="none" width={14} height={14} stroke="white" strokeWidth={1.4} strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
          </button>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <div style={{ width: 15, height: 1, background: C.gold }}/>
              <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.08em' }}>അന്വേഷണം</span>
              <div style={{ width: 15, height: 1, background: C.gold }}/>
            </div>
            <div style={{ ...serif, fontSize: 22, color: 'white', fontWeight: 300, lineHeight: 1.2, paddingRight: 36 }}>{propertyName}</div>
            <div style={{ width: 34, height: 2, background: C.gold, margin: '12px 0' }}/>
            <div style={{ ...sans, fontSize: 12, color: 'rgba(255,255,255,.68)', fontWeight: 300, lineHeight: 1.6 }}>
              Two quick details so the owner can reply with exact availability &amp; price.
            </div>
          </div>
        </div>

        <div className="enq-scroll" style={{ padding: '20px 0 22px', overflowY: 'auto' }}>
          {/* Date */}
          <div style={{ padding: '0 20px' }}>
            <Label ml="തീയതി" en="Tentative date"/>
            <input type="date" min={minDate} value={date} disabled={flexible}
              onChange={e => setDate(e.target.value)}
              style={{ ...field(touched && !dateOk), opacity: flexible ? .5 : 1 }}/>
            <label style={{ ...sans, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.muted, marginTop: 10, cursor: 'pointer', userSelect: 'none', fontWeight: 300 }}>
              <input type="checkbox" checked={flexible} onChange={e => setFlexible(e.target.checked)} style={{ accentColor: C.green, width: 15, height: 15, margin: 0 }}/>
              Dates not fixed yet / flexible
            </label>
            {touched && !dateOk && <div style={hint}>Pick a date or tick “flexible”.</div>}
          </div>

          {/* Guests — chips styled like the "find by feel" filter cards */}
          <div style={{ padding: '22px 20px 0' }}>
            <Label ml="അതിഥികൾ" en="Number of guests"/>
          </div>
          <div className="enq-scroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 20px 12px' }}>
            {PAX_PRESETS.map(p => {
              const active = paxNum === p.n
              return (
                <button key={p.n} type="button" onClick={() => setPax(String(p.n))} className="enq-chip"
                  style={{
                    flexShrink: 0, minWidth: 92, textAlign: 'left', cursor: 'pointer',
                    background: active ? '#fdf0eb' : 'white',
                    border: active ? `1.5px solid ${C.terra}` : `1px solid ${C.cream3}`,
                    borderRadius: 12, padding: '10px 12px',
                    boxShadow: active ? '0 2px 8px rgba(155,61,30,.12)' : '0 1px 3px rgba(0,0,0,.04)',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <div style={{ width: 6, height: 1, background: C.terra }}/>
                    <span style={{ ...sans, fontSize: 8.5, color: C.terra, letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{p.ml}</span>
                  </div>
                  <div style={{ ...serif, fontSize: 17, color: C.text, lineHeight: 1.1 }}>{p.n}{p.n === 500 ? '+' : ''}</div>
                  <div style={{ ...sans, fontSize: 10.5, color: C.muted, fontWeight: 300 }}>{p.desc}</div>
                </button>
              )
            })}
          </div>
          <div style={{ padding: '0 20px' }}>
            <input type="number" inputMode="numeric" min={1} placeholder="Or type an approximate number, e.g. 150" value={pax}
              onChange={e => setPax(e.target.value)} style={field(touched && !paxOk)}/>
            {touched && !paxOk && <div style={hint}>Enter an approximate guest count.</div>}
            {overCapacity && (
              <div style={{ ...hint, color: C.muted }}>
                This space lists up to {maxGuests} guests — you can still ask the owner.
              </div>
            )}

            <button onClick={submit} className="enq-chip" style={{
              ...sans, width: '100%', height: 48, marginTop: 22, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: C.green, color: 'white', fontSize: 11.5, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 3px 10px rgba(28,58,43,.22)',
            }}>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z"/></svg>
              Send on WhatsApp
            </button>
            {onSkip && (
              <button type="button" onClick={onSkip} style={{
                ...sans, width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                padding: '11px 8px 2px', fontSize: 11.5, color: C.terra, textDecoration: 'underline', fontWeight: 400,
              }}>
                Just have a quick question? Open WhatsApp directly →
              </button>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
              {['Straight to owner', 'No commission', 'No login'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.gold }}/>
                  <span style={{ ...sans, fontSize: 10.5, color: C.muted, fontWeight: 300 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
