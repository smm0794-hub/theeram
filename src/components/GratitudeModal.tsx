'use client'

import { useEffect, useRef, useState } from 'react'

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

type Screen = 'connecting' | 'donate' | 'thankyou'

const STEPS = [
  { id: 0, label: 'Fetching owner details',  icon: 'M 8 10 L 18 10 M 8 14 L 18 14 M 8 18 L 14 18 M 6 6 L 20 6 L 20 22 L 4 22 L 4 6 Z', color: C.gold },
  { id: 1, label: 'Curating your enquiry',   icon: 'M 4 20 L 8 19 L 19 8 L 16 5 L 5 16 Z M 16 5 L 19 8', color: C.gold },
  { id: 2, label: 'Connecting to owner',     icon: 'M 9 12 L 15 12 M 12 9 L 15 12 L 12 15 M 5 8 C 5 8 3 10 3 12 C 3 14 5 16 5 16 M 19 8 C 19 8 21 10 21 12 C 21 14 19 16 19 16', color: C.gold },
  { id: 3, label: 'Opening WhatsApp',        icon: 'M 12 2 C 6.48 2 2 6.48 2 12 C 2 13.85 2.5 15.58 3.36 17.06 L 2 22 L 6.94 20.64 C 8.42 21.5 10.15 22 12 22 C 17.52 22 22 17.52 22 12 C 22 6.48 17.52 2 12 2 Z M 8.5 9 C 8.5 9 9 8 9.5 8 C 10 8 10.5 8.5 11 9.5 C 11.5 10.5 11 11 11 11.5 C 11 12 13 14 13.5 14 C 14 14 14.5 13.5 15 13.5 C 15.5 13.5 16 14 16 14.5 C 16 15 15 15.5 14.5 15.5 C 12 15.5 8.5 12 8.5 9 Z', color: C.wa },
]

const STEP_DURATION = 800
const STEP_GAP = 300
const CARD_APPEAR_AT_STEP = 2 // card slides in when step 3 activates

export default function GratitudeModal({ propertyName, whatsappUrl, reviewUrl, upiUrl, onClose }: GratitudeModalProps) {
  const [stepStates, setStepStates] = useState<('idle' | 'active' | 'done')[]>(['idle', 'idle', 'idle', 'idle'])
  const [cardVisible, setCardVisible] = useState(false)
  const [screen, setScreen] = useState<Screen>('connecting')
  const [hasPaid, setHasPaid] = useState(false)
  const timers = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    // Check if already donated
    try {
      if (localStorage.getItem('theeram_chai')) setHasPaid(true)
    } catch {}

    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    runSequence()
    return () => {
      document.body.style.overflow = ''
      timers.current.forEach(clearTimeout)
    }
  }, [])

  function addTimer(fn: () => void, delay: number) {
    const t = setTimeout(fn, delay)
    timers.current.push(t)
  }

  function activateStep(i: number) {
    setStepStates(prev => {
      const next = [...prev]
      next[i] = 'active'
      return next
    })
    addTimer(() => {
      setStepStates(prev => {
        const next = [...prev]
        next[i] = 'done'
        return next
      })
    }, STEP_DURATION)
  }

  function runSequence() {
    const t0 = 300
    const gap = STEP_DURATION + STEP_GAP

    addTimer(() => activateStep(0), t0)
    addTimer(() => activateStep(1), t0 + gap)
    addTimer(() => {
      activateStep(2)
      addTimer(() => setCardVisible(true), 200)
    }, t0 + gap * 2)
    addTimer(() => {
      activateStep(3)
      // Open WhatsApp 150ms after last tick
      addTimer(() => {
        try { window.location.href = whatsappUrl } catch {}
        setScreen('donate')
      }, STEP_DURATION + 1500)
    }, t0 + gap * 3)
  }

  function handleChai() {
    try {
      localStorage.setItem('theeram_chai', '1')
      setHasPaid(true)
    } catch {}
    if (upiUrl) {
      try { window.open(upiUrl, '_blank') } catch {}
    }
    setScreen('thankyou')
  }

  function handleReview() {
    if (reviewUrl) {
      try { window.open(reviewUrl, '_blank') } catch {}
    }
    setScreen('thankyou')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: C.cream,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* Green top — connecting section */}
      <div style={{ background: C.green, padding: '36px 28px 36px', flexShrink: 0 }}>
        <p style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', margin: '0 0 18px', textAlign: 'center' }}>
          തീരം · theeram
        </p>
        <p style={{ ...serif, fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: '0 0 5px', fontWeight: 300 }}>
          Connecting you to
        </p>
        <p style={{ ...serif, fontSize: 20, color: C.gold, textAlign: 'center', margin: 0, fontWeight: 300, lineHeight: 1.3 }}>
          {propertyName}
        </p>

        {/* Steps */}
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 15 }}>
          {STEPS.map((step, i) => {
            const state = stepStates[i]
            const isActive = state === 'active'
            const isDone = state === 'done'
            const ringColor = step.color
            const circumference = 69.1

            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, opacity: state === 'idle' ? 0.25 : 1, transition: 'opacity 0.3s' }}>
                {/* Animated circle */}
                <div style={{ position: 'relative', width: 28, height: 28, flexShrink: 0 }}>
                  <svg width="28" height="28" viewBox="0 0 28 28">
                    {/* Track */}
                    <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                    {/* Progress ring */}
                    <circle
                      cx="14" cy="14" r="11" fill="none"
                      stroke={ringColor} strokeWidth="1.5"
                      strokeDasharray={circumference}
                      strokeDashoffset={isActive || isDone ? 0 : circumference}
                      strokeLinecap="round"
                      transform="rotate(-90 14 14)"
                      style={{ transition: isActive || isDone ? 'stroke-dashoffset 0.62s ease' : 'none' }}
                    />
                    {/* Fill on done */}
                    <circle cx="14" cy="14" r="11" fill={ringColor} opacity={isDone ? 1 : 0} style={{ transition: 'opacity 0.18s' }}/>
                    {/* Tick on done */}
                    <path
                      d="M8.5 14l3.5 3.5L19.5 10"
                      stroke="white" strokeWidth="1.8" fill="none"
                      strokeLinecap="round" strokeLinejoin="round"
                      opacity={isDone ? 1 : 0}
                      style={{ transition: 'opacity 0.18s' }}
                    />
                    {/* Icon when not done */}
                    {!isDone && (
                      <path
                        d={step.icon}
                        stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" fill="none"
                        strokeLinecap="round" strokeLinejoin="round"
                        transform="scale(0.52) translate(13.5, 13.5)"
                        style={{ opacity: isDone ? 0 : 1, transition: 'opacity 0.18s' }}
                      />
                    )}
                  </svg>
                  {/* Simple emoji icon fallback */}
                  {!isDone && (
                    <span style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: 11,
                      opacity: isDone ? 0 : 1,
                      transition: 'opacity 0.18s',
                      pointerEvents: 'none',
                    }}>
                      {i === 0 ? '📋' : i === 1 ? '✏️' : i === 2 ? '🔗' : '💬'}
                    </span>
                  )}
                </div>

                <p style={{
                  ...sans, fontSize: 13, margin: 0, fontWeight: 300,
                  color: isDone ? 'rgba(255,255,255,0.95)' : isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
                  transition: 'color 0.3s',
                }}>
                  {step.label}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cream bottom — donation section */}
      <div style={{
        padding: '24px 24px 36px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        opacity: cardVisible ? 1 : 0,
        transform: cardVisible ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 0.45s, transform 0.45s',
      }}>

        {/* Default — donate state */}
        {screen !== 'thankyou' && (
          <>
            <div>
              <p style={{ ...serif, fontSize: 15, color: C.text, textAlign: 'center', margin: '0 0 4px', fontWeight: 300 }}>
                Theeram is free, always.
              </p>
              <p style={{ ...sans, fontSize: 12, color: C.muted, textAlign: 'center', fontWeight: 300, margin: '0 0 20px', lineHeight: 1.65 }}>
                If it helped, keep us going<br/>with a chai.
              </p>

              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button
                  onClick={handleChai}
                  style={{
                    flex: 1, background: C.green, border: 'none', color: 'white',
                    ...sans, fontSize: 13, padding: '13px 8px', borderRadius: 10,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  ☕ Buy us a chai
                </button>
                <button
                  onClick={handleReview}
                  style={{
                    flex: 1, background: 'transparent', border: `1px solid ${C.cream3}`, color: C.muted,
                    ...sans, fontSize: 13, padding: '13px 8px', borderRadius: 10,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                  ⭐ Leave a review
                </button>
              </div>

              <p style={{ ...sans, fontSize: 11, color: '#C4BAB0', textAlign: 'center', margin: 0 }}>
                Either way, thank you.
              </p>
            </div>

            <div>
              <div style={{ width: '100%', height: 1, background: C.cream3, margin: '20px 0' }}/>
              <button
                onClick={onClose}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  ...sans, fontSize: 12, color: C.terra,
                  display: 'flex', alignItems: 'center', gap: 5, margin: '0 auto',
                }}>
                ← Back to listings
              </button>
            </div>
          </>
        )}

        {/* Thank you state */}
        {screen === 'thankyou' && (
          <div style={{ textAlign: 'center', paddingTop: 16 }}>
            <div style={{ fontSize: 34, marginBottom: 14, display: 'inline-block', animation: 'heartbeat 1s ease-in-out infinite' }}>
              ❤️
            </div>
            <p style={{ ...serif, fontSize: 18, color: C.green, margin: '0 0 8px', fontWeight: 300 }}>
              Thank you.
            </p>
            <p style={{ ...sans, fontSize: 13, color: C.muted, fontWeight: 300, margin: '0 0 32px', lineHeight: 1.7 }}>
              You're helping keep Theeram<br/>free for everyone.
            </p>

            <div style={{ width: '100%', height: 1, background: C.cream3, margin: '0 0 20px' }}/>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                ...sans, fontSize: 12, color: C.terra,
                display: 'flex', alignItems: 'center', gap: 5, margin: '0 auto',
              }}>
              ← Back to listings
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes heartbeat {
          0%   { transform: scale(1); }
          14%  { transform: scale(1.28); }
          28%  { transform: scale(1); }
          42%  { transform: scale(1.18); }
          56%  { transform: scale(1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
