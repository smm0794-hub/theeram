'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PROPERTY_TYPE_LABELS } from '@/lib/supabase'

const C = {
  green: '#1C3A2B', cream: '#F5F0E8', cream2: '#EDE8DC', cream3: '#E5DFD0',
  gold: '#C9A84C', terra: '#9B3D1E', text: '#1C1C1A', muted: '#6B5E4E',
}
const sans = { fontFamily: 'system-ui, sans-serif' } as const
const serif = { fontFamily: 'Georgia, serif' } as const

type View = 'login' | 'dashboard'

interface PropertySummary {
  id: string; name: string; slug: string; property_type: string
  is_active: boolean; is_featured: boolean; sort_order: number
  photos: string[]; created_at: string
}

export default function CuratorPage() {
  const [view, setView] = useState<View>('login')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  // On mount — try to load dashboard (session cookie may still be valid)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('expired') === '1') setSessionExpired(true)
    // Try loading properties — if 401, show login
    tryLoadDashboard()
  }, [])

  async function tryLoadDashboard() {
    setLoading(true)
    const r = await fetch('/api/properties?all=1')
    if (r.ok) {
      const { data } = await r.json()
      setProperties((data ?? []).sort((a: PropertySummary, b: PropertySummary) => (b.sort_order ?? 0) - (a.sort_order ?? 0)))
      setView('dashboard')
    }
    setLoading(false)
  }

  async function loadProperties() {
    const r = await fetch('/api/properties?all=1')
    if (r.ok) {
      const { data } = await r.json()
      setProperties((data ?? []).sort((a: PropertySummary, b: PropertySummary) => (b.sort_order ?? 0) - (a.sort_order ?? 0)))
    }
  }

  async function handleLogin() {
    setLoggingIn(true); setAuthError('')
    const r = await fetch('/api/curator-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
    if (r.ok) {
      setView('dashboard')
      setSessionExpired(false)
      loadProperties()
    } else {
      setAuthError('Incorrect password.')
    }
    setLoggingIn(false)
  }

  async function logout() {
    await fetch('/api/curator-logout', { method: 'POST' })
    setView('login'); setPassword(''); setProperties([])
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch('/api/properties', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: !current }) })
    setProperties(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
    showToast(current ? 'Hidden from public' : 'Now live!')
  }

  async function toggleFeatured(id: string, current: boolean) {
    await fetch('/api/properties', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_featured: !current }) })
    setProperties(prev => prev.map(p => p.id === id ? { ...p, is_featured: !current } : p))
    showToast(current ? "Removed Theeram pick" : "⭐ Theeram pick set!")
  }

  async function moveProperty(id: string, direction: 'up' | 'down') {
    const idx = properties.findIndex(p => p.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === properties.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const newProps = [...properties]
    ;[newProps[idx], newProps[swapIdx]] = [newProps[swapIdx], newProps[idx]]
    setProperties(newProps)
    // Assign sort_order based on position in array — highest index = highest sort_order = appears first
    const totalCount = newProps.length
    await Promise.all([
      fetch('/api/properties', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: newProps[idx].id, sort_order: totalCount - idx }) }),
      fetch('/api/properties', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: newProps[swapIdx].id, sort_order: totalCount - swapIdx }) }),
    ])
    showToast('Order updated')
  }

  async function deleteProperty(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch(`/api/properties?id=${id}`, { method: 'DELETE' })
    setProperties(prev => prev.filter(p => p.id !== id))
    showToast('Deleted')
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (view === 'login') return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ background: C.green, padding: '6px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em' }}>തീരം · theeram</span>
        <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.4)' }}>Curator</span>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, border: `2px solid ${C.terra}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg viewBox="0 0 20 20" fill="none" width={22} height={22}>
              <circle cx="10" cy="10" r="6" stroke={C.gold} strokeWidth={1}/>
              <path d="M10 6Q13 9 10 14Q7 9 10 6Z" fill={C.gold} opacity=".85"/>
            </svg>
          </div>
          <h1 style={{ ...serif, fontSize: 22, color: C.text, fontWeight: 400, marginBottom: 6 }}>Theeram Curator</h1>
          <p style={{ ...sans, fontSize: 13, color: C.muted, marginBottom: 28, fontWeight: 300 }}>Private access</p>

          {sessionExpired && !authError && (
            <div style={{ ...sans, fontSize: 12, color: C.muted, marginBottom: 16, background: C.cream2, padding: '10px 14px', border: `1px solid ${C.cream3}`, maxWidth: 280, textAlign: 'center' }}>
              Your session has expired. Please log in again.
            </div>
          )}

          <div style={{ width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Enter curator password"
              style={{ ...sans, border: `1px solid ${authError ? C.terra : C.cream3}`, padding: '12px 14px', fontSize: 14, background: C.cream, outline: 'none', color: C.text, width: '100%', boxSizing: 'border-box' as const }}
            />
            {authError && <p style={{ ...sans, fontSize: 12, color: C.terra }}>{authError}</p>}
            <button
              onClick={handleLogin}
              disabled={loggingIn}
              style={{ ...sans, background: C.green, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '13px 0', border: 'none', cursor: loggingIn ? 'not-allowed' : 'pointer', opacity: loggingIn ? .7 : 1 }}
            >
              {loggingIn ? 'Checking...' : 'Enter'}
            </button>
          </div>
          <Link href="/" style={{ ...sans, fontSize: 11, color: C.muted, textDecoration: 'none', marginTop: 24, borderBottom: `1px solid ${C.cream3}`, paddingBottom: 1 }}>← Back to site</Link>
        </div>
      )}
    </div>
  )

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: C.cream }}>
      {/* Top bar */}
      <div style={{ background: C.green, padding: '6px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em' }}>തീരം · theeram</span>
        <button onClick={logout} style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.4)', background: 'none', border: 'none', cursor: 'pointer' }}>Log out</button>
      </div>

      {/* Header */}
      <div style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}`, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
        <div>
          <span style={{ ...serif, fontSize: 20, color: C.text }}>Curator</span>
          <span style={{ ...sans, fontSize: 11, color: C.muted, marginLeft: 8 }}>{properties.filter(p => p.is_active).length} live · {properties.filter(p => !p.is_active).length} draft</span>
        </div>
        <Link href="/curator/new" style={{ ...sans, background: C.green, color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '8px 14px', textDecoration: 'none' }}>+ Add</Link>
      </div>

      {/* Quick links */}
      <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: '🤖 Agent', href: '/curator/agent' },
          { label: '✨ Makers', href: '/curator/vendors' },
          { label: '📊 Analytics', href: '/curator/analytics' },
          { label: '📬 Submissions', href: '/curator/submissions' },
        ].map(({ label, href }) => (
          <Link key={href} href={href} style={{ ...sans, textAlign: 'center', padding: '9px 0', border: `1px solid ${C.cream3}`, color: C.muted, fontSize: 11, fontWeight: 500, textDecoration: 'none', background: 'white' }}>
            {label}
          </Link>
        ))}
      </div>

      {/* Property list */}
      <div style={{ padding: '4px 16px 48px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          [1,2,3].map(i => <div key={i} style={{ height: 100, background: 'white', border: `1px solid ${C.cream3}` }}/>)
        ) : properties.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ ...sans, fontSize: 14, color: C.muted, marginBottom: 14 }}>No properties yet.</p>
            <Link href="/curator/new" style={{ ...sans, fontSize: 12, color: C.terra, textDecoration: 'underline' }}>Add your first listing</Link>
          </div>
        ) : properties.map((p, idx) => (
          <div key={p.id} style={{ background: 'white', border: p.is_featured ? `1.5px solid ${C.gold}` : `1px solid ${C.cream3}`, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ ...serif, fontSize: 16, color: C.text }}>{p.name}</span>
                  {p.is_featured && <span style={{ ...sans, fontSize: 9, background: C.gold, color: 'white', padding: '2px 6px', fontWeight: 700 }}>PICK</span>}
                </div>
                <span style={{ ...sans, fontSize: 11, color: C.muted }}>{PROPERTY_TYPE_LABELS[p.property_type as keyof typeof PROPERTY_TYPE_LABELS] ?? p.property_type}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span style={{ ...sans, fontSize: 10, fontWeight: 600, padding: '3px 8px', background: p.is_active ? '#f0faf4' : '#faf0eb', color: p.is_active ? '#2D7A4F' : C.muted }}>
                  {p.is_active ? 'Live' : 'Draft'}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => moveProperty(p.id, 'up')} disabled={idx === 0} style={{ width: 26, height: 26, border: `1px solid ${C.cream3}`, background: 'none', cursor: idx === 0 ? 'not-allowed' : 'pointer', fontSize: 12, color: idx === 0 ? C.cream3 : C.muted, opacity: idx === 0 ? .4 : 1 }}>↑</button>
                  <button onClick={() => moveProperty(p.id, 'down')} disabled={idx === properties.length - 1} style={{ width: 26, height: 26, border: `1px solid ${C.cream3}`, background: 'none', cursor: idx === properties.length - 1 ? 'not-allowed' : 'pointer', fontSize: 12, color: idx === properties.length - 1 ? C.cream3 : C.muted, opacity: idx === properties.length - 1 ? .4 : 1 }}>↓</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              <Link href={`/curator/edit/${p.slug}`} style={{ ...sans, fontSize: 11, border: `1px solid ${C.green}`, color: C.green, padding: '6px 12px', textDecoration: 'none', fontWeight: 500 }}>Edit</Link>
              <button onClick={() => toggleActive(p.id, p.is_active)} style={{ ...sans, fontSize: 11, border: `1px solid ${C.cream3}`, color: C.muted, padding: '6px 12px', background: 'none', cursor: 'pointer' }}>{p.is_active ? 'Hide' : 'Show'}</button>
              <button onClick={() => toggleFeatured(p.id, p.is_featured)} style={{ ...sans, fontSize: 11, border: `1px solid ${p.is_featured ? C.gold : C.cream3}`, color: p.is_featured ? C.gold : C.muted, padding: '6px 12px', background: 'none', cursor: 'pointer' }}>{p.is_featured ? '⭐ Unfeature' : '☆ Feature'}</button>
              <button onClick={() => deleteProperty(p.id, p.name)} style={{ ...sans, fontSize: 11, border: `1px solid ${C.terra}`, color: C.terra, padding: '6px 12px', background: 'none', cursor: 'pointer' }}>Delete</button>
              <Link href={`/property/${p.slug}`} target="_blank" style={{ ...sans, fontSize: 11, border: `1px solid ${C.cream3}`, color: C.muted, padding: '6px 12px', textDecoration: 'none' }}>View →</Link>
            </div>
          </div>
        ))}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.green, color: 'white', ...sans, fontSize: 12, padding: '10px 20px', zIndex: 50, whiteSpace: 'nowrap' as const }}>
          {toast}
        </div>
      )}
    </div>
  )
}
