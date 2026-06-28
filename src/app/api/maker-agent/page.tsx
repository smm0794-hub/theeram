'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const C = {
  green: '#1C3A2B', green2: '#163023',
  cream: '#F5F0E8', cream2: '#EDE8DC', cream3: '#E5DFD0',
  gold: '#C9A84C', terra: '#9B3D1E',
  text: '#1C1C1A', muted: '#6B5E4E',
}
const sans = { fontFamily: 'system-ui, sans-serif' } as const
const serif = { fontFamily: 'Georgia, serif' } as const
const mono = { fontFamily: 'monospace' } as const
const inp: React.CSSProperties = {
  ...sans, width: '100%', border: `1px solid ${C.cream3}`,
  padding: '11px 14px', fontSize: 14, background: C.cream,
  outline: 'none', color: C.text, fontWeight: 300, boxSizing: 'border-box',
}

const CATEGORIES = [
  { id: 'photography_video', label: 'Photography & Video', ml: 'ഫോട്ടോഗ്രാഫി' },
  { id: 'catering', label: 'Catering', ml: 'കാറ്ററിംഗ്' },
  { id: 'decoration_florals', label: 'Decoration & Florals', ml: 'അലങ്കാരം' },
  { id: 'event_management', label: 'Event Management', ml: 'ഇവന്റ്' },
  { id: 'beauty_styling', label: 'Beauty & Styling', ml: 'ബ്യൂട്ടി' },
]

interface Maker {
  id: string
  name: string; slug: string
  tagline: string; description: string
  phone: string; whatsapp: string
  instagram_url: string; facebook_url: string
  price_guide: string
  years_experience: number; team_size: number
  min_guests: number; max_guests: number
  offers_trial: boolean; home_service: boolean
  category_details: Record<string, any>
  confidence: 'high' | 'medium' | 'low'
  source: string
  candidate_images: string[]
  selected_images: string[]
  already_listed: boolean
  selected: boolean
  exportData: any
}

const CONFIDENCE_COLOR: Record<string, string> = { high: '#2D7A4F', medium: '#8A7040', low: '#9B3D1E' }

function slugify(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
function esc(s: string) { return (s ?? '').replace(/'/g, "''") }
function n(x: any): number { const v = Number(x); return Number.isFinite(v) ? Math.floor(v) : 0 }

// Builds the clean export object Claude will read back and insert via Supabase directly.
// No SQL string, no escaping needed here — Claude handles that when executing.
function buildExportObject(m: Maker, category: string, districtIds: string[], districtNames: string[]) {
  const wa = (m.whatsapp || m.phone || '').replace(/\D/g, '')
  return {
    name: m.name,
    slug: m.slug,
    category,
    tagline: m.tagline,
    description: m.description,
    whatsapp: wa,
    phone: m.phone,
    instagram_url: m.instagram_url,
    facebook_url: m.facebook_url,
    price_guide: m.price_guide,
    photos: (m.selected_images ?? []).filter(Boolean),
    years_experience: n(m.years_experience),
    team_size: n(m.team_size),
    min_guests: n(m.min_guests),
    max_guests: n(m.max_guests),
    offers_trial: !!m.offers_trial,
    home_service: !!m.home_service,
    category_details: m.category_details ?? {},
    districts: districtNames,
    confidence: m.confidence,
    source: m.source,
  }
}

export default function MakerAgentPage() {
  const [category, setCategory] = useState('photography_video')
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'discovery' | 'name_lookup'>('discovery')
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>([])
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([])
  const [scanning, setScanning] = useState(false)
  const [makers, setMakers] = useState<Maker[]>([])
  const [log, setLog] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copied, setCopied] = useState('')
  const [bulkExport, setBulkExport] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [error, setError] = useState('')
  const [showListed, setShowListed] = useState(false)

  useEffect(() => {
    fetch('/api/districts').then(r => r.json()).then(d => { if (d.data) setDistricts(d.data) }).catch(() => {})
  }, [])

  function addLog(msg: string) { setLog(prev => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`]) }

  function toggleDistrict(id: string) {
    setSelectedDistricts(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
  }

  function selectedDistrictNames(): string[] {
    return selectedDistricts.map(id => districts.find(d => d.id === id)?.name).filter(Boolean) as string[]
  }

  async function runScan() {
    if (!query.trim()) return
    setScanning(true); setMakers([]); setLog([])
    setError(''); setBulkExport(''); setShowBulk(false); setShowListed(false)
    const catLabel = CATEGORIES.find(c => c.id === category)?.label
    addLog(`${mode === 'name_lookup' ? '🔍 Name lookup' : '📍 Discovery scan'}: ${catLabel} — "${query}"`)
    try {
      let existingSlugs: string[] = []
      try {
        const exRes = await fetch(`/api/vendors?all=1&category=${category}`)
        const exData = await exRes.json()
        existingSlugs = (exData.data ?? []).map((v: any) => v.slug).filter(Boolean)
      } catch {}

      const res = await fetch('/api/maker-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, category, districtIds: selectedDistricts, mode, existingSlugs }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)

      addLog('Extracting details with Claude Haiku...')
      const parsed: any[] = data.makers ?? []
      const newCount = data.newCount ?? parsed.length
      const listedCount = parsed.length - newCount
      addLog(`✓ ${newCount} new maker${newCount !== 1 ? 's' : ''}${listedCount > 0 ? ` · ${listedCount} already listed` : ''}`)

      const processed: Maker[] = parsed.map((m, i) => {
        const maker: Maker = {
          ...m, id: `m${i}-${Date.now()}`, slug: slugify(m.name),
          selected: !m.already_listed && m.confidence !== 'low',
          candidate_images: m.candidate_images ?? [],
          selected_images: [],
          already_listed: !!m.already_listed,
          exportData: null,
        }
        maker.exportData = buildExportObject(maker, category, selectedDistricts, selectedDistrictNames())
        return maker
      })
      setMakers(processed)
    } catch (err: any) {
      const msg = err.message ?? 'Unknown error'
      setError(msg); addLog(`✗ ${msg}`)
    }
    setScanning(false)
  }

  function update(id: string, field: string, val: any) {
    setMakers(prev => prev.map(m => {
      if (m.id !== id) return m
      const u = { ...m, [field]: val }
      if (field === 'name') u.slug = slugify(val)
      u.exportData = buildExportObject(u, category, selectedDistricts, selectedDistrictNames())
      return u
    }))
  }

  function updateDetail(id: string, key: string, val: any) {
    setMakers(prev => prev.map(m => {
      if (m.id !== id) return m
      const u = { ...m, category_details: { ...m.category_details, [key]: val } }
      u.exportData = buildExportObject(u, category, selectedDistricts, selectedDistrictNames())
      return u
    }))
  }

  function selectImage(id: string, url: string) {
    setMakers(prev => prev.map(m => {
      if (m.id !== id) return m
      const already = m.selected_images.includes(url)
      const selected_images = already ? m.selected_images.filter(u => u !== url) : [...m.selected_images, url]
      const u = { ...m, selected_images }
      u.exportData = buildExportObject(u, category, selectedDistricts, selectedDistrictNames())
      return u
    }))
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(''), 2000)
  }

  function generateBulk() {
    const sel = makers.filter(m => m.selected && !m.already_listed)
    if (!sel.length) return
    const exportPayload = {
      action: 'insert_makers',
      category,
      makers: sel.map(m => m.exportData),
    }
    setBulkExport(JSON.stringify(exportPayload, null, 2))
    setShowBulk(true)
  }

  const newMakers = makers.filter(m => !m.already_listed)
  const listedMakers = makers.filter(m => m.already_listed)
  const selCount = makers.filter(m => m.selected && !m.already_listed).length

  function renderDetailFields(m: Maker) {
    switch (category) {
      case 'photography_video':
        return (
          <>
            <DetailToggle label="Offers video" val={!!m.category_details.offers_video} onChange={v => updateDetail(m.id, 'offers_video', v)}/>
            <DetailToggle label="Has drone" val={!!m.category_details.has_drone} onChange={v => updateDetail(m.id, 'has_drone', v)}/>
            <NumField label="Turnaround (days)" val={m.category_details.turnaround_days ?? 0} onChange={v => updateDetail(m.id, 'turnaround_days', v)}/>
          </>
        )
      case 'catering':
        return (
          <>
            <DetailToggle label="Live counters" val={!!m.category_details.live_counters} onChange={v => updateDetail(m.id, 'live_counters', v)}/>
            <DetailToggle label="Brings staff" val={!!m.category_details.brings_staff} onChange={v => updateDetail(m.id, 'brings_staff', v)}/>
            <NumField label="Min guests" val={m.min_guests} onChange={v => update(m.id, 'min_guests', v)}/>
            <NumField label="Max guests" val={m.max_guests} onChange={v => update(m.id, 'max_guests', v)}/>
          </>
        )
      case 'decoration_florals':
        return (
          <>
            <DetailToggle label="Does mandapam" val={!!m.category_details.does_mandapam} onChange={v => updateDetail(m.id, 'does_mandapam', v)}/>
            <DetailToggle label="Includes lighting" val={!!m.category_details.includes_lighting} onChange={v => updateDetail(m.id, 'includes_lighting', v)}/>
          </>
        )
      case 'event_management':
        return (
          <>
            <DetailToggle label="Has vendor network" val={!!m.category_details.has_vendor_network} onChange={v => updateDetail(m.id, 'has_vendor_network', v)}/>
            <NumField label="Events handled" val={m.category_details.events_handled ?? 0} onChange={v => updateDetail(m.id, 'events_handled', v)}/>
          </>
        )
      case 'beauty_styling':
        return (
          <>
            <DetailToggle label="Bridal specialist" val={!!m.category_details.bridal_specialist} onChange={v => updateDetail(m.id, 'bridal_specialist', v)}/>
            <DetailToggle label="Offers trial" val={m.offers_trial} onChange={v => update(m.id, 'offers_trial', v)}/>
            <DetailToggle label="Home service" val={m.home_service} onChange={v => update(m.id, 'home_service', v)}/>
          </>
        )
      default: return null
    }
  }

  function DetailToggle({ label, val, onChange }: { label: string; val: boolean; onChange: (v: boolean) => void }) {
    return (
      <button onClick={() => onChange(!val)} style={{ ...sans, fontSize: 11, padding: '7px 10px', border: `1px solid ${val ? C.green : C.cream3}`, background: val ? '#f0faf4' : 'white', color: val ? C.green : C.muted, cursor: 'pointer', textAlign: 'left' as const }}>
        {val ? '✓ ' : '○ '}{label}
      </button>
    )
  }
  function NumField({ label, val, onChange }: { label: string; val: number; onChange: (v: number) => void }) {
    return (
      <div>
        <label style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>{label.toUpperCase()}</label>
        <input type="number" value={val} onChange={e => onChange(parseInt(e.target.value) || 0)} style={{ ...inp, padding: '8px 10px', fontSize: 13 }}/>
      </div>
    )
  }

  function renderMaker(m: Maker) {
    return (
      <div key={m.id} style={{ background: 'white', border: m.already_listed ? `1px dashed ${C.cream3}` : m.selected ? `1.5px solid ${C.green}` : `1px solid ${C.cream3}`, opacity: m.already_listed ? 0.6 : 1 }}>
        <div style={{ padding: '14px 14px 10px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
              {m.already_listed
                ? <span style={{ ...sans, fontSize: 9, fontWeight: 700, color: C.muted, border: `1px solid ${C.cream3}`, padding: '2px 6px' }}>ALREADY LISTED</span>
                : <span style={{ ...sans, fontSize: 9, fontWeight: 700, color: CONFIDENCE_COLOR[m.confidence], border: `1px solid ${CONFIDENCE_COLOR[m.confidence]}`, padding: '2px 6px' }}>{m.confidence.toUpperCase()}</span>
              }
            </div>
            <div style={{ ...serif, fontSize: 16, color: C.text, marginBottom: 2 }}>{m.name}</div>
            {m.phone && <div style={{ ...sans, fontSize: 11, color: C.green, marginTop: 4 }}>📞 {m.phone}</div>}
            {m.instagram_url && <div style={{ ...sans, fontSize: 11, color: C.terra, marginTop: 2 }}>📷 {m.instagram_url.replace(/https?:\/\/(www\.)?instagram\.com\//, '@')}</div>}
          </div>
          {!m.already_listed && (
            <button onClick={() => update(m.id, 'selected', !m.selected)} style={{ width: 28, height: 28, border: `1.5px solid ${m.selected ? C.green : C.cream3}`, background: m.selected ? C.green : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {m.selected && <svg viewBox="0 0 14 14" fill="none" width={12} height={12} stroke="white" strokeWidth={2}><path d="M2 7l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
          )}
        </div>

        {!m.already_listed && m.candidate_images.length > 0 && (
          <div style={{ padding: '0 14px 12px' }}>
            <div style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em', marginBottom: 8 }}>SELECT PHOTOS — tap to add/remove</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }} className="no-scrollbar">
              {m.candidate_images.map((url, i) => (
                <div key={i} onClick={() => selectImage(m.id, url)} style={{ flexShrink: 0, width: 90, height: 68, position: 'relative', cursor: 'pointer', border: m.selected_images.includes(url) ? `2px solid ${C.terra}` : `1px solid ${C.cream3}` }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={e => { const d = (e.target as HTMLImageElement).closest('div'); if (d) d.style.display = 'none' }}/>
                  {m.selected_images.includes(url) && (
                    <div style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, background: C.terra, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 10 10" fill="none" width={8} height={8} stroke="white" strokeWidth={1.5}><path d="M2 5l2 2 4-4"/></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {m.selected_images.length > 0 && <div style={{ ...sans, fontSize: 10, color: C.muted, marginTop: 6 }}>⚠️ {m.selected_images.length} photo{m.selected_images.length > 1 ? 's' : ''} selected · Reference only — confirm before publishing</div>}
          </div>
        )}

        {!m.already_listed && (
          <div style={{ borderTop: `1px solid ${C.cream3}` }}>
            <button onClick={() => setExpandedId(expandedId === m.id ? null : m.id)} style={{ ...sans, width: '100%', padding: '9px 14px', fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const, display: 'flex', justifyContent: 'space-between' }}>
              <span>Review & edit</span><span>{expandedId === m.id ? '▲' : '▼'}</span>
            </button>
            {expandedId === m.id && (
              <div style={{ padding: '0 14px 16px', borderTop: `1px solid ${C.cream3}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Name','name',m.name],['Slug','slug',m.slug],['Tagline','tagline',m.tagline],['WhatsApp','whatsapp',m.whatsapp],['Phone','phone',m.phone],['Instagram URL','instagram_url',m.instagram_url],['Facebook URL','facebook_url',m.facebook_url],['Price guide','price_guide',m.price_guide]].map(([label,field,val]) => (
                  <div key={field as string}>
                    <label style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em', display: 'block', marginBottom: 4 }}>{(label as string).toUpperCase()}</label>
                    <input value={val as string} onChange={e => update(m.id, field as string, e.target.value)} style={{ ...inp, padding: '8px 12px', fontSize: 13 }}/>
                  </div>
                ))}
                <div>
                  <label style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
                  <textarea value={m.description} onChange={e => update(m.id, 'description', e.target.value)} rows={4} style={{ ...inp, padding: '8px 12px', fontSize: 13, resize: 'vertical' as const }}/>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <NumField label="Years experience" val={m.years_experience} onChange={v => update(m.id, 'years_experience', v)}/>
                  <NumField label="Team size" val={m.team_size} onChange={v => update(m.id, 'team_size', v)}/>
                </div>
                <div>
                  <label style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em', display: 'block', marginBottom: 8 }}>CATEGORY DETAILS</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {renderDetailFields(m)}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em' }}>EXPORT DATA — paste to Claude to push live</label>
                    <button onClick={() => copy(JSON.stringify(m.exportData, null, 2), m.id)} style={{ ...sans, fontSize: 10, color: copied === m.id ? C.green : C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>{copied === m.id ? '✓ Copied' : 'Copy'}</button>
                  </div>
                  <pre style={{ ...mono, fontSize: 10, background: C.green2, color: 'rgba(255,255,255,.65)', padding: '10px 12px', overflowX: 'auto', whiteSpace: 'pre-wrap' as const, margin: 0, maxHeight: 180, overflowY: 'auto' }}>{JSON.stringify(m.exportData, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: C.cream, paddingBottom: 80 }}>
      <div style={{ background: C.green, padding: '6px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.5)' }}>തീരം · theeram</span>
        <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.4)' }}>Maker Agent</span>
      </div>
      <div style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}`, padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/curator" style={{ ...sans, fontSize: 12, color: C.muted, textDecoration: 'none' }}>← Curator</Link>
          <span style={{ color: C.cream3 }}>|</span>
          <span style={{ ...serif, fontSize: 18, color: C.text }}>Maker Agent</span>
        </div>
        {newMakers.length > 0 && <span style={{ ...sans, fontSize: 11, color: C.muted }}>{selCount}/{newMakers.length} selected</span>}
      </div>

      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ background: C.green, padding: '16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 14, height: 1, background: C.gold }}/>
            <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.08em' }}>Serper + Claude Haiku</span>
            <div style={{ width: 14, height: 1, background: C.gold }}/>
          </div>
          <p style={{ ...sans, fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.7, fontWeight: 300, margin: 0 }}>
            Makers aren't tied to one town — tag the districts they serve below. Districts guide the search but don't restrict results.
          </p>
        </div>

        {/* Category selector */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em', display: 'block', marginBottom: 8 }}>CATEGORY</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)} style={{ ...sans, padding: '11px 14px', border: `1px solid ${category === c.id ? C.green : C.cream3}`, background: category === c.id ? '#f0faf4' : 'white', color: category === c.id ? C.green : C.muted, cursor: 'pointer', textAlign: 'left' as const, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                <span>{c.label}</span><span style={{ fontSize: 11, opacity: .6 }}>{c.ml}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Districts served */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em', display: 'block', marginBottom: 8 }}>DISTRICTS SERVED (optional, guides search)</label>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {districts.map(d => (
              <button key={d.id} onClick={() => toggleDistrict(d.id)} style={{ ...sans, fontSize: 11, padding: '6px 12px', border: `1px solid ${selectedDistricts.includes(d.id) ? C.terra : C.cream3}`, background: selectedDistricts.includes(d.id) ? '#fdf0eb' : 'white', color: selectedDistricts.includes(d.id) ? C.terra : C.muted, cursor: 'pointer' }}>{d.name}</button>
            ))}
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setMode('discovery')} style={{ ...sans, flex: 1, padding: '12px 10px', border: `1px solid ${mode === 'discovery' ? C.green : C.cream3}`, background: mode === 'discovery' ? '#f0faf4' : 'white', color: mode === 'discovery' ? C.green : C.muted, cursor: 'pointer', textAlign: 'left' as const }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>📍 Discovery scan</div>
            <div style={{ fontSize: 10, fontWeight: 300 }}>Find all makers for this search</div>
          </button>
          <button onClick={() => setMode('name_lookup')} style={{ ...sans, flex: 1, padding: '12px 10px', border: `1px solid ${mode === 'name_lookup' ? C.green : C.cream3}`, background: mode === 'name_lookup' ? '#f0faf4' : 'white', color: mode === 'name_lookup' ? C.green : C.muted, cursor: 'pointer', textAlign: 'left' as const }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>🔍 Find by name</div>
            <div style={{ fontSize: 10, fontWeight: 300 }}>Look up a specific maker</div>
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>{mode === 'name_lookup' ? 'MAKER NAME' : 'SEARCH QUERY'}</label>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && !scanning && runScan()}
            placeholder={mode === 'name_lookup' ? 'e.g. Lensmoods Photography' : 'e.g. wedding photographers Kottayam'} style={inp}/>
        </div>

        <button onClick={runScan} disabled={scanning || !query.trim()} style={{ ...sans, width: '100%', background: scanning ? C.muted : C.green, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, padding: '14px 0', border: 'none', cursor: scanning ? 'not-allowed' : 'pointer', marginBottom: 20 }}>
          {scanning ? '⟳  Scanning...' : mode === 'name_lookup' ? '🔍  Look up maker' : '⟳  Run discovery scan'}
        </button>

        {log.length > 0 && (
          <div style={{ background: C.green2, padding: '12px 14px', marginBottom: 20 }}>
            {log.map((l, i) => <p key={i} style={{ ...mono, fontSize: 11, color: i === log.length - 1 ? C.gold : 'rgba(255,255,255,.45)', margin: '3px 0' }}>{l}</p>)}
          </div>
        )}
        {error && <div style={{ background: '#fdf0eb', border: `1px solid ${C.terra}`, padding: '12px 14px', marginBottom: 20 }}><p style={{ ...sans, fontSize: 13, color: C.terra, margin: 0 }}>{error}</p></div>}

        {newMakers.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{ width: 14, height: 1, background: C.terra }}/>
              <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>NEW MAKERS ({newMakers.length})</span>
              <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>{newMakers.map(renderMaker)}</div>
          </>
        )}

        {listedMakers.length > 0 && (
          <>
            <button onClick={() => setShowListed(!showListed)} style={{ ...sans, width: '100%', textAlign: 'left' as const, background: 'none', border: `1px solid ${C.cream3}`, padding: '10px 14px', cursor: 'pointer', marginBottom: 12, display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 12 }}>
              <span>{listedMakers.length} already in your makers list</span><span>{showListed ? '▲ Hide' : '▼ Show'}</span>
            </button>
            {showListed && <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>{listedMakers.map(renderMaker)}</div>}
          </>
        )}

        {showBulk && bulkExport && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ ...serif, fontSize: 16, color: C.text }}>Export — {selCount} makers</span>
              <button onClick={() => copy(bulkExport, 'bulk')} style={{ ...sans, fontSize: 11, color: copied === 'bulk' ? C.green : C.terra, border: `1px solid ${copied === 'bulk' ? C.green : C.terra}`, padding: '6px 14px', background: 'none', cursor: 'pointer', fontWeight: 600 }}>{copied === 'bulk' ? '✓ Copied!' : 'Copy export data'}</button>
            </div>
            <p style={{ ...sans, fontSize: 12, color: C.muted, marginBottom: 10 }}>
              Paste this into your chat with Claude and ask it to push these makers live. Claude will insert directly into Supabase as Draft — review what it plans to insert before confirming.
            </p>
            <pre style={{ ...mono, fontSize: 10, background: C.green2, color: 'rgba(255,255,255,.65)', padding: '14px', overflowX: 'auto', whiteSpace: 'pre-wrap' as const, margin: 0, maxHeight: 400, overflowY: 'auto' }}>{bulkExport}</pre>
          </div>
        )}
      </div>

      {newMakers.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.cream, borderTop: `1px solid ${C.cream3}`, padding: '12px 16px', display: 'flex', gap: 10, zIndex: 30 }}>
          <button onClick={() => setMakers(prev => prev.map(m => m.already_listed ? m : ({ ...m, selected: true })))} style={{ ...sans, flex: 1, border: `1px solid ${C.cream3}`, background: 'white', color: C.muted, fontSize: 11, fontWeight: 500, padding: '11px 0', cursor: 'pointer' }}>Select all new</button>
          <button onClick={generateBulk} disabled={selCount === 0} style={{ ...sans, flex: 2, background: selCount === 0 ? C.muted : C.green, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, padding: '11px 0', border: 'none', cursor: selCount === 0 ? 'not-allowed' : 'pointer' }}>
            Export {selCount} maker{selCount !== 1 ? 's' : ''} for Claude
          </button>
        </div>
      )}
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  )
}
