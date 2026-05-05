'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Vendor, VendorCategory, VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS, VENDOR_CATEGORY_ICONS } from '@/lib/supabase'
import VendorCard from '@/components/VendorCard'

export default function ServicesPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [activeCategory, setActiveCategory] = useState<VendorCategory>('event_management')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVendors()
  }, [])

  async function fetchVendors() {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
      if (!error && data) setVendors(data as Vendor[])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const filtered = vendors.filter((v) => v.category === activeCategory)

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAF7F2' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, backgroundColor: '#FAF7F2', borderBottom: '0.5px solid #D6C9B8', padding: '10px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <Link href="/" style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#2C1A0E', textDecoration: 'none', letterSpacing: '-0.01em' }}>Theeram</Link>
            <span style={{ color: '#C9A84C', fontSize: 14 }}>·</span>
            <span style={{ fontSize: 11, color: '#7C5C3E', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 500 }}>Services</span>
          </div>
          <Link href="/join" style={{ fontSize: 12, color: '#D4735E', border: '1px solid #D4735E', borderRadius: 999, padding: '5px 12px', textDecoration: 'none', fontWeight: 500 }}>
            List your service
          </Link>
        </div>
      </header>

      {/* Category tabs */}
      <div style={{ backgroundColor: '#FAF7F2', paddingTop: 16, paddingBottom: 4, borderBottom: '0.5px solid #D6C9B8' }}>
        <p style={{ padding: '0 16px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C5C3E', marginBottom: 12 }}>
          What do you need?
        </p>
        <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingLeft: 24, paddingRight: 16, paddingBottom: 12 }}>
          {VENDOR_CATEGORIES.map((cat) => {
            const active = activeCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  flexShrink: 0,
                  padding: '10px 16px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 500,
                  border: active ? 'none' : '1px solid #7C5C3E',
                  backgroundColor: active ? '#2C1A0E' : 'transparent',
                  color: active ? 'white' : '#7C5C3E',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>{VENDOR_CATEGORY_ICONS[cat]}</span>
                {VENDOR_CATEGORY_LABELS[cat]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Vendor count */}
      <p style={{ padding: '12px 16px 4px', fontSize: 11, color: '#7C5C3E' }}>
        {loading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'vendor' : 'vendors'} in ${VENDOR_CATEGORY_LABELS[activeCategory]}`}
      </p>

      {/* Vendor cards */}
      <section style={{ padding: '8px 16px 48px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2].map((i) => <div key={i} style={{ height: 320, backgroundColor: 'white', borderRadius: 16, border: '0.5px solid #D6C9B8' }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 48 }}>
            <p style={{ color: '#7C5C3E', fontSize: 14, marginBottom: 8 }}>No vendors listed yet in this category.</p>
            <p style={{ color: '#B4A898', fontSize: 12, marginBottom: 20 }}>Know someone who should be here?</p>
            <Link href="/join" style={{ fontSize: 13, color: '#D4735E', textDecoration: 'underline' }}>Suggest a vendor</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((vendor, index) => (
              <VendorCard key={vendor.id} vendor={vendor} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FAF7F2', borderTop: '0.5px solid #D6C9B8', padding: '10px 16px', display: 'flex', gap: 8, zIndex: 30 }}>
        <Link href="/" style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 999, border: '1px solid #D6C9B8', color: '#7C5C3E', fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
          🏡 Spaces
        </Link>
        <Link href="/services" style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 999, backgroundColor: '#2C1A0E', color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
          ✨ Services
        </Link>
      </div>
    </main>
  )
}
