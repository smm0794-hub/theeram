'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PROPERTY_TYPE_LABELS, PropertyType } from '@/lib/supabase'

const C = { green:'#1C3A2B',cream:'#F5F0E8',cream2:'#EDE8DC',cream3:'#E5DFD0',gold:'#C9A84C',terra:'#9B3D1E',text:'#1C1C1A',muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const

type MainTab = 'listings' | 'submissions'

interface PropertySummary {
  id: string; name: string; slug: string; property_type: string
  is_active: boolean; is_featured: boolean; sort_order: number
  photos: string[]; created_at: string; town_id: string | null
}

interface TownRow { id: string; name: string; hero_bg_color: string }

interface PropertySubmission {
  id: string; name: string; owner_name: string; whatsapp: string
  property_type: string; tagline: string; status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }

export default function CuratorSpacesPage() {
  const [mainTab, setMainTab] = useState<MainTab>('listings')
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [towns, setTowns] = useState<TownRow[]>([])
  const [submissions, setSubmissions] = useState<PropertySubmission[]>([])
  const [townFilter, setTownFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [pr, tr, sr] = await Promise.all([
      fetch('/api/properties?all=1').then(r => r.json()),
      fetch('/api/towns').then(r => r.json()).catch(() => ({ data: [] })),
      fetch('/api/property-submissions').then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
    ])
    if (pr.data) {
      const sorted = [...pr.data].sort((a: PropertySummary, b: PropertySummary) =>
        (b.sort_order ?? 0) - (a.sort_order ?? 0) || new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setProperties(sorted)
    }
    if (tr.data) setTowns(tr.data)
    if (sr.data) setSubmissions(sr.data)
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function patch(id: string, updates: Record<string, any>) {
    const r = await fetch('/api/properties', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
    return r.ok
  }

  async function toggleActive(id: string, current: boolean) {
    const ok = await patch(id, { is_active: !current })
    if (ok) { setProperties(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p)); showToast(current ? 'Hidden from public' : 'Now live!') }
    else showToast('Update failed — please try again')
  }

  async function toggleFeatured(id: string, current: boolean) {
    const ok = await patch(id, { is_featured: !current })
    if (ok) { setProperties(prev => prev.map(p => p.id === id ? { ...p, is_featured: !current } : p)); showToast(current ? 'Removed Theeram pick' : '⭐ Theeram pick set!') }
    else showToast('Update failed — please try again')
  }

  async function deleteProperty(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const r = await fetch(`/api/properties?id=${id}`, { method: 'DELETE' })
    if (r.ok) { setProperties(prev => prev.filter(p => p.id !== id)); showToast('Deleted') }
    else showToast('Delete failed')
  }

  // Approving a submission creates a Draft property the curator can then edit/enrich,
  // mirroring how vendor submission approval works.
  async function approveSubmission(s: PropertySubmission) {
    const payload = {
      property: {
        name: s.name, slug: slugify(s.name), owner_name: s.owner_name,
        owner_whatsapp: s.whatsapp, property_type: s.property_type || 'villa_without_pool',
        tagline: s.tagline, is_active: false,
      },
    }
    const r = await fetch('/api/properties', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!r.ok) { showToast('Could not create listing — check required fields'); return }
    await fetch('/api/property-submissions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, status: 'approved' }) })
    setSubmissions(prev => prev.map(x => x.id === s.id ? { ...x, status: 'approved' } : x))
    await loadAll()
    showToast(`${s.name} added as Draft — edit to complete it`)
  }

  async function rejectSubmission(id: string) {
    await fetch('/api/property-submissions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'rejected' }) })
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' } : s))
    showToast('Rejected')
  }

  const filtered = properties.filter(p => {
    if (townFilter !== 'all' && p.town_id !== townFilter) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || (p.property_type ?? '').toLowerCase().includes(q)
    }
    return true
  })
  const liveCount = filtered.filter(p => p.is_active).length
  const draftCount = filtered.filter(p => !p.is_active).length
  const pending = submissions.filter(s => s.status === 'pending')

  return (
    <div style={{ minHeight:'100vh',background:C.cream,paddingBottom:80 }}>
      <div style={{ background:C.green,padding:'6px 16px' }}><span style={{ ...sans,fontSize:10,color:'rgba(255,255,255,.5)' }}>theeram</span></div>
      <div style={{ background:C.cream,borderBottom:`1px solid ${C.cream3}`,padding:'13px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:40 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <Link href="/curator" style={{ ...sans,fontSize:12,color:C.muted,textDecoration:'none' }}>← Curator</Link>
          <span style={{ ...serif,fontSize:18,color:C.text }}>Spaces</span>
          {pending.length > 0 && <span style={{ ...sans,fontSize:10,background:C.terra,color:'white',padding:'2px 7px',fontWeight:600 }}>{pending.length} pending</span>}
        </div>
        <Link href="/curator/new" style={{ ...sans,background:C.green,color:'white',fontSize:10,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase' as const,padding:'7px 14px',textDecoration:'none' }}>+ Add</Link>
      </div>

      {/* Tab switcher — matches the Makers page pattern */}
      <div style={{ display:'flex',background:C.cream2,borderBottom:`1px solid ${C.cream3}` }}>
        {[['listings','Listings'],['submissions','Submissions']].map(([t,l]) => (
          <button key={t} onClick={() => setMainTab(t as MainTab)} style={{ ...sans,flex:1,padding:'11px 0',fontSize:12,fontWeight:500,background:'none',border:'none',cursor:'pointer',borderBottom:`2px solid ${mainTab===t?C.terra:'transparent'}`,color:mainTab===t?C.terra:C.muted }}>
            {l}{t==='submissions'&&pending.length>0?` (${pending.length})`:''}
          </button>
        ))}
      </div>

      {/* Listings tab */}
      {mainTab === 'listings' && (
        <>
          <div style={{ padding:'12px 16px 0',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <span style={{ ...sans,fontSize:11,color:C.muted }}>{liveCount} live · {draftCount} draft</span>
          </div>

          <div style={{ padding:'10px 16px 0',overflowX:'auto' }}>
            <div style={{ display:'flex',gap:6,paddingBottom:8 }} className="no-scrollbar">
              <button onClick={() => setTownFilter('all')} style={{ ...sans,flexShrink:0,padding:'6px 14px',border:`1px solid ${townFilter==='all'?C.green:C.cream3}`,background:townFilter==='all'?C.green:'white',color:townFilter==='all'?'white':C.muted,fontSize:11,cursor:'pointer',fontWeight:townFilter==='all'?600:400 }}>All towns</button>
              {towns.map(t => (
                <button key={t.id} onClick={() => setTownFilter(t.id)} style={{ ...sans,flexShrink:0,padding:'6px 14px',border:`1px solid ${townFilter===t.id?t.hero_bg_color:C.cream3}`,background:townFilter===t.id?t.hero_bg_color:'white',color:townFilter===t.id?'white':C.muted,fontSize:11,cursor:'pointer',fontWeight:townFilter===t.id?600:400 }}>{t.name}</button>
              ))}
            </div>
          </div>

          <div style={{ padding:'8px 16px 0',position:'relative' }}>
            <svg viewBox="0 0 16 16" fill="none" width={13} height={13} stroke={C.muted} strokeWidth={1.4} strokeLinecap="round"
              style={{ position:'absolute',left:28,top:'50%',transform:'translateY(-50%)' }}>
              <circle cx="7" cy="7" r="5"/><path d="M11 11l2 2"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search spaces by name..."
              style={{ width:'100%',border:`1px solid ${C.cream3}`,padding:'9px 12px 9px 34px',fontSize:13,...sans,background:'white',outline:'none',color:C.text,fontWeight:300,boxSizing:'border-box' as const }}/>
          </div>

          <div style={{ padding:'8px 16px 0',display:'flex',flexDirection:'column',gap:10 }}>
            {loading ? [1,2,3].map(i => <div key={i} style={{ height:100,background:'white',border:`1px solid ${C.cream3}` }}/>)
            : filtered.length === 0 ? (
              <div style={{ textAlign:'center',padding:'40px 0' }}>
                <p style={{ ...sans,fontSize:14,color:C.muted,marginBottom:12 }}>No spaces{townFilter !== 'all' ? ' in this town' : ''} yet.</p>
                <Link href="/curator/new" style={{ ...sans,fontSize:12,color:C.terra,textDecoration:'underline' }}>Add the first listing →</Link>
              </div>
            ) : filtered.map(p => {
              const town = towns.find(t => t.id === p.town_id)
              return (
                <div key={p.id} style={{ background:'white',border:p.is_featured?`1.5px solid ${C.gold}`:`1px solid ${C.cream3}`,padding:14 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:3 }}>
                        <span style={{ ...serif,fontSize:15,color:C.text }}>{p.name}</span>
                        {p.is_featured && <span style={{ ...sans,fontSize:9,background:C.gold,color:C.text,padding:'2px 6px',fontWeight:700 }}>PICK</span>}
                      </div>
                      <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                        <span style={{ ...sans,fontSize:10,color:C.muted }}>{PROPERTY_TYPE_LABELS[p.property_type as PropertyType] ?? p.property_type}</span>
                        {town && <span style={{ ...sans,fontSize:10,color:'white',background:town.hero_bg_color,padding:'1px 7px' }}>{town.name}</span>}
                      </div>
                    </div>
                    <div style={{ display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6 }}>
                      <span style={{ ...sans,fontSize:10,fontWeight:600,padding:'3px 8px',background:p.is_active?'#f0faf4':'#faf0eb',color:p.is_active?'#2D7A4F':C.muted }}>{p.is_active?'Live':'Draft'}</span>
                      <div style={{ display:'flex',alignItems:'center',gap:4 }}>
                        <span style={{ ...sans,fontSize:9,color:C.muted }}>POS</span>
                        <input type="number" defaultValue={p.sort_order} min={0} max={999}
                          onBlur={async e => { const val = parseInt(e.target.value) || 0; await patch(p.id, { sort_order: val }); await loadAll(); showToast('Order updated') }}
                          style={{ width:44,border:`1px solid ${C.cream3}`,padding:'3px 6px',fontSize:11,...sans,textAlign:'center' as const,background:'white',outline:'none',color:C.text }}/>
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex',gap:6,flexWrap:'wrap' as const }}>
                    <Link href={`/curator/edit/${p.slug}`} style={{ ...sans,fontSize:11,border:`1px solid ${C.green}`,color:C.green,padding:'5px 11px',textDecoration:'none',fontWeight:500 }}>Edit</Link>
                    <button onClick={() => toggleActive(p.id,p.is_active)} style={{ ...sans,fontSize:11,border:`1px solid ${C.cream3}`,color:C.muted,padding:'5px 11px',background:'none',cursor:'pointer' }}>{p.is_active?'Hide':'Show'}</button>
                    <button onClick={() => toggleFeatured(p.id,p.is_featured)} style={{ ...sans,fontSize:11,border:`1px solid ${p.is_featured?C.gold:C.cream3}`,color:p.is_featured?C.gold:C.muted,padding:'5px 11px',background:'none',cursor:'pointer' }}>{p.is_featured?'⭐ Unfeature':'☆ Feature'}</button>
                    <button onClick={() => deleteProperty(p.id,p.name)} style={{ ...sans,fontSize:11,border:`1px solid ${C.terra}`,color:C.terra,padding:'5px 11px',background:'none',cursor:'pointer' }}>Delete</button>
                    <Link href={`/property/${p.slug}`} target="_blank" style={{ ...sans,fontSize:11,border:`1px solid ${C.cream3}`,color:C.muted,padding:'5px 11px',textDecoration:'none' }}>View →</Link>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Submissions tab — mirrors curator-vendors.tsx pattern */}
      {mainTab === 'submissions' && (
        <div style={{ padding:'14px 16px',display:'flex',flexDirection:'column',gap:10 }}>
          {loading ? [1,2].map(i => <div key={i} style={{ height:120,background:'white',border:`1px solid ${C.cream3}` }}/>) : submissions.length === 0 ? (
            <p style={{ ...sans,fontSize:14,color:C.muted,textAlign:'center',padding:'40px 0' }}>No submissions yet.</p>
          ) : submissions.map(s => (
            <div key={s.id} style={{ background:'white',border:`1px solid ${C.cream3}`,padding:14 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8 }}>
                <div>
                  <div style={{ ...sans,fontSize:10,color:C.muted,marginBottom:2 }}>{PROPERTY_TYPE_LABELS[s.property_type as PropertyType] ?? s.property_type}</div>
                  <div style={{ ...serif,fontSize:16,color:C.text,marginBottom:2 }}>{s.name}</div>
                  {s.owner_name && <div style={{ ...sans,fontSize:11,color:C.muted }}>{s.owner_name}</div>}
                  {s.whatsapp && <div style={{ ...sans,fontSize:11,color:C.muted }}>📞 {s.whatsapp}</div>}
                </div>
                <span style={{ ...sans,fontSize:10,fontWeight:600,padding:'3px 8px',
                  background:s.status==='pending'?'#fff9eb':s.status==='approved'?'#f0faf4':'#faf0eb',
                  color:s.status==='pending'?'#8A7040':s.status==='approved'?'#2D7A4F':C.terra }}>
                  {s.status}
                </span>
              </div>
              {s.tagline && <div style={{ ...sans,fontSize:12,color:C.muted,marginBottom:10,fontWeight:300 }}>{s.tagline}</div>}
              {s.status === 'pending' && (
                <div style={{ display:'flex',gap:8 }}>
                  <button onClick={() => approveSubmission(s)} style={{ ...sans,flex:1,background:C.green,color:'white',fontSize:11,fontWeight:700,padding:'8px 0',border:'none',cursor:'pointer' }}>✓ Approve as Draft</button>
                  <button onClick={() => rejectSubmission(s.id)} style={{ ...sans,padding:'8px 14px',border:`1px solid ${C.terra}`,color:C.terra,fontSize:11,background:'none',cursor:'pointer' }}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:C.green,color:'white',...sans,fontSize:12,padding:'10px 20px',zIndex:50,whiteSpace:'nowrap' as const }}>{toast}</div>}
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  )
}
