'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

const C = { green:'#1C3A2B', cream:'#F5F0E8', cream3:'#E5DFD0', gold:'#C9A84C', terra:'#9B3D1E', text:'#1C1C1A', muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const

export default function CuratorLoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const expired = params.get('expired') === '1'
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // If already authed, redirect straight to curator
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
      if (r.ok) {
        router.replace('/curator')
      } else {
        setError('Incorrect password.')
      }
    } catch {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  if (checking) return (
    <div style={{ minHeight:'100vh', background:C.cream, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:28, height:28, border:`2px solid ${C.terra}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:C.cream, display:'flex', flexDirection:'column' }}>
      <div style={{ background:C.green, padding:'6px 16px' }}>
        <span style={{ ...sans, fontSize:10, color:'rgba(255,255,255,.5)', letterSpacing:'.06em' }}>തീരം · theeram</span>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ width:48, height:48, borderRadius:'50%', background:C.green, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
          <svg viewBox="0 0 20 20" fill="none" width={22} height={22}>
            <circle cx="10" cy="10" r="6" stroke={C.gold} strokeWidth={1}/>
            <path d="M10 6Q13 9 10 14Q7 9 10 6Z" fill={C.gold} opacity=".85"/>
          </svg>
        </div>
        <h1 style={{ ...serif, fontSize:22, color:C.text, fontWeight:400, marginBottom:6 }}>Theeram Curator</h1>
        <p style={{ ...sans, fontSize:13, color:C.muted, marginBottom:28, fontWeight:300 }}>Private access</p>

        {expired && (
          <div style={{ ...sans, fontSize:12, color:C.muted, marginBottom:16, background:'#fdf0eb', border:`1px solid ${C.terra}`, padding:'10px 14px', maxWidth:280, textAlign:'center', width:'100%', boxSizing:'border-box' as const }}>
            Your session has expired. Please log in again.
          </div>
        )}

        <div style={{ width:'100%', maxWidth:280, display:'flex', flexDirection:'column', gap:10 }}>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleLogin()}
            placeholder="Enter curator password"
            autoFocus
            style={{ ...sans, border:`1px solid ${error ? C.terra : C.cream3}`, padding:'12px 14px', fontSize:14, background:C.cream, outline:'none', color:C.text, width:'100%', boxSizing:'border-box' as const }}
          />
          {error && <p style={{ ...sans, fontSize:12, color:C.terra, margin:0 }}>{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading || !password.trim()}
            style={{ ...sans, background:C.green, color:'white', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase' as const, padding:'13px 0', border:'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1 }}
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </div>
        <Link href="/" style={{ ...sans, fontSize:11, color:C.muted, textDecoration:'none', marginTop:24, borderBottom:`1px solid ${C.cream3}`, paddingBottom:1 }}>
          ← Back to site
        </Link>
      </div>
    </div>
  )
}
