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

interface Venue {
  id: string
  name: string; slug: string; type: string
  tagline: string; description: string
  phone: string; whatsapp: string
  price_guide: string; location: string
  instagram: string; maps_url: string
  room_count: number; bathroom_count: number
  max_overnight: number; max_day: number
  has_pool: boolean; has_ac_hall: boolean; has_open_lawn: boolean
  has_kitchen: boolean; has_parking: boolean; has_generator: boolean
  alcohol_allowed: boolean; outside_catering: boolean
  ac_hall_capacity: number; parking_count: number
  event_types: string[]
  confidence: 'high' | 'medium' | 'low'
  source: string
  candidate_images: string[]
  selected_images: string[]
  already_listed: boolean
  selected: boolean
  sql: string
}

const EVENT_TYPES = [
  { id: 'staycation', label: 'Staycation' },
  { id: 'family_gathering', label: 'Family Gathering' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'corporate', label: 'Corporate' },
  { id: 'birthday', label: 'Birthday' },
  { id: 'retreat', label: 'Retreat' },
]

const PROPERTY_TYPES: Record<string, string> = {
  villa_with_pool: 'Villa with pool', villa_without_pool: 'Villa',
  heritage_home: 'Tharavadu / Heritage', open_event_space: 'Event lawn / Party hall',
  auditorium: 'Auditorium / Convention', river_frontage: 'Riverside',
  lodging: 'Lodging / Homestay', resort: 'Resort',
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high: '#2D7A4F', medium: '#8A7040', low: '#9B3D1E',
}

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// Escape ALL string fields to prevent SQL breakage
function esc(s: string) {
  return (s ?? '').replace(/'/g, "''")
}

function n(x: any): number {
  const v = Number(x)
  return Number.isFinite(v) ? Math.floor(v) : 0
}

function buildSQL(v: Venue, townId?: string | null): string {
  const wa = (v.whatsapp || v.phone || '').replace(/\D/g, '')
  const eventTypes = v.event_types?.length ? v.event_types : ['family_gathering']
  const types = eventTypes.map(e => `'${esc(e)}'`).join(',')
  const photoArr = (v.selected_images ?? []).filter(Boolean)
  const photos = photoArr.length ? `'{${photoArr.map(esc).join(',')}}'` : `'{}'`
  const townCol = townId ? `,town_id` : ''
  const townVal = townId ? `,'${esc(townId)}'` : ''
  return `WITH ins AS (
  INSERT INTO public.properties (name,slug,tagline,description,owner_whatsapp,owner_name,price_guide,photos,is_active,is_featured,sort_order,instagram_url,maps_url,property_type${townCol})
  VALUES ('${esc(v.name)}','${esc(v.slug)}','${esc(v.tagline)}','${esc(v.description)}','${esc(wa)}','${esc(v.name)}','${esc(v.price_guide)}',${photos},false,false,0,'${esc(v.instagram)}','${esc(v.maps_url)}','${esc(v.type)}'${townVal})
  RETURNING id
),
attrs AS (
  INSERT INTO public.property_attributes (property_id,room_count,bathroom_count,max_guests_overnight,max_guests_day_event,has_pool,has_ac_hall,has_open_lawn,has_kitchen,has_parking,has_generator,alcohol_allowed,outside_catering,ac_hall_capacity,open_lawn_sqft,parking_count)
  SELECT id,${n(v.room_count)},${n(v.bathroom_count)},${n(v.max_overnight)},${n(v.max_day)},${!!v.has_pool},${!!v.has_ac_hall},${!!v.has_open_lawn},${!!v.has_kitchen},${!!v.has_parking},${!!v.has_generator},${!!v.alcohol_allowed},${!!v.outside_catering},${n(v.ac_hall_capacity)},0,${n(v.parking_count)} FROM ins
)
INSERT INTO public.property_event_types (property_id,event_type)
SELECT id,unnest(ARRAY[${types}]::text[]) FROM ins;`
}

export default function AgentPage() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'discovery' | 'name_lookup'>('discovery')
  const [townId, setTownId] = useState<string | null>(null)
  const [townSlug, setTownSlug] = useState('')
  const [townName, setTownName] = useState('')
  const [scanning, setScanning] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [log, setLog] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copied, setCopied] = useState('')
  const [bulkSQL, setBulkSQL] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [error, setError] = useState('')
  const [showListed, setShowListed] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tn = params.get('town')
    const tid = params.get('townId')
    const ts = params.get('townSlug')
    if (tn) { setTownName(tn); setQuery(`party halls villas event spaces ${tn} Kerala`) }
    if (tid) setTownId(tid)
    if (ts) setTownSlug(ts)
  }, [])

  function addLog(msg: string) {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`])
  }

  async function runScan() {
    if (!query.trim()) return
    setScanning(true); setVenues([]); setLog([])
    setError(''); setBulkSQL(''); setShowBulk(false); setShowListed(false)
    addLog(`${mode === 'name_lookup' ? '🔍 Name lookup' : '📍 Discovery scan'}: "${query}"`)
    addLog('Running targeted searches via Serper...')
    try {
      // Fetch existing slugs so the agent can flag already-listed venues
      let existingSlugs: string[] = []
      try {
        const exRes = await fetch('/api/properties?all=1')
        const exData = await exRes.json()
        existingSlugs = (exData.data ?? []).map((p: any) => p.slug).filter(Boolean)
      } catch {}

      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, townId, townSlug, mode, existingSlugs }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`)

      addLog('Extracting details with Claude Haiku...')
      const parsed: any[] = data.venues ?? []
      const resolvedTownId = data.townId ?? townId
      const newCount = data.newCount ?? parsed.length
      const listedCount = parsed.length - newCount
      addLog(`✓ ${newCount} new venue${newCount !== 1 ? 's' : ''}${listedCount > 0 ? ` · ${listedCount} already listed` : ''}`)

      const processed: Venue[] = parsed.map((v, i) => {
        const venue: Venue = {
          ...v,
          id: `v${i}-${Date.now()}`,
          slug: slugify(v.name),
          selected: !v.already_listed && v.confidence !== 'low',
          candidate_images: v.candidate_images ?? [],
          selected_images: [],  // user picks manually
          already_listed: !!v.already_listed,
          sql: '',
        }
        venue.sql = buildSQL(venue, resolvedTownId)
        return venue
      })
      setVenues(processed)
    } catch (err: any) {
      const msg = err.message ?? 'Unknown error'
      setError(msg); addLog(`✗ ${msg}`)
    }
    setScanning(false)
  }

  function update(id: string, field: string, val: any) {
    setVenues(prev => prev.map(v => {
      if (v.id !== id) return v
      const u = { ...v, [field]: val }
      if (field === 'name') u.slug = slugify(val)
      u.sql = buildSQL(u, townId)
      return u
    }))
  }

  function selectImage(id: string, url: string) {
    setVenues(prev => prev.map(v => {
      if (v.id !== id) return v
      const already = v.selected_images.includes(url)
      const selected_images = already
        ? v.selected_images.filter(u => u !== url)
        : [...v.selected_images, url]
      const u = { ...v, selected_images }
      u.sql = buildSQL(u, townId)
      return u
    }))
  }

  function toggleET(id: string, et: string) {
    setVenues(prev => prev.map(v => {
      if (v.id !== id) return v
      const types = v.event_types.includes(et)
        ? v.event_types.filter(t => t !== et)
        : [...v.event_types, et]
      const u = { ...v, event_types: types }
      u.sql = buildSQL(u, townId)
      return u
    }))
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(''), 2000)
  }

  function generateBulk() {
    const sel = venues.filter(v => v.selected && !v.already_listed)
    if (!sel.length) return
    setBulkSQL(sel.map(v => `-- ${v.name} (${v.confidence})\n${v.sql}`).join('\n\n'))
    setShowBulk(true)
  }

  const newVenues = venues.filter(v => !v.already_listed)
  const listedVenues = venues.filter(v => v.already_listed)
  const selCount = venues.filter(v => v.selected && !v.already_listed).length

  function renderVenue(v: Venue) {
    return (
      <div key={v.id} style={{ background: 'white', border: v.already_listed ? `1px dashed ${C.cream3}` : v.selected ? `1.5px solid ${C.green}` : `1px solid ${C.cream3}`, opacity: v.already_listed ? 0.6 : 1 }}>
        <div style={{ padding: '14px 14px 10px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
              {v.already_listed
                ? <span style={{ ...sans, fontSize: 9, fontWeight: 700, color: C.muted, border: `1px solid ${C.cream3}`, padding: '2px 6px' }}>ALREADY LISTED</span>
                : <span style={{ ...sans, fontSize: 9, fontWeight: 700, color: CONFIDENCE_COLOR[v.confidence], border: `1px solid ${CONFIDENCE_COLOR[v.confidence]}`, padding: '2px 6px' }}>{v.confidence.toUpperCase()}</span>
              }
              <span style={{ ...sans, fontSize: 10, color: C.muted }}>{PROPERTY_TYPES[v.type] ?? v.type}</span>
            </div>
            <div style={{ ...serif, fontSize: 16, color: C.text, marginBottom: 2 }}>{v.name}</div>
            <div style={{ ...sans, fontSize: 11, color: C.muted, fontWeight: 300 }}>{v.location}</div>
            {v.phone && <div style={{ ...sans, fontSize: 11, color: C.green, marginTop: 4 }}>📞 {v.phone}</div>}
          </div>
          {!v.already_listed && (
            <button onClick={() => update(v.id, 'selected', !v.selected)} style={{ width: 28, height: 28, border: `1.5px solid ${v.selected ? C.green : C.cream3}`, background: v.selected ? C.green : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {v.selected && <svg viewBox="0 0 14 14" fill="none" width={12} height={12} stroke="white" strokeWidth={2}><path d="M2 7l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
          )}
        </div>

        {!v.already_listed && v.candidate_images.length > 0 && (
          <div style={{ padding: '0 14px 12px' }}>
            <div style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em', marginBottom: 8 }}>SELECT PHOTOS — tap to add, tap again to remove</div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }} className="no-scrollbar">
              {v.candidate_images.map((url, i) => (
                <div key={i} onClick={() => selectImage(v.id, url)}
                  style={{ flexShrink: 0, width: 90, height: 68, position: 'relative', cursor: 'pointer', border: v.selected_images.includes(url) ? `2px solid ${C.terra}` : `1px solid ${C.cream3}` }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => { const d = (e.target as HTMLImageElement).closest('div'); if (d) d.style.display = 'none' }}/>
                  {v.selected_images.includes(url) && (
                    <div style={{ position: 'absolute', top: 3, right: 3, width: 16, height: 16, background: C.terra, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 10 10" fill="none" width={8} height={8} stroke="white" strokeWidth={1.5}><path d="M2 5l2 2 4-4"/></svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {v.selected_images.length > 0 && <div style={{ ...sans, fontSize: 10, color: C.muted, marginTop: 6 }}>⚠️ {v.selected_images.length} photo{v.selected_images.length > 1 ? 's' : ''} selected · Reference only — confirm with owner before publishing</div>}
          </div>
        )}

        {!v.already_listed && (
          <div style={{ borderTop: `1px solid ${C.cream3}` }}>
            <button onClick={() => setExpandedId(expandedId === v.id ? null : v.id)} style={{ ...sans, width: '100%', padding: '9px 14px', fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const, display: 'flex', justifyContent: 'space-between' }}>
              <span>Review & edit</span><span>{expandedId === v.id ? '▲' : '▼'}</span>
            </button>

            {expandedId === v.id && (
              <div style={{ padding: '0 14px 16px', borderTop: `1px solid ${C.cream3}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Name','name',v.name],['Slug','slug',v.slug],['Tagline','tagline',v.tagline],['WhatsApp','whatsapp',v.whatsapp],['Phone','phone',v.phone],['Price guide','price_guide',v.price_guide],['Instagram','instagram',v.instagram],['Maps URL','maps_url',v.maps_url]].map(([label,field,val]) => (
                  <div key={field as string}>
                    <label style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em', display: 'block', marginBottom: 4 }}>{(label as string).toUpperCase()}</label>
                    <input value={val as string} onChange={e => update(v.id, field as string, e.target.value)} style={{ ...inp, padding: '8px 12px', fontSize: 13 }}/>
                  </div>
                ))}
                <div>
                  <label style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em', display: 'block', marginBottom: 4 }}>DESCRIPTION</label>
                  <textarea value={v.description} onChange={e => update(v.id, 'description', e.target.value)} rows={4} style={{ ...inp, padding: '8px 12px', fontSize: 13, resize: 'vertical' as const }}/>
                </div>
                <div>
                  <label style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em', display: 'block', marginBottom: 6 }}>PROPERTY TYPE</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                    {Object.entries(PROPERTY_TYPES).map(([key, label]) => (
                      <button key={key} onClick={() => update(v.id, 'type', key)} style={{ ...sans, fontSize: 10, padding: '5px 10px', border: `1px solid ${v.type === key ? C.terra : C.cream3}`, background: v.type === key ? '#fdf0eb' : 'white', color: v.type === key ? C.terra : C.muted, cursor: 'pointer' }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[['Rooms','room_count',v.room_count],['Bathrooms','bathroom_count',v.bathroom_count],['Max overnight','max_overnight',v.max_overnight],['Max day event','max_day',v.max_day],['AC hall cap.','ac_hall_capacity',v.ac_hall_capacity],['Parking count','parking_count',v.parking_count]].map(([label,field,val]) => (
                    <div key={field as string}>
                      <label style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.06em', display: 'block', marginBottom: 4 }}>{(label as string).toUpperCase()}</label>
                      <input type="number" value={val as number} onChange={e => update(v.id, field as string, parseInt(e.target.value)||0)} style={{ ...inp, padding: '8px 10px', fontSize: 13 }}/>
                    </div>
                  ))}
                </div>
                <div>
                  <label style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em', display: 'block', marginBottom: 8 }}>FACILITIES</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[['has_pool','Pool'],['has_ac_hall','AC Hall'],['has_open_lawn','Open Lawn'],['has_kitchen','Kitchen'],['has_parking','Parking'],['has_generator','Generator'],['alcohol_allowed','Alcohol'],['outside_catering','Outside catering']].map(([field,label]) => (
                      <button key={field} onClick={() => update(v.id, field, !(v as any)[field])} style={{ ...sans, fontSize: 11, padding: '7px 10px', border: `1px solid ${(v as any)[field] ? C.green : C.cream3}`, background: (v as any)[field] ? '#f0faf4' : 'white', color: (v as any)[field] ? C.green : C.muted, cursor: 'pointer', textAlign: 'left' as const }}>
                        {(v as any)[field] ? '✓ ' : '○ '}{label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em', display: 'block', marginBottom: 8 }}>EVENT TYPES</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                    {EVENT_TYPES.map(et => (
                      <button key={et.id} onClick={() => toggleET(v.id, et.id)} style={{ ...sans, fontSize: 11, padding: '6px 12px', border: `1px solid ${v.event_types.includes(et.id) ? C.terra : C.cream3}`, background: v.event_types.includes(et.id) ? '#fdf0eb' : 'white', color: v.event_types.includes(et.id) ? C.terra : C.muted, cursor: 'pointer' }}>{et.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em' }}>GENERATED SQL</label>
                    <button onClick={() => copy(v.sql, v.id)} style={{ ...sans, fontSize: 10, color: copied === v.id ? C.green : C.muted, background: 'none', border: 'none', cursor: 'pointer' }}>{copied === v.id ? '✓ Copied' : 'Copy'}</button>
                  </div>
                  <pre style={{ ...mono, fontSize: 10, background: C.green2, color: 'rgba(255,255,255,.65)', padding: '10px 12px', overflowX: 'auto', whiteSpace: 'pre-wrap' as const, margin: 0, maxHeight: 180, overflowY: 'auto' }}>{v.sql}</pre>
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
        <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.4)' }}>Listing Agent</span>
      </div>

      <div style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}`, padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/curator" style={{ ...sans, fontSize: 12, color: C.muted, textDecoration: 'none' }}>← Curator</Link>
          <span style={{ color: C.cream3 }}>|</span>
          <span style={{ ...serif, fontSize: 18, color: C.text }}>Listing Agent</span>
        </div>
        {newVenues.length > 0 && <span style={{ ...sans, fontSize: 11, color: C.muted }}>{selCount}/{newVenues.length} selected</span>}
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        <div style={{ background: C.green, padding: '16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 14, height: 1, background: C.gold }}/>
            <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.08em' }}>Serper + Claude Haiku</span>
            <div style={{ width: 14, height: 1, background: C.gold }}/>
          </div>
          <p style={{ ...sans, fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.7, fontWeight: 300, margin: 0 }}>
            Each scan costs under ₹1. Already-listed venues are flagged and skipped. Pick a mode below.
          </p>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button onClick={() => setMode('discovery')} style={{ ...sans, flex: 1, padding: '12px 10px', border: `1px solid ${mode === 'discovery' ? C.green : C.cream3}`, background: mode === 'discovery' ? '#f0faf4' : 'white', color: mode === 'discovery' ? C.green : C.muted, cursor: 'pointer', textAlign: 'left' as const }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>📍 Discovery scan</div>
            <div style={{ fontSize: 10, fontWeight: 300 }}>Find all venues in a town</div>
          </button>
          <button onClick={() => setMode('name_lookup')} style={{ ...sans, flex: 1, padding: '12px 10px', border: `1px solid ${mode === 'name_lookup' ? C.green : C.cream3}`, background: mode === 'name_lookup' ? '#f0faf4' : 'white', color: mode === 'name_lookup' ? C.green : C.muted, cursor: 'pointer', textAlign: 'left' as const }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>🔍 Find by name</div>
            <div style={{ fontSize: 10, fontWeight: 300 }}>Look up a specific venue</div>
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>
            {mode === 'name_lookup' ? 'VENUE NAME' : 'SEARCH QUERY'}
          </label>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && !scanning && runScan()}
            placeholder={mode === 'name_lookup' ? 'e.g. Vayal by TTK Homes' : 'e.g. party halls Pala Kerala'} style={inp}/>
          {mode === 'discovery' && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const }}>
              {['party halls Pala Kerala', 'villas Pala Kerala', 'heritage homes Pala Kerala', 'party halls Thodupuzha', 'villas Kanjirappally Kerala'].map(q => (
                <button key={q} onClick={() => setQuery(q)} style={{ ...sans, fontSize: 10, color: C.muted, border: `1px solid ${C.cream3}`, padding: '4px 10px', background: 'white', cursor: 'pointer' }}>{q}</button>
              ))}
            </div>
          )}
        </div>

        <button onClick={runScan} disabled={scanning || !query.trim()} style={{ ...sans, width: '100%', background: scanning ? C.muted : C.green, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, padding: '14px 0', border: 'none', cursor: scanning ? 'not-allowed' : 'pointer', marginBottom: 20 }}>
          {scanning ? '⟳  Scanning...' : mode === 'name_lookup' ? '🔍  Look up venue' : '⟳  Run discovery scan'}
        </button>

        {log.length > 0 && (
          <div style={{ background: C.green2, padding: '12px 14px', marginBottom: 20 }}>
            {log.map((l, i) => (
              <p key={i} style={{ ...mono, fontSize: 11, color: i === log.length - 1 ? C.gold : 'rgba(255,255,255,.45)', margin: '3px 0' }}>{l}</p>
            ))}
          </div>
        )}

        {error && (
          <div style={{ background: '#fdf0eb', border: `1px solid ${C.terra}`, padding: '12px 14px', marginBottom: 20 }}>
            <p style={{ ...sans, fontSize: 13, color: C.terra, margin: 0 }}>{error}</p>
          </div>
        )}

        {/* New venues */}
        {newVenues.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{ width: 14, height: 1, background: C.terra }}/>
              <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>NEW VENUES ({newVenues.length})</span>
              <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {newVenues.map(renderVenue)}
            </div>
          </>
        )}

        {/* Already listed venues — collapsed */}
        {listedVenues.length > 0 && (
          <>
            <button onClick={() => setShowListed(!showListed)} style={{ ...sans, width: '100%', textAlign: 'left' as const, background: 'none', border: `1px solid ${C.cream3}`, padding: '10px 14px', cursor: 'pointer', marginBottom: 12, display: 'flex', justifyContent: 'space-between', color: C.muted, fontSize: 12 }}>
              <span>{listedVenues.length} already in your listings</span>
              <span>{showListed ? '▲ Hide' : '▼ Show'}</span>
            </button>
            {showListed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {listedVenues.map(renderVenue)}
              </div>
            )}
          </>
        )}

        {showBulk && bulkSQL && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ ...serif, fontSize: 16, color: C.text }}>Bulk SQL — {selCount} venues</span>
              <button onClick={() => copy(bulkSQL, 'bulk')} style={{ ...sans, fontSize: 11, color: copied === 'bulk' ? C.green : C.terra, border: `1px solid ${copied === 'bulk' ? C.green : C.terra}`, padding: '6px 14px', background: 'none', cursor: 'pointer', fontWeight: 600 }}>{copied === 'bulk' ? '✓ Copied!' : 'Copy all SQL'}</button>
            </div>
            <p style={{ ...sans, fontSize: 12, color: C.muted, marginBottom: 10 }}>Paste into Supabase → SQL Editor → Run. All {selCount} venues inserted as Draft.</p>
            <pre style={{ ...mono, fontSize: 10, background: C.green2, color: 'rgba(255,255,255,.65)', padding: '14px', overflowX: 'auto', whiteSpace: 'pre-wrap' as const, margin: 0, maxHeight: 400, overflowY: 'auto' }}>{bulkSQL}</pre>
          </div>
        )}
      </div>

      {newVenues.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.cream, borderTop: `1px solid ${C.cream3}`, padding: '12px 16px', display: 'flex', gap: 10, zIndex: 30 }}>
          <button onClick={() => setVenues(prev => prev.map(v => v.already_listed ? v : ({ ...v, selected: true })))} style={{ ...sans, flex: 1, border: `1px solid ${C.cream3}`, background: 'white', color: C.muted, fontSize: 11, fontWeight: 500, padding: '11px 0', cursor: 'pointer' }}>Select all new</button>
          <button onClick={generateBulk} disabled={selCount === 0} style={{ ...sans, flex: 2, background: selCount === 0 ? C.muted : C.green, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, padding: '11px 0', border: 'none', cursor: selCount === 0 ? 'not-allowed' : 'pointer' }}>
            Generate SQL for {selCount} venue{selCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  )
}
