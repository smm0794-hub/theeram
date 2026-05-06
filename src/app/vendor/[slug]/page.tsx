'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, Vendor, VENDOR_CATEGORY_LABELS } from '@/lib/supabase'
import { C, sans, serif } from '@/lib/design'
import Header from '@/components/Header'

export default function VendorDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activePhoto, setActivePhoto] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('vendors').select('*').eq('slug', params.slug).eq('is_active', true).single()
      .then(({ data }) => { setVendor(data as Vendor); setLoading(false) })
  }, [params.slug])

  async function handleShare() {
    const url = window.location.href
    try { if (navigator.share) await navigator.share({ title: vendor?.name ?? '', url }); else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) } } catch {}
  }

  function handleWhatsApp() {
    if (!vendor) return
    const msg = encodeURIComponent(`Hi! I found ${vendor.name} on Theeram and I'm interested in your services.`)
    window.open(`https://wa.me/${vendor.whatsapp}?text=${msg}`, '_blank')
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
      <Link href="/?tab=makers" style={{ ...sans, fontSize: 13, color: C.terra, textDecoration: 'underline' }}>Back to makers</Link>
    </div>
  )

  const photos = vendor.photos ?? []

  return (
    <div style={{ background: C.cream, minHeight: '100vh', paddingBottom: 90 }}>
      <Header/>

      {/* Hero zone */}
      <div style={{ background: C.green, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        {photos.length > 0
          ? <img src={photos[0]} alt={vendor.name} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}/>
          : <div style={{ opacity: .1 }}>
              <svg viewBox="0 0 120 120" fill="none" width={180} height={180} stroke="white" strokeWidth={.8}>
                <circle cx="60" cy="60" r="50"/><circle cx="60" cy="60" r="30"/>
                <line x1="60" y1="10" x2="60" y2="110"/><line x1="10" y1="60" x2="110" y2="60"/>
              </svg>
            </div>
        }
        <button onClick={() => router.back()} style={{ position: 'absolute', top: 16, left: 16, width: 36, height: 36, background: 'rgba(0,0,0,.4)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5L7 10l5 5"/></svg>
        </button>
        <button onClick={handleShare} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, background: 'rgba(0,0,0,.4)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {copied
            ? <svg viewBox="0 0 20 20" fill="none" width={16} height={16} stroke="white" strokeWidth={2}><path d="M4 10l5 5 7-9" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg viewBox="0 0 14 14" fill="none" width={14} height={14} stroke="white" strokeWidth={1.3} strokeLinecap="round"><circle cx="11" cy="2.5" r="1.5"/><circle cx="3" cy="7" r="1.5"/><circle cx="11" cy="11.5" r="1.5"/><path d="M4.5 6.3l5-3.2M4.5 7.7l5 3.2"/></svg>
          }
        </button>
        {vendor.is_featured && (
          <div style={{ position: 'absolute', bottom: 12, right: 12, background: C.gold, padding: '4px 10px' }}>
            <span style={{ ...sans, fontSize: 9, fontWeight: 700, color: C.text, letterSpacing: '.07em' }}>Featured</span>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 16px 12px', background: 'linear-gradient(to top,rgba(0,0,0,.55),transparent)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <div style={{ width: 10, height: 1, background: C.gold }}/>
            <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.07em' }}>{VENDOR_CATEGORY_LABELS[vendor.category]}</span>
            <div style={{ width: 10, height: 1, background: C.gold }}/>
          </div>
          <h1 style={{ ...serif, fontSize: 22, color: 'white', fontWeight: 400, lineHeight: 1.2 }}>{vendor.name}</h1>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 16px 0' }}>
        <p style={{ ...sans, fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 16, fontWeight: 300 }}>{vendor.tagline}</p>
        {vendor.area_served && <p style={{ ...sans, fontSize: 12, color: C.muted, marginBottom: 16 }}>📍 {vendor.area_served}</p>}

        {vendor.instagram_url && (
          <a href={vendor.instagram_url.startsWith('http') ? vendor.instagram_url : `https://instagram.com/${vendor.instagram_url.replace('@','')}`}
            target="_blank" rel="noopener noreferrer"
            style={{ ...sans, fontSize: 12, color: C.terra, textDecoration: 'none', borderBottom: `1px solid ${C.terra}`, paddingBottom: 1, display: 'inline-block', marginBottom: 20 }}>
            Instagram →
          </a>
        )}

        {vendor.description && (
          <div style={{ borderTop: `1px solid ${C.cream3}`, paddingTop: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
              <div style={{ width: 14, height: 1, background: C.terra }}/>
              <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em' }}>കൂടുതൽ</span>
              <div style={{ flex: 1, height: 1, background: C.cream3 }}/>
            </div>
            <p style={{ ...sans, fontSize: 14, color: '#444', lineHeight: 1.8, fontWeight: 300 }}>{vendor.description}</p>
          </div>
        )}

        {vendor.price_guide && (
          <p style={{ ...sans, fontSize: 13, color: C.muted, fontStyle: 'italic', borderTop: `1px solid ${C.cream3}`, paddingTop: 16, marginBottom: 16, fontWeight: 300 }}>{vendor.price_guide}</p>
        )}

        {photos.length > 1 && (
          <div style={{ borderTop: `1px solid ${C.cream3}`, paddingTop: 20, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {photos.map((url, i) => (
                <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setActivePhoto(url)}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}/>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: C.cream, borderTop: `1px solid ${C.cream3}`, padding: '12px 16px', display: 'flex', gap: 10, zIndex: 30 }}>
        <Link href="/?tab=makers" style={{ width: 44, height: 44, border: `1px solid ${C.cream3}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, textDecoration: 'none', flexShrink: 0 }}>
          <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5L7 10l5 5"/></svg>
        </Link>
        {vendor.phone && (
          <a href={`tel:${vendor.phone}`} style={{ ...sans, height: 44, border: `1px solid ${C.cream3}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, textDecoration: 'none', padding: '0 14px', fontSize: 11, fontWeight: 500 }}>
            📞 Call
          </a>
        )}
        {vendor.whatsapp && (
          <button onClick={handleWhatsApp} style={{ ...sans, flex: 1, background: C.green, color: 'white', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', height: 44, border: 'none', cursor: 'pointer' }}>
            WhatsApp
          </button>
        )}
      </div>

      {activePhoto && (
        <div onClick={() => setActivePhoto(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={activePhoto} alt="" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }} onClick={e => e.stopPropagation()}/>
          <button onClick={() => setActivePhoto(null)} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, background: 'rgba(255,255,255,.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={1.8}><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}
