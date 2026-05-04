'use client'

import { useState } from 'react'
import Link from 'next/link'
import { VendorCategory, VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS, VENDOR_CATEGORY_ICONS } from '@/lib/supabase'

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #D6C9B8',
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: 15,
  color: '#2C1A0E',
  backgroundColor: '#FAF7F2',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function JoinPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [category, setCategory] = useState<VendorCategory | ''>('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [priceGuide, setPriceGuide] = useState('')
  const [areaServed, setAreaServed] = useState('Pala & surrounding areas')
  const [message, setMessage] = useState('')

  async function handleSubmit() {
    if (!name || !category || !whatsapp || !description) {
      setError('Please fill in your name, category, WhatsApp number and description.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const r = await fetch('/api/vendor-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, tagline, description, whatsapp, phone, email, instagram_url: instagram, price_guide: priceGuide, area_served: areaServed, message }),
      })
      if (r.ok) {
        setSubmitted(true)
        // Auto-open WhatsApp notification to curator (silently — tab opens in background)
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
        <div style={{ fontSize: 40, marginBottom: 20 }}>🪔</div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#2C1A0E', marginBottom: 12 }}>Thank you, {name.split(' ')[0]}.</h1>
        <p style={{ fontSize: 14, color: '#7C5C3E', lineHeight: 1.7, maxWidth: 280, marginBottom: 8 }}>
          Your listing request has been received. We personally review every application and will be in touch soon.
        </p>
        <p style={{ fontSize: 12, color: '#B4A898', lineHeight: 1.6, maxWidth: 260, marginBottom: 24 }}>
          Theeram is a curated directory — we visit and verify every listing before it goes live.
        </p>
        <div style={{ backgroundColor: 'white', borderRadius: 14, border: '1px solid #D6C9B8', padding: '16px 20px', marginBottom: 24, maxWidth: 280, width: '100%' }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>For follow-up, save our number</p>
          <a href="https://wa.me/919447000000" style={{ fontSize: 15, fontWeight: 700, color: '#25D366', textDecoration: 'none' }}>
            💬 +91 94470 00000
          </a>
          <p style={{ fontSize: 11, color: '#B4A898', marginTop: 4 }}>WhatsApp us if you don't hear back within 3 days</p>
        </div>
        <Link href="/services" style={{ fontSize: 13, color: '#D4735E', textDecoration: 'underline' }}>Browse current listings →</Link>
      </div>
    )
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', paddingBottom: 120 }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#FAF7F2', borderBottom: '0.5px solid #D6C9B8', padding: '10px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/services" style={{ color: '#7C5C3E', display: 'flex' }}>
          <svg viewBox="0 0 20 20" fill="none" width={20} height={20} stroke="currentColor" strokeWidth={2}><path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E' }}>List your service</span>
      </header>

      <div style={{ padding: '20px 16px 0' }}>
        <p style={{ fontSize: 13, color: '#7C5C3E', lineHeight: 1.7, marginBottom: 24 }}>
          Theeram is a curated directory for event vendors in Pala, Kerala. Fill in your details and we'll review your application personally.
        </p>

        {/* Name */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Business name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your business or personal name" style={inputStyle} />
        </div>

        {/* Category */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 8 }}>Category *</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {VENDOR_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `1px solid ${category === cat ? '#D4735E' : '#D6C9B8'}`,
                  backgroundColor: category === cat ? '#fdf3f1' : 'white',
                  color: category === cat ? '#D4735E' : '#7C5C3E',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>{VENDOR_CATEGORY_ICONS[cat]}</span>
                {VENDOR_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Tagline */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Tagline</label>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One line — what makes you special" style={inputStyle} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>About your service *</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your services, experience, and what makes you the right choice for events in Pala." rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {/* WhatsApp */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>WhatsApp number *</label>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="919447000000 (with country code)" type="tel" style={inputStyle} />
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Phone number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Local phone number" type="tel" style={inputStyle} />
        </div>

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" type="email" style={inputStyle} />
        </div>

        {/* Instagram */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Instagram</label>
          <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@handle or full link" style={inputStyle} />
        </div>

        {/* Price guide */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Price guide</label>
          <input value={priceGuide} onChange={(e) => setPriceGuide(e.target.value)} placeholder="e.g. Starting from ₹15,000 per event" style={inputStyle} />
        </div>

        {/* Area served */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Area served</label>
          <input value={areaServed} onChange={(e) => setAreaServed(e.target.value)} placeholder="Pala & surrounding areas" style={inputStyle} />
        </div>

        {/* Message */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#7C5C3E', marginBottom: 6 }}>Anything else you'd like us to know?</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Years of experience, notable events, references..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {error && <p style={{ fontSize: 13, color: '#D4735E', marginBottom: 12 }}>{error}</p>}
      </div>

      {/* Sticky submit */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FAF7F2', borderTop: '0.5px solid #D6C9B8', padding: '12px 16px', zIndex: 30 }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ width: '100%', backgroundColor: '#2C1A0E', color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 12, height: 48, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? 'Submitting...' : 'Submit application'}
        </button>
        <p style={{ fontSize: 10, color: '#B4A898', textAlign: 'center', marginTop: 6 }}>
          We review every application personally before approving.
        </p>
      </div>
    </main>
  )
}
