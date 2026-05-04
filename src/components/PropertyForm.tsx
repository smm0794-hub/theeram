'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Property, PropertyType, EventType, PROPERTY_TYPE_LABELS, EVENT_TYPES, EVENT_TYPE_LABELS, PROPERTY_TYPES } from '@/lib/supabase'

interface Props { initial?: Partial<Property> }

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #D6C9B8', borderRadius: 12, padding: '12px 16px',
  fontSize: 15, color: '#2C1A0E', backgroundColor: '#FAF7F2', outline: 'none', boxSizing: 'border-box',
}

function Toggle({ label, value, onChange, note }: { label: string; value: boolean; onChange: (v: boolean) => void; note?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #D6C9B8' }}>
      <div>
        <span style={{ fontSize: 14, color: '#2C1A0E' }}>{label}</span>
        {note && <p style={{ fontSize: 11, color: '#7C5C3E', marginTop: 2 }}>{note}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        style={{ width: 48, height: 26, borderRadius: 999, backgroundColor: value ? '#6B8F71' : '#D6C9B8', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}
      >
        <span style={{ position: 'absolute', top: 3, left: value ? 'calc(100% - 22px)' : 3, width: 20, height: 20, borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </button>
    </div>
  )
}

export default function PropertyForm({ initial }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const attrs = initial?.property_attributes

  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [slugManual, setSlugManual] = useState(!!initial?.slug)
  const [tagline, setTagline] = useState(initial?.tagline ?? '')
  const [ownerName, setOwnerName] = useState(initial?.owner_name ?? '')
  const [ownerWa, setOwnerWa] = useState(initial?.owner_whatsapp ?? '')
  const [priceGuide, setPriceGuide] = useState(initial?.price_guide ?? '')
  const [propertyType, setPropertyType] = useState<PropertyType>(initial?.property_type ?? 'villa_with_pool')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [isActive, setIsActive] = useState(initial?.is_active ?? false)
  const [mapsUrl, setMapsUrl] = useState(initial?.maps_url ?? '')
  const [instagramUrl, setInstagramUrl] = useState(initial?.instagram_url ?? '')

  const [roomCount, setRoomCount] = useState(attrs?.room_count ?? 0)
  const [bathCount, setBathCount] = useState(attrs?.bathroom_count ?? 0)
  const [maxOvernight, setMaxOvernight] = useState(attrs?.max_guests_overnight ?? 0)
  const [maxDay, setMaxDay] = useState(attrs?.max_guests_day_event ?? 0)

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

  const [eventTypes, setEventTypes] = useState<EventType[]>(
    (initial?.property_event_types?.map((e) => e.event_type) ?? []) as EventType[]
  )

  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? [])
  const [uploading, setUploading] = useState(false)

  const [pinX, setPinX] = useState(initial?.map_pin_x ?? 195)
  const [pinY, setPinY] = useState(initial?.map_pin_y ?? 265)
  const mapRef = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleNameChange(val: string) {
    setName(val)
    if (!slugManual) setSlug(slugify(val))
  }

  function toggleEvent(e: EventType) {
    setEventTypes((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e])
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? 'theeram-unsigned'
    const urls: string[] = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', preset)
      try {
        const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd })
        const data = await r.json()
        if (data.secure_url) urls.push(data.secure_url)
      } catch {}
    }
    setPhotos((prev) => [...prev, ...urls])
    setUploading(false)
  }

  function handleMapMove(e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) {
    if (!dragging || !mapRef.current) return
    const rect = mapRef.current.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setPinX(Math.round(Math.max(0, Math.min(390, ((clientX - rect.left) / rect.width) * 390))))
    setPinY(Math.round(Math.max(0, Math.min(530, ((clientY - rect.top) / rect.height) * 530))))
  }

  async function handleSave() {
    if (!name || !slug || !tagline || !ownerWa || eventTypes.length === 0) {
      showToast('Fill in name, tagline, WhatsApp, and at least one event type.')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property: { name, slug, tagline, owner_name: ownerName, owner_whatsapp: ownerWa, price_guide: priceGuide, property_type: propertyType, description, photos, is_active: isActive, map_pin_x: pinX, map_pin_y: pinY, maps_url: mapsUrl, instagram_url: instagramUrl },
          attributes: { room_count: roomCount, bathroom_count: bathCount, max_guests_overnight: maxOvernight, max_guests_day_event: maxDay, has_pool: hasPool, has_ac_hall: hasAcHall, ac_hall_capacity: acHallCap, has_non_ac_hall: hasNonAcHall, non_ac_hall_capacity: nonAcHallCap, has_open_lawn: hasLawn, open_lawn_sqft: lawnSqft, has_kitchen: hasKitchen, has_parking: hasParking, parking_count: parkingCount, has_generator: hasGenerator, alcohol_allowed: alcoholAllowed, outside_catering: outsideCatering },
          eventTypes,
        }),
      })
      const json = await r.json()
      if (r.ok) {
        setSaveSuccess(true)
        showToast('Property saved successfully!', 'success')
        setTimeout(() => router.push('/curator'), 2500)
      } else {
        showToast('Error: ' + (json.error ?? 'Unknown error'), 'error')
      }
    } catch (e: any) {
      showToast('Error: ' + e.message, 'error')
    }
    setSaving(false)
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 5000)
  }

  const sectionTitle: React.CSSProperties = { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C5C3E', fontWeight: 600, marginBottom: 12 }
  const section: React.CSSProperties = { marginBottom: 28 }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', paddingBottom: 100 }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#FAF7F2', borderBottom: '0.5px solid #D6C9B8', padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={() => router.push('/curator')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7C5C3E', padding: 4 }}>
          <svg viewBox="0 0 20 20" fill="none" width={20} height={20} stroke="currentColor" strokeWidth={2}><path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E' }}>
          {initial?.name ? 'Edit property' : 'New property'}
        </span>
      </header>

      <div style={{ padding: '20px 16px 0' }}>

        {/* 1 — Basics */}
        <div style={section}>
          <p style={sectionTitle}>1 — Basics</p>
          <Field label="Property name *">
            <input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Meenachil Garden Villa" style={inputStyle} />
          </Field>
          <Field label="URL slug *">
            <input value={slug} onChange={(e) => { setSlug(slugify(e.target.value)); setSlugManual(true) }} placeholder="e.g. meenachil-garden-villa" style={inputStyle} />
            <p style={{ fontSize: 11, color: '#7C5C3E', marginTop: 4 }}>theeram.in/property/{slug || '...'}</p>
          </Field>
          <Field label="Tagline *">
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One sentence — what makes it special" style={inputStyle} />
          </Field>
          <Field label="Owner name">
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="e.g. Thomas Varghese" style={inputStyle} />
          </Field>
          <Field label="Owner WhatsApp *">
            <input value={ownerWa} onChange={(e) => setOwnerWa(e.target.value)} placeholder="919447000000" type="tel" style={inputStyle} />
          </Field>
          <Field label="Price guide">
            <input value={priceGuide} onChange={(e) => setPriceGuide(e.target.value)} placeholder="₹12,000–₹20,000 per day" style={inputStyle} />
          </Field>
          <Field label="Google Maps link">
            <input value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} placeholder="Paste Google Maps share link" style={inputStyle} />
          </Field>
          <Field label="Instagram (handle or link)">
            <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="@handle or full Instagram URL" style={inputStyle} />
          </Field>
        </div>

        {/* 2 — Property type */}
        <div style={section}>
          <p style={sectionTitle}>2 — Property type</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            {PROPERTY_TYPES.map((pt) => (
              <button key={pt} onClick={() => setPropertyType(pt)} style={{ padding: 12, borderRadius: 12, border: `1px solid ${propertyType === pt ? '#D4735E' : '#D6C9B8'}`, backgroundColor: propertyType === pt ? '#fdf3f1' : 'white', color: propertyType === pt ? '#D4735E' : '#7C5C3E', fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
                {PROPERTY_TYPE_LABELS[pt]}
              </button>
            ))}
          </div>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #D6C9B8' }}>
            <img src={`/illustrations/property-types/${propertyType.replace(/_/g, '-')}.svg`} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
          </div>
        </div>

        {/* 3 — Description */}
        <div style={section}>
          <p style={sectionTitle}>3 — Description</p>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What makes this place special? 3–5 sentences." rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {/* 4 — Capacity */}
        <div style={section}>
          <p style={sectionTitle}>4 — Capacity</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Bedrooms', value: roomCount, set: setRoomCount },
              { label: 'Bathrooms', value: bathCount, set: setBathCount },
              { label: 'Max overnight', value: maxOvernight, set: setMaxOvernight },
              { label: 'Max day event', value: maxDay, set: setMaxDay },
            ].map(({ label, value, set }) => (
              <Field key={label} label={label}>
                <input type="number" min={0} value={value || ''} onChange={(e) => set(parseInt(e.target.value) || 0)} style={{ ...inputStyle, textAlign: 'center' }} />
              </Field>
            ))}
          </div>
        </div>

        {/* 5 — Facilities */}
        <div style={section}>
          <p style={sectionTitle}>5 — Facilities</p>
          <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #D6C9B8', padding: '0 16px' }}>
            <Toggle label="Swimming pool" value={hasPool} onChange={setHasPool} />
            <Toggle label="AC hall" value={hasAcHall} onChange={setHasAcHall} />
            {hasAcHall && <div style={{ paddingBottom: 12 }}><Field label="AC hall capacity"><input type="number" min={0} value={acHallCap || ''} onChange={(e) => setAcHallCap(parseInt(e.target.value) || 0)} style={inputStyle} /></Field></div>}
            <Toggle label="Non-AC hall" value={hasNonAcHall} onChange={setHasNonAcHall} />
            {hasNonAcHall && <div style={{ paddingBottom: 12 }}><Field label="Non-AC hall capacity"><input type="number" min={0} value={nonAcHallCap || ''} onChange={(e) => setNonAcHallCap(parseInt(e.target.value) || 0)} style={inputStyle} /></Field></div>}
            <Toggle label="Open lawn / garden" value={hasLawn} onChange={setHasLawn} />
            {hasLawn && <div style={{ paddingBottom: 12 }}><Field label="Lawn size (sqft)"><input type="number" min={0} value={lawnSqft || ''} onChange={(e) => setLawnSqft(parseInt(e.target.value) || 0)} style={inputStyle} /></Field></div>}
            <Toggle label="Full kitchen" value={hasKitchen} onChange={setHasKitchen} />
            <Toggle label="Parking" value={hasParking} onChange={setHasParking} />
            {hasParking && <div style={{ paddingBottom: 12 }}><Field label="Parking spaces"><input type="number" min={0} value={parkingCount || ''} onChange={(e) => setParkingCount(parseInt(e.target.value) || 0)} style={inputStyle} /></Field></div>}
            <Toggle label="Generator backup" value={hasGenerator} onChange={setHasGenerator} />
            <Toggle label="Alcohol permitted" value={alcoholAllowed} onChange={setAlcoholAllowed} />
            <Toggle label="Outside catering allowed" value={outsideCatering} onChange={setOutsideCatering} />
          </div>
        </div>

        {/* 6 — Event types */}
        <div style={section}>
          <p style={sectionTitle}>6 — Event types *</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {EVENT_TYPES.map((et) => (
              <button key={et} onClick={() => toggleEvent(et)} style={{ padding: '10px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500, border: `1px solid ${eventTypes.includes(et) ? 'transparent' : '#7C5C3E'}`, backgroundColor: eventTypes.includes(et) ? '#D4735E' : 'transparent', color: eventTypes.includes(et) ? 'white' : '#7C5C3E', cursor: 'pointer' }}>
                {EVENT_TYPE_LABELS[et]}
              </button>
            ))}
          </div>
        </div>

        {/* 7 — Photos */}
        <div style={section}>
          <p style={sectionTitle}>7 — Photos</p>
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} style={{ width: '100%', border: '2px dashed #D6C9B8', borderRadius: 12, padding: '24px 0', color: '#7C5C3E', fontSize: 13, backgroundColor: 'transparent', cursor: 'pointer' }}>
            {uploading ? 'Uploading...' : 'Tap to add photos from camera roll'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotoSelect} />
          {photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
              {photos.map((url, i) => (
                <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                  <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  {/* Move left */}
                  {i > 0 && (
                    <button
                      onClick={() => setPhotos((prev) => { const a = [...prev]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a })}
                      style={{ position: 'absolute', bottom: 4, left: 4, width: 20, height: 20, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >←</button>
                  )}
                  {/* Move right */}
                  {i < photos.length - 1 && (
                    <button
                      onClick={() => setPhotos((prev) => { const a = [...prev]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a })}
                      style={{ position: 'absolute', bottom: 4, right: 24, width: 20, height: 20, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >→</button>
                  )}
                  {/* Remove */}
                  <button onClick={() => setPhotos((prev) => prev.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', backgroundColor: '#2C1A0E', color: 'white', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  {/* First photo badge */}
                  {i === 0 && <div style={{ position: 'absolute', top: 4, left: 4, backgroundColor: '#C9A84C', color: 'white', fontSize: 8, fontWeight: 700, padding: '2px 5px', borderRadius: 3 }}>HERO</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 8 — Map pin */}
        <div style={section}>
          <p style={sectionTitle}>8 — Map pin</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <Field label="Pin X"><input type="number" value={pinX} onChange={(e) => setPinX(parseInt(e.target.value) || 0)} style={{ ...inputStyle, textAlign: 'center' }} /></Field>
            <Field label="Pin Y"><input type="number" value={pinY} onChange={(e) => setPinY(parseInt(e.target.value) || 0)} style={{ ...inputStyle, textAlign: 'center' }} /></Field>
          </div>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #D6C9B8', touchAction: 'none' }}>
            <svg
              ref={mapRef}
              viewBox="0 0 390 530"
              style={{ width: '100%', cursor: 'crosshair', display: 'block' }}
              onMouseDown={() => setDragging(true)}
              onMouseUp={() => setDragging(false)}
              onMouseLeave={() => setDragging(false)}
              onMouseMove={handleMapMove}
              onTouchStart={() => setDragging(true)}
              onTouchEnd={() => setDragging(false)}
              onTouchMove={handleMapMove}
            >
              <image href="/illustrations/landmarks/pala.svg" x={0} y={0} width={390} height={530} />
              <circle cx={pinX} cy={pinY} r={10} fill="#D4735E" stroke="white" strokeWidth={2.5} />
            </svg>
          </div>
          <p style={{ fontSize: 11, color: '#7C5C3E', marginTop: 6 }}>Drag the pin to set approximate location</p>
        </div>

        {/* 9 — Status */}
        <div style={section}>
          <p style={sectionTitle}>9 — Status</p>
          <div style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #D6C9B8', padding: '0 16px' }}>
            <Toggle
              label={isActive ? '🟢 Live — visible on site' : '⚪ Draft — hidden from public'}
              value={isActive}
              onChange={setIsActive}
            />
          </div>
        </div>

      </div>

      {/* Sticky save */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FAF7F2', borderTop: '0.5px solid #D6C9B8', padding: '12px 16px', zIndex: 30 }}>
        <button onClick={handleSave} disabled={saving || saveSuccess} style={{ width: '100%', backgroundColor: saveSuccess ? '#6B8F71' : '#2C1A0E', color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 12, padding: '14px 0', border: 'none', cursor: (saving || saveSuccess) ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'background 0.3s' }}>
          {saving ? 'Saving...' : saveSuccess ? '✓ Saved — going back...' : 'Save property'}
        </button>
      </div>

      {/* Toast — colour coded */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: toastType === 'success' ? '#6B8F71' : '#D4735E',
          color: 'white',
          fontSize: 13,
          fontWeight: 500,
          padding: '12px 24px',
          borderRadius: 999,
          zIndex: 50,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: 'calc(100vw - 32px)',
          textAlign: 'center',
          whiteSpaceCollapse: 'collapse',
        }}>
          {toastType === 'success' ? '✓ ' : '✕ '}{toast}
        </div>
      )}
    </div>
  )
}
