'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const C = {
  green: '#1C3A2B', cream: '#F5F0E8', cream2: '#EDE8DC', cream3: '#E5DFD0',
  gold: '#C9A84C', terra: '#9B3D1E', text: '#1C1C1A', muted: '#6B5E4E',
}
const sans = { fontFamily: 'system-ui, sans-serif' } as const
const serif = { fontFamily: 'Georgia, serif' } as const

type View = 'login' | 'dashboard'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ ...sans, fontSize: 9, color: C.muted, letterSpacing: '.1em', marginBottom: 8 }}>{children}</div>
}

export default function CuratorPage() {
  const [view, setView] = useState<View>('login')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [loading, setLoading] = useState(false)

  // Lightweight signal data only — no full listing data lives on this page anymore.
  // Listings themselves live at /curator/spaces and /curator/vendors.
  const [pendingPropertySubmissions, setPendingPropertySubmissions] = useState(0)
  const [pendingMakerSubmissions, setPendingMakerSubmissions] = useState(0)
  const [draftSpacesCount, setDraftSpacesCount] = useState(0)
  const [draftMakersCount, setDraftMakersCount] = useState(0)
  const [readyToPublishCount, setReadyToPublishCount] = useState(0)
  const [weeklyEnquiries, setWeeklyEnquiries] = useState<{ thisWeek: number; lastWeek: number } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('expired') === '1') setSessionExpired(true)
    tryLoadDashboard()
  }, [])

  async function tryLoadDashboard() {
    setLoading(true)
    const r = await fetch('/api/curator-check')
    if (r.ok) {
      setView('dashboard')
      loadSignals()
    }
    setLoading(false)
  }

  // Pulls only the small counts needed for the attention zone + momentum line.
  // All failures here are non-fatal — the dashboard still renders without them.
  async function loadSignals() {
    try {
      const [propsRes, vendorsRes, propSubRes, vendorSubRes, analyticsRes] = await Promise.all([
        fetch('/api/properties?all=1').then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
        fetch('/api/vendors?all=1').then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
        fetch('/api/property-submissions').then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
        fetch('/api/vendor-submissions').then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
        fetch('/api/analytics').then(r => r.ok ? r.json() : null).catch(() => null),
      ])

      const allProps = propsRes?.data ?? []
      const allVendors = vendorsRes?.data ?? []

      setDraftSpacesCount(allProps.filter((p: any) => !p.is_active).length)
      setDraftMakersCount(allVendors.filter((v: any) => !v.is_active).length)
      setReadyToPublishCount(allProps.filter((p: any) => !p.is_active && p.photos && p.photos.length > 0).length)

      setPendingPropertySubmissions((propSubRes?.data ?? []).filter((s: any) => s.status === 'pending').length)
      setPendingMakerSubmissions((vendorSubRes?.data ?? []).filter((s: any) => s.status === 'pending').length)

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
      loadSignals()
    } else {
      setAuthError('Incorrect password.')
    }
    setLoggingIn(false)
  }

  async function logout() {
    await fetch('/api/curator-logout', { method: 'POST' })
    setView('login'); setPassword('')
  }

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
  const hasAttentionItems = pendingPropertySubmissions > 0 || pendingMakerSubmissions > 0 || readyToPublishCount > 0 || draftSpacesCount > 0 || draftMakersCount > 0

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

      <div style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}`, padding: '14px 16px', position: 'sticky', top: 0, zIndex: 40 }}>
        <span style={{ ...serif, fontSize: 20, color: C.text }}>Curator</span>
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
            {pendingPropertySubmissions > 0 && (
              <Link href="/curator/spaces" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff9eb', border: '1px solid #e8d49a', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...sans, fontSize: 13, color: '#8A7040' }}>📬 {pendingPropertySubmissions} space submission{pendingPropertySubmissions !== 1 ? 's' : ''} to review</span>
                  <span style={{ ...sans, fontSize: 11, color: '#8A7040' }}>→</span>
                </div>
              </Link>
            )}
            {pendingMakerSubmissions > 0 && (
              <Link href="/curator/vendors" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff9eb', border: '1px solid #e8d49a', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...sans, fontSize: 13, color: '#8A7040' }}>📬 {pendingMakerSubmissions} maker submission{pendingMakerSubmissions !== 1 ? 's' : ''} to review</span>
                  <span style={{ ...sans, fontSize: 11, color: '#8A7040' }}>→</span>
                </div>
              </Link>
            )}
            {readyToPublishCount > 0 && (
              <Link href="/curator/spaces" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#f0faf4', border: '1px solid #b8e0c4', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...sans, fontSize: 13, color: '#2D7A4F' }}>✓ {readyToPublishCount} draft{readyToPublishCount !== 1 ? 's' : ''} ha{readyToPublishCount !== 1 ? 've' : 's'} photos — ready to go live</span>
                  <span style={{ ...sans, fontSize: 11, color: '#2D7A4F' }}>→</span>
                </div>
              </Link>
            )}
            {draftSpacesCount > 0 && (
              <Link href="/curator/spaces" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fdf0eb', border: `1px solid ${C.cream3}`, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...sans, fontSize: 13, color: C.terra }}>📷 {draftSpacesCount} draft space{draftSpacesCount !== 1 ? 's' : ''} not yet live</span>
                  <span style={{ ...sans, fontSize: 11, color: C.terra }}>→</span>
                </div>
              </Link>
            )}
            {draftMakersCount > 0 && (
              <Link href="/curator/vendors" style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fdf0eb', border: `1px solid ${C.cream3}`, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ ...sans, fontSize: 13, color: C.terra }}>✨ {draftMakersCount} draft maker{draftMakersCount !== 1 ? 's' : ''} not yet live</span>
                  <span style={{ ...sans, fontSize: 11, color: C.terra }}>→</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Zone 2: Tools — Spaces and Makers, each Listings / Analytics / Agent ── */}
      <div style={{ padding: '20px 16px 32px' }}>
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
    </div>
  )
}
