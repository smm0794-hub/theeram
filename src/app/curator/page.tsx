'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PROPERTY_TYPE_LABELS } from '@/lib/supabase'

interface PropertySummary {
  id: string
  name: string
  slug: string
  is_active: boolean
  property_type: string
}

type View = 'login' | 'dashboard'

export default function CuratorPage() {
  const [view, setView] = useState<View>('login')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    // Check if redirected here due to expired session
    const params = new URLSearchParams(window.location.search)
    if (params.get('expired') === '1') setSessionExpired(true)
  }, [])

  async function login() {
    setLoggingIn(true)
    setAuthError('')
    try {
      const r = await fetch('/api/curator-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (r.ok) {
        setView('dashboard')
        if (typeof window !== 'undefined') localStorage.setItem('curator_was_authed', 'true')
        loadProperties()
      } else {
        setAuthError('Incorrect password. Try again.')
      }
    } catch {
      setAuthError('Connection error. Check your internet.')
    }
    setLoggingIn(false)
  }

  async function loadProperties() {
    setLoading(true)
    try {
      const r = await fetch('/api/properties')
      if (r.ok) {
        const { data } = await r.json()
        setProperties(data ?? [])
      }
    } catch {}
    setLoading(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await fetch('/api/properties', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    setProperties((prev) => prev.map((p) => p.id === id ? { ...p, is_active: !current } : p))
    showToast(current ? 'Hidden from public' : 'Now live!')
  }

  async function toggleFeatured(id: string, current: boolean) {
    await fetch('/api/properties', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_featured: !current }),
    })
    setProperties((prev) => prev.map((p) => p.id === id ? { ...p, is_featured: !current } : p))
    showToast(current ? "Removed editor's pick" : "⭐ Editor's pick set!")
  }

  async function moveProperty(id: string, direction: 'up' | 'down') {
    const idx = properties.findIndex((p) => p.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === properties.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const newProps = [...properties]
    ;[newProps[idx], newProps[swapIdx]] = [newProps[swapIdx], newProps[idx]]
    setProperties(newProps)
    await Promise.all([
      fetch('/api/properties', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: newProps[swapIdx].id, sort_order: newProps.length - idx }) }),
      fetch('/api/properties', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: newProps[idx].id, sort_order: newProps.length - swapIdx }) }),
    ])
  }

  async function deleteProperty(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch(`/api/properties?id=${id}`, { method: 'DELETE' })
    setProperties((prev) => prev.filter((p) => p.id !== id))
    showToast('Deleted')
  }

  async function logout() {
    await fetch('/api/curator-logout', { method: 'POST' })
    setView('login')
    setPassword('')
    setProperties([])
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ---- LOGIN SCREEN ----
  if (view === 'login') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ width: '100%', maxWidth: 320 }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#2C1A0E', marginBottom: 4 }}>Theeram</p>
          <p style={{ fontSize: 13, color: '#7C5C3E', marginBottom: 32 }}>Curator access</p>

          <div style={{ backgroundColor: 'white', borderRadius: 16, border: '1px solid #D6C9B8', padding: 24 }}>
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C5C3E', marginBottom: 8 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="Enter curator password"
              autoFocus
              style={{ width: '100%', border: '1px solid #D6C9B8', borderRadius: 12, padding: '12px 16px', fontSize: 15, color: '#2C1A0E', backgroundColor: '#FAF7F2', outline: 'none', marginBottom: 16, boxSizing: 'border-box' }}
            />
            {sessionExpired && !authError && (
              <p style={{ fontSize: 12, color: '#7C5C3E', marginBottom: 12, backgroundColor: '#FAF7F2', padding: '8px 12px', borderRadius: 8, border: '1px solid #D6C9B8' }}>
                Your session has expired. Please log in again.
              </p>
            )}
            <button
              onClick={login}
              disabled={loggingIn}
              style={{ width: '100%', backgroundColor: '#2C1A0E', color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 12, padding: '12px 0', border: 'none', cursor: loggingIn ? 'not-allowed' : 'pointer', opacity: loggingIn ? 0.7 : 1 }}
            >
              {loggingIn ? 'Checking...' : 'Enter'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---- DASHBOARD ----
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#FAF7F2', borderBottom: '0.5px solid #D6C9B8', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E' }}>Curator</span>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/" style={{ fontSize: 12, color: '#7C5C3E', textDecoration: 'underline' }}>View site</Link>
          <button onClick={logout} style={{ fontSize: 12, color: '#7C5C3E', background: 'none', border: 'none', cursor: 'pointer' }}>Log out</button>
        </div>
      </header>

      <div style={{ padding: 16 }}>
        {/* Add new */}
        <Link
          href="/curator/new"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2C1A0E', color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 12, padding: '12px 0', textDecoration: 'none', marginBottom: 10 }}
        >
          + Add new property
        </Link>

        {/* Quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          <Link href="/curator/vendors" style={{ textAlign: 'center', padding: '10px 0', borderRadius: 12, border: '1px solid #D6C9B8', color: '#7C5C3E', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
            ✨ Vendors
          </Link>
          <Link href="/curator/analytics" style={{ textAlign: 'center', padding: '10px 0', borderRadius: 12, border: '1px solid #D6C9B8', color: '#7C5C3E', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
            📊 Analytics
          </Link>
          <Link href="/curator/submissions" style={{ textAlign: 'center', padding: '10px 0', borderRadius: 12, border: '1px solid #D6C9B8', color: '#7C5C3E', fontSize: 13, fontWeight: 500, textDecoration: 'none', gridColumn: 'span 2' }}>
            📬 Property &amp; Vendor Submissions
          </Link>
        </div>

        {/* Property list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2].map((i) => <div key={i} style={{ height: 96, backgroundColor: 'white', borderRadius: 12, border: '1px solid #D6C9B8' }} />)}
          </div>
        ) : properties.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7C5C3E', fontSize: 14, paddingTop: 48 }}>No properties yet. Add your first one above.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {properties.map((p) => (
              <div key={p.id} style={{ backgroundColor: 'white', borderRadius: 12, border: `1px solid ${(p as any).is_featured ? '#C9A84C' : '#D6C9B8'}`, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2C1A0E' }}>{p.name}</p>
                      {(p as any).is_featured && <span style={{ fontSize: 9, backgroundColor: '#C9A84C', color: 'white', padding: '2px 6px', borderRadius: 999, fontWeight: 600 }}>PICK</span>}
                    </div>
                    <p style={{ fontSize: 11, color: '#7C5C3E', marginTop: 2 }}>
                      {PROPERTY_TYPE_LABELS[p.property_type as keyof typeof PROPERTY_TYPE_LABELS] ?? p.property_type}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, backgroundColor: p.is_active ? '#f0f7f1' : '#f5f0eb', color: p.is_active ? '#6B8F71' : '#7C5C3E' }}>
                      {p.is_active ? 'Live' : 'Draft'}
                    </span>
                    {/* Reorder arrows */}
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button onClick={() => moveProperty(p.id, 'up')} style={{ width: 24, height: 24, border: '1px solid #D6C9B8', borderRadius: 4, backgroundColor: 'transparent', cursor: 'pointer', fontSize: 10, color: '#7C5C3E' }}>↑</button>
                      <button onClick={() => moveProperty(p.id, 'down')} style={{ width: 24, height: 24, border: '1px solid #D6C9B8', borderRadius: 4, backgroundColor: 'transparent', cursor: 'pointer', fontSize: 10, color: '#7C5C3E' }}>↓</button>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Link href={`/curator/edit/${p.slug}`} style={{ flex: 1, textAlign: 'center', border: '1px solid #7C5C3E', color: '#7C5C3E', fontSize: 13, fontWeight: 500, borderRadius: 8, padding: '8px 0', textDecoration: 'none' }}>
                    Edit
                  </Link>
                  <button onClick={() => toggleActive(p.id, p.is_active)} style={{ flex: 1, border: '1px solid #7C5C3E', color: '#7C5C3E', fontSize: 13, fontWeight: 500, borderRadius: 8, padding: '8px 0', backgroundColor: 'transparent', cursor: 'pointer' }}>
                    {p.is_active ? 'Hide' : 'Show'}
                  </button>
                  <button onClick={() => toggleFeatured(p.id, !!(p as any).is_featured)} style={{ border: `1px solid ${(p as any).is_featured ? '#C9A84C' : '#D6C9B8'}`, color: (p as any).is_featured ? '#C9A84C' : '#B4A898', fontSize: 12, fontWeight: 500, borderRadius: 8, padding: '8px 10px', backgroundColor: 'transparent', cursor: 'pointer' }}>
                    {(p as any).is_featured ? '⭐' : '☆'}
                  </button>
                  <button onClick={() => deleteProperty(p.id, p.name)} style={{ border: '1px solid #D4735E', color: '#D4735E', fontSize: 13, fontWeight: 500, borderRadius: 8, padding: '8px 14px', backgroundColor: 'transparent', cursor: 'pointer' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#2C1A0E', color: 'white', fontSize: 13, padding: '10px 20px', borderRadius: 999, zIndex: 50, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
