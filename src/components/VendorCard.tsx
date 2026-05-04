'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Vendor, VENDOR_CATEGORY_LABELS } from '@/lib/supabase'

interface Props {
  vendor: Vendor
  index: number
}

export default function VendorCard({ vendor, index }: Props) {
  const [copied, setCopied] = useState(false)
  const illustrationSrc = `/illustrations/vendors/${vendor.category.replace(/_/g, '-')}.svg`

  function handleWhatsApp() {
    const message = encodeURIComponent(
      `Hi! I found ${vendor.name} on Theeram and I'm interested in your services. Could you share more details?`
    )
    window.open(`https://wa.me/${vendor.whatsapp}?text=${message}`, '_blank')
  }

  function handlePhone() {
    window.open(`tel:${vendor.phone}`, '_self')
  }

  async function handleShare() {
    const url = `${window.location.origin}/vendor/${vendor.slug}`
    const shareData = {
      title: vendor.name,
      text: `${vendor.tagline} — found on Theeram Spaces`,
      url,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {}
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 16,
        border: vendor.is_featured ? '1.5px solid #C9A84C' : '0.5px solid #D6C9B8',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Featured badge */}
      {vendor.is_featured && (
        <div style={{ position: 'absolute', top: 12, right: 12, backgroundColor: '#C9A84C', color: 'white', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, letterSpacing: '0.05em', zIndex: 2 }}>
          FEATURED
        </div>
      )}

      {/* Illustration */}
      <Link href={`/vendor/${vendor.slug}`} style={{ display: 'block', height: 160, overflow: 'hidden' }}>
        <img
          src={illustrationSrc}
          alt={VENDOR_CATEGORY_LABELS[vendor.category]}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </Link>

      {/* Content */}
      <div style={{ padding: 16 }}>
        {/* Category pill */}
        <span style={{ fontSize: 10, color: '#7C5C3E', border: '1px solid #D6C9B8', borderRadius: 999, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {VENDOR_CATEGORY_LABELS[vendor.category]}
        </span>

        <Link href={`/vendor/${vendor.slug}`} style={{ textDecoration: 'none' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E', marginTop: 8, marginBottom: 4, lineHeight: 1.2 }}>
            {vendor.name}
          </h2>
          <p style={{ fontSize: 13, color: '#7C5C3E', marginBottom: 4, lineHeight: 1.4 }}>{vendor.tagline}</p>
        </Link>

        {vendor.area_served && (
          <p style={{ fontSize: 11, color: '#B4A898', marginBottom: 12 }}>📍 {vendor.area_served}</p>
        )}

        {vendor.price_guide && (
          <p style={{ fontSize: 12, color: '#7C5C3E', fontStyle: 'italic', marginBottom: 12 }}>{vendor.price_guide}</p>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {/* WhatsApp */}
          {vendor.whatsapp && (
            <button
              onClick={handleWhatsApp}
              style={{ flex: 1, backgroundColor: '#25D366', color: 'white', fontWeight: 700, fontSize: 13, borderRadius: 10, height: 40, border: 'none', cursor: 'pointer' }}
            >
              WhatsApp
            </button>
          )}

          {/* Phone */}
          {vendor.phone && (
            <button
              onClick={handlePhone}
              style={{ flex: vendor.whatsapp ? 0 : 1, backgroundColor: 'transparent', color: '#7C5C3E', fontWeight: 600, fontSize: 13, borderRadius: 10, height: 40, border: '1px solid #D6C9B8', cursor: 'pointer', padding: '0 16px' }}
            >
              📞 Call
            </button>
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            style={{ backgroundColor: 'transparent', color: '#7C5C3E', fontWeight: 600, fontSize: 13, borderRadius: 10, height: 40, width: 40, border: '1px solid #D6C9B8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            title="Share this vendor"
          >
            {copied ? '✓' : (
              <svg viewBox="0 0 20 20" fill="none" width={16} height={16} stroke="currentColor" strokeWidth={1.5}>
                <circle cx="15" cy="5" r="2"/>
                <circle cx="5" cy="10" r="2"/>
                <circle cx="15" cy="15" r="2"/>
                <path d="M7 9l6-3M7 11l6 3" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
