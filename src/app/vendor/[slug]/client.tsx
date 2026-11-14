'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, Vendor, VENDOR_CATEGORY_LABELS } from '@/lib/supabase'
import { C, sans, serif } from '@/lib/design'
import Header from '@/components/Header'
import GratitudeModal from '@/components/GratitudeModal'

export default function VendorDetailClient({ slug, initialVendor }: { slug: string; initialVendor?: Vendor | null }) {
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(initialVendor ?? null)
  const [loading, setLoading] = useState(!initialVendor)
  const [copied, setCopied] = useState(false)
  const [activePhoto, setActivePhoto] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (initialVendor?.id) {
      setLoading(false)
      return
    }
    supabase.from('vendors').select('*').eq('slug', slug).eq('is_active', true).single()
      .then(({ data }) => { setVendor(data as Vendor); setLoading(false) })
  }, [slug, initialVendor])

  async function handleShare() {
    const url = window.location.href
    try { if (navigator.share) await navigator.share({ title: vendor?.name ?? '', url }); else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } } catch {}
  }

  function logInquiry() {
    if (!vendor) return
    fetch('/api/vendor-inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor_id: vendor.id }),
    }).catch(() => {})
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: `2px solid ${C.terra}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!vendor) return (
    <div style={{ minHeight: '100vh', background: C.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ ...sans, color: C.muted }}>Maker not found.</p>
      <Link href="/services" style={{ ...sans, fontSize: 13, color: C.terra, textDecoration: 'underline' }}>Back to makers</Link>
    </div>
  )

  const photos = vendor.photos ?? []
  const waDigits = (vendor.whatsapp ?? '').replace(/\D/g, '')
  const phoneDigits = (vendor.phone || vendor.whatsapp || '').replace(/\D/g, '')
  const waUrl = `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hi! I found ${vendor.name} on Theeram (theeramspaces.in) and I'm interested in your services. Could you share availability and pricing?`)}`

  function handleWhatsApp() {
    logInquiry()
    const w = window.open(waUrl, '_blank', 'noopener,noreferrer')
    if (!w) window.location.href = waUrl
    setShowModal(true)
  }

  return (
    <div style={{ background: C.cream, minHeight: '100vh', paddingBottom: 100 }}>
      <Header/>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button onClick={() => router.back()} style={{
            ...sans, fontSize: 12, color: C.text, background: C.cream2, border: `1px solid ${C.cream3}`,
            padding: '7px 14px', borderRadius: 999, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            ← Back
          </button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Check out ${vendor.name} (${VENDOR_CATEGORY_LABELS[vendor.category]}) on Theeram Spaces: https://www.theeramspaces.in/vendor/${vendor.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                ...sans, fontSize: 12, color: C.green, background: '#EEF5F0', border: `1px solid rgba(28,58,43,.2)`,
                padding: '7px 13px', borderRadius: 999, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
              }}
            >
              💬 WhatsApp
            </a>
            <button onClick={handleShare} style={{
              ...sans, fontSize: 12, color: C.text, background: 'white', border: `1px solid ${C.cream3}`,
              padding: '7px 14px', borderRadius: 999, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              {copied ? '✓ Link copied' : '↗ Share'}
            </button>
          </div>
        </div>

        {/* Rounded Hero Card */}
        <div style={{ background: 'white', borderRadius: 26, border: `1px solid ${C.cream3}`, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,.04)', marginBottom: 16 }}>
          <div style={{ background: C.green, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {photos.length > 0
              ? <img src={photos[0]} alt={`${vendor.name} — ${VENDOR_CATEGORY_LABELS[vendor.category]}`} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}/>
              : <div style={{ opacity: .1 }}>
                  <svg viewBox="0 0 120 120" fill="none" width={180} height={180} stroke="white" strokeWidth={.8}>
                    <circle cx="60" cy="60" r="50"/><circle cx="60" cy="60" r="30"/>
                    <line x1="60" y1="10" x2="60" y2="110"/><line x1="10" y1="60" x2="110" y2="60"/>
                  </svg>
                </div>
            }
            {vendor.is_featured && (
              <div style={{ position: 'absolute', top: 14, left: 14, background: C.gold, padding: '4px 12px', borderRadius: 999 }}>
                <span style={{ ...sans, fontSize: 9.5, fontWeight: 700, color: C.text, letterSpacing: '.05em' }}>★ Featured</span>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 20px 14px', background: 'linear-gradient(to top,rgba(0,0,0,.6),transparent)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <div style={{ width: 10, height: 1, background: C.gold }}/>
                <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.07em' }}>{VENDOR_CATEGORY_LABELS[vendor.category]}</span>
              </div>
              <h1 style={{ ...serif, fontSize: 24, color: 'white', fontWeight: 400, lineHeight: 1.2 }}>{vendor.name}</h1>
            </div>
          </div>

          <div style={{ padding: '18px 20px 20px' }}>
            <p style={{ ...sans, fontSize: 14, color: C.muted, lineHeight: 1.65, marginBottom: 12, fontWeight: 300 }}>{vendor.tagline}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              {vendor.area_served && (
                <span style={{ ...sans, fontSize: 11.5, color: C.muted, background: C.cream, padding: '6px 12px', borderRadius: 999, border: `1px solid ${C.cream3}` }}>
                  📍 {vendor.area_served}
                </span>
              )}
              {vendor.price_guide && (
                <span style={{ ...sans, fontSize: 11.5, color: C.text, fontWeight: 500, background: C.cream, padding: '6px 12px', borderRadius: 999, border: `1px solid ${C.cream3}` }}>
                  {vendor.price_guide}
                </span>
              )}
              {vendor.instagram_url && (
                <a href={vendor.instagram_url.startsWith('http') ? vendor.instagram_url : `https://instagram.com/${vendor.instagram_url.replace('@','')}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ ...sans, fontSize: 11.5, color: C.terra, background: '#FDF4EF', border: `1px solid rgba(155,61,30,.28)`, padding: '6px 13px', borderRadius: 999, textDecoration: 'none' }}>
                  Instagram →
                </a>
              )}
            </div>
          </div>
        </div>

        {vendor.description && (
          <div style={{ background: 'white', borderRadius: 24, border: `1px solid ${C.cream3}`, padding: '20px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <div style={{ width: 14, height: 1, background: C.terra }}/>
              <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>കൂടുതൽ</span>
              <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
            </div>
            <p style={{ ...sans, fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 300, margin: 0 }}>{vendor.description}</p>
          </div>
        )}

        {photos.length > 1 && (
          <div style={{ background: 'white', borderRadius: 24, border: `1px solid ${C.cream3}`, padding: '20px 20px', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {photos.map((url, i) => (
                <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 14, cursor: 'pointer' }} onClick={() => setActivePhoto(url)}>
                  <img src={url} alt={`${vendor.name} portfolio photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(245,240,232,.96)', backdropFilter: 'blur(8px)', borderTop: `1px solid ${C.cream3}`, padding: '12px 16px', zIndex: 30 }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', gap: 10 }}>
          <Link href="/services" style={{ width: 48, height: 48, borderRadius: 14, border: `1px solid ${C.cream3}`, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, textDecoration: 'none', flexShrink: 0 }}>
            <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5L7 10l5 5"/></svg>
          </Link>
          {phoneDigits && (
            <a href={`tel:+${phoneDigits}`} onClick={logInquiry} style={{ ...sans, height: 48, borderRadius: 14, border: `1px solid ${C.green}`, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.green, textDecoration: 'none', padding: '0 16px', fontSize: 12, fontWeight: 600 }}>
              📞 Call
            </a>
          )}
          {waDigits && (
            <button onClick={handleWhatsApp} style={{ ...sans, flex: 1, background: C.green, color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', height: 48, borderRadius: 14, border: 'none', cursor: 'pointer' }}>
              Check availability on WhatsApp
            </button>
          )}
        </div>
      </div>

      {activePhoto && (
        <div onClick={() => setActivePhoto(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={activePhoto} alt={`${vendor.name} enlarged photo`} style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 14 }} onClick={e => e.stopPropagation()}/>
          <button onClick={() => setActivePhoto(null)} style={{ position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={1.8}><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round"/></svg>
          </button>
        </div>
      )}

      {showModal && (
        <GratitudeModal
          propertyName={vendor.name}
          whatsappUrl={waUrl}
          reviewUrl="https://g.page/r/Cav0otb1aGpEEBM/review"
          upiUrl="upi://pay?pa=smm0794@okhdfcbank&pn=Theeram&am=20&cu=INR&tn=Theeram+chai"
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
