'use client'

import { useState } from 'react'
import Link from 'next/link'
import { C, display, sans } from '@/lib/design'

interface Props {
  sticky?: boolean
  minimal?: boolean
}

export default function Header({ sticky = true, minimal = false }: Props) {
  const [open, setOpen] = useState(false)

  if (minimal) {
    return <div style={{ height: 4, background: C.lime }} />
  }

  return (
    <>
      <div style={{ height: 3, background: C.green }} />

      <header style={{
        background: 'rgba(244, 245, 243, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: `1px solid ${C.cream3}`,
        padding: '12px 16px',
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg viewBox="0 0 28 28" fill="none" width={20} height={20}>
                <path d="M5 17C8.5 11 12.5 11 14 14C15.5 17 19.5 17 23 11" stroke={C.lime} strokeWidth={2.6} strokeLinecap="round" />
                <path d="M5 11.5C8.5 5.5 12.5 5.5 14 8.5C15.5 11.5 19.5 11.5 23 5.5" stroke={C.gold} strokeWidth={2.2} strokeLinecap="round" opacity=".9" />
                <circle cx="14" cy="21.5" r="2" fill={C.lime} />
              </svg>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{ ...display, fontSize: 20, fontWeight: 900, color: C.dark, letterSpacing: '-0.03em' }}>theeram</span>
              <span style={{ ...sans, fontSize: 11, fontWeight: 500, color: C.muted }}>തീരം</span>
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/list" style={{
              ...sans,
              fontSize: 11,
              fontWeight: 700,
              background: C.dark,
              color: 'white',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: 999,
              whiteSpace: 'nowrap',
            }}>
              + List your space
            </Link>

            <button onClick={() => setOpen(v => !v)} aria-label="Menu" style={{
              background: 'white',
              border: `1px solid ${C.cream3}`,
              borderRadius: 10,
              cursor: 'pointer',
              padding: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {open ? (
                <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke={C.dark} strokeWidth={1.8} strokeLinecap="round">
                  <path d="M5 5l10 10M15 5L5 15" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke={C.dark} strokeWidth={1.8} strokeLinecap="round">
                  <line x1="3" y1="6" x2="17" y2="6" /><line x1="3" y1="10" x2="17" y2="10" /><line x1="3" y1="14" x2="17" y2="14" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}`, padding: '12px 20px 18px', position: sticky ? 'sticky' : 'relative', top: sticky ? 61 : undefined, zIndex: 49 }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
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
                style={{
                  ...sans,
                  fontSize: 14,
                  color: C.dark,
                  textDecoration: 'none',
                  fontWeight: note ? 500 : 600,
                  padding: '12px 0',
                  borderBottom: i < 4 ? `1px solid ${C.cream3}` : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{label}</span>
                {note && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.green,
                    background: C.limePill,
                    letterSpacing: '.06em',
                    borderRadius: 999,
                    padding: '3px 10px',
                    textTransform: 'uppercase',
                  }}>
                    {note}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
