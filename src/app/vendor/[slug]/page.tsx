'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, Vendor, VENDOR_CATEGORY_LABELS } from '@/lib/supabase'

export default function VendorDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [activePhoto, setActivePhoto] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('vendors')
          .select('*')
          .eq('slug', params.slug)
          .eq('is_active', true)
          .single()
        setVendor(data as Vendor)
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [params.slug])

  async function handleShare() {
    const url = window.location.href
    const shareData = { title: vendor?.name ?? 'Theeram', text: vendor?.tagline ?? '', url }
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

  function handleWhatsApp() {
    if (!vendor) return
    const message = encodeURIComponent(`Hi! I found ${vendor.name} on Theeram and I'm interested in your services. Could you share more details?`)
    window.open(`https://wa.me/${vendor.whatsapp}?text=${message}`, '_blank')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #7C5C3E', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!vendor) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ color: '#7C5C3E' }}>Vendor not found.</p>
      <Link href="/services" style={{ color: '#7C5C3E', fontSize: 13, textDecoration: 'underline' }}>Back to services</Link>
    </div>
  )

  const illustrationSrc = `/illustrations/vendors/${vendor.category.replace(/_/g, '-')}.svg`
  const photos = vendor.photos ?? []

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', paddingBottom: 100 }}>

      {/* Hero */}
      <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
        <img src={illustrationSrc} alt={VENDOR_CATEGORY_LABELS[vendor.category]} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <button onClick={() => router.back()} style={{ position: 'absolute', top: 16, left: 16, width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 20 20" fill="none" width={20} height={20} stroke="white" strokeWidth={2}><path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {/* Share button */}
        <button onClick={handleShare} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          {copied ? (
            <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={2}><path d="M4 10l5 5 7-9" strokeLinecap="round" strokeLinejoin="round"/></svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={1.8}>
              <circle cx="15" cy="5" r="2"/><circle cx="5" cy="10" r="2"/><circle cx="15" cy="15" r="2"/>
              <path d="M7 9l6-3M7 11l6 3" strokeLinecap="round"/>
            </svg>
          )}
        </button>
        {vendor.is_featured && (
          <div style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: '#C9A84C', color: 'white', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999 }}>FEATURED</div>
        )}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Category */}
        <span style={{ fontSize: 10, color: '#7C5C3E', border: '1px solid #D6C9B8', borderRadius: 999, padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {VENDOR_CATEGORY_LABELS[vendor.category]}
        </span>

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#2C1A0E', marginTop: 10, marginBottom: 6, lineHeight: 1.2 }}>{vendor.name}</h1>
        <p style={{ fontSize: 14, color: '#7C5C3E', marginBottom: 6 }}>{vendor.tagline}</p>
        {vendor.area_served && <p style={{ fontSize: 12, color: '#B4A898', marginBottom: 16 }}>📍 {vendor.area_served}</p>}

        {/* Social links */}
        {vendor.instagram_url && (
          <div style={{ marginBottom: 16 }}>
            <a href={vendor.instagram_url.startsWith('http') ? vendor.instagram_url : `https://instagram.com/${vendor.instagram_url.replace('@', '')}`}
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: '#7C5C3E', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg viewBox="0 0 20 20" fill="none" width={14} height={14} stroke="currentColor" strokeWidth={1.4}>
                <rect x="2" y="2" width="16" height="16" rx="4"/>
                <circle cx="10" cy="10" r="3.5"/>
                <circle cx="14.5" cy="5.5" r="0.8" fill="currentColor"/>
              </svg>
              Instagram
            </a>
          </div>
        )}

        {/* About */}
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2C1A0E', marginBottom: 8 }}>About</h2>
          <p style={{ fontSize: 15, color: '#333', lineHeight: 1.7 }}>{vendor.description}</p>
        </section>

        {/* Price guide */}
        {vendor.price_guide && (
          <p style={{ fontSize: 13, color: '#7C5C3E', fontStyle: 'italic', marginBottom: 20 }}>{vendor.price_guide}</p>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2C1A0E', marginBottom: 12 }}>Gallery</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {photos.map((url, i) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', cursor: 'pointer', position: 'relative' }} onClick={() => setActivePhoto(url)}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 2, right: 4 }}>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' }}>© Theeram</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Legal */}
        <div style={{ borderTop: '0.5px solid #D6C9B8', paddingTop: 16 }}>
          <p style={{ fontSize: 10, color: '#B4A898', lineHeight: 1.6 }}>
            All photographs are the property of their respective owners. Theeram Spaces is a discovery platform and is not responsible for the accuracy of vendor details.
          </p>
        </div>
      </div>

      {/* Sticky CTA */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FAF7F2', borderTop: '0.5px solid #D6C9B8', padding: '12px 16px', zIndex: 30, display: 'flex', gap: 10 }}>
        {vendor.phone && (
          <a href={`tel:${vendor.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, border: '1px solid #D6C9B8', color: '#7C5C3E', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            📞 Call
          </a>
        )}
        {vendor.whatsapp && (
          <button onClick={handleWhatsApp} style={{ flex: 2, backgroundColor: '#25D366', color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 12, height: 48, border: 'none', cursor: 'pointer' }}>
            WhatsApp
          </button>
        )}
      </div>

      {/* Lightbox */}
      {activePhoto && (
        <div onClick={() => setActivePhoto(null)} style={{ position: 'fixed', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <img src={activePhoto} alt="" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 8, objectFit: 'contain' }} onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setActivePhoto(null)} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 20 20" fill="none" width={18} height={18} stroke="white" strokeWidth={2}><path d="M5 5l10 10M15 5L5 15" strokeLinecap="round"/></svg>
          </button>
        </div>
      )}
    </main>
  )
}
