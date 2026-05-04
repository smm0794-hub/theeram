'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Property, PROPERTY_TYPE_LABELS, EVENT_TYPE_LABELS } from '@/lib/supabase'
import GratitudeModal from './GratitudeModal'
import { supabase } from '@/lib/supabase'

interface Props {
  property: Property
  index: number
}

function Icon({ type, available }: { type: string; available: boolean }) {
  const c = available ? '#6B8F71' : '#D6C9B8'
  const icons: Record<string, JSX.Element> = {
    rooms: <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><rect x="1" y="5" width="14" height="9" rx="1" stroke={c} strokeWidth="1.2"/><rect x="5" y="9" width="6" height="5" rx="0.5" stroke={c} strokeWidth="1.2"/></svg>,
    pool: <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><path d="M1 11 C3 9 5 13 7 11 C9 9 11 13 13 11 C14 10 15 10 15 10" stroke={c} strokeWidth="1.2" strokeLinecap="round"/><path d="M1 8 C3 6 5 10 7 8 C9 6 11 10 13 8" stroke={c} strokeWidth="1.2" strokeLinecap="round"/></svg>,
    hall: <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><rect x="2" y="6" width="12" height="8" rx="1" stroke={c} strokeWidth="1.2"/><path d="M1 6 L8 2 L15 6" stroke={c} strokeWidth="1.2" strokeLinejoin="round"/></svg>,
    lawn: <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><path d="M1 13 Q4 8 8 10 Q12 12 15 8" stroke={c} strokeWidth="1.2" strokeLinecap="round"/><path d="M4 13 Q5 9 7 11" stroke={c} strokeWidth="1.2" strokeLinecap="round"/></svg>,
    alcohol: <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><path d="M5 2 L11 2 L10 8 L6 8 Z" stroke={c} strokeWidth="1.2" strokeLinejoin="round"/><path d="M6 8 L6 14 M10 8 L10 14" stroke={c} strokeWidth="1.2" strokeLinecap="round"/><path d="M5 14 L11 14" stroke={c} strokeWidth="1.2" strokeLinecap="round"/></svg>,
  }
  return icons[type] ?? null
}

export default function PropertyCard({ property, index }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const attrs = property.property_attributes
  const eventTypes = property.property_event_types ?? []
  const firstEvent = eventTypes[0]?.event_type ?? ''
  const illustrationSrc = `/illustrations/property-types/${(property.property_type ?? 'villa-with-pool').replace(/_/g, '-')}.svg`

  async function handleShare() {
    const url = `${window.location.origin}/property/${property.slug}`
    try {
      if (navigator.share) {
        await navigator.share({ title: property.name, text: property.tagline, url })
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {}
  }

  async function handleWhatsApp() {
    try {
      await supabase.from('inquiries').insert({ property_id: property.id, event_type: firstEvent || 'general' })
    } catch (e) { /* continue even if logging fails */ }
    setShowModal(true)
  }

  function openWhatsApp() {
    const eventLabel = EVENT_TYPE_LABELS[firstEvent as keyof typeof EVENT_TYPE_LABELS] ?? firstEvent
    const message = encodeURIComponent(
      `Hi! I found ${property.name} on Theeram and I'm interested in booking for a ${eventLabel}. Could you share availability and pricing? Thank you!`
    )
    window.open(`https://wa.me/${property.owner_whatsapp}?text=${message}`, '_blank')
  }

  return (
    <>
      <div style={{ backgroundColor: 'white', borderRadius: 16, border: (property as any).is_featured ? '1.5px solid #C9A84C' : '0.5px solid #D6C9B8', overflow: 'hidden', position: 'relative' }}>
        {(property as any).is_featured && (
          <div style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#C9A84C', color: 'white', fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 999, letterSpacing: '0.05em', zIndex: 2 }}>
            EDITOR&apos;S PICK
          </div>
        )}

        {/* Illustration */}
        <Link href={`/property/${property.slug}`} style={{ display: 'block', position: 'relative', height: 180, overflow: 'hidden' }}>
          <img src={illustrationSrc} alt={PROPERTY_TYPE_LABELS[property.property_type] ?? 'Property'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          {firstEvent && (
            <span style={{ position: 'absolute', bottom: 12, left: 12, backgroundColor: '#2C1A0E', color: 'white', fontSize: 11, padding: '4px 10px', borderRadius: 999 }}>
              {EVENT_TYPE_LABELS[firstEvent as keyof typeof EVENT_TYPE_LABELS] ?? firstEvent}
            </span>
          )}
        </Link>

        {/* Content */}
        <div style={{ padding: 16 }}>
          <Link href={`/property/${property.slug}`} style={{ textDecoration: 'none' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E', marginBottom: 4, lineHeight: 1.2 }}>{property.name}</h2>
            <p style={{ fontSize: 13, color: '#7C5C3E', marginBottom: 14, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{property.tagline}</p>
          </Link>

          {/* Attribute icons */}
          {attrs && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              {/* Guest count — most important, shown first */}
              {attrs.max_guests_day_event > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <svg viewBox="0 0 16 16" fill="none" width={16} height={16}><path d="M8 7a3 3 0 100-6 3 3 0 000 6zM2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#6B8F71" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  <span style={{ fontSize: 10, color: '#6B8F71' }}>Up to {attrs.max_guests_day_event}</span>
                </div>
              )}
              {[
                { type: 'rooms', available: attrs.room_count > 0, label: attrs.room_count > 0 ? `${attrs.room_count}BR` : 'Rooms' },
                { type: 'pool', available: attrs.has_pool, label: 'Pool' },
                { type: 'hall', available: attrs.has_ac_hall, label: 'AC Hall' },
                { type: 'lawn', available: attrs.has_open_lawn, label: 'Lawn' },
                { type: 'alcohol', available: attrs.alcohol_allowed, label: 'Alcohol' },
              ].map(({ type, available, label }) => (
                <div key={type} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <Icon type={type} available={available} />
                  <span style={{ fontSize: 10, color: available ? '#6B8F71' : '#D6C9B8' }}>{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Price */}
          <div style={{ textAlign: 'right', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: '#7C5C3E', fontStyle: 'italic' }}>
              From {property.price_guide?.split('–')[0] ?? '₹12,000'} / day
            </span>
          </div>

          {/* WhatsApp CTA + Share */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleWhatsApp}
              style={{ flex: 1, backgroundColor: '#25D366', color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 12, height: 44, border: 'none', cursor: 'pointer' }}
            >
              Check availability on WhatsApp
            </button>
            <button
              onClick={handleShare}
              style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid #D6C9B8', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C5C3E', flexShrink: 0 }}
              title="Share"
            >
              {copied ? '✓' : (
                <svg viewBox="0 0 20 20" fill="none" width={16} height={16} stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="15" cy="5" r="2"/><circle cx="5" cy="10" r="2"/><circle cx="15" cy="15" r="2"/>
                  <path d="M7 9l6-3M7 11l6 3" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <GratitudeModal isOpen={showModal} onClose={() => setShowModal(false)} property={property} eventType={firstEvent} onWhatsApp={openWhatsApp} />
    </>
  )
}
