'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Town, PROPERTY_TYPE_LABELS, PropertyType } from '@/lib/supabase'

const C = { green:'#1C3A2B',cream:'#F5F0E8',cream2:'#EDE8DC',cream3:'#E5DFD0',gold:'#C9A84C',terra:'#9B3D1E',text:'#1C1C1A',muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const

interface PropertySummary {
  id: string; name: string; slug: string; property_type: string
  is_active: boolean; is_featured: boolean; sort_order: number
  photos: string[]; created_at: string; town_id: string | null
  towns?: { name: string; hero_bg_color: string } | null
}

export default function CuratorSpacesPage() {
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [towns, setTowns] = useState<Town[]>([])
  const [townFilter, setTownFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [pr, tr] = await Promise.all([
      supabase.from('properties').select('id,name,slug,property_type,is_active,is_featured,sort_order,photos,created_at,town_id,towns(name,hero_bg_color)')
        .order('sort_order', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('towns').select('*').eq('is_active', true).order('sort_order'),
    ])
    if (!pr.error && pr.data) setProperties(pr.data as PropertySummary[])
    if (!tr.error && tr.data) setTowns(tr.data as Town[])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('properties').update({ is_active: !current }).eq('id', id)
    setProperties(prev => prev.map(p => p.id === id ? { ...p, is_active: !current } : p))
    showToast(current ? 'Hidden from public' : 'Now live!')
  }

  async function toggleFeatured(id: string, current: boolean) {
    await supabase.from('properties').update({ is_featured: !current }).eq('id', id)
    setProperties(prev => prev.map(p => p.id === id ? { ...p, is_featured: !current } : p))
    showToast(current ? 'Removed Theeram pick' : '⭐ Theeram pick set!')
  }

  async function moveProperty(id: string, direction: 'up' | 'down') {
    const filtered = townFilter === 'all' ? properties : properties.filter(p => p.town_id === townFilter)
    const idx = filtered.findIndex(p => p.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === filtered.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const total = filtered.length
    await Promise.all([
      supabase.from('properties').update({ sort_order: total - idx }).eq('id', filtered[swapIdx].id),
      supabase.from('properties').update({ sort_order: total - swapIdx }).eq('id', filtered[idx].id),
    ])
    await loadAll()
    showToast('Order updated')
  }

  async function deleteProperty(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await supabase.from('property_attributes').delete().eq('property_id', id)
    await supabase.from('property_event_types').delete().eq('property_id', id)
    await supabase.from('inquiries').delete().eq('property_id', id)
    await supabase.from('properties').delete().eq('id', id)
    setProperties(prev => prev.filter(p => p.id !== id))
    showToast('Deleted')
  }

  const filtered = townFilter === 'all' ? properties : properties.filter(p => p.town_id === townFilter)
  const liveCount = filtered.filter(p => p.is_active).length
  const draftCount = filtered.filter(p => !p.is_active).length

  return (
    <div style={{ minHeight:'100vh',background:C.cream,paddingBottom:80 }}>
      <div style={{ background:C.green,padding:'6px 16px' }}><span style={{ ...sans,fontSize:10,color:'rgba(255,255,255,.5)' }}>theeram</span></div>
      <div style={{ background:C.cream,borderBottom:`1px solid ${C.cream3}`,padding:'13px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:40 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <Link href="/curator" style={{ ...sans,fontSize:12,color:C.muted,textDecoration:'none' }}>← Curator</Link>
          <span style={{ ...serif,fontSize:18,color:C.text }}>Spaces</span>
          <span style={{ ...sans,fontSize:11,color:C.muted }}>{liveCount} live · {draftCount} draft</span>
        </div>
        <Link href="/curator/new" style={{ ...sans,background:C.green,color:'white',fontSize:10,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase' as const,padding:'7px 14px',textDecoration:'none' }}>+ Add</Link>
      </div>

      {/* Town filter */}
      <div style={{ padding:'12px 16px 0',overflowX:'auto' }}>
        <div style={{ display:'flex',gap:6,paddingBottom:8 }} className="no-scrollbar">
          <button onClick={() => setTownFilter('all')} style={{ ...sans,flexShrink:0,padding:'6px 14px',border:`1px solid ${townFilter==='all'?C.green:C.cream3}`,background:townFilter==='all'?C.green:'white',color:townFilter==='all'?'white':C.muted,fontSize:11,cursor:'pointer',fontWeight:townFilter==='all'?600:400 }}>All towns</button>
          {towns.map(t => (
            <button key={t.id} onClick={() => setTownFilter(t.id)} style={{ ...sans,flexShrink:0,padding:'6px 14px',border:`1px solid ${townFilter===t.id?t.hero_bg_color:C.cream3}`,background:townFilter===t.id?t.hero_bg_color:'white',color:townFilter===t.id?'white':C.muted,fontSize:11,cursor:'pointer',fontWeight:townFilter===t.id?600:400 }}>{t.name}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'8px 16px 0',display:'flex',flexDirection:'column',gap:10 }}>
        {loading ? [1,2,3].map(i => <div key={i} style={{ height:100,background:'white',border:`1px solid ${C.cream3}` }}/>) :
        filtered.length === 0 ? (
          <div style={{ textAlign:'center',padding:'40px 0' }}>
            <p style={{ ...sans,fontSize:14,color:C.muted,marginBottom:12 }}>No spaces{townFilter !== 'all' ? ' in this town' : ''} yet.</p>
            <Link href="/curator/new" style={{ ...sans,fontSize:12,color:C.terra,textDecoration:'underline' }}>Add the first listing →</Link>
          </div>
        ) : filtered.map((p, idx) => {
          const town = (p as any).towns
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
                  <div style={{ display:'flex',gap:3 }}>
                    <button onClick={() => moveProperty(p.id,'up')} disabled={idx===0} style={{ width:24,height:24,border:`1px solid ${C.cream3}`,background:'none',cursor:idx===0?'not-allowed':'pointer',fontSize:11,color:idx===0?C.cream3:C.muted,opacity:idx===0?.4:1 }}>↑</button>
                    <button onClick={() => moveProperty(p.id,'down')} disabled={idx===filtered.length-1} style={{ width:24,height:24,border:`1px solid ${C.cream3}`,background:'none',cursor:idx===filtered.length-1?'not-allowed':'pointer',fontSize:11,color:idx===filtered.length-1?C.cream3:C.muted,opacity:idx===filtered.length-1?.4:1 }}>↓</button>
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
      {toast && <div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:C.green,color:'white',...sans,fontSize:12,padding:'10px 20px',zIndex:50,whiteSpace:'nowrap' as const }}>{toast}</div>}
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  )
}
