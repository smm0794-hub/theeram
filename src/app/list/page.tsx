'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from '@/lib/supabase'

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #D6C9B8', borderRadius: 12,
  padding: '12px 16px', fontSize: 15, color: '#2C1A0E',
  backgroundColor: '#FAF7F2', outline: 'none', boxSizing: 'border-box',
}

export default function ListPropertyPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [description, setDescription] = useState('')
  const [priceGuide, setPriceGuide] = useState('')
  const [maxGuests, setMaxGuests] = useState('')
  const [facilities, setFacilities] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    if (!name || !whatsapp || !description) {
      setError('Please fill in the property name, WhatsApp number and description.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const r = await fetch('/api/property-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, owner_name: ownerName, whatsapp, phone, email, address, property_type: propertyType, description, price_guide: priceGuide, max_guests: maxGuests, facilities, message }),
      })
      if (r.ok) {
        setSubmitted(true)
        try {
          const { notifyUrl } = await r.json()
          if (notifyUrl) window.open(notifyUrl, '_blank')
        } catch {}
      } else {
        const { error: e } = await r.json()
        setError('Something went wrong. Please try again. ' + (e ?? ''))
      }
    } catch {
      setError('Connection error. Please try again.')
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>🏡</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#2C1A0E', marginBottom: 12 }}>Thank you, {ownerName.split(' ')[0] || 'there'}.</h1>
        <p style={{ fontSize: 14, color: '#7C5C3E', lineHeight: 1.7, maxWidth: 280, marginBottom: 8 }}>
          Your property listing request has been received. We personally visit and verify every property before it goes live.
        </p>
        <p style={{ fontSize: 12, color: '#B4A898', lineHeight: 1.6, maxWidth: 260, marginBottom: 24 }}>
          We will be in touch on WhatsApp to arrange a visit.
        </p>
        <div style={{ backgroundColor: 'white', borderRadius: 14, border: '1px solid #D6C9B8', padding: '16px 20px', marginBottom: 24, maxWidth: 280, width: '100%' }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Questions? Reach us on WhatsApp</p>
          <a href="https://wa.me/919447000000" style={{ fontSize: 15, fontWeight: 700, color: '#25D366', textDecoration: 'none' }}>
            💬 +91 94470 00000
          </a>
        </div>
        <Link href="/" style={{ fontSize: 13, color: '#D4735E', textDecoration: 'underline' }}>Browse listings →</Link>
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', paddingBottom: 120 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#FAF7F2', borderBottom: '0.5px solid #D6C9B8', padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/" style={{ color: '#7C5C3E', display: 'flex' }}>
          <svg viewBox="0 0 20 20" fill="none" width={20} height={20} stroke="currentColor" strokeWidth={2}><path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E' }}>List your property</span>
        </div>
      </header>

      <div style={{ padding: '20px 16px 0' }}>
        <p style={{ fontSize: 13, color: '#7C5C3E', lineHeight: 1.7, marginBottom: 24 }}>
          Theeram is a curated directory of event spaces in Pala, Kerala. Every property is personally visited and verified before listing. Fill in your details and we will be in touch.
        </p>

        {/* Property details */}
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C5C3E', marginBottom: 12, fontWeight: 600 }}>About the property</p>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Property name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Meenachil Garden Villa" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 8 }}>Property type</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PROPERTY_TYPES.map((pt) => (
              <button key={pt} onClick={() => setPropertyType(pt)} style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${propertyType === pt ? '#D4735E' : '#D6C9B8'}`, backgroundColor: propertyType === pt ? '#fdf3f1' : 'white', color: propertyType === pt ? '#D4735E' : '#7C5C3E', fontSize: 12, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
                {PROPERTY_TYPE_LABELS[pt]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Location / Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ward, Panchayat, District" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Description *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us about the property — setting, facilities, what makes it special." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Max guests (day event)</label>
          <input value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} placeholder="e.g. 200" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Key facilities</label>
          <input value={facilities} onChange={(e) => setFacilities(e.target.value)} placeholder="Pool, AC Hall, Open Lawn, Kitchen, Parking..." style={inputStyle} />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Price guide</label>
          <input value={priceGuide} onChange={(e) => setPriceGuide(e.target.value)} placeholder="e.g. ₹15,000–₹25,000 per day" style={inputStyle} />
        </div>

        <div style={{ borderTop: '0.5px solid #D6C9B8', paddingTop: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C5C3E', marginBottom: 12, fontWeight: 600 }}>Your contact details</p>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Your name</label>
            <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Property owner or manager name" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>WhatsApp number *</label>
            <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="919447000000 (with country code)" type="tel" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Phone number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Local phone number" type="tel" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Anything else?</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Any other details you'd like us to know..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>

        {error && <p style={{ fontSize: 13, color: '#D4735E', marginBottom: 12 }}>{error}</p>}
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FAF7F2', borderTop: '0.5px solid #D6C9B8', padding: '12px 16px', zIndex: 30 }}>
        <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', backgroundColor: '#2C1A0E', color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 12, height: 48, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
          {submitting ? 'Submitting...' : 'Submit listing request'}
        </button>
        <p style={{ fontSize: 10, color: '#B4A898', textAlign: 'center', marginTop: 6 }}>We visit and verify every property personally before listing.</p>
      </div>
    </main>
  )
}
