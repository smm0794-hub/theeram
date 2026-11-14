'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Vendor, VENDOR_CATEGORY_LABELS, VENDOR_CATEGORIES, VendorCategory } from '@/lib/supabase'
import { C, sans, serif } from '@/lib/design'
import Header from '@/components/Header'
import MakerCard from '@/components/MakerCard'

export default function ServicesClient({ initialVendors }: { initialVendors?: Vendor[] }) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors ?? [])
  const [activeCategory, setActiveCategory] = useState<VendorCategory | 'all'>('all')
  const [loading, setLoading] = useState(!initialVendors)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (initialVendors) {
      setLoading(false)
      return
    }
    supabase.from('vendors').select('*, vendor_attributes(*)').eq('is_active', true)
      .order('is_featured', { ascending: false }).order('created_at', { ascending: false })
      .then(({ data }) => {
        const normalised = (data ?? []).map((v: any) => ({
          ...v,
          vendor_attributes: Array.isArray(v.vendor_attributes) ? v.vendor_attributes[0] : v.vendor_attributes,
        }))
        setVendors(normalised as Vendor[])
        setLoading(false)
      })
  }, [initialVendors])

  const filtered = vendors.filter(v => {
    if (activeCategory !== 'all' && v.category !== activeCategory) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return v.name.toLowerCase().includes(q) || v.tagline?.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div style={{ background: C.cream, minHeight: '100vh' }}>
      <Header/>
      <style>{`
        .no-scrollbar::-webkit-scrollbar{display:none}
        .services-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 720px) {
          .services-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
        }
      `}</style>

      {/* Hero strip */}
      <div style={{ background: C.green, padding: '36px 20px 32px' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 16, height: 1, background: C.gold }}/>
            <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.08em' }}>കൂട്ട്</span>
            <div style={{ width: 16, height: 1, background: C.gold }}/>
          </div>
          <h1 style={{ ...serif, fontSize: 28, color: 'white', fontWeight: 300, lineHeight: 1.2, marginBottom: 10 }}>
            The people who<br/>make it happen.
          </h1>
          <p style={{ ...sans, fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.7, fontWeight: 300, maxWidth: 360, marginBottom: 20 }}>
            From the photographer who has shot every wedding in your family to the cook who knows your grandmother’s avial recipe.
          </p>
          <Link href="/join" style={{ ...sans, display: 'inline-block', background: 'transparent', color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '10px 18px', border: `1px solid ${C.gold}`, borderRadius: 8, textDecoration: 'none' }}>
            + List your service
          </Link>
        </div>
      </div>

      {/* Category filter — sleek horizontal tab strip */}
      <div style={{ background: C.cream2, borderBottom: `1px solid ${C.cream3}`, overflowX: 'auto' }} className="no-scrollbar">
        <div style={{ maxWidth: 1052, margin: '0 auto', display: 'flex', padding: '0 16px' }}>
          {[{ id: 'all', label: 'All makers' }, ...VENDOR_CATEGORIES.map(c => ({ id: c, label: VENDOR_CATEGORY_LABELS[c] }))].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id as any)}
              style={{
                ...sans, flexShrink: 0, padding: '12px 14px', fontSize: 12, fontWeight: 500,
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: activeCategory === id ? `2px solid ${C.terra}` : '2px solid transparent',
                color: activeCategory === id ? C.terra : C.muted,
                letterSpacing: '.01em', transition: 'all .15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1052, margin: '0 auto', padding: '14px 16px 56px' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <svg viewBox="0 0 16 16" fill="none" width={13} height={13} stroke={C.muted} strokeWidth={1.4} strokeLinecap="round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="7" cy="7" r="5"/><path d="M11 11l2 2"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search makers..." style={{ width: '100%', border: `1px solid ${C.cream3}`, borderRadius: 10, padding: '10px 12px 10px 34px', fontSize: 13, fontFamily: 'system-ui,sans-serif', background: 'white', outline: 'none', color: C.text, fontWeight: 300, boxSizing: 'border-box' as const }}/>
        </div>

        {/* Count */}
        <p style={{ ...sans, fontSize: 11, color: C.muted, padding: '0 2px 10px', margin: 0 }}>
          {loading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'maker' : 'makers'}${activeCategory !== 'all' ? ` in ${VENDOR_CATEGORY_LABELS[activeCategory as VendorCategory]}` : ''}`}
        </p>

        {/* Maker cards */}
        {loading ? (
          <div className="services-grid">
            {[1,2,3,4].map(i => <div key={i} style={{ height: 220, background: 'white', borderRadius: 22, border: `1px solid ${C.cream3}` }}/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '44px 20px', background: 'white', borderRadius: 24, border: `1px solid ${C.cream3}` }}>
            <p style={{ ...sans, fontSize: 14, color: C.muted, marginBottom: 10 }}>No makers found.</p>
            <button onClick={() => { setActiveCategory('all'); setSearch('') }} style={{ ...sans, fontSize: 12, color: C.terra, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
          </div>
        ) : (
          <div className="services-grid">
            {filtered.map(v => <MakerCard key={v.id} maker={v as any}/>)}
          </div>
        )}
      </div>
    </div>
  )
}
