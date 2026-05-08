'use client'

import { useEffect, useState } from 'react'
import { supabase, Vendor, VendorSubmission, VENDOR_CATEGORY_LABELS, VENDOR_CATEGORIES, VENDOR_CATEGORY_ICONS, VendorCategory, Town } from '@/lib/supabase'
import Link from 'next/link'

const C = { green:'#1C3A2B',cream:'#F5F0E8',cream2:'#EDE8DC',cream3:'#E5DFD0',gold:'#C9A84C',terra:'#9B3D1E',text:'#1C1C1A',muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const
const inp: React.CSSProperties = { ...sans,width:'100%',border:`1px solid ${C.cream3}`,padding:'10px 12px',fontSize:13,background:C.cream,outline:'none',color:C.text,fontWeight:300,boxSizing:'border-box',marginBottom:10 }

type Mode = 'list' | 'edit'

function slug(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') }

export default function CuratorVendorsPage() {
  const [mode, setMode] = useState<Mode>('list')
  const [townFilter, setTownFilter] = useState<string>('all')
  const [towns, setTowns] = useState<Town[]>([])
  const [editing, setEditing] = useState<Partial<Vendor> | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [submissions, setSubmissions] = useState<VendorSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [vr, tr] = await Promise.all([
      supabase.from('vendors').select('*').order('is_featured', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('towns').select('*').eq('is_active', true).order('sort_order'),
    ])
    if (!vr.error) setVendors((vr.data ?? []) as Vendor[])
    if (!tr.error) setTowns((tr.data ?? []) as Town[])
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function newVendor() {
    setEditing({ is_active: false, is_featured: false, category: 'photography_video' })
    setMode('edit')
  }

  function editVendor(v: Vendor) { setEditing({ ...v }); setMode('edit') }

  async function saveVendor() {
    if (!editing?.name || !editing?.category) { showToast('Name and category are required'); return }
    setSaving(true)
    const isNew = !editing.id
    const payload: any = { ...editing }
    if (!payload.slug) payload.slug = slug(payload.name)
    if (isNew) delete payload.id
    const q = isNew
      ? supabase.from('vendors').insert(payload).select().single()
      : supabase.from('vendors').update(payload).eq('id', editing.id!).select().single()
    const { error } = await q
    if (error) { showToast('Save failed: ' + error.message); setSaving(false); return }
    showToast(isNew ? 'Maker added!' : 'Saved')
    await loadAll()
    setMode('list'); setEditing(null); setSaving(false)
  }

  async function toggleVendorActive(id: string, current: boolean) {
    await supabase.from('vendors').update({ is_active: !current }).eq('id', id)
    setVendors(prev => prev.map(v => v.id === id ? { ...v, is_active: !current } : v))
    showToast(current ? 'Hidden' : 'Now live!')
  }

  async function toggleFeatured(id: string, current: boolean) {
    await supabase.from('vendors').update({ is_featured: !current }).eq('id', id)
    setVendors(prev => prev.map(v => v.id === id ? { ...v, is_featured: !current } : v))
    showToast(current ? 'Unfeatured' : 'Featured!')
  }

  async function deleteVendor(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    await supabase.from('vendors').delete().eq('id', id)
    setVendors(prev => prev.filter(v => v.id !== id))
    showToast('Deleted')
  }

  async function approveSubmission(s: VendorSubmission) {
    const vendorPayload = {
      name: s.name, slug: slug(s.name), category: s.category,
      tagline: s.tagline, description: s.description,
      whatsapp: s.whatsapp, phone: s.phone, email: s.email,
      instagram_url: s.instagram_url, price_guide: s.price_guide,
      area_served: s.area_served, is_active: true, is_featured: false,
    }
    const { error } = await supabase.from('vendors').insert(vendorPayload)
    if (error) { showToast('Error: ' + error.message); return }
    await supabase.from('vendor_submissions').update({ status: 'approved' }).eq('id', s.id)
    await loadAll()
    showToast(`${s.name} approved and listed!`)
  }

  async function rejectSubmission(id: string) {
    await supabase.from('vendor_submissions').update({ status: 'rejected' }).eq('id', id)
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' } : s))
    showToast('Rejected')
  }

  function field(label: string, key: keyof Vendor, multiline?: boolean) {
    if (!editing) return null
    return (
      <div key={key}>
        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:4 }}>{label.toUpperCase()}</label>
        {multiline
          ? <textarea value={(editing[key] as string) ?? ''} onChange={e => setEditing(p => ({...p!, [key]: e.target.value}))} rows={3} style={{ ...inp,resize:'vertical' as const }}/>
          : <input value={(editing[key] as string) ?? ''} onChange={e => setEditing(p => ({...p!, [key]: e.target.value}))} style={inp}/>
        }
      </div>
    )
  }

  const pending = submissions.filter(s => s.status === 'pending')

  // ── Edit mode ─────────────────────────────────────────────────────────────
  if (mode === 'edit' && editing) return (
    <div style={{ minHeight:'100vh',background:C.cream,paddingBottom:80 }}>
      <div style={{ background:C.green,padding:'6px 16px' }}><span style={{ ...sans,fontSize:10,color:'rgba(255,255,255,.5)' }}>theeram</span></div>
      <div style={{ background:C.cream,borderBottom:`1px solid ${C.cream3}`,padding:'13px 16px',display:'flex',gap:10,alignItems:'center',position:'sticky',top:0,zIndex:40 }}>
        <button onClick={() => { setMode('list'); setEditing(null) }} style={{ ...sans,fontSize:12,color:C.muted,background:'none',border:'none',cursor:'pointer' }}>← Makers</button>
        <span style={{ fontFamily:'Georgia,serif',fontSize:18,color:C.text }}>{editing.id ? `Edit ${editing.name}` : 'New maker'}</span>
      </div>
      <div style={{ padding:'20px 16px 0',display:'flex',flexDirection:'column',gap:4 }}>

        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:6 }}>CATEGORY</label>
        <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:12 }}>
          {VENDOR_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setEditing(p => ({...p!, category: cat}))} style={{ ...sans,padding:'10px 14px',border:`1px solid ${editing.category===cat?C.terra:C.cream3}`,background:editing.category===cat?'#fdf0eb':'white',color:editing.category===cat?C.terra:C.muted,fontSize:13,cursor:'pointer',textAlign:'left' as const,display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ fontSize:16 }}>{VENDOR_CATEGORY_ICONS[cat]}</span>
              {VENDOR_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {field('Name', 'name')}
        {field('Slug', 'slug')}
        {field('Tagline', 'tagline')}
        {field('Description', 'description', true)}
        {field('WhatsApp (with country code)', 'whatsapp')}
        {field('Phone', 'phone')}
        {field('Instagram URL', 'instagram_url')}
        {field('Price guide', 'price_guide')}
        {field('Area served', 'area_served')}

        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:6 }}>STATUS</label>
        <div style={{ display:'flex',gap:8,marginBottom:8 }}>
          {[false,true].map(val => (
            <button key={String(val)} onClick={() => setEditing(p => ({...p!,is_active:val}))} style={{ ...sans,flex:1,padding:'9px',border:`1px solid ${editing.is_active===val?C.green:C.cream3}`,background:editing.is_active===val?'#f0faf4':'white',color:editing.is_active===val?C.green:C.muted,fontSize:12,cursor:'pointer' }}>
              {val ? '🟢 Live' : '⚪ Draft'}
            </button>
          ))}
        </div>

        <div style={{ display:'flex',gap:8,marginBottom:16 }}>
          {[false,true].map(val => (
            <button key={String(val)} onClick={() => setEditing(p => ({...p!,is_featured:val}))} style={{ ...sans,flex:1,padding:'9px',border:`1px solid ${editing.is_featured===val?C.gold:C.cream3}`,background:editing.is_featured===val?'#fffbf0':'white',color:editing.is_featured===val?'#8A7040':C.muted,fontSize:12,cursor:'pointer' }}>
              {val ? '⭐ Featured' : 'Not featured'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ position:'fixed',bottom:0,left:0,right:0,background:C.cream,borderTop:`1px solid ${C.cream3}`,padding:'12px 16px',zIndex:30 }}>
        <button onClick={saveVendor} disabled={saving} style={{ ...sans,width:'100%',background:saving?C.muted:C.green,color:'white',fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase' as const,padding:'13px 0',border:'none',cursor:saving?'not-allowed':'pointer' }}>
          {saving ? 'Saving...' : 'Save maker'}
        </button>
      </div>
    </div>
  )

  // ── List mode ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh',background:C.cream,paddingBottom:60 }}>
      <div style={{ background:C.green,padding:'6px 16px' }}><span style={{ ...sans,fontSize:10,color:'rgba(255,255,255,.5)' }}>theeram</span></div>
      <div style={{ background:C.cream,borderBottom:`1px solid ${C.cream3}`,padding:'13px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:40 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <Link href="/curator" style={{ ...sans,fontSize:12,color:C.muted,textDecoration:'none' }}>← Curator</Link>
          <span style={{ fontFamily:'Georgia,serif',fontSize:18,color:C.text }}>Makers</span>
            </div>
        <button onClick={newVendor} style={{ ...sans,background:C.green,color:'white',fontSize:10,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase' as const,padding:'7px 14px',border:'none',cursor:'pointer' }}>+ Add</button>
      </div>

      {/* Town filter */}
      <div style={{ padding:'10px 16px 0',overflowX:'auto' }}>
        <div style={{ display:'flex',gap:6,paddingBottom:8 }} className="no-scrollbar">
          <button onClick={() => setTownFilter('all')} style={{ ...sans,flexShrink:0,padding:'5px 12px',border:`1px solid ${townFilter==='all'?C.green:C.cream3}`,background:townFilter==='all'?C.green:'white',color:townFilter==='all'?'white':C.muted,fontSize:10,cursor:'pointer' }}>All</button>
          {towns.map(t => (
            <button key={t.id} onClick={() => setTownFilter(t.id)} style={{ ...sans,flexShrink:0,padding:'5px 12px',border:`1px solid ${townFilter===t.id?t.hero_bg_color:C.cream3}`,background:townFilter===t.id?t.hero_bg_color:'white',color:townFilter===t.id?'white':C.muted,fontSize:10,cursor:'pointer' }}>{t.name}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:'8px 16px',display:'flex',flexDirection:'column',gap:10 }}>
        {loading ? [1,2,3].map(i => <div key={i} style={{ height:100,background:'white',border:`1px solid ${C.cream3}` }}/>) : vendors.map(v => (
            <div key={v.id} style={{ background:'white',border:v.is_featured?`1.5px solid ${C.gold}`:`1px solid ${C.cream3}`,padding:14 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8 }}>
                <div>
                  <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:2 }}>
                    <span style={{ fontSize:14 }}>{VENDOR_CATEGORY_ICONS[v.category as VendorCategory]}</span>
                    <span style={{ ...sans,fontSize:10,color:C.muted }}>{VENDOR_CATEGORY_LABELS[v.category as VendorCategory]}</span>
                    {v.is_featured && <span style={{ ...sans,fontSize:9,background:C.gold,color:C.text,padding:'1px 5px',fontWeight:700 }}>FEATURED</span>}
                  </div>
                  <div style={{ fontFamily:'Georgia,serif',fontSize:16,color:C.text }}>{v.name}</div>
                </div>
                <span style={{ ...sans,fontSize:10,fontWeight:600,padding:'3px 8px',background:v.is_active?'#f0faf4':'#faf0eb',color:v.is_active?'#2D7A4F':C.muted }}>
                  {v.is_active?'Live':'Draft'}
                </span>
              </div>
              <div style={{ display:'flex',gap:6,flexWrap:'wrap' as const }}>
                <button onClick={() => editVendor(v)} style={{ ...sans,fontSize:11,border:`1px solid ${C.green}`,color:C.green,padding:'5px 11px',background:'none',cursor:'pointer' }}>Edit</button>
                <button onClick={() => toggleVendorActive(v.id, v.is_active)} style={{ ...sans,fontSize:11,border:`1px solid ${C.cream3}`,color:C.muted,padding:'5px 11px',background:'none',cursor:'pointer' }}>{v.is_active?'Hide':'Show'}</button>
                <button onClick={() => toggleFeatured(v.id, v.is_featured)} style={{ ...sans,fontSize:11,border:`1px solid ${v.is_featured?C.gold:C.cream3}`,color:v.is_featured?'#8A7040':C.muted,padding:'5px 11px',background:'none',cursor:'pointer' }}>{v.is_featured?'Unfeature':'Feature'}</button>
                <button onClick={() => deleteVendor(v.id, v.name)} style={{ ...sans,fontSize:11,border:`1px solid ${C.terra}`,color:C.terra,padding:'5px 11px',background:'none',cursor:'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
      </div>

      {toast && <div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:C.green,color:'white',...sans,fontSize:12,padding:'10px 20px',zIndex:50,whiteSpace:'nowrap' as const }}>{toast}</div>}
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  )
}
