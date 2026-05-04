'use client'

import { useEffect, useState } from 'react'
import { Property, EVENT_TYPE_LABELS } from '@/lib/supabase'

interface Props {
  isOpen: boolean
  onClose: () => void
  property: Property
  eventType: string
}

const UPI_ID = 'smm0794@okhdfcbank'
const UPI_NAME = 'Theeram'
const UPI_AMOUNT = '20'
const UPI_NOTE = 'Theeram+coffee'

export default function GratitudeModal({ isOpen, onClose, property, eventType }: Props) {
  if (!isOpen) return null

  function openWhatsApp() {
    const eventLabel = EVENT_TYPE_LABELS[eventType as keyof typeof EVENT_TYPE_LABELS] ?? eventType
    const message = encodeURIComponent(
      `Hi! I found ${property.name} on Theeram and I'm interested in booking for a ${eventLabel}. Could you share availability and pricing? Thank you!`
    )
    window.open(`https://wa.me/${property.owner_whatsapp}?text=${message}`, '_blank')
    onClose()
  }

  function openUPI() {
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${UPI_AMOUNT}&cu=INR&tn=${UPI_NOTE}`
    window.location.href = upiUrl
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: 'rgba(44,26,14,0.65)' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: 'white', borderRadius: 20, width: 300, padding: 24, textAlign: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top label */}
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#7C5C3E', marginBottom: 12 }}>
          You found your space
        </p>

        {/* Headline */}
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2C1A0E', lineHeight: 1.4, marginBottom: 20 }}>
          Connecting you to {property.name} on WhatsApp
        </p>

        {/* QR code — for scanning on desktop */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <div style={{ width: 88, height: 88, borderRadius: 10, border: '1px solid #D6C9B8', overflow: 'hidden' }}>
            <img src="/upi-qr.png" alt="UPI QR Code" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        <p style={{ fontSize: 13, color: '#7C5C3E', marginBottom: 4 }}>Buy Theeram a coffee · ₹20</p>
        <p style={{ fontSize: 11, color: '#B4A898', marginBottom: 16 }}>Scan with any UPI app · or tap below</p>

        {/* UPI deep link — opens UPI app directly on phone */}
        <button
          onClick={openUPI}
          style={{ width: '100%', backgroundColor: '#FAF7F2', color: '#2C1A0E', fontWeight: 600, fontSize: 14, borderRadius: 12, height: 44, border: '1px solid #D6C9B8', cursor: 'pointer', marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none">
            <rect width="24" height="24" rx="4" fill="#5F259F"/>
            <path d="M12 5L7 12h4v2l5-7h-4V5z" fill="white"/>
          </svg>
          Pay ₹20 with UPI
        </button>

        <p style={{ fontSize: 10, color: '#B4A898', marginBottom: 16 }}>Opens GPay, PhonePe, Paytm or any UPI app</p>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#D6C9B8' }} />
          <span style={{ fontSize: 11, color: '#B4A898' }}>then</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#D6C9B8' }} />
        </div>

        {/* WhatsApp CTA — primary action */}
        <button
          onClick={openWhatsApp}
          style={{ width: '100%', backgroundColor: '#25D366', color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 12, height: 48, border: 'none', cursor: 'pointer', marginBottom: 12 }}
        >
          Continue to WhatsApp
        </button>

        {/* Skip */}
        <button
          onClick={openWhatsApp}
          style={{ fontSize: 12, color: '#B4A898', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
