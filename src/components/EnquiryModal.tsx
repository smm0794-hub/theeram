'use client'

import { useEffect, useRef, useState } from 'react'
import { C, sans, serif } from '@/lib/design'

export interface EnquiryDetails {
  date: string | null // ISO yyyy-mm-dd, or null when flexible
  pax: number
  occasion?: string | null // optional 1-tap event type
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const OCCASION_PRESETS = [
  { id: 'wedding', label: 'Wedding / Engagement' },
  { id: 'baptism', label: 'Baptism / Communion' },
  { id: 'family_gathering', label: 'Family Gathering' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'staycation', label: 'Staycation' },
  { id: 'corporate', label: 'Corporate / Retreat' },
]

export function buildEnquiryMessage(propertyName: string, details?: EnquiryDetails) {
  const lines = [`Hi! I found ${propertyName} on Theeram (theeramspaces.in) and I'm interested in booking.`]
  if (details) {
    lines.push('')
    if (details.occasion) {
      const occLabel = OCCASION_PRESETS.find(o => o.id === details.occasion)?.label ?? details.occasion
      lines.push(`✨ Occasion: ${occLabel}`)
    }
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ ...serif, fontSize: 10.5, fontWeight: 900, color: C.limeDark }}>&gt;&gt;</span>
      <span style={{ ...sans, fontSize: 10.5, fontWeight: 700, color: C.green, letterSpacing: '.08em', textTransform: 'uppercase' }}>{ml} · {en}</span>
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
  const [occasion, setOccasion] = useState<string | null>(null)
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
    onSubmit({ date: flexible ? null : date, pax: paxNum, occasion })
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

        {/* Header — Olive Garden + concentric octagon motif */}
        <div style={{ background: C.green, padding: '22px 22px 20px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ position: 'absolute', right: -30, top: -30, opacity: .09, pointerEvents: 'none' }}>
            <svg viewBox="0 0 200 200" fill="none" width={150} height={150}>
              <polygon points="100,10 163,36 190,100 163,163 100,190 36,163 10,100 36,36" stroke="white" strokeWidth={1}/>
              <polygon points="100,35 145,54 165,100 145,145 100,165 54,145 35,100 54,54" stroke="white" strokeWidth={1}/>
              <polygon points="100,60 128,72 140,100 128,128 100,140 72,128 60,100 72,72" stroke={C.lime} strokeWidth={1.2}/>
            </svg>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <svg viewBox="0 0 20 20" fill="none" width={14} height={14} stroke="white" strokeWidth={1.6} strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
          </button>

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10, background: C.limePill, color: C.dark, padding: '3px 10px', borderRadius: 999 }}>
              <span style={{ ...sans, fontSize: 10, fontWeight: 700, letterSpacing: '.06em' }}>അന്വേഷണം · DIRECT ENQUIRY</span>
            </div>
            <div style={{ ...serif, fontSize: 22, color: 'white', fontWeight: 800, lineHeight: 1.2, paddingRight: 36 }}>{propertyName}</div>
            <div style={{ width: 34, height: 3, background: C.lime, margin: '12px 0', borderRadius: 2 }}/>
            <div style={{ ...sans, fontSize: 12.5, color: 'rgba(255,255,255,.78)', fontWeight: 400, lineHeight: 1.6 }}>
              Two quick details so the owner can reply with exact availability &amp; price.
            </div>
          </div>
        </div>

        <div className="enq-scroll" style={{ padding: '20px 0 22px', overflowY: 'auto' }}>
          {/* Optional 1-tap occasion */}
          <div style={{ padding: '0 20px' }}>
            <Label ml="ചടങ്ങ്" en="Occasion (optional)"/>
          </div>
          <div className="enq-scroll" style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '0 20px 16px' }}>
            {OCCASION_PRESETS.map(o => {
              const active = occasion === o.id
              return (
                <button key={o.id} type="button" onClick={() => setOccasion(active ? null : o.id)} className="enq-chip"
                  style={{
                    flexShrink: 0, cursor: 'pointer',
                    background: active ? C.dark : 'white',
                    border: active ? `1.5px solid ${C.dark}` : `1px solid ${C.cream3}`,
                    borderRadius: 999, padding: '7px 14px',
                    ...sans, fontSize: 11.5, color: active ? C.lime : C.text, fontWeight: active ? 700 : 500,
                  }}>
                  {o.label}
                </button>
              )
            })}
          </div>

          {/* Date */}
          <div style={{ padding: '0 20px' }}>
            <Label ml="തീയതി" en="Tentative date"/>
            <input type="date" min={minDate} value={date} disabled={flexible}
              onChange={e => setDate(e.target.value)}
              style={{ ...field(touched && !dateOk), opacity: flexible ? .5 : 1 }}/>
            <label style={{ ...sans, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.muted, marginTop: 10, cursor: 'pointer', userSelect: 'none', fontWeight: 400 }}>
              <input type="checkbox" checked={flexible} onChange={e => setFlexible(e.target.checked)} style={{ accentColor: C.green, width: 15, height: 15, margin: 0 }}/>
              Dates not fixed yet / flexible
            </label>
            {touched && !dateOk && <div style={hint}>Pick a date or tick “flexible”.</div>}
          </div>

          {/* Guests */}
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
                    background: active ? C.mintTint : 'white',
                    border: active ? `1.5px solid ${C.green}` : `1px solid ${C.cream3}`,
                    borderRadius: 12, padding: '10px 12px',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <span style={{ ...sans, fontSize: 9, fontWeight: 700, color: C.limeDark, letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{p.ml}</span>
                  </div>
                  <div style={{ ...serif, fontSize: 17, fontWeight: 800, color: C.text, lineHeight: 1.1 }}>{p.n}{p.n === 500 ? '+' : ''}</div>
                  <div style={{ ...sans, fontSize: 10.5, color: C.muted, fontWeight: 400 }}>{p.desc}</div>
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
              ...serif, width: '100%', height: 48, marginTop: 22, borderRadius: 14, border: 'none', cursor: 'pointer',
              background: C.lime, color: C.dark, fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(17,18,17,.12)',
            }}>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z"/></svg>
              Send on WhatsApp
            </button>
            {onSkip && (
              <button type="button" onClick={onSkip} style={{
                ...sans, width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                padding: '11px 8px 2px', fontSize: 11.5, color: C.green, textDecoration: 'underline', fontWeight: 600,
              }}>
                Just have a quick question? Open WhatsApp directly →
              </button>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 14, marginTop: 10 }}>
              {['Straight to owner', 'No commission', 'No login'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.limeDark }}/>
                  <span style={{ ...sans, fontSize: 10.5, color: C.muted, fontWeight: 500 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
