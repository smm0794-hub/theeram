'use client'

import { useState } from 'react'
import Link from 'next/link'
import { C, sans, serif } from '@/lib/design'

interface Props {
  sticky?: boolean
  minimal?: boolean
}

export default function Header({ sticky = true, minimal = false }: Props) {
  const [open, setOpen] = useState(false)

  if (minimal) {
    return <div style={{ height: 3, background: C.green }}/>
  }

  return (
    <>
      <div style={{ height: 3, background: C.green }}/>

      <header style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}`, padding: '11px 16px', position: sticky ? 'sticky' : 'relative', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 20 20" fill="none" width={17} height={17}>
                <circle cx="10" cy="10" r="6" stroke={C.gold} strokeWidth={1}/>
                <path d="M10 6Q13 9 10 14Q7 9 10 6Z" fill={C.gold} opacity=".85"/>
              </svg>
            </div>
            <span style={{ ...serif, fontSize: 21, color: C.text, letterSpacing: '-.01em' }}>Theeram</span>
          </Link>
          <button onClick={() => setOpen(v => !v)} aria-label="Menu" style={{ background: C.cream2, border: `1px solid ${C.cream3}`, borderRadius: 10, cursor: 'pointer', padding: 6 }}>
            {open ? (
              <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke={C.text} strokeWidth={1.4} strokeLinecap="round">
                <path d="M5 5l10 10M15 5L5 15"/>
              </svg>
            ) : (
              <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke={C.text} strokeWidth={1.4} strokeLinecap="round">
                <line x1="3" y1="6" x2="17" y2="6"/><line x1="3" y1="10" x2="17" y2="10"/><line x1="3" y1="14" x2="17" y2="14"/>
              </svg>
            )}
          </button>
        </div>
      </header>

      {open && (
        <div style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}`, padding: '12px 20px 18px', position: 'sticky', top: sticky ? 57 : undefined, zIndex: 49 }}>
          <div style={{ maxWidth: 1020, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
            {[
              { label: 'Spaces', href: '/', note: null },
              { label: 'Makers', href: '/services', note: null },
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
                {note && <span style={{ fontSize: 10, color: C.terra, letterSpacing: '.06em', border: `1px solid ${C.terra}`, borderRadius: 999, padding: '2px 9px' }}>{note}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
