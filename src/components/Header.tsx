'use client'

import { useState } from 'react'
import Link from 'next/link'
import { C, sans, serif } from '@/lib/design'

interface Props {
  sticky?: boolean
}

export default function Header({ sticky = true }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Top bar — theeram wordmark only; town pages render their own dynamic top bar */}
      <div style={{ background: C.green, padding: '6px 16px' }}>
        <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em' }}>തീരം · theeram</span>
      </div>

      {/* Main header */}
      <header style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}`, padding: '11px 16px', position: sticky ? 'sticky' : 'relative', top: 0, zIndex: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <div style={{ width: 33, height: 33, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg viewBox="0 0 20 20" fill="none" width={17} height={17}>
              <circle cx="10" cy="10" r="6" stroke={C.gold} strokeWidth={1}/>
              <path d="M10 6Q13 9 10 14Q7 9 10 6Z" fill={C.gold} opacity=".85"/>
            </svg>
          </div>
          <span style={{ ...serif, fontSize: 21, color: C.text, letterSpacing: '-.01em' }}>Theeram</span>
        </Link>
        <button onClick={() => setOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          {open ? (
            <svg viewBox="0 0 20 20" fill="none" width={20} height={20} stroke={C.text} strokeWidth={1.4} strokeLinecap="round">
              <path d="M5 5l10 10M15 5L5 15"/>
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="none" width={20} height={20} stroke={C.text} strokeWidth={1.4} strokeLinecap="round">
              <line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/>
            </svg>
          )}
        </button>
      </header>

      {/* Nav drawer */}
      {open && (
        <div style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}`, padding: '20px', display: 'flex', flexDirection: 'column', gap: 0, position: 'sticky', top: sticky ? 55 : undefined, zIndex: 49 }}>
          {[
            { label: 'Spaces', href: '/', note: null },
            { label: 'Makers', href: '/?tab=makers', note: null },
            { label: 'About', href: '/about', note: null },
            { label: 'List your space', href: '/list', note: 'Owner' },
            { label: 'List your service', href: '/join', note: 'Maker' },
          ].map(({ label, href, note }, i) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              style={{ ...sans, fontSize: 14, color: note ? C.muted : C.text, textDecoration: 'none', fontWeight: note ? 300 : 400, padding: '12px 0', borderBottom: i < 4 ? `1px solid ${C.cream3}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as React.CSSProperties}
            >
              {label}
              {note && <span style={{ fontSize: 10, color: C.terra, letterSpacing: '.06em', border: `1px solid ${C.terra}`, padding: '2px 7px' }}>{note}</span>}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
