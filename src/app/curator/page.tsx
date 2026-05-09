import Link from 'next/link'

// This page is fully protected by middleware — no client-side auth needed
// Middleware redirects to /curator-login if session cookie is missing

const C = { green:'#1C3A2B', green2:'#163023', cream:'#F5F0E8', cream2:'#EDE8DC', cream3:'#E5DFD0', gold:'#C9A84C', terra:'#9B3D1E', text:'#1C1C1A', muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const

export default function CuratorPage() {
  return (
    <div style={{ minHeight:'100vh', background:C.cream }}>
      <div style={{ background:C.green, padding:'6px 16px', display:'flex', justifyContent:'space-between' }}>
        <span style={{ ...sans, fontSize:10, color:'rgba(255,255,255,.5)', letterSpacing:'.06em' }}>theeram</span>
        <a href="/api/curator-logout" style={{ ...sans, fontSize:10, color:'rgba(255,255,255,.4)', textDecoration:'none' }}>Log out</a>
      </div>

      <div style={{ background:C.cream, borderBottom:`1px solid ${C.cream3}`, padding:'14px 16px' }}>
        <span style={{ ...serif, fontSize:20, color:C.text }}>Curator</span>
      </div>

      <div style={{ padding:'16px 16px 0', display:'flex', flexDirection:'column', gap:10 }}>

        {/* Agents */}
        <div style={{ background:C.green, padding:'14px' }}>
          <div style={{ ...sans, fontSize:9, color:C.gold, letterSpacing:'.08em', marginBottom:10 }}>AGENTS</div>
          <div style={{ display:'flex', gap:8 }}>
            <Link href="/curator/agent" style={{ ...sans, flex:1, textAlign:'center', padding:'10px 0', background:'rgba(255,255,255,.12)', color:'white', fontSize:11, fontWeight:500, textDecoration:'none' }}>🤖 Venue agent</Link>
            <Link href="/curator/towns" style={{ ...sans, flex:1, textAlign:'center', padding:'10px 0', background:'rgba(255,255,255,.12)', color:'white', fontSize:11, fontWeight:500, textDecoration:'none' }}>🗺️ Town agent</Link>
          </div>
        </div>

        {/* Spaces & Makers */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Link href="/curator/spaces" style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'16px 14px', textDecoration:'none', display:'block' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>🏡</div>
            <div style={{ ...sans, fontSize:13, fontWeight:600, color:C.text, marginBottom:3 }}>Spaces</div>
            <div style={{ ...sans, fontSize:10, color:C.muted }}>Add, edit, manage listings</div>
          </Link>
          <Link href="/curator/vendors" style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'16px 14px', textDecoration:'none', display:'block' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>✨</div>
            <div style={{ ...sans, fontSize:13, fontWeight:600, color:C.text, marginBottom:3 }}>Makers</div>
            <div style={{ ...sans, fontSize:10, color:C.muted }}>Add, edit, approve vendors</div>
          </Link>
        </div>

        {/* Analytics & Submissions */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <Link href="/curator/analytics" style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'16px 14px', textDecoration:'none', display:'block' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>📊</div>
            <div style={{ ...sans, fontSize:13, fontWeight:600, color:C.text, marginBottom:3 }}>Analytics</div>
            <div style={{ ...sans, fontSize:10, color:C.muted }}>Enquiries by town & listing</div>
          </Link>
          <Link href="/curator/submissions" style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'16px 14px', textDecoration:'none', display:'block' }}>
            <div style={{ fontSize:22, marginBottom:6 }}>📬</div>
            <div style={{ ...sans, fontSize:13, fontWeight:600, color:C.text, marginBottom:3 }}>Submissions</div>
            <div style={{ ...sans, fontSize:10, color:C.muted }}>New space applications</div>
          </Link>
        </div>

        {/* Towns */}
        <Link href="/curator/towns" style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px', textDecoration:'none', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ fontSize:22 }}>🗺️</div>
          <div>
            <div style={{ ...sans, fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>Towns</div>
            <div style={{ ...sans, fontSize:10, color:C.muted }}>Manage town pages and content</div>
          </div>
          <span style={{ ...sans, fontSize:12, color:C.muted, marginLeft:'auto' }}>→</span>
        </Link>

      </div>
    </div>
  )
}
