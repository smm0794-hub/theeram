'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Vendor, VendorSubmission, VENDOR_CATEGORY_LABELS, VENDOR_CATEGORIES, VENDOR_CATEGORY_ICONS, VendorCategory } from '@/lib/supabase'

type Tab = 'pending' | 'active'

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export default function CuratorVendorsPage() {
  const [tab, setTab] = useState<Tab>('pending')
  const [submissions, setSubmissions] = useState<VendorSubmission[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [subRes, venRes] = await Promise.all([
      fetch('/api/vendor-submissions?status=pending'),
      fetch('/api/vendors?all=1'),
    ])
    if (subRes.ok) { const { data } = await subRes.json(); setSubmissions(data ?? []) }
    if (venRes.ok) { const { data } = await venRes.json(); setVendors(data ?? []) }
    setLoading(false)
  }

  async function approveSubmission(sub: VendorSubmission) {
    const vendorData = {
      name: sub.name,
      slug: slugify(sub.name),
      category: sub.category,
      tagline: sub.tagline,
      description: sub.description,
      whatsapp: sub.whatsapp,
      phone: sub.phone,
      instagram_url: sub.instagram_url,
      price_guide: sub.price_guide,
      area_served: sub.area_served,
      photos: [],
      is_active: true,
      is_featured: false,
    }
    const r = await fetch('/api/vendor-submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: sub.id, action: 'approve', vendorData }),
    })
    if (r.ok) {
      setSubmissions((prev) => prev.filter((s) => s.id !== sub.id))
      showToast('Approved and listed!')
      loadAll()
    }
  }

  async function rejectSubmission(id: string) {
    if (!confirm('Reject this application?')) return
    await fetch('/api/vendor-submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'reject' }),
    })
    setSubmissions((prev) => prev.filter((s) => s.id !== id))
    showToast('Application rejected')
  }

  async function toggleVendor(id: string, current: boolean) {
    await fetch('/api/vendors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !current }),
    })
    setVendors((prev) => prev.map((v) => v.id === id ? { ...v, is_active: !current } : v))
    showToast(current ? 'Hidden' : 'Now live!')
  }

  async function toggleFeatured(id: string, current: boolean) {
    await fetch('/api/vendors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_featured: !current }),
    })
    setVendors((prev) => prev.map((v) => v.id === id ? { ...v, is_featured: !current } : v))
    showToast(current ? 'Unfeatured' : '⭐ Featured!')
  }

  async function deleteVendor(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    await fetch(`/api/vendors?id=${id}`, { method: 'DELETE' })
    setVendors((prev) => prev.filter((v) => v.id !== id))
    showToast('Deleted')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#FAF7F2', borderBottom: '0.5px solid #D6C9B8', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/curator" style={{ color: '#7C5C3E', display: 'flex' }}>
            <svg viewBox="0 0 20 20" fill="none" width={20} height={20} stroke="currentColor" strokeWidth={2}><path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E' }}>Vendors</span>
        </div>
        <Link href="/services" style={{ fontSize: 12, color: '#7C5C3E', textDecoration: 'underline' }}>View page</Link>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '0.5px solid #D6C9B8' }}>
        {(['pending', 'active'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '12px 0', fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? '#2C1A0E' : '#7C5C3E', backgroundColor: 'transparent', border: 'none', borderBottom: tab === t ? '2px solid #2C1A0E' : '2px solid transparent', cursor: 'pointer', textTransform: 'capitalize' }}>
            {t === 'pending' ? `Pending ${submissions.length > 0 ? `(${submissions.length})` : ''}` : `Active (${vendors.filter(v => v.is_active).length})`}
          </button>
        ))}
      </div>

      <div style={{ padding: 16 }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2].map((i) => <div key={i} style={{ height: 120, backgroundColor: 'white', borderRadius: 12, border: '1px solid #D6C9B8' }} />)}
          </div>
        ) : tab === 'pending' ? (
          submissions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#7C5C3E', fontSize: 14, paddingTop: 48 }}>No pending applications.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {submissions.map((sub) => (
                <div key={sub.id} style={{ backgroundColor: 'white', borderRadius: 12, border: '1px solid #D6C9B8', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <p style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2C1A0E' }}>{sub.name}</p>
                      <p style={{ fontSize: 12, color: '#7C5C3E', marginTop: 2 }}>
                        {VENDOR_CATEGORY_ICONS[sub.category as VendorCategory]} {VENDOR_CATEGORY_LABELS[sub.category as VendorCategory]}
                      </p>
                    </div>
                    <span style={{ fontSize: 10, color: '#B4A898' }}>{new Date(sub.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                  {sub.tagline && <p style={{ fontSize: 13, color: '#7C5C3E', marginBottom: 6, fontStyle: 'italic' }}>{sub.tagline}</p>}
                  {sub.description && <p style={{ fontSize: 12, color: '#333', marginBottom: 8, lineHeight: 1.5 }}>{sub.description.slice(0, 150)}{sub.description.length > 150 ? '...' : ''}</p>}
                  <div style={{ display: 'flex', gap: 6, fontSize: 11, color: '#7C5C3E', marginBottom: 12, flexWrap: 'wrap' }}>
                    {sub.whatsapp && <span>📱 {sub.whatsapp}</span>}
                    {sub.phone && <span>📞 {sub.phone}</span>}
                    {sub.email && <span>✉ {sub.email}</span>}
                    {sub.price_guide && <span>₹ {sub.price_guide}</span>}
                    {sub.area_served && <span>📍 {sub.area_served}</span>}
                  </div>
                  {sub.message && <p style={{ fontSize: 12, color: '#B4A898', marginBottom: 12, fontStyle: 'italic' }}>"{sub.message}"</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => approveSubmission(sub)} style={{ flex: 1, backgroundColor: '#6B8F71', color: 'white', fontWeight: 600, fontSize: 13, borderRadius: 8, height: 36, border: 'none', cursor: 'pointer' }}>
                      ✓ Approve &amp; list
                    </button>
                    <button onClick={() => rejectSubmission(sub.id)} style={{ flex: 1, backgroundColor: 'transparent', color: '#D4735E', fontWeight: 600, fontSize: 13, borderRadius: 8, height: 36, border: '1px solid #D4735E', cursor: 'pointer' }}>
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          vendors.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#7C5C3E', fontSize: 14, paddingTop: 48 }}>No vendors listed yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {vendors.map((v) => (
                <div key={v.id} style={{ backgroundColor: 'white', borderRadius: 12, border: `1px solid ${v.is_featured ? '#C9A84C' : '#D6C9B8'}`, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2C1A0E' }}>{v.name}</p>
                      <p style={{ fontSize: 11, color: '#7C5C3E', marginTop: 2 }}>
                        {VENDOR_CATEGORY_ICONS[v.category]} {VENDOR_CATEGORY_LABELS[v.category]}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, backgroundColor: v.is_active ? '#f0f7f1' : '#f5f0eb', color: v.is_active ? '#6B8F71' : '#7C5C3E' }}>
                        {v.is_active ? 'Live' : 'Hidden'}
                      </span>
                      {v.is_featured && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 999, backgroundColor: '#C9A84C', color: 'white' }}>⭐ Featured</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button onClick={() => toggleVendor(v.id, v.is_active)} style={{ fontSize: 12, border: '1px solid #7C5C3E', color: '#7C5C3E', borderRadius: 7, padding: '6px 12px', backgroundColor: 'transparent', cursor: 'pointer' }}>
                      {v.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => toggleFeatured(v.id, v.is_featured)} style={{ fontSize: 12, border: `1px solid ${v.is_featured ? '#C9A84C' : '#D6C9B8'}`, color: v.is_featured ? '#C9A84C' : '#B4A898', borderRadius: 7, padding: '6px 12px', backgroundColor: 'transparent', cursor: 'pointer' }}>
                      {v.is_featured ? '⭐ Unfeature' : '☆ Feature'}
                    </button>
                    <button onClick={() => deleteVendor(v.id, v.name)} style={{ fontSize: 12, border: '1px solid #D4735E', color: '#D4735E', borderRadius: 7, padding: '6px 12px', backgroundColor: 'transparent', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#2C1A0E', color: 'white', fontSize: 13, padding: '10px 20px', borderRadius: 999, zIndex: 50, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
