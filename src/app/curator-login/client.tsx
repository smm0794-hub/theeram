'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { C, display as serif, sans } from '@/lib/design'

export default function CuratorLoginClient() {
  const router = useRouter()
  const params = useSearchParams()
  const expired = params.get('expired') === '1'
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/curator-check')
      .then(r => { if (r.ok) router.replace('/curator') })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [])

  async function handleLogin() {
    if (!password.trim()) return
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/curator-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (r.ok) { router.replace('/curator') }
      else { setError('Incorrect password.') }
    } catch {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  if (checking) return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: `2.5px solid ${C.green}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: C.green, padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...serif, fontSize: 13, fontWeight: 900, color: C.lime, letterSpacing: '-0.02em' }}>തീരം · theeram</span>
        <span style={{ ...sans, fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,.7)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Curator</span>
      </div>
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

          {expired && (
            <div style={{ ...sans, fontSize: 12, color: C.dark, marginBottom: 14, background: C.butterSoft, border: `1px solid ${C.gold}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
              Your session has expired. Please log in again.
            </div>
          )}

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && handleLogin()}
              placeholder="Enter curator password"
              autoFocus
              style={{ ...sans, border: `1px solid ${error ? '#B91C1C' : C.cream3}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, background: C.cream, outline: 'none', color: C.dark, width: '100%', boxSizing: 'border-box' }}
            />
            {error && <p style={{ ...sans, fontSize: 12, color: '#B91C1C', fontWeight: 600, margin: 0 }}>{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading || !password.trim()}
              style={{ ...serif, background: C.lime, color: C.dark, fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', padding: '13px 0', border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1 }}
            >
              {loading ? 'Checking...' : 'Enter Workspace →'}
            </button>
          </div>
          <Link href="/" style={{ ...sans, fontSize: 12, fontWeight: 600, color: C.green, textDecoration: 'none', marginTop: 20 }}>
            ← Back to site
          </Link>
        </div>
      </div>
    </div>
  )
}
