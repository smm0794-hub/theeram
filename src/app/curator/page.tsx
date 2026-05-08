'use client'

import { useState } from 'react'
import Link from 'next/link'

const C = { green:'#1C3A2B',green2:'#163023',cream:'#F5F0E8',cream2:'#EDE8DC',cream3:'#E5DFD0',gold:'#C9A84C',terra:'#9B3D1E',text:'#1C1C1A',muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const

export default function CuratorPage() {
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [authed, setAuthed] = useState<boolean | null>(null)

  // Check session on mount
  useState(() => {
    fetch('/api/properties?all=1').then(r => setAuthed(r.ok)).catch(() => setAuthed(false))
  })

  async function handleLogin() {
    setLoggingIn(true); setAuthError('')
    const r = await fetch('/api/curator-auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ password }) })
    if (r.ok) { setAuthed(true) } else { setAuthError('Incorrect password.') }
    setLoggingIn(false)
  }

  async function logout() {
    await fetch('/api/curator-logout', { method:'POST' })
    setAuthed(false); setPassword('')
  }

  // ── Login ────────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight:'100vh',background:C.cream,display:'flex',flexDirection:'column' }}>
      <div style={{ background:C.green,padding:'6px 16px' }}><span style={{ ...sans,fontSize:10,color:'rgba(255,255,255,.5)' }}>theeram</span></div>
      <div style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24 }}>
        <div style={{ width:48,height:48,borderRadius:'50%',background:C.green,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20 }}>
          <svg viewBox="0 0 20 20" fill="none" width={22} height={22}><circle cx="10" cy="10" r="6" stroke={C.gold} strokeWidth={1}/><path d="M10 6Q13 9 10 14Q7 9 10 6Z" fill={C.gold} opacity=".85"/></svg>
        </div>
        <h1 style={{ ...serif,fontSize:22,color:C.text,fontWeight:400,marginBottom:6 }}>Theeram Curator</h1>
        <p style={{ ...sans,fontSize:13,color:C.muted,marginBottom:28,fontWeight:300 }}>Private access</p>
        <div style={{ width:'100%',maxWidth:280,display:'flex',flexDirection:'column',gap:10 }}>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key==='Enter' && !loggingIn && handleLogin()} placeholder="Enter curator password"
            style={{ ...sans,border:`1px solid ${authError?C.terra:C.cream3}`,padding:'12px 14px',fontSize:14,background:C.cream,outline:'none',color:C.text,width:'100%',boxSizing:'border-box' as const }}/>
          {authError && <p style={{ ...sans,fontSize:12,color:C.terra }}>{authError}</p>}
          <button onClick={handleLogin} disabled={loggingIn} style={{ ...sans,background:C.green,color:'white',fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase' as const,padding:'13px 0',border:'none',cursor:loggingIn?'not-allowed':'pointer',opacity:loggingIn?.7:1 }}>
            {loggingIn?'Checking...':'Enter'}
          </button>
        </div>
        <Link href="/" style={{ ...sans,fontSize:11,color:C.muted,textDecoration:'none',marginTop:24,borderBottom:`1px solid ${C.cream3}`,paddingBottom:1 }}>← Back to site</Link>
      </div>
    </div>
  )

  // ── Dashboard ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh',background:C.cream }}>
      <div style={{ background:C.green,padding:'6px 16px',display:'flex',justifyContent:'space-between' }}>
        <span style={{ ...sans,fontSize:10,color:'rgba(255,255,255,.5)',letterSpacing:'.06em' }}>theeram</span>
        <button onClick={logout} style={{ ...sans,fontSize:10,color:'rgba(255,255,255,.4)',background:'none',border:'none',cursor:'pointer' }}>Log out</button>
      </div>

      <div style={{ background:C.cream,borderBottom:`1px solid ${C.cream3}`,padding:'14px 16px',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
        <span style={{ ...serif,fontSize:20,color:C.text }}>Curator</span>
      </div>

      <div style={{ padding:'16px 16px 0',display:'flex',flexDirection:'column',gap:10 }}>

        {/* Agents */}
        <div style={{ background:C.green,padding:'14px' }}>
          <div style={{ ...sans,fontSize:9,color:C.gold,letterSpacing:'.08em',marginBottom:10 }}>AGENTS</div>
          <div style={{ display:'flex',gap:8 }}>
            <Link href="/curator/agent" style={{ ...sans,flex:1,textAlign:'center',padding:'10px 0',background:'rgba(255,255,255,.12)',color:'white',fontSize:11,fontWeight:500,textDecoration:'none' }}>🤖 Venue agent</Link>
            <Link href="/curator/towns" style={{ ...sans,flex:1,textAlign:'center',padding:'10px 0',background:'rgba(255,255,255,.12)',color:'white',fontSize:11,fontWeight:500,textDecoration:'none' }}>🗺️ Town agent</Link>
          </div>
        </div>

        {/* Spaces & Makers */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
          <Link href="/curator/spaces" style={{ background:'white',border:`1px solid ${C.cream3}`,padding:'16px 14px',textDecoration:'none',display:'block' }}>
            <div style={{ fontSize:22,marginBottom:6 }}>🏡</div>
            <div style={{ ...sans,fontSize:13,fontWeight:600,color:C.text,marginBottom:3 }}>Spaces</div>
            <div style={{ ...sans,fontSize:10,color:C.muted }}>Add, edit, manage listings</div>
          </Link>
          <Link href="/curator/vendors" style={{ background:'white',border:`1px solid ${C.cream3}`,padding:'16px 14px',textDecoration:'none',display:'block' }}>
            <div style={{ fontSize:22,marginBottom:6 }}>✨</div>
            <div style={{ ...sans,fontSize:13,fontWeight:600,color:C.text,marginBottom:3 }}>Makers</div>
            <div style={{ ...sans,fontSize:10,color:C.muted }}>Add, edit, approve vendors</div>
          </Link>
        </div>

        {/* Analytics & Submissions */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
          <Link href="/curator/analytics" style={{ background:'white',border:`1px solid ${C.cream3}`,padding:'16px 14px',textDecoration:'none',display:'block' }}>
            <div style={{ fontSize:22,marginBottom:6 }}>📊</div>
            <div style={{ ...sans,fontSize:13,fontWeight:600,color:C.text,marginBottom:3 }}>Analytics</div>
            <div style={{ ...sans,fontSize:10,color:C.muted }}>Enquiries by town & listing</div>
          </Link>
          <Link href="/curator/submissions" style={{ background:'white',border:`1px solid ${C.cream3}`,padding:'16px 14px',textDecoration:'none',display:'block' }}>
            <div style={{ fontSize:22,marginBottom:6 }}>📬</div>
            <div style={{ ...sans,fontSize:13,fontWeight:600,color:C.text,marginBottom:3 }}>Submissions</div>
            <div style={{ ...sans,fontSize:10,color:C.muted }}>New space applications</div>
          </Link>
        </div>

        {/* Towns */}
        <Link href="/curator/towns" style={{ background:'white',border:`1px solid ${C.cream3}`,padding:'14px',textDecoration:'none',display:'flex',alignItems:'center',gap:14 }}>
          <div style={{ fontSize:22 }}>🗺️</div>
          <div>
            <div style={{ ...sans,fontSize:13,fontWeight:600,color:C.text,marginBottom:2 }}>Towns</div>
            <div style={{ ...sans,fontSize:10,color:C.muted }}>Manage town pages and content</div>
          </div>
          <span style={{ ...sans,fontSize:12,color:C.muted,marginLeft:'auto' }}>→</span>
        </Link>

      </div>
    </div>
  )
}
