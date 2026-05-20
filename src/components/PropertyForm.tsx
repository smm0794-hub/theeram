'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Property, PropertyType, EventType } from '@/lib/supabase'

// ── Design tokens ────────────────────────────────────────────────────────────
const C = {
  green: '#1C3A2B', cream: '#F5F0E8', cream2: '#EDE8DC', cream3: '#E5DFD0',
  gold: '#C9A84C', terra: '#9B3D1E', text: '#1C1C1A', muted: '#6B5E4E',
}
const sans = { fontFamily: 'system-ui, sans-serif' } as const

// ── Shared input style ───────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  ...sans, width: '100%', border: `1px solid ${C.cream3}`, padding: '12px 14px',
  fontSize: 14, background: C.cream, outline: 'none', color: C.text,
  fontWeight: 300, boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em',
  textTransform: 'uppercase', display: 'block', marginBottom: 6,
}
const sectionTitle: React.CSSProperties = {
  ...sans, fontSize: 10, color: C.terra, letterSpacing: '.1em',
  textTransform: 'uppercase', marginBottom: 14, fontWeight: 600,
}
const section: React.CSSProperties = {
  background: 'white', border: `1px solid ${C.cream3}`, padding: 16, marginBottom: 12,
}

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'villa_with_pool', label: 'Villa with pool' },
  { value: 'villa_without_pool', label: 'Villa without pool' },
  { value: 'heritage_home', label: 'Heritage home / Tharavadu' },
  { value: 'open_event_space', label: 'Open event space / Lawn' },
  { value: 'auditorium', label: 'Auditorium / Convention centre' },
  { value: 'river_frontage', label: 'Riverside property' },
  { value: 'lodging', label: 'Lodging / Homestay' },
  { value: 'resort', label: 'Resort' },
]

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'staycation', label: 'Staycation' },
  { value: 'family_gathering', label: 'Family Gathering' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'birthday', label: 'Birthday Party' },
  { value: 'retreat', label: 'Retreat' },
]

// ── Field helper ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

// ── Toggle helper ─────────────────────────────────────────────────────────────
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: `1px solid ${C.cream3}` }}>
      <span style={{ ...sans, fontSize: 14, color: C.text, fontWeight: 300 }}>{label}</span>
      <button onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 12, background: value ? C.green : C.cream3, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left .2s' }}/>
      </button>
    </div>
  )
}

// ── Props ────────────────────────────────────────────────────────────────────
interface PropertyFormProps {
  initial?: Partial<Property & {
    property_attributes?: any
    property_event_types?: { event_type: EventType }[]
  }>
  mode: 'new' | 'edit'
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function PropertyForm({ initial, mode }: PropertyFormProps) {
  const router = useRouter()

  // Section 1 — Basics
  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [tagline, setTagline] = useState(initial?.tagline ?? '')
  const [ownerName, setOwnerName] = useState(initial?.owner_name ?? '')
  const [ownerWa, setOwnerWa] = useState(initial?.owner_whatsapp ?? '')
  const [priceGuide, setPriceGuide] = useState(initial?.price_guide ?? '')
  const [mapsUrl, setMapsUrl] = useState((initial as any)?.maps_url ?? '')
  const [instagramUrl, setInstagramUrl] = useState((initial as any)?.instagram_url ?? '')

  // Section 2 — Town
  const [towns, setTowns] = useState<{ id: string; name: string; hero_bg_color: string }[]>([])
  const [townId, setTownId] = useState<string>((initial as any)?.town_id ?? '')

  // Section 3 — Property type
  const [propertyType, setPropertyType] = useState<PropertyType>((initial?.property_type as PropertyType) ?? 'villa_with_pool')

  // Section 4 — Description
  const [description, setDescription] = useState(initial?.description ?? '')

  // Section 5 — Capacity
  const attrs = initial?.property_attributes
  const [roomCount, setRoomCount] = useState(attrs?.room_count ?? 0)
  const [bathroomCount, setBathroomCount] = useState(attrs?.bathroom_count ?? 0)
  const [maxOvernight, setMaxOvernight] = useState(attrs?.max_guests_overnight ?? 0)
  const [maxDay, setMaxDay] = useState(attrs?.max_guests_day_event ?? 0)

  // Section 6 — Facilities
  const [hasPool, setHasPool] = useState(attrs?.has_pool ?? false)
  const [hasAcHall, setHasAcHall] = useState(attrs?.has_ac_hall ?? false)
  const [acHallCap, setAcHallCap] = useState(attrs?.ac_hall_capacity ?? 0)
  const [hasNonAcHall, setHasNonAcHall] = useState(attrs?.has_non_ac_hall ?? false)
  const [nonAcHallCap, setNonAcHallCap] = useState(attrs?.non_ac_hall_capacity ?? 0)
  const [hasLawn, setHasLawn] = useState(attrs?.has_open_lawn ?? false)
  const [lawnSqft, setLawnSqft] = useState(attrs?.open_lawn_sqft ?? 0)
  const [hasKitchen, setHasKitchen] = useState(attrs?.has_kitchen ?? false)
  const [hasParking, setHasParking] = useState(attrs?.has_parking ?? false)
  const [parkingCount, setParkingCount] = useState(attrs?.parking_count ?? 0)
  const [hasGenerator, setHasGenerator] = useState(attrs?.has_generator ?? false)
  const [alcoholAllowed, setAlcoholAllowed] = useState(attrs?.alcohol_allowed ?? false)
  const [outsideCatering, setOutsideCatering] = useState(attrs?.outside_catering ?? false)

  // Section 7 — Event types
  const [eventTypes, setEventTypes] = useState<EventType[]>(
    initial?.property_event_types?.map(e => e.event_type as EventType) ?? []
  )

  // Section 8 — Photos
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? [])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  // Section 9 — Status
  const [isActive, setIsActive] = useState(initial?.is_active ?? false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')

  // Load towns
  useEffect(() => {
    fetch('/api/towns').then(r => r.json()).then(d => {
      if (d.data) setTowns(d.data)
      // Default to first town if new listing and no town set
      if (!townId && d.data?.length > 0 && mode === 'new') setTownId(d.data[0].id)
    }).catch(() => {})
  }, [])

  // Auto-generate slug from name
  const handleNameChange = useCallback((val: string) => {
    setName(val)
    if (mode === 'new') setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }, [mode])

  // Toggle event type
  function toggleEventType(et: EventType) {
    setEventTypes(prev => prev.includes(et) ? prev.filter(e => e !== et) : [...prev, et])
  }

  // Photo upload
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const preset = process.env.CLOUDINARY_UPLOAD_PRESET ?? 'theeram-unsigned'
    const uploaded: string[] = []
    for (const file of files) {
      const key = file.name
      setUploadProgress(p => ({ ...p, [key]: 0 }))
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', preset)
      try {
        const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd })
        const data = await r.json()
        if (data.secure_url) { uploaded.push(data.secure_url); setUploadProgress(p => ({ ...p, [key]: 100 })) }
      } catch { setUploadProgress(p => ({ ...p, [key]: -1 })) }
    }
    setPhotos(prev => [...prev, ...uploaded])
    setUploading(false)
  }

  function removePhoto(url: string) { setPhotos(prev => prev.filter(p => p !== url)) }

  // Save
  async function handleSave() {
    if (!name || !slug || !tagline || !ownerWa || eventTypes.length === 0) {
      setError('Required: name, slug, tagline, WhatsApp number, and at least one event type.'); return
    }
    if (!townId) { setError('Please select a town for this listing.'); return }
    setSaving(true); setError('')
    try {
      const r = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: {
            name, slug, tagline, owner_name: ownerName, owner_whatsapp: ownerWa,
            price_guide: priceGuide, property_type: propertyType, description,
            photos, is_active: isActive, maps_url: mapsUrl,
            instagram_url: instagramUrl, town_id: townId,
          },
          attributes: {
            room_count: roomCount, bathroom_count: bathroomCount,
            max_guests_overnight: maxOvernight, max_guests_day_event: maxDay,
            has_pool: hasPool, has_ac_hall: hasAcHall, ac_hall_capacity: acHallCap,
            has_non_ac_hall: hasNonAcHall, non_ac_hall_capacity: nonAcHallCap,
            has_open_lawn: hasLawn, open_lawn_sqft: lawnSqft,
            has_kitchen: hasKitchen, has_parking: hasParking, parking_count: parkingCount,
            has_generator: hasGenerator, alcohol_allowed: alcoholAllowed,
            outside_catering: outsideCatering,
          },
          eventTypes,
        }),
      })
      if (!r.ok) { const d = await r.json(); setError(d.error ?? 'Save failed'); setSaving(false); return }
      setToast(mode === 'new' ? 'Listing created!' : 'Saved!')
      setTimeout(() => router.push('/curator/spaces'), 1200)
    } catch { setError('Connection error. Please try again.') }
    setSaving(false)
  }

  return (
    <div style={{ paddingBottom: 100 }}>
      {toast && <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: C.green, color: 'white', ...sans, fontSize: 12, padding: '10px 20px', zIndex: 50, whiteSpace: 'nowrap' }}>{toast}</div>}

      {/* ── 1 — Town ─────────────────────────────────────────────── */}
      <div style={section}>
        <p style={sectionTitle}>1 — Town</p>
        <Field label="Which town is this listing in? *">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {towns.length === 0
              ? <p style={{ ...sans, fontSize: 13, color: C.muted }}>Loading towns...</p>
              : towns.map(t => (
                <button key={t.id} onClick={() => setTownId(t.id)}
                  style={{ ...sans, padding: '12px 14px', border: `1px solid ${townId === t.id ? t.hero_bg_color : C.cream3}`, background: townId === t.id ? t.hero_bg_color : 'white', color: townId === t.id ? 'white' : C.muted, fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: townId === t.id ? 'rgba(255,255,255,.6)' : t.hero_bg_color, flexShrink: 0 }}/>
                  {t.name}
                </button>
              ))
            }
          </div>
        </Field>
      </div>

      {/* ── 2 — Basics ───────────────────────────────────────────── */}
      <div style={section}>
        <p style={sectionTitle}>2 — Basics</p>
        <Field label="Property name *">
          <input value={name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Meenachil Garden Villa" style={inputStyle}/>
        </Field>
        <Field label="Slug (URL) *">
          <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="meenachil-garden-villa" style={inputStyle}/>
        </Field>
        <Field label="Tagline *">
          <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="One sentence — what makes it special" style={inputStyle}/>
        </Field>
        <Field label="Owner name">
          <input value={ownerName} onChange={e => setOwnerName(e.target.value)} style={inputStyle}/>
        </Field>
        <Field label="Owner WhatsApp *">
          <input value={ownerWa} onChange={e => setOwnerWa(e.target.value)} placeholder="919447000000" type="tel" style={inputStyle}/>
        </Field>
        <Field label="Price guide">
          <input value={priceGuide} onChange={e => setPriceGuide(e.target.value)} placeholder="₹15,000–₹25,000 per day" style={inputStyle}/>
        </Field>
        <Field label="Google Maps URL">
          <input value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} placeholder="https://maps.app.goo.gl/..." style={inputStyle}/>
        </Field>
        <Field label="Instagram URL">
          <input value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." style={inputStyle}/>
        </Field>
      </div>

      {/* ── 3 — Property type ────────────────────────────────────── */}
      <div style={section}>
        <p style={sectionTitle}>3 — Property type</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PROPERTY_TYPES.map(({ value, label }) => (
            <button key={value} onClick={() => setPropertyType(value)}
              style={{ ...sans, padding: '12px 14px', border: `1px solid ${propertyType === value ? C.terra : C.cream3}`, background: propertyType === value ? '#fdf0eb' : 'white', color: propertyType === value ? C.terra : C.muted, fontSize: 13, cursor: 'pointer', textAlign: 'left' as const }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 4 — Description ──────────────────────────────────────── */}
      <div style={section}>
        <p style={sectionTitle}>4 — Description</p>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="What makes this place special? 3–5 sentences." rows={5}
          style={{ ...inputStyle, resize: 'vertical' }}/>
      </div>

      {/* ── 5 — Capacity ─────────────────────────────────────────── */}
      <div style={section}>
        <p style={sectionTitle}>5 — Capacity</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[['Bedrooms', roomCount, setRoomCount], ['Bathrooms', bathroomCount, setBathroomCount], ['Max guests (overnight)', maxOvernight, setMaxOvernight], ['Max guests (day event)', maxDay, setMaxDay]].map(([label, val, setter]: any) => (
            <Field key={label as string} label={label as string}>
              <input type="number" value={val} onChange={e => setter(parseInt(e.target.value) || 0)} style={{ ...inputStyle, textAlign: 'center' }}/>
            </Field>
          ))}
        </div>
      </div>

      {/* ── 6 — Facilities ───────────────────────────────────────── */}
      <div style={section}>
        <p style={sectionTitle}>6 — Facilities</p>
        <Toggle label="Swimming pool" value={hasPool} onChange={setHasPool}/>
        <Toggle label="AC hall" value={hasAcHall} onChange={setHasAcHall}/>
        {hasAcHall && <Field label="AC hall capacity"><input type="number" value={acHallCap} onChange={e => setAcHallCap(parseInt(e.target.value)||0)} style={inputStyle}/></Field>}
        <Toggle label="Non-AC hall" value={hasNonAcHall} onChange={setHasNonAcHall}/>
        {hasNonAcHall && <Field label="Non-AC hall capacity"><input type="number" value={nonAcHallCap} onChange={e => setNonAcHallCap(parseInt(e.target.value)||0)} style={inputStyle}/></Field>}
        <Toggle label="Open lawn / garden" value={hasLawn} onChange={setHasLawn}/>
        {hasLawn && <Field label="Lawn area (sqft)"><input type="number" value={lawnSqft} onChange={e => setLawnSqft(parseInt(e.target.value)||0)} style={inputStyle}/></Field>}
        <Toggle label="Full kitchen" value={hasKitchen} onChange={setHasKitchen}/>
        <Toggle label="Parking" value={hasParking} onChange={setHasParking}/>
        {hasParking && <Field label="Parking count"><input type="number" value={parkingCount} onChange={e => setParkingCount(parseInt(e.target.value)||0)} style={inputStyle}/></Field>}
        <Toggle label="Generator backup" value={hasGenerator} onChange={setHasGenerator}/>
        <Toggle label="Alcohol permitted" value={alcoholAllowed} onChange={setAlcoholAllowed}/>
        <Toggle label="Outside catering allowed" value={outsideCatering} onChange={setOutsideCatering}/>
      </div>

      {/* ── 7 — Event types ──────────────────────────────────────── */}
      <div style={section}>
        <p style={sectionTitle}>7 — Event types *</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {EVENT_TYPES.map(({ value, label }) => (
            <button key={value} onClick={() => toggleEventType(value)}
              style={{ ...sans, padding: '9px 16px', border: `1px solid ${eventTypes.includes(value) ? C.terra : C.cream3}`, background: eventTypes.includes(value) ? '#fdf0eb' : 'white', color: eventTypes.includes(value) ? C.terra : C.muted, fontSize: 13, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 8 — Photos ───────────────────────────────────────────── */}
      <div style={section}>
        <p style={sectionTitle}>8 — Photos</p>
        <label style={{ display: 'block', border: `2px dashed ${C.cream3}`, padding: 20, textAlign: 'center', cursor: 'pointer', marginBottom: 14 }}>
          <span style={{ ...sans, fontSize: 13, color: C.muted }}>{uploading ? 'Uploading...' : 'Tap to select photos'}</span>
          <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{ display: 'none' }}/>
        </label>
        {photos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {photos.map((url, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1' }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                <button onClick={() => removePhoto(url)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, background: 'rgba(0,0,0,.6)', border: 'none', cursor: 'pointer', color: 'white', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 9 — Status ───────────────────────────────────────────── */}
      <div style={section}>
        <p style={sectionTitle}>9 — Status</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[false, true].map(val => (
            <button key={String(val)} onClick={() => setIsActive(val)}
              style={{ ...sans, flex: 1, padding: '12px 0', border: `1px solid ${isActive === val ? C.green : C.cream3}`, background: isActive === val ? '#f0faf4' : 'white', color: isActive === val ? C.green : C.muted, fontSize: 13, cursor: 'pointer', fontWeight: isActive === val ? 600 : 400 }}>
              {val ? '🟢 Live' : '⚪ Draft'}
            </button>
          ))}
        </div>
        <p style={{ ...sans, fontSize: 11, color: C.muted, marginTop: 8, fontWeight: 300 }}>Draft listings are only visible in the curator. Set to Live when photos are ready.</p>
      </div>

      {error && <div style={{ ...sans, fontSize: 13, color: C.terra, background: '#fdf0eb', border: `1px solid ${C.terra}`, padding: '12px 14px', marginBottom: 14 }}>{error}</div>}

      {/* Sticky save */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.cream, borderTop: `1px solid ${C.cream3}`, padding: '12px 16px', zIndex: 30 }}>
        <button onClick={handleSave} disabled={saving}
          style={{ ...sans, width: '100%', background: saving ? C.muted : C.green, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' as const, padding: '14px 0', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? .7 : 1 }}>
          {saving ? 'Saving...' : mode === 'new' ? 'Create listing' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
