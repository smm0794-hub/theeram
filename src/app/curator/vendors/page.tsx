'use client'

import { useEffect, useState } from 'react'
import { supabase, Vendor, VendorSubmission, VENDOR_CATEGORY_LABELS, VENDOR_CATEGORIES, VENDOR_CATEGORY_ICONS, VendorCategory } from '@/lib/supabase'
import Link from 'next/link'

const C = { green:'#1C3A2B',cream:'#F5F0E8',cream2:'#EDE8DC',cream3:'#E5DFD0',gold:'#C9A84C',terra:'#9B3D1E',text:'#1C1C1A',muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const
const inp: React.CSSProperties = { ...sans,width:'100%',border:`1px solid ${C.cream3}`,padding:'10px 12px',fontSize:13,background:C.cream,outline:'none',color:C.text,fontWeight:300,boxSizing:'border-box',marginBottom:10 }

type Mode = 'list' | 'edit'
type MainTab = 'makers' | 'submissions'

interface District { id: string; name: string }
interface VendorAttrs {
  years_experience: number; team_size: number; instagram_followers: number
  min_guests: number; max_guests: number
  portfolio_url: string; facebook_url: string
  offers_trial: boolean; home_service: boolean
  category_details: Record<string, any>
}

function slug(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') }

export default function CuratorVendorsPage() {
  const [mainTab, setMainTab] = useState<MainTab>('makers')
  const [mode, setMode] = useState<Mode>('list')
  const [editing, setEditing] = useState<Partial<Vendor> | null>(null)
  const [editingAttrs, setEditingAttrs] = useState<VendorAttrs>({
    years_experience: 0, team_size: 0, instagram_followers: 0, min_guests: 0, max_guests: 0,
    portfolio_url: '', facebook_url: '', offers_trial: false, home_service: false, category_details: {},
  })
  const [editingDistricts, setEditingDistricts] = useState<string[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [submissions, setSubmissions] = useState<VendorSubmission[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [vendorDistrictMap, setVendorDistrictMap] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { loadAll() }, [])

  // ── Data layer — now goes through /api/vendors (service role), not the anon
  // Supabase client. The anon client could only ever see is_active=true rows
  // and had no DELETE policy at all, which is why drafts were invisible and
  // delete silently did nothing. Districts and submissions still use the anon
  // client directly since those tables have open public-read policies.
  async function loadAll() {
    setLoading(true)
    const [vr, sr, dr, vdr] = await Promise.all([
      fetch('/api/vendors?all=1').then(r => r.json()).catch(() => ({ data: [] })),
      supabase.from('vendor_submissions').select('*').order('created_at', { ascending: false }),
      supabase.from('kerala_districts').select('id, name').order('sort_order'),
      supabase.from('vendor_districts').select('vendor_id, district_id'),
    ])
    if (vr.data) setVendors(vr.data as Vendor[])
    else if (vr.error) showToast('Could not load makers: ' + vr.error)
    if (!sr.error) setSubmissions((sr.data ?? []) as VendorSubmission[])
    if (!dr.error) setDistricts((dr.data ?? []) as District[])
    if (!vdr.error) {
      const map: Record<string, string[]> = {}
      ;(vdr.data ?? []).forEach((row: any) => {
        if (!map[row.vendor_id]) map[row.vendor_id] = []
        map[row.vendor_id].push(row.district_id)
      })
      setVendorDistrictMap(map)
    }
    setLoading(false)
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function newVendor() {
    setEditing({ is_active: false, is_featured: false, category: 'photography_video' })
    setEditingAttrs({ years_experience: 0, team_size: 0, instagram_followers: 0, min_guests: 0, max_guests: 0, portfolio_url: '', facebook_url: '', offers_trial: false, home_service: false, category_details: {} })
    setEditingDistricts([])
    setMode('edit')
  }

  async function editVendor(v: Vendor) {
    setEditing({ ...v })
    setEditingDistricts(vendorDistrictMap[v.id] ?? [])
    const { data } = await supabase.from('vendor_attributes').select('*').eq('vendor_id', v.id).single()
    if (data) {
      setEditingAttrs({
        years_experience: data.years_experience ?? 0, team_size: data.team_size ?? 0, instagram_followers: data.instagram_followers ?? 0,
        min_guests: data.min_guests ?? 0, max_guests: data.max_guests ?? 0,
        portfolio_url: data.portfolio_url ?? '', facebook_url: data.facebook_url ?? '',
        offers_trial: data.offers_trial ?? false, home_service: data.home_service ?? false,
        category_details: data.category_details ?? {},
      })
    } else {
      setEditingAttrs({ years_experience: 0, team_size: 0, instagram_followers: 0, min_guests: 0, max_guests: 0, portfolio_url: '', facebook_url: '', offers_trial: false, home_service: false, category_details: {} })
    }
    setMode('edit')
  }

  function toggleDistrict(id: string) {
    setEditingDistricts(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
  }

  function updateDetail(key: string, val: any) {
    setEditingAttrs(prev => ({ ...prev, category_details: { ...prev.category_details, [key]: val } }))
  }

  async function saveVendor() {
    if (!editing?.name || !editing?.category) { showToast('Name and category are required'); return }
    setSaving(true)
    const isNew = !editing.id
    const payload: any = { ...editing }
    if (!payload.slug) payload.slug = slug(payload.name)
    if (isNew) delete payload.id

    const r = isNew
      ? await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      : await fetch('/api/vendors', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...payload }) })

    const result = await r.json()
    if (!r.ok) { showToast('Save failed: ' + (result.error ?? 'unknown error')); setSaving(false); return }

    const vendorId = result.data?.id ?? editing.id
    if (vendorId) {
      // Attributes and districts still go through the anon client — these tables
      // already have public-write-friendly policies via the curator session pattern
      // used elsewhere; if that changes, move these into the API route too.
      await supabase.from('vendor_attributes').upsert({ vendor_id: vendorId, ...editingAttrs })
      await supabase.from('vendor_districts').delete().eq('vendor_id', vendorId)
      if (editingDistricts.length > 0) {
        await supabase.from('vendor_districts').insert(editingDistricts.map(d => ({ vendor_id: vendorId, district_id: d })))
      }
    }

    showToast(isNew ? 'Maker added!' : 'Saved')
    await loadAll()
    setMode('list'); setEditing(null); setSaving(false)
  }

  async function toggleVendorActive(id: string, current: boolean) {
    const r = await fetch('/api/vendors', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_active: !current }) })
    if (r.ok) { setVendors(prev => prev.map(v => v.id === id ? { ...v, is_active: !current } : v)); showToast(current ? 'Hidden' : 'Now live!') }
    else showToast('Update failed')
  }

  async function toggleFeatured(id: string, current: boolean) {
    const r = await fetch('/api/vendors', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, is_featured: !current }) })
    if (r.ok) { setVendors(prev => prev.map(v => v.id === id ? { ...v, is_featured: !current } : v)); showToast(current ? 'Unfeatured' : '⭐ Theeram pick set!') }
    else showToast('Update failed')
  }

  async function deleteVendor(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This also removes their attributes and district tags.`)) return
    const r = await fetch(`/api/vendors?id=${id}`, { method: 'DELETE' })
    if (r.ok) { setVendors(prev => prev.filter(v => v.id !== id)); showToast('Deleted') }
    else { const result = await r.json().catch(() => ({})); showToast('Delete failed: ' + (result.error ?? 'unknown error')) }
  }

  async function approveSubmission(s: VendorSubmission) {
    const vendorPayload = {
      name: s.name, slug: slug(s.name), category: s.category,
      tagline: s.tagline, description: s.description,
      whatsapp: s.whatsapp, phone: s.phone,
      instagram_url: s.instagram_url, price_guide: s.price_guide,
      is_active: true, is_featured: false,
    }
    const r = await fetch('/api/vendors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(vendorPayload) })
    if (!r.ok) { const result = await r.json().catch(() => ({})); showToast('Error: ' + (result.error ?? 'unknown')); return }
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

  function numField(label: string, val: number, onChange: (v: number) => void) {
    return (
      <div>
        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:4 }}>{label.toUpperCase()}</label>
        <input type="number" value={val} onChange={e => onChange(parseInt(e.target.value) || 0)} style={inp}/>
      </div>
    )
  }

  function toggleField(label: string, val: boolean, onChange: (v: boolean) => void) {
    return (
      <button onClick={() => onChange(!val)} style={{ ...sans, fontSize:12, padding:'9px 12px', border:`1px solid ${val ? C.green : C.cream3}`, background: val ? '#f0faf4' : 'white', color: val ? C.green : C.muted, cursor:'pointer', textAlign:'left' as const }}>
        {val ? '✓ ' : '○ '}{label}
      </button>
    )
  }

  function renderCategoryDetails() {
    const cat = editing?.category
    const d = editingAttrs.category_details
    switch (cat) {
      case 'photography_video':
        return (
          <>
            {toggleField('Offers video', !!d.offers_video, v => updateDetail('offers_video', v))}
            {toggleField('Has drone', !!d.has_drone, v => updateDetail('has_drone', v))}
            {numField('Turnaround (days)', d.turnaround_days ?? 0, v => updateDetail('turnaround_days', v))}
          </>
        )
      case 'catering':
        return (
          <>
            {toggleField('Live counters', !!d.live_counters, v => updateDetail('live_counters', v))}
            {toggleField('Brings own staff', !!d.brings_staff, v => updateDetail('brings_staff', v))}
            {numField('Min guests', editingAttrs.min_guests, v => setEditingAttrs(p => ({...p, min_guests: v})))}
            {numField('Max guests', editingAttrs.max_guests, v => setEditingAttrs(p => ({...p, max_guests: v})))}
          </>
        )
      case 'decoration_florals':
        return (
          <>
            {toggleField('Does mandapam', !!d.does_mandapam, v => updateDetail('does_mandapam', v))}
            {toggleField('Includes lighting', !!d.includes_lighting, v => updateDetail('includes_lighting', v))}
          </>
        )
      case 'event_management':
        return (
          <>
            {toggleField('Has vendor network', !!d.has_vendor_network, v => updateDetail('has_vendor_network', v))}
            {numField('Events handled', d.events_handled ?? 0, v => updateDetail('events_handled', v))}
          </>
        )
      case 'beauty_styling':
        return (
          <>
            {toggleField('Bridal specialist', !!d.bridal_specialist, v => updateDetail('bridal_specialist', v))}
            {toggleField('Offers trial', editingAttrs.offers_trial, v => setEditingAttrs(p => ({...p, offers_trial: v})))}
            {toggleField('Home service', editingAttrs.home_service, v => setEditingAttrs(p => ({...p, home_service: v})))}
          </>
        )
      default: return null
    }
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

      <div style={{ padding:16 }}>
        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:6 }}>CATEGORY</label>
        <div style={{ display:'flex',flexDirection:'column',gap:6,marginBottom:16 }}>
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
        <div>
          <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:4 }}>FACEBOOK URL</label>
          <input value={editingAttrs.facebook_url} onChange={e => setEditingAttrs(p => ({...p, facebook_url: e.target.value}))} style={inp}/>
        </div>
        {field('Price guide', 'price_guide')}

        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:8,marginTop:6 }}>DISTRICTS SERVED</label>
        <div style={{ display:'flex',flexWrap:'wrap' as const,gap:6,marginBottom:16 }}>
          {districts.map(d => (
            <button key={d.id} onClick={() => toggleDistrict(d.id)} style={{ ...sans,fontSize:11,padding:'6px 12px',border:`1px solid ${editingDistricts.includes(d.id)?C.terra:C.cream3}`,background:editingDistricts.includes(d.id)?'#fdf0eb':'white',color:editingDistricts.includes(d.id)?C.terra:C.muted,cursor:'pointer' }}>{d.name}</button>
          ))}
        </div>

        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:8 }}>EXPERIENCE</label>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16 }}>
          {numField('Years experience', editingAttrs.years_experience, v => setEditingAttrs(p => ({...p, years_experience: v})))}
          {numField('Team size', editingAttrs.team_size, v => setEditingAttrs(p => ({...p, team_size: v})))}
        </div>

        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:8 }}>SOCIAL REACH</label>
        <div style={{ marginBottom:16 }}>
          {numField('Instagram followers', editingAttrs.instagram_followers, v => setEditingAttrs(p => ({...p, instagram_followers: v})))}
        </div>

        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:8 }}>CATEGORY DETAILS</label>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:16 }}>
          {renderCategoryDetails()}
        </div>

        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:6 }}>STATUS</label>
        <div style={{ display:'flex',gap:8,marginBottom:8 }}>
          {[false,true].map(val => (
            <button key={String(val)} onClick={() => setEditing(p => ({...p!,is_active:val}))} style={{ ...sans,flex:1,padding:'9px',border:`1px solid ${editing.is_active===val?C.green:C.cream3}`,background:editing.is_active===val?'#f0faf4':'white',color:editing.is_active===val?C.green:C.muted,fontSize:12,cursor:'pointer' }}>
              {val ? '🟢 Live' : '⚪ Draft'}
            </button>
          ))}
        </div>

        <label style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.07em',display:'block',marginBottom:6 }}>THEERAM PICK</label>
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
          {pending.length > 0 && <span style={{ ...sans,fontSize:10,background:C.terra,color:'white',padding:'2px 7px',fontWeight:600 }}>{pending.length} pending</span>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link href="/curator/maker-agent" style={{ ...sans,fontSize:10,color:C.terra,border:`1px solid ${C.terra}`,padding:'7px 12px',textDecoration:'none' }}>🤖 Agent</Link>
          <button onClick={newVendor} style={{ ...sans,background:C.green,color:'white',fontSize:10,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase' as const,padding:'7px 14px',border:'none',cursor:'pointer' }}>+ Add</button>
        </div>
      </div>

      <div style={{ display:'flex',background:C.cream2,borderBottom:`1px solid ${C.cream3}` }}>
        {[['makers','Makers'],['submissions','Submissions']].map(([t,l]) => (
          <button key={t} onClick={() => setMainTab(t as MainTab)} style={{ ...sans,flex:1,padding:'11px 0',fontSize:12,fontWeight:500,background:'none',border:'none',cursor:'pointer',borderBottom:`2px solid ${mainTab===t?C.terra:'transparent'}`,color:mainTab===t?C.terra:C.muted }}>
            {l}{t==='submissions'&&pending.length>0?` (${pending.length})`:''}
          </button>
        ))}
      </div>

      {mainTab === 'makers' && (
        <div style={{ padding:'14px 16px',display:'flex',flexDirection:'column',gap:10 }}>
          {loading ? [1,2,3].map(i => <div key={i} style={{ height:100,background:'white',border:`1px solid ${C.cream3}` }}/>) : vendors.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <p style={{ ...sans,fontSize:14,color:C.muted,marginBottom:14 }}>No makers yet.</p>
              <Link href="/curator/maker-agent" style={{ ...sans,fontSize:12,color:C.terra,textDecoration:'underline' }}>Run the maker agent →</Link>
            </div>
          ) : vendors.map(v => {
            const vDistricts = (vendorDistrictMap[v.id] ?? []).map(id => districts.find(d => d.id === id)?.name).filter(Boolean)
            return (
              <div key={v.id} style={{ background:'white',border:v.is_featured?`1.5px solid ${C.gold}`:`1px solid ${C.cream3}`,padding:14 }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8 }}>
                  <div>
                    <div style={{ display:'flex',alignItems:'center',gap:7,marginBottom:2 }}>
                      <span style={{ fontSize:14 }}>{VENDOR_CATEGORY_ICONS[v.category as VendorCategory]}</span>
                      <span style={{ ...sans,fontSize:10,color:C.muted }}>{VENDOR_CATEGORY_LABELS[v.category as VendorCategory]}</span>
                      {v.is_featured && <span style={{ ...sans,fontSize:9,background:C.gold,color:C.text,padding:'1px 5px',fontWeight:700 }}>PICK</span>}
                    </div>
                    <div style={{ fontFamily:'Georgia,serif',fontSize:16,color:C.text }}>{v.name}</div>
                    {vDistricts.length > 0 && <div style={{ ...sans,fontSize:10,color:C.muted,marginTop:2 }}>{vDistricts.slice(0,3).join(', ')}{vDistricts.length > 3 ? ` +${vDistricts.length - 3}` : ''}</div>}
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
                  <Link href={`/maker/${v.slug}`} target="_blank" style={{ ...sans,fontSize:11,border:`1px solid ${C.cream3}`,color:C.muted,padding:'5px 11px',textDecoration:'none' }}>View →</Link>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {mainTab === 'submissions' && (
        <div style={{ padding:'14px 16px',display:'flex',flexDirection:'column',gap:10 }}>
          {loading ? [1,2].map(i => <div key={i} style={{ height:120,background:'white',border:`1px solid ${C.cream3}` }}/>) : submissions.length === 0 ? (
            <p style={{ ...sans,fontSize:14,color:C.muted,textAlign:'center',padding:'40px 0' }}>No submissions yet.</p>
          ) : submissions.map(s => (
            <div key={s.id} style={{ background:'white',border:`1px solid ${C.cream3}`,padding:14 }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8 }}>
                <div>
                  <div style={{ ...sans,fontSize:10,color:C.muted,marginBottom:2 }}>{VENDOR_CATEGORY_LABELS[s.category as VendorCategory]}</div>
                  <div style={{ fontFamily:'Georgia,serif',fontSize:16,color:C.text,marginBottom:2 }}>{s.name}</div>
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
                  <button onClick={() => approveSubmission(s)} style={{ ...sans,flex:1,background:C.green,color:'white',fontSize:11,fontWeight:700,padding:'8px 0',border:'none',cursor:'pointer' }}>✓ Approve & list</button>
                  <button onClick={() => rejectSubmission(s.id)} style={{ ...sans,padding:'8px 14px',border:`1px solid ${C.terra}`,color:C.terra,fontSize:11,background:'none',cursor:'pointer' }}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <div style={{ position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:C.green,color:'white',...sans,fontSize:12,padding:'10px 20px',zIndex:50,whiteSpace:'nowrap' as const }}>{toast}</div>}
    </div>
  )
}
