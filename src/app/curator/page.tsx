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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ ...sans, fontSize: 9, color: C.muted, letterSpacing: '.1em', marginBottom: 8 }}>{children}</div>
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
  const [showAllListings, setShowAllListings] = useState(false)

  // Lightweight signal data, pulled once for the "needs attention" + pulse strip
  const [pendingSubmissions, setPendingSubmissions] = useState(0)
  const [weeklyEnquiries, setWeeklyEnquiries] = useState<{ thisWeek: number; lastWeek: number } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('expired') === '1') setSessionExpired(true)
    tryLoadDashboard()
  }, [])

  async function tryLoadDashboard() {
    setLoading(true)
    const r = await fetch('/api/properties?all=1')
    if (r.ok) {
      const { data } = await r.json()
      setProperties((data ?? []).sort((a: PropertySummary, b: PropertySummary) => (b.sort_order ?? 0) - (a.sort_order ?? 0)))
      setView('dashboard')
      loadSignals()
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

  // Quietly pull the two numbers needed for "needs attention" and the pulse line.
  // Failures here are non-fatal — the dashboard still works without them.
  async function loadSignals() {
    try {
      const [subRes, analyticsRes] = await Promise.all([
        fetch('/api/property-submissions').then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
        fetch('/api/analytics').then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      const pending = (subRes?.data ?? []).filter((s: any) => s.status === 'pending').length
      setPendingSubmissions(pending)

      if (analyticsRes?.trend) {
        const trend = analyticsRes.trend as { enquiries: number }[]
        const lastWeek = trend.slice(0, 7).reduce((s, d) => s + d.enquiries, 0)
        const thisWeek = trend.slice(7, 14).reduce((s, d) => s + d.enquiries, 0)
        setWeeklyEnquiries({ thisWeek, lastWeek })
      }
    } catch {}
  }

  async function handleLogin() {
    setLoggingIn(true); setAuthError('')
    const r = await fetch('/api/curator-auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
    if (r.ok) {
      setView('dashboard')
      setSessionExpired(false)
      loadProperties()
      loadSignals()
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
  const liveCount = properties.filter(p => p.is_active).length
  const draftCount = properties.filter(p => !p.is_active).length
  const noPhotoDrafts = properties.filter(p => !p.is_active && (!p.photos || p.photos.length === 0))
  const readyToPublish = properties.filter(p => !p.is_active && p.photos && p.photos.length > 0)

  const hasAttentionItems = pendingSubmissions > 0 || readyToPublish.length > 0 || noPhotoDrafts.length > 0

  let momentumLine: string | null = null
  if (weeklyEnquiries && weeklyEnquiries.lastWeek > 0) {
    const ratio = weeklyEnquiries.thisWeek / weeklyEnquiries.lastWeek
    if (ratio >= 1.5) momentumLine = `📈 Enquiries up ${ratio.toFixed(1)}x this week — see analytics →`
    else if (ratio <= 0.6) momentumLine = `📉 Enquiries down this week — see analytics →`
  } else if (weeklyEnquiries && weeklyEnquiries.thisWeek > 0) {
    momentumLine = `📈 ${weeklyEnquiries.thisWeek} enquiries this week — see analytics →`
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream }}>
      <div style={{ background: C.green, padding: '6px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em' }}>തീരം · theeram</span>
        <button onClick={logout} style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.4)', background: 'none', border: 'none', cursor: 'pointer' }}>Log out</button>
      </div>

      <div style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}`, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
        <span style={{ ...serif, fontSize: 20, color: C.text }}>Curator</span>
        <Link href="/curator/new" style={{ ...sans, background: C.green, color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '8px 14px', textDecoration: 'none' }}>+ Add space</Link>
      </div>

      {/* ── Momentum teaser — one line, points to full analytics ─────────── */}
      {momentumLine && (
        <Link href="/curator/analytics" style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{ background: '#163023', padding: '11px 16px', textAlign: 'center' }}>
            <span style={{ ...sans, fontSize: 12, color: C.gold, fontWeight: 500 }}>{momentumLine}</span>
          </div>
        </Link>
      )}

      {/* ── Zone 1: Needs your attention ──────────────────────────────────── */}
      {hasAttentionItems && (
        <div style={{ padding: '16px 16px 4px' }}>
          <SectionLabel>NEEDS YOUR ATTENTION</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingSubmissions > 0 && (
              <Link href="/curator/submissions" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff9eb', border: '1px solid #e8d49a', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...sans, fontSize: 13, color: '#8A7040' }}>📬 {pendingSubmissions} new submission{pendingSubmissions !== 1 ? 's' : ''} to review</span>
                  <span style={{ ...sans, fontSize: 11, color: '#8A7040' }}>→</span>
                </div>
              </Link>
            )}
            {readyToPublish.length > 0 && (
              <div style={{ background: '#f0faf4', border: '1px solid #b8e0c4', padding: '12px 14px' }}>
                <span style={{ ...sans, fontSize: 13, color: '#2D7A4F' }}>✓ {readyToPublish.length} draft{readyToPublish.length !== 1 ? 's' : ''} ha{readyToPublish.length !== 1 ? 've' : 's'} photos — ready to go live</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginTop: 8 }}>
                  {readyToPublish.slice(0, 4).map(p => (
                    <button key={p.id} onClick={() => toggleActive(p.id, p.is_active)} style={{ ...sans, fontSize: 11, color: '#2D7A4F', border: '1px solid #b8e0c4', background: 'white', padding: '4px 10px', cursor: 'pointer' }}>
                      {p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name} →
                    </button>
                  ))}
                </div>
              </div>
            )}
            {noPhotoDrafts.length > 0 && (
              <div style={{ background: '#fdf0eb', border: `1px solid ${C.cream3}`, padding: '12px 14px' }}>
                <span style={{ ...sans, fontSize: 13, color: C.terra }}>📷 {noPhotoDrafts.length} draft{noPhotoDrafts.length !== 1 ? 's' : ''} still need photos before going live</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Zone 2: Tools — Spaces and Makers, each with Listings / Analytics / Agent in that order ── */}
      <div style={{ padding: '20px 16px 4px' }}>
        <SectionLabel>SPACES</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 18 }}>
          {[
            { label: '📋 Listings', href: '/curator/spaces' },
            { label: '📊 Analytics', href: '/curator/analytics' },
            { label: '🤖 Agent', href: '/curator/agent' },
          ].map(({ label, href }) => (
            <Link key={href} href={href} style={{ ...sans, textAlign: 'center', padding: '9px 0', border: `1px solid ${C.cream3}`, color: C.muted, fontSize: 11, fontWeight: 500, textDecoration: 'none', background: 'white' }}>
              {label}
            </Link>
          ))}
        </div>

        <SectionLabel>MAKERS</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: '📋 Listings', href: '/curator/vendors' },
            { label: '📊 Analytics', href: '/curator/maker-analytics' },
            { label: '🤖 Agent', href: '/curator/maker-agent' },
          ].map(({ label, href }) => (
            <Link key={href} href={href} style={{ ...sans, textAlign: 'center', padding: '9px 0', border: `1px solid ${C.cream3}`, color: C.muted, fontSize: 11, fontWeight: 500, textDecoration: 'none', background: 'white' }}>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Zone 3: Listings — collapsed by default ───────────────────────── */}
      <div style={{ padding: '20px 16px 48px' }}>
        <button onClick={() => setShowAllListings(v => !v)} style={{ ...sans, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: showAllListings ? 14 : 0 }}>
          <SectionLabel>ALL SPACES · {liveCount} live · {draftCount} draft</SectionLabel>
          <span style={{ ...sans, fontSize: 11, color: C.muted }}>{showAllListings ? '▲ Hide' : '▼ Show all'}</span>
        </button>

        {showAllListings && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: C.green, color: 'white', ...sans, fontSize: 12, padding: '10px 20px', zIndex: 50, whiteSpace: 'nowrap' as const }}>
          {toast}
        </div>
      )}
    </div>
  )
}
