'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Vendor, VENDOR_CATEGORY_LABELS, VENDOR_CATEGORIES, VendorCategory, VENDOR_CATEGORY_ICONS } from '@/lib/supabase'
import { C, sans, serif } from '@/lib/design'
import Header from '@/components/Header'

export default function ServicesPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [activeCategory, setActiveCategory] = useState<VendorCategory | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('vendors').select('*').eq('is_active', true)
      .order('is_featured', { ascending: false }).order('created_at', { ascending: false })
      .then(({ data }) => { setVendors((data as Vendor[]) ?? []); setLoading(false) })
  }, [])

  const filtered = vendors.filter(v => {
    if (activeCategory !== 'all' && v.category !== activeCategory) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return v.name.toLowerCase().includes(q) || v.tagline?.toLowerCase().includes(q)
    }
    return true
  })

  function handleWhatsApp(v: Vendor) {
    const msg = encodeURIComponent(`Hi! I found ${v.name} on Theeram and I'm interested in your services.`)
    window.open(`https://wa.me/${v.whatsapp}?text=${msg}`, '_blank')
  }

  return (
    <div style={{ background: C.cream, minHeight: '100vh' }}>
      <Header/>

      {/* Hero strip */}
      <div style={{ background: C.green, padding: '36px 20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{ width: 16, height: 1, background: C.gold }}/>
          <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.08em' }}>കൂട്ട്</span>
          <div style={{ width: 16, height: 1, background: C.gold }}/>
        </div>
        <h1 style={{ ...serif, fontSize: 28, color: 'white', fontWeight: 300, lineHeight: 1.2, marginBottom: 10 }}>
          The people who<br/>make it happen.
        </h1>
        <p style={{ ...sans, fontSize: 13, color: 'rgba(255,255,255,.65)', lineHeight: 1.7, fontWeight: 300, maxWidth: 300, marginBottom: 20 }}>
          From the photographer who has shot every wedding in your family to the cook who knows your grandmother's avial recipe.
        </p>
        <Link href="/join" style={{ ...sans, display: 'inline-block', background: 'transparent', color: C.gold, fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '10px 18px', border: `1px solid ${C.gold}`, textDecoration: 'none' }}>
          + List your service
        </Link>
      </div>

      {/* Category filter */}
      <div style={{ background: C.cream2, borderBottom: `1px solid ${C.cream3}`, padding: '0 0 0', overflowX: 'auto' }}>
        <div style={{ display: 'flex', padding: '0 16px' }} className="no-scrollbar">
          {[{ id: 'all', label: 'All makers' }, ...VENDOR_CATEGORIES.map(c => ({ id: c, label: VENDOR_CATEGORY_LABELS[c] }))].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveCategory(id as any)}
              style={{ ...sans, flexShrink: 0, padding: '12px 14px', fontSize: 12, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', borderBottom: activeCategory === id ? `2px solid ${C.terra}` : '2px solid transparent', color: activeCategory === id ? C.terra : C.muted, letterSpacing: '.01em', transition: 'all .15s' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>

      {/* Search */}
      <div style={{ padding: '12px 16px', position: 'relative' }}>
        <svg viewBox="0 0 16 16" fill="none" width={13} height={13} stroke={C.muted} strokeWidth={1.4} strokeLinecap="round" style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)' }}>
          <circle cx="7" cy="7" r="5"/><path d="M11 11l2 2"/>
        </svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search makers..." style={{ width: '100%', border: `1px solid ${C.cream3}`, padding: '10px 12px 10px 34px', fontSize: 13, fontFamily: 'system-ui,sans-serif', background: 'white', outline: 'none', color: C.text, fontWeight: 300, boxSizing: 'border-box' as const }}/>
      </div>

      {/* Count */}
      <p style={{ ...sans, fontSize: 11, color: C.muted, padding: '0 16px 8px' }}>
        {loading ? 'Loading...' : `${filtered.length} ${filtered.length === 1 ? 'maker' : 'makers'}${activeCategory !== 'all' ? ` in ${VENDOR_CATEGORY_LABELS[activeCategory as VendorCategory]}` : ''}`}
      </p>

      {/* Maker cards */}
      <div style={{ padding: '0 16px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? [1,2,3].map(i => <div key={i} style={{ height: 160, background: 'white', border: `1px solid ${C.cream3}` }}/>)
        : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ ...sans, fontSize: 14, color: C.muted, marginBottom: 10 }}>No makers found.</p>
            <button onClick={() => { setActiveCategory('all'); setSearch('') }} style={{ ...sans, fontSize: 12, color: C.terra, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear filters</button>
          </div>
        ) : filtered.map(v => (
          <div key={v.id} style={{ background: 'white', border: v.is_featured ? `1.5px solid ${C.gold}` : `1px solid ${C.cream3}`, padding: '18px 16px', position: 'relative' }}>
            {v.is_featured && <div style={{ position: 'absolute', top: 0, left: 0, background: C.gold, padding: '3px 8px' }}><span style={{ ...sans, fontSize: 9, fontWeight: 700, color: C.text }}>Featured</span></div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
              <div style={{ width: 8, height: 1, background: C.terra }}/>
              <span style={{ ...sans, fontSize: 9, color: C.terra, letterSpacing: '.07em' }}>{VENDOR_CATEGORY_LABELS[v.category]}</span>
              <div style={{ width: 8, height: 1, background: C.terra }}/>
            </div>
            <Link href={`/vendor/${v.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{ ...serif, fontSize: 19, fontWeight: 400, color: C.text, marginBottom: 4, lineHeight: 1.2 }}>{v.name}</div>
              <div style={{ ...sans, fontSize: 12, color: C.muted, fontWeight: 300, lineHeight: 1.5, marginBottom: v.area_served ? 6 : 12 }}>{v.tagline}</div>
            </Link>
            {v.area_served && <div style={{ ...sans, fontSize: 11, color: C.muted, marginBottom: 12 }}>📍 {v.area_served}</div>}
            {v.price_guide && <div style={{ ...sans, fontSize: 12, color: C.muted, fontStyle: 'italic', marginBottom: 12, fontWeight: 300 }}>{v.price_guide}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              {v.whatsapp && <button onClick={() => handleWhatsApp(v)} style={{ ...sans, flex: 1, background: C.green, color: 'white', fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', padding: '9px 0', border: 'none', cursor: 'pointer' }}>WhatsApp</button>}
              {v.phone && <a href={`tel:${v.phone}`} style={{ ...sans, padding: '9px 12px', border: `1px solid ${C.cream3}`, color: C.text, fontSize: 10, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>📞 Call</a>}
              <Link href={`/vendor/${v.slug}`} style={{ ...sans, padding: '9px 12px', border: `1px solid ${C.cream3}`, color: C.muted, fontSize: 10, fontWeight: 400, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>More →</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
