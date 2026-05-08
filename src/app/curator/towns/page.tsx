'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Town } from '@/lib/supabase'

const C = { green:'#1C3A2B',green2:'#163023',cream:'#F5F0E8',cream2:'#EDE8DC',cream3:'#E5DFD0',gold:'#C9A84C',terra:'#9B3D1E',text:'#1C1C1A',muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const
const mono = { fontFamily:'monospace' } as const
const inp: React.CSSProperties = { ...sans,width:'100%',border:`1px solid ${C.cream3}`,padding:'10px 12px',fontSize:13,background:C.cream,outline:'none',color:C.text,fontWeight:300,boxSizing:'border-box',marginBottom:10 }

type Mode = 'list' | 'agent' | 'edit'

export default function TownsPage() {
  const [towns, setTowns] = useState<Town[]>([])
  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<Partial<Town> | null>(null)
  const [toast, setToast] = useState('')
  const [agentInput, setAgentInput] = useState('')
  const [agentDistrict, setAgentDistrict] = useState('')
  const [agentRunning, setAgentRunning] = useState(false)
  const [agentResult, setAgentResult] = useState<any>(null)
  const [agentLog, setAgentLog] = useState<string[]>([])
  const [agentError, setAgentError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadTowns() }, [])

  async function loadTowns() {
    const { data } = await supabase.from('towns').select('*').order('sort_order', { ascending: true })
    setTowns((data ?? []) as Town[])
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function runTownAgent() {
    if (!agentInput.trim()) return
    setAgentRunning(true); setAgentResult(null); setAgentError('')
    setAgentLog([`Researching ${agentInput}...`, 'Calling agent with web search...'])
    try {
      const r = await fetch('/api/town-agent', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ townName: agentInput, district: agentDistrict }) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error ?? `Error ${r.status}`)
      setAgentLog(prev => [...prev, `✓ Content generated for ${data.town.name}`])
      setAgentResult(data.town)
    } catch (err: any) {
      setAgentError(err.message); setAgentLog(prev => [...prev, `✗ ${err.message}`])
    }
    setAgentRunning(false)
  }

  function useAgentResult() {
    if (!agentResult) return
    setEditing({ ...agentResult, is_active: false, sort_order: towns.length + 1 })
    setMode('edit')
  }

  async function saveTown() {
    if (!editing) return
    setSaving(true)
    const isNew = !editing.id
    const payload = { ...editing }
    if (isNew) delete payload.id
    const q = isNew
      ? supabase.from('towns').insert(payload).select().single()
      : supabase.from('towns').update(payload).eq('id', editing.id!).select().single()
    const { data, error } = await q
    if (error) { showToast('Save failed: ' + error.message); setSaving(false); return }
    showToast(isNew ? `${editing.name} added!` : 'Saved')
    await loadTowns()
    setMode('list'); setEditing(null)
    setSaving(false)
  }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('towns').update({ is_active: !current }).eq('id', id)
    setTowns(prev => prev.map(t => t.id === id ? { ...t, is_active: !current } : t))
    showToast(current ? 'Hidden' : 'Now live!')
  }

  function field(label: string, key: keyof Town, multiline?: boolean) {
    if (!editing) return null
    return (
      <div key={key}>
        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:4 }}>{label.toUpperCase()}</label>
        {multiline
          ? <textarea value={(editing[key] as string) ?? ''} onChange={e => setEditing(prev => ({...prev!, [key]: e.target.value}))} rows={4} style={{ ...inp,resize:'vertical' as const,marginBottom:12 }}/>
          : <input value={(editing[key] as string) ?? ''} onChange={e => setEditing(prev => ({...prev!, [key]: e.target.value}))} style={inp}/>
        }
      </div>
    )
  }

  // ── Agent screen ─────────────────────────────────────────────────────────
  if (mode === 'agent') return (
    <div style={{ minHeight:'100vh',background:C.cream,paddingBottom:80 }}>
      <div style={{ background:C.green,padding:'6px 16px',display:'flex',justifyContent:'space-between' }}>
        <span style={{ ...sans,fontSize:10,color:'rgba(255,255,255,.5)' }}>തീരം · theeram</span>
        <span style={{ ...sans,fontSize:10,color:'rgba(255,255,255,.4)' }}>Town Agent</span>
      </div>
      <div style={{ background:C.cream,borderBottom:`1px solid ${C.cream3}`,padding:'13px 16px',display:'flex',gap:10,alignItems:'center' }}>
        <button onClick={() => { setMode('list'); setAgentResult(null); setAgentLog([]) }} style={{ ...sans,fontSize:12,color:C.muted,background:'none',border:'none',cursor:'pointer' }}>← Towns</button>
        <span style={{ color:C.cream3 }}>|</span>
        <span style={{ fontFamily:'Georgia,serif',fontSize:18,color:C.text }}>Town Content Agent</span>
      </div>
      <div style={{ padding:'20px 16px' }}>
        <div style={{ background:C.green,padding:'16px',marginBottom:20 }}>
          <p style={{ ...sans,fontSize:13,color:'rgba(255,255,255,.7)',lineHeight:1.7,fontWeight:300,margin:0 }}>
            Enter a town name and the agent will research it — geography, culture, distances, celebration traditions — and generate all hero copy, stats, and suggested venue search queries automatically.
          </p>
        </div>
        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:6 }}>TOWN NAME</label>
        <input value={agentInput} onChange={e => setAgentInput(e.target.value)} onKeyDown={e => e.key==='Enter' && !agentRunning && runTownAgent()} placeholder="e.g. Changanassery" style={inp}/>
        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:6 }}>DISTRICT (optional)</label>
        <input value={agentDistrict} onChange={e => setAgentDistrict(e.target.value)} placeholder="e.g. Kottayam" style={inp}/>
        <button onClick={runTownAgent} disabled={agentRunning||!agentInput.trim()} style={{ ...sans,width:'100%',background:agentRunning?C.muted:C.green,color:'white',fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase' as const,padding:'13px 0',border:'none',cursor:agentRunning?'not-allowed':'pointer',marginTop:4,marginBottom:20 }}>
          {agentRunning ? '⟳  Researching...' : '⟳  Generate town content'}
        </button>
        {agentLog.length > 0 && (
          <div style={{ background:C.green2,padding:'12px 14px',marginBottom:20 }}>
            {agentLog.map((l,i) => <p key={i} style={{ ...mono,fontSize:11,color:i===agentLog.length-1?C.gold:'rgba(255,255,255,.45)',margin:'3px 0' }}>{l}</p>)}
          </div>
        )}
        {agentError && <p style={{ ...sans,fontSize:13,color:C.terra,marginBottom:16 }}>{agentError}</p>}
        {agentResult && (
          <div style={{ border:`1px solid ${C.cream3}`,background:'white',padding:16,marginBottom:20 }}>
            <div style={{ width:24,height:24,background:agentResult.hero_bg_color,marginBottom:10 }}/>
            <div style={{ fontFamily:'Georgia,serif',fontSize:18,color:C.text,marginBottom:4 }}>{agentResult.name}</div>
            <div style={{ ...sans,fontSize:11,color:C.muted,marginBottom:10 }}>{agentResult.district} District · {agentResult.tagline}</div>
            <div style={{ ...sans,fontSize:12,color:C.text,lineHeight:1.7,marginBottom:10 }} dangerouslySetInnerHTML={{ __html: agentResult.hero_headline }}/>
            <div style={{ ...sans,fontSize:11,color:C.muted,lineHeight:1.6,marginBottom:10,fontWeight:300 }}>{agentResult.why_here_text}</div>
            {agentResult.suggested_search_queries?.length > 0 && (
              <div style={{ marginBottom:10 }}>
                <p style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',marginBottom:6 }}>SUGGESTED VENUE SEARCHES</p>
                {agentResult.suggested_search_queries.map((q: string) => <p key={q} style={{ ...sans,fontSize:11,color:C.muted,marginBottom:3 }}>→ {q}</p>)}
              </div>
            )}
            <button onClick={useAgentResult} style={{ ...sans,width:'100%',background:C.green,color:'white',fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase' as const,padding:'12px 0',border:'none',cursor:'pointer' }}>
              Use this content — review & save →
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // ── Edit screen ──────────────────────────────────────────────────────────
  if (mode === 'edit' && editing) return (
    <div style={{ minHeight:'100vh',background:C.cream,paddingBottom:80 }}>
      <div style={{ background:C.green,padding:'6px 16px',display:'flex',justifyContent:'space-between' }}>
        <span style={{ ...sans,fontSize:10,color:'rgba(255,255,255,.5)' }}>തീരം · theeram</span>
      </div>
      <div style={{ background:C.cream,borderBottom:`1px solid ${C.cream3}`,padding:'13px 16px',display:'flex',gap:10,alignItems:'center',position:'sticky',top:0,zIndex:40 }}>
        <button onClick={() => { setMode('list'); setEditing(null) }} style={{ ...sans,fontSize:12,color:C.muted,background:'none',border:'none',cursor:'pointer' }}>← Towns</button>
        <span style={{ color:C.cream3 }}>|</span>
        <span style={{ fontFamily:'Georgia,serif',fontSize:18,color:C.text }}>{editing.id ? `Edit ${editing.name}` : 'New town'}</span>
      </div>
      <div style={{ padding:'20px 16px 0',display:'flex',flexDirection:'column',gap:4 }}>
        {field('Town name', 'name')}
        {field('Slug (URL)', 'slug')}
        {field('District', 'district')}
        {field('Tagline', 'tagline')}
        {field('Hero headline (use <em> tags for gold italic)', 'hero_headline', true)}
        {field('Hero subtext (2-3 sentences)', 'hero_subtext', true)}
        {field('Why here — heading', 'why_here_heading')}
        {field('Why here — body text', 'why_here_text', true)}
        {field('Stat 1 value (e.g. 45 min)', 'stat_1_value')}
        {field('Stat 1 label (e.g. FROM KOTTAYAM)', 'stat_1_label')}
        {field('Stat 2 value', 'stat_2_value')}
        {field('Stat 2 label', 'stat_2_label')}
        {field('Stat 3 value', 'stat_3_value')}
        {field('Stat 3 label', 'stat_3_label')}
        {field('Hero background color (hex e.g. #1C3A2B)', 'hero_bg_color')}
        {editing.hero_bg_color && <div style={{ width:'100%',height:40,background:editing.hero_bg_color,marginBottom:10,border:`1px solid ${C.cream3}` }}/>}
        <div>
          <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:6 }}>STATUS</label>
          <div style={{ display:'flex',gap:8,marginBottom:12 }}>
            {[false, true].map(val => (
              <button key={String(val)} onClick={() => setEditing(prev => ({...prev!,is_active:val}))} style={{ ...sans,flex:1,padding:'10px',border:`1px solid ${editing.is_active===val?C.green:C.cream3}`,background:editing.is_active===val?'#f0faf4':'white',color:editing.is_active===val?C.green:C.muted,fontSize:12,cursor:'pointer' }}>
                {val ? '🟢 Live' : '⚪ Draft'}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ position:'fixed',bottom:0,left:0,right:0,background:C.cream,borderTop:`1px solid ${C.cream3}`,padding:'12px 16px',zIndex:30 }}>
        <button onClick={saveTown} disabled={saving} style={{ ...sans,width:'100%',background:saving?C.muted:C.green,color:'white',fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase' as const,padding:'13px 0',border:'none',cursor:saving?'not-allowed':'pointer' }}>
          {saving ? 'Saving...' : 'Save town'}
        </button>
      </div>
    </div>
  )

  // ── List screen ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh',background:C.cream,paddingBottom:60 }}>
      <div style={{ background:C.green,padding:'6px 16px',display:'flex',justifyContent:'space-between' }}>
        <span style={{ ...sans,fontSize:10,color:'rgba(255,255,255,.5)' }}>തീരം · theeram</span>
      </div>
      <div style={{ background:C.cream,borderBottom:`1px solid ${C.cream3}`,padding:'13px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:40 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <Link href="/curator" style={{ ...sans,fontSize:12,color:C.muted,textDecoration:'none' }}>← Curator</Link>
          <span style={{ color:C.cream3 }}>|</span>
          <span style={{ fontFamily:'Georgia,serif',fontSize:18,color:C.text }}>Towns</span>
        </div>
        <div style={{ display:'flex',gap:8 }}>
          <button onClick={() => setMode('agent')} style={{ ...sans,background:'transparent',color:C.terra,fontSize:10,fontWeight:600,letterSpacing:'.07em',padding:'7px 12px',border:`1px solid ${C.terra}`,cursor:'pointer' }}>🤖 Agent</button>
          <button onClick={() => { setEditing({ is_active:false,sort_order:towns.length+1,hero_bg_color:'#1C3A2B' }); setMode('edit') }} style={{ ...sans,background:C.green,color:'white',fontSize:10,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase' as const,padding:'7px 14px',border:'none',cursor:'pointer' }}>+ Add</button>
        </div>
      </div>
      <div style={{ padding:'16px 16px 0',display:'flex',flexDirection:'column',gap:10 }}>
        {towns.map(t => (
          <div key={t.id} style={{ background:'white',border:`1px solid ${C.cream3}`,padding:14 }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
              <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                <div style={{ width:16,height:16,background:t.hero_bg_color,flexShrink:0 }}/>
                <div>
                  <div style={{ ...serif,fontSize:16,color:C.text }}>{t.name}</div>
                  <div style={{ ...sans,fontSize:11,color:C.muted }}>{t.district} District</div>
                </div>
              </div>
              <span style={{ ...sans,fontSize:10,fontWeight:600,padding:'3px 8px',background:t.is_active?'#f0faf4':'#faf0eb',color:t.is_active?'#2D7A4F':C.muted }}>
                {t.is_active?'Live':'Draft'}
              </span>
            </div>
            <div style={{ ...sans,fontSize:11,color:C.muted,marginBottom:10,fontWeight:300,lineHeight:1.5 }}>{t.tagline}</div>
            <div style={{ display:'flex',gap:6,flexWrap:'wrap' as const }}>
              <button onClick={() => { setEditing(t); setMode('edit') }} style={{ ...sans,fontSize:11,border:`1px solid ${C.green}`,color:C.green,padding:'6px 12px',background:'none',cursor:'pointer' }}>Edit</button>
              <button onClick={() => toggleActive(t.id, t.is_active)} style={{ ...sans,fontSize:11,border:`1px solid ${C.cream3}`,color:C.muted,padding:'6px 12px',background:'none',cursor:'pointer' }}>{t.is_active?'Hide':'Show'}</button>
              <Link href={`/${t.slug}`} target="_blank" style={{ ...sans,fontSize:11,border:`1px solid ${C.cream3}`,color:C.muted,padding:'6px 12px',textDecoration:'none' }}>View →</Link>
              <Link href={`/curator/agent?town=${t.name}&townId=${t.id}`} style={{ ...sans,fontSize:11,border:`1px solid ${C.cream3}`,color:C.muted,padding:'6px 12px',textDecoration:'none' }}>🤖 Scan venues</Link>
            </div>
          </div>
        ))}
      </div>
      {toast && <div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:C.green,color:'white',...sans,fontSize:12,padding:'10px 20px',zIndex:50,whiteSpace:'nowrap' as const }}>{toast}</div>}
    </div>
  )
}
