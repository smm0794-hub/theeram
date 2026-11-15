'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { C, display as serif, sans } from '@/lib/design'

type View = 'login' | 'dashboard'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
      <span style={{ ...serif, fontSize: 10.5, fontWeight: 900, color: C.limeDark }}>&gt;&gt;</span>
      <span style={{ ...sans, fontSize: 10, fontWeight: 700, color: C.green, letterSpacing: '.1em' }}>{children}</span>
    </div>
  )
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
      <div style={{ background: C.green, padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...serif, fontSize: 13, fontWeight: 900, color: C.lime, letterSpacing: '-0.02em' }}>തീരം · theeram</span>
        <span style={{ ...sans, fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.7)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Curator</span>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 28, border: `2.5px solid ${C.green}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', border: `1px solid ${C.cream3}`, borderRadius: '18px 44px 18px 18px', padding: '32px 28px', width: '100%', maxWidth: 340, boxShadow: '0 8px 28px rgba(17,18,17,.06)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <svg viewBox="0 0 28 28" fill="none" width={24} height={24}>
                <path d="M5 17C8.5 11 12.5 11 14 14C15.5 17 19.5 17 23 11" stroke={C.lime} strokeWidth={2.6} strokeLinecap="round"/>
                <path d="M5 11.5C8.5 5.5 12.5 5.5 14 8.5C15.5 11.5 19.5 11.5 23 5.5" stroke={C.gold} strokeWidth={2.2} strokeLinecap="round" opacity=".9"/>
                <circle cx="14" cy="21.5" r="2" fill={C.lime}/>
              </svg>
            </div>
            <h1 style={{ ...serif, fontSize: 22, color: C.dark, fontWeight: 900, marginBottom: 4 }}>Theeram Curator</h1>
            <p style={{ ...sans, fontSize: 12.5, color: C.muted, marginBottom: 22, fontWeight: 400 }}>Private workspace access</p>

            {sessionExpired && !authError && (
              <div style={{ ...sans, fontSize: 12, color: C.dark, marginBottom: 14, background: C.butterSoft, borderRadius: 10, padding: '10px 14px', border: `1px solid ${C.gold}`, width: '100%', textAlign: 'center' }}>
                Your session has expired. Please log in again.
              </div>
            )}

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Enter curator password"
                style={{ ...sans, border: `1px solid ${authError ? '#B91C1C' : C.cream3}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, background: C.cream, outline: 'none', color: C.dark, width: '100%', boxSizing: 'border-box' }}
              />
              {authError && <p style={{ ...sans, fontSize: 12, color: '#B91C1C', fontWeight: 600 }}>{authError}</p>}
              <button
                onClick={handleLogin}
                disabled={loggingIn}
                style={{ ...serif, background: C.lime, color: C.dark, fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '13px 0', border: 'none', borderRadius: 12, cursor: loggingIn ? 'not-allowed' : 'pointer', opacity: loggingIn ? .7 : 1 }}
              >
                {loggingIn ? 'Checking...' : 'Enter Workspace →'}
              </button>
            </div>
            <Link href="/" style={{ ...sans, fontSize: 12, fontWeight: 600, color: C.green, textDecoration: 'none', marginTop: 20 }}>← Back to site</Link>
          </div>
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
      <div style={{ background: C.green, padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ ...serif, fontSize: 13, fontWeight: 900, color: C.lime, textDecoration: 'none', letterSpacing: '-0.02em' }}>തീരം · theeram</Link>
        <button onClick={logout} style={{ ...sans, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.75)', background: 'rgba(255,255,255,.1)', padding: '5px 12px', borderRadius: 999, border: 'none', cursor: 'pointer' }}>Log out</button>
      </div>

      <div style={{ background: 'white', borderBottom: `1px solid ${C.cream3}`, padding: '16px 18px', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ ...serif, fontSize: 22, fontWeight: 900, color: C.dark }}>Curator</span>
            <span style={{ ...sans, fontSize: 10.5, fontWeight: 700, background: C.limePill, color: C.dark, padding: '3px 10px', borderRadius: 999 }}>WORKSPACE</span>
          </div>
          <Link href="/" style={{ ...sans, fontSize: 12, fontWeight: 600, color: C.green, textDecoration: 'none' }}>View live site →</Link>
        </div>
      </div>

      {/* ── Momentum teaser — one line, points to full analytics ─────────── */}
      {momentumLine && (
        <Link href="/curator/analytics" style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{ background: C.dark, padding: '11px 16px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
            <span style={{ ...sans, fontSize: 12.5, color: C.lime, fontWeight: 700 }}>{momentumLine}</span>
          </div>
        </Link>
      )}

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 18px 40px' }}>
        {/* ── Zone 1: Needs your attention ──────────────────────────────────── */}
        {hasAttentionItems && (
          <div style={{ marginBottom: 26 }}>
            <SectionLabel>NEEDS YOUR ATTENTION</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {pendingPropertySubmissions > 0 && (
                <Link href="/curator/spaces" style={{ textDecoration: 'none' }}>
                  <div style={{ background: C.butterSoft, border: `1px solid ${C.gold}`, borderRadius: 14, padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...sans, fontSize: 13.5, fontWeight: 600, color: C.dark }}>📬 {pendingPropertySubmissions} space submission{pendingPropertySubmissions !== 1 ? 's' : ''} to review</span>
                    <span style={{ ...serif, fontSize: 13, fontWeight: 800, color: C.green }}>→</span>
                  </div>
                </Link>
              )}
              {pendingMakerSubmissions > 0 && (
                <Link href="/curator/vendors" style={{ textDecoration: 'none' }}>
                  <div style={{ background: C.butterSoft, border: `1px solid ${C.gold}`, borderRadius: 14, padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...sans, fontSize: 13.5, fontWeight: 600, color: C.dark }}>📬 {pendingMakerSubmissions} maker submission{pendingMakerSubmissions !== 1 ? 's' : ''} to review</span>
                    <span style={{ ...serif, fontSize: 13, fontWeight: 800, color: C.green }}>→</span>
                  </div>
                </Link>
              )}
              {readyToPublishCount > 0 && (
                <Link href="/curator/spaces" style={{ textDecoration: 'none' }}>
                  <div style={{ background: C.mintTint, border: `1px solid ${C.limeDark}`, borderRadius: 14, padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...sans, fontSize: 13.5, fontWeight: 600, color: C.green }}>✓ {readyToPublishCount} draft{readyToPublishCount !== 1 ? 's' : ''} ha{readyToPublishCount !== 1 ? 've' : 's'} photos — ready to go live</span>
                    <span style={{ ...serif, fontSize: 13, fontWeight: 800, color: C.green }}>→</span>
                  </div>
                </Link>
              )}
              {draftSpacesCount > 0 && (
                <Link href="/curator/spaces" style={{ textDecoration: 'none' }}>
                  <div style={{ background: C.lavender, border: `1px solid ${C.cream3}`, borderRadius: 14, padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...sans, fontSize: 13.5, fontWeight: 600, color: C.dark }}>📷 {draftSpacesCount} draft space{draftSpacesCount !== 1 ? 's' : ''} not yet live</span>
                    <span style={{ ...serif, fontSize: 13, fontWeight: 800, color: C.dark }}>→</span>
                  </div>
                </Link>
              )}
              {draftMakersCount > 0 && (
                <Link href="/curator/vendors" style={{ textDecoration: 'none' }}>
                  <div style={{ background: C.lavender, border: `1px solid ${C.cream3}`, borderRadius: 14, padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ ...sans, fontSize: 13.5, fontWeight: 600, color: C.dark }}>✨ {draftMakersCount} draft maker{draftMakersCount !== 1 ? 's' : ''} not yet live</span>
                    <span style={{ ...serif, fontSize: 13, fontWeight: 800, color: C.dark }}>→</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Zone 2: Tools — Spaces, Makers, Towns ── */}
        <div>
          <SectionLabel>SPACES</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginBottom: 22 }}>
            {[
              { label: '📋 Listings', href: '/curator/spaces' },
              { label: '📊 Analytics', href: '/curator/analytics' },
              { label: '🤖 Agent', href: '/curator/agent' },
              { label: '🏘️ Towns', href: '/curator/towns' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} style={{ ...serif, textAlign: 'center', padding: '14px 10px', border: `1px solid ${C.cream3}`, borderRadius: '14px 28px 14px 14px', color: C.dark, fontSize: 12.5, fontWeight: 700, textDecoration: 'none', background: 'white', boxShadow: '0 2px 6px rgba(17,18,17,.03)' }}>
                {label}
              </Link>
            ))}
          </div>

          <SectionLabel>MAKERS</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
            {[
              { label: '📋 Listings', href: '/curator/vendors' },
              { label: '📊 Analytics', href: '/curator/maker-analytics' },
              { label: '🤖 Agent', href: '/curator/maker-agent' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} style={{ ...serif, textAlign: 'center', padding: '14px 10px', border: `1px solid ${C.cream3}`, borderRadius: '14px 28px 14px 14px', color: C.dark, fontSize: 12.5, fontWeight: 700, textDecoration: 'none', background: 'white', boxShadow: '0 2px 6px rgba(17,18,17,.03)' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
