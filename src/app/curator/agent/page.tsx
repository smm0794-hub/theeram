'use client'

import { useState } from 'react'
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
  source: string; selected: boolean; sql: string
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

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function buildSQL(v: Venue): string {
  const wa = v.whatsapp || v.phone.replace(/\D/g, '')
  const esc = (s: string) => s.replace(/'/g, "''")
  const types = v.event_types.map(e => `'${e}'`).join(',')
  return `WITH ins AS (
  INSERT INTO public.properties (name,slug,tagline,description,owner_whatsapp,owner_name,price_guide,photos,is_active,is_featured,sort_order,instagram_url,maps_url,property_type)
  VALUES ('${esc(v.name)}','${v.slug}','${esc(v.tagline)}','${esc(v.description)}','${wa}','${esc(v.name)}','${esc(v.price_guide)}','{}',false,false,0,'${v.instagram}','${v.maps_url}','${v.type}')
  RETURNING id
),
attrs AS (
  INSERT INTO public.property_attributes (property_id,room_count,bathroom_count,max_guests_overnight,max_guests_day_event,has_pool,has_ac_hall,has_open_lawn,has_kitchen,has_parking,has_generator,alcohol_allowed,outside_catering,ac_hall_capacity,open_lawn_sqft,parking_count)
  SELECT id,${v.room_count},${v.bathroom_count},${v.max_overnight},${v.max_day},${v.has_pool},${v.has_ac_hall},${v.has_open_lawn},${v.has_kitchen},${v.has_parking},${v.has_generator},${v.alcohol_allowed},${v.outside_catering},${v.ac_hall_capacity},0,${v.parking_count} FROM ins
)
INSERT INTO public.property_event_types (property_id,event_type)
SELECT id,unnest(ARRAY[${types}]) FROM ins;`
}

const SYSTEM_PROMPT = `You are a venue discovery agent for Theeram Spaces — a curated event venue directory for Pala, Kerala.

Search the web and find event spaces, party halls, villas, homestays, convention centres, and heritage homes in and around Pala, Kottayam district, Kerala. Also cover: Ettumanoor, Erattupetta, Kanjirappally, Changanassery, Bharananganam, Ramapuram.

Return ONLY a valid JSON array. No preamble, no markdown fences. Raw JSON only.

Each object must have exactly these fields:
{
  "name": string,
  "type": "villa_with_pool|villa_without_pool|heritage_home|open_event_space|auditorium|river_frontage|lodging|resort",
  "tagline": "one warm compelling sentence",
  "description": "3-5 sentences, warm editorial tone as if written by a local who visited",
  "phone": "with country code e.g. 919447000000",
  "whatsapp": "same format, empty string if unknown",
  "price_guide": "e.g. Contact owner for pricing",
  "location": "area, Pala or nearby town",
  "instagram": "full URL or empty string",
  "maps_url": "Google Maps URL or empty string",
  "room_count": 0, "bathroom_count": 0, "max_overnight": 0, "max_day": 0,
  "has_pool": false, "has_ac_hall": false, "has_open_lawn": false,
  "has_kitchen": false, "has_parking": false, "has_generator": false,
  "alcohol_allowed": false, "outside_catering": false,
  "ac_hall_capacity": 0, "parking_count": 0,
  "event_types": ["staycation","family_gathering","wedding","corporate","birthday","retreat"],
  "confidence": "high|medium|low",
  "source": "URL or source name"
}

confidence: high = official website or multiple reliable sources with full details. medium = Justdial/Quickerala/Facebook with partial details. low = single mention, minimal details.

Only include venues suitable for private events. No government buildings, schools, hospitals.`

export default function AgentPage() {
  const [query, setQuery] = useState('event spaces party halls villas in Pala Kerala')
  const [scanning, setScanning] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [log, setLog] = useState<string[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copied, setCopied] = useState('')
  const [bulkSQL, setBulkSQL] = useState('')
  const [showBulk, setShowBulk] = useState(false)
  const [error, setError] = useState('')

  function addLog(msg: string) {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`])
  }

  async function runScan() {
    setScanning(true); setVenues([]); setLog([])
    setError(''); setBulkSQL(''); setShowBulk(false)
    addLog(`Scanning for: "${query}"`)
    addLog('Calling agent with web search enabled...')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          system: SYSTEM_PROMPT,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{ role: 'user', content: `Find all event venues for: "${query}". Search Google Maps, Justdial, Quickerala, Facebook, booking sites, local directories. Find as many as possible. Return only the JSON array.` }],
        }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message ?? `API ${res.status}`) }
      const data = await res.json()
      addLog('Agent completed. Parsing results...')
      const text = data.content.map((b: any) => b.type === 'text' ? b.text : '').join('\n')
      const clean = text.replace(/```json|```/g, '').trim()
      const s = clean.indexOf('['), e2 = clean.lastIndexOf(']')
      if (s === -1) throw new Error('No JSON array returned')
      const parsed: any[] = JSON.parse(clean.slice(s, e2 + 1))
      addLog(`Found ${parsed.length} venues. Generating SQL...`)
      const processed: Venue[] = parsed.map((v, i) => {
        const venue: Venue = {
          ...v, id: `v${i}-${Date.now()}`,
          slug: slug(v.name),
          selected: v.confidence !== 'low',
          sql: '',
        }
        venue.sql = buildSQL(venue)
        return venue
      })
      setVenues(processed)
      addLog(`✓ Done — ${processed.filter(v => v.selected).length} venues pre-selected`)
    } catch (err: any) {
      const msg = err.message ?? 'Unknown error'
      setError(msg); addLog(`✗ Error: ${msg}`)
    }
    setScanning(false)
  }

  function update(id: string, field: string, val: any) {
    setVenues(prev => prev.map(v => {
      if (v.id !== id) return v
      const u = { ...v, [field]: val }
      if (field === 'name') u.slug = slug(val)
      u.sql = buildSQL(u)
      return u
    }))
  }

  function toggleET(id: string, et: string) {
    setVenues(prev => prev.map(v => {
      if (v.id !== id) return v
      const types = v.event_types.includes(et) ? v.event_types.filter(t => t !== et) : [...v.event_types, et]
      const u = { ...v, event_types: types }
      u.sql = buildSQL(u)
      return u
    }))
  }

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key); setTimeout(() => setCopied(''), 2000)
  }

  function generateBulk() {
    const sel = venues.filter(v => v.selected)
    if (!sel.length) return
    setBulkSQL(sel.map(v => `-- ${v.name} (${v.confidence})\n${v.sql}`).join('\n\n'))
    setShowBulk(true)
  }

  const selCount = venues.filter(v => v.selected).length

  return (
    <div style={{ minHeight: '100vh', background: C.cream, paddingBottom: 80 }}>
      <div style={{ background: C.green, padding: '6px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em' }}>തീരം · theeram</span>
        <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.4)' }}>Listing Agent</span>
      </div>

      <div style={{ background: C.cream, borderBottom: `1px solid ${C.cream3}`, padding: '13px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/curator" style={{ ...sans, fontSize: 12, color: C.muted, textDecoration: 'none' }}>← Curator</Link>
          <span style={{ color: C.cream3 }}>|</span>
          <span style={{ ...serif, fontSize: 18, color: C.text }}>Listing Agent</span>
        </div>
        {venues.length > 0 && <span style={{ ...sans, fontSize: 11, color: C.muted }}>{selCount} of {venues.length} selected</span>}
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        <div style={{ background: C.green, padding: '18px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 14, height: 1, background: C.gold }}/>
            <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.08em' }}>AI-powered discovery</span>
            <div style={{ width: 14, height: 1, background: C.gold }}/>
          </div>
          <p style={{ ...sans, fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.7, fontWeight: 300, margin: 0 }}>
            The agent searches Google, Justdial, Quickerala, Facebook and local directories. Review each result, edit details, select what meets your standard, then paste the SQL into Supabase. You curate — the agent discovers.
          </p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em', display: 'block', marginBottom: 6 }}>SEARCH QUERY</label>
          <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && !scanning && runScan()} style={inp}/>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' as const }}>
            {['event spaces Pala Kerala', 'wedding venues Pala Kottayam', 'party halls Erattupetta', 'villas homestays Pala', 'convention centres Pala'].map(q => (
              <button key={q} onClick={() => setQuery(q)} style={{ ...sans, fontSize: 10, color: C.muted, border: `1px solid ${C.cream3}`, padding: '4px 10px', background: 'white', cursor: 'pointer' }}>{q}</button>
            ))}
          </div>
        </div>

        <button onClick={runScan} disabled={scanning || !query.trim()} style={{ ...sans, width: '100%', background: scanning ? C.muted : C.green, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, padding: '14px 0', border: 'none', cursor: scanning ? 'not-allowed' : 'pointer', marginBottom: 20 }}>
          {scanning ? '⟳  Agent scanning the web...' : '⟳  Run agent scan'}
        </button>

        {log.length > 0 && (
          <div style={{ background: C.green2, padding: '12px 14px', marginBottom: 20 }}>
            {log.map((l, i) => (
              <p key={i} style={{ ...mono, fontSize: 11, color: i === log.length - 1 ? C.gold : 'rgba(255,255,255,.45)', margin: '3px 0' }}>{l}</p>
            ))}
          </div>
        )}

        {error && <div style={{ background: '#fdf0eb', border: `1px solid ${C.terra}`, padding: '12px 14px', marginBottom: 20 }}><p style={{ ...sans, fontSize: 13, color: C.terra, margin: 0 }}>{error}</p></div>}

        {venues.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
              <div style={{ width: 14, height: 1, background: C.terra }}/>
              <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>DISCOVERED VENUES</span>
              <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {venues.map(v => (
                <div key={v.id} style={{ background: 'white', border: v.selected ? `1.5px solid ${C.green}` : `1px solid ${C.cream3}` }}>

                  <div style={{ padding: '14px 14px 10px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ ...sans, fontSize: 9, fontWeight: 700, color: CONFIDENCE_COLOR[v.confidence], border: `1px solid ${CONFIDENCE_COLOR[v.confidence]}`, padding: '2px 6px', letterSpacing: '.05em' }}>{v.confidence.toUpperCase()}</span>
                        <span style={{ ...sans, fontSize: 10, color: C.muted }}>{PROPERTY_TYPES[v.type] ?? v.type}</span>
                      </div>
                      <div style={{ ...serif, fontSize: 16, color: C.text, marginBottom: 2 }}>{v.name}</div>
                      <div style={{ ...sans, fontSize: 11, color: C.muted, fontWeight: 300 }}>{v.location}</div>
                    </div>
                    <button onClick={() => update(v.id, 'selected', !v.selected)} style={{ width: 28, height: 28, border: `1.5px solid ${v.selected ? C.green : C.cream3}`, background: v.selected ? C.green : 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {v.selected && <svg viewBox="0 0 14 14" fill="none" width={12} height={12} stroke="white" strokeWidth={2}><path d="M2 7l4 4 6-6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                  </div>

                  <div style={{ padding: '0 14px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                    {v.phone && <span style={{ ...sans, fontSize: 10, color: C.muted, background: C.cream2, padding: '3px 8px' }}>📞 {v.phone}</span>}
                    {v.has_pool && <span style={{ ...sans, fontSize: 10, color: C.muted, background: C.cream2, padding: '3px 8px' }}>Pool</span>}
                    {v.has_ac_hall && <span style={{ ...sans, fontSize: 10, color: C.muted, background: C.cream2, padding: '3px 8px' }}>AC hall</span>}
                    {v.has_open_lawn && <span style={{ ...sans, fontSize: 10, color: C.muted, background: C.cream2, padding: '3px 8px' }}>Lawn</span>}
                    {v.max_day > 0 && <span style={{ ...sans, fontSize: 10, color: C.muted, background: C.cream2, padding: '3px 8px' }}>Up to {v.max_day}</span>}
                    {v.source && <span style={{ ...sans, fontSize: 10, color: C.muted, background: C.cream2, padding: '3px 8px' }}>via {v.source.replace(/https?:\/\/(www\.)?/, '').split('/')[0].slice(0,20)}</span>}
                  </div>

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
                </div>
              ))}
            </div>

            {showBulk && bulkSQL && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ ...serif, fontSize: 16, color: C.text }}>Bulk SQL — {selCount} venues</span>
                  <button onClick={() => copy(bulkSQL, 'bulk')} style={{ ...sans, fontSize: 11, color: copied === 'bulk' ? C.green : C.terra, border: `1px solid ${copied === 'bulk' ? C.green : C.terra}`, padding: '6px 14px', background: 'none', cursor: 'pointer', fontWeight: 600 }}>{copied === 'bulk' ? '✓ Copied!' : 'Copy all SQL'}</button>
                </div>
                <p style={{ ...sans, fontSize: 12, color: C.muted, marginBottom: 10 }}>Paste into Supabase → SQL Editor → New query → Run. All {selCount} venues inserted as Draft.</p>
                <pre style={{ ...mono, fontSize: 10, background: C.green2, color: 'rgba(255,255,255,.65)', padding: '14px', overflowX: 'auto', whiteSpace: 'pre-wrap' as const, margin: 0, maxHeight: 400, overflowY: 'auto' }}>{bulkSQL}</pre>
              </div>
            )}
          </>
        )}
      </div>

      {venues.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.cream, borderTop: `1px solid ${C.cream3}`, padding: '12px 16px', display: 'flex', gap: 10, zIndex: 30 }}>
          <button onClick={() => setVenues(prev => prev.map(v => ({ ...v, selected: true })))} style={{ ...sans, flex: 1, border: `1px solid ${C.cream3}`, background: 'white', color: C.muted, fontSize: 11, fontWeight: 500, padding: '11px 0', cursor: 'pointer' }}>Select all</button>
          <button onClick={generateBulk} disabled={selCount === 0} style={{ ...sans, flex: 2, background: selCount === 0 ? C.muted : C.green, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, padding: '11px 0', border: 'none', cursor: selCount === 0 ? 'not-allowed' : 'pointer' }}>
            Generate SQL for {selCount} venue{selCount !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
