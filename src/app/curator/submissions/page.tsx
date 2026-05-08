'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, VENDOR_CATEGORY_LABELS, VendorCategory } from '@/lib/supabase'

const C = { green:'#1C3A2B',cream:'#F5F0E8',cream3:'#E5DFD0',terra:'#9B3D1E',text:'#1C1C1A',muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const

interface PropertySubmission {
  id: string
  name: string
  owner_name: string
  whatsapp: string
  phone: string
  email: string
  tagline: string
  description: string
  price_guide: string
  area: string
  capacity: string
  facilities: string
  message: string
  status: string
  created_at: string
}

// submissions page — spaces only
type Tab = 'properties' | 'vendors'

export default function CuratorSubmissionsPage() {
  const [tab, setTab] = useState<Tab>('properties')
  const [submissions, setSubmissions] = useState<PropertySubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => { loadSubmissions() }, [])

  async function loadSubmissions() {
    setLoading(true)
    try {
      const r = await fetch('/api/property-submissions')
      if (r.ok) {
        const { data } = await r.json()
        setSubmissions(data ?? [])
      }
    } catch {}
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await fetch('/api/property-submissions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status } : s))
    showToast(status === 'reviewed' ? 'Marked as reviewed' : 'Marked as rejected')
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const pending = submissions.filter((s) => s.status === 'pending')
  const reviewed = submissions.filter((s) => s.status !== 'pending')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#FAF7F2', borderBottom: '0.5px solid #D6C9B8', padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/curator" style={{ color: '#7C5C3E', display: 'flex' }}>
            <svg viewBox="0 0 20 20" fill="none" width={20} height={20} stroke="currentColor" strokeWidth={2}><path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E' }}>Submissions</span>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.cream3}` }}>
        {(['properties', 'vendors'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '12px 0', fontSize: 12, fontWeight: tab === t ? 600 : 400, color: tab === t ? C.terra : C.muted, backgroundColor: 'transparent', border: 'none', borderBottom: tab === t ? `2px solid ${C.terra}` : '2px solid transparent', cursor: 'pointer', fontFamily: 'system-ui,sans-serif' }}>
            {t === 'properties' ? `Spaces${pending.length > 0 ? ` (${pending.length})` : ''}` : 'Makers'}
          </button>
        ))}
      </div>

      {tab === 'vendors' ? (
        <div style={{ padding: 16 }}>
          <p style={{ fontSize: 13, color: '#7C5C3E', marginBottom: 16, lineHeight: 1.6 }}>
            Vendor applications are managed separately. Tap below to review and approve pending vendor applications, or to assign featured status to paid vendors.
          </p>
          <Link href="/curator/vendors" style={{ display: 'block', textAlign: 'center', backgroundColor: '#2C1A0E', color: 'white', fontWeight: 600, fontSize: 14, borderRadius: 12, padding: '14px 0', textDecoration: 'none', marginBottom: 12 }}>
            Review vendor applications
          </Link>
          <div style={{ backgroundColor: 'white', borderRadius: 14, border: '1px solid #D6C9B8', padding: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#2C1A0E', marginBottom: 8 }}>How to assign featured status</p>
            <ol style={{ fontSize: 13, color: '#7C5C3E', lineHeight: 1.8, paddingLeft: 16 }}>
              <li>Go to <strong>Manage Vendors</strong> above</li>
              <li>Switch to the <strong>Active</strong> tab</li>
              <li>Find the vendor you want to feature</li>
              <li>Tap the <strong>☆ Feature</strong> button on their card</li>
              <li>Their card will show a gold kasavu border and appear first in their category</li>
            </ol>
            <p style={{ fontSize: 11, color: '#B4A898', marginTop: 10, lineHeight: 1.6 }}>
              Featured status is how you reward paid vendors. Toggle it on when they pay, off when their period expires. No backend needed — it's just a switch you control.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2].map((i) => <div key={i} style={{ height: 120, backgroundColor: 'white', borderRadius: 12, border: '1px solid #D6C9B8' }} />)}
            </div>
          ) : submissions.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#7C5C3E', fontSize: 14, paddingTop: 48 }}>No property submissions yet.</p>
          ) : (
            <>
              {pending.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#D4735E', marginBottom: 12, fontWeight: 600 }}>
                    New — needs review ({pending.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {pending.map((s) => (
                      <SubmissionCard key={s.id} submission={s} onUpdate={updateStatus} />
                    ))}
                  </div>
                </div>
              )}
              {reviewed.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B4A898', marginBottom: 12, fontWeight: 600 }}>
                    Already reviewed ({reviewed.length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {reviewed.map((s) => (
                      <SubmissionCard key={s.id} submission={s} onUpdate={updateStatus} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#2C1A0E', color: 'white', fontSize: 13, padding: '10px 20px', borderRadius: 999, zIndex: 50, whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

function SubmissionCard({ submission: s, onUpdate }: { submission: PropertySubmission; onUpdate: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div style={{ backgroundColor: 'white', borderRadius: 12, border: `1px solid ${s.status === 'pending' ? '#D4735E' : '#D6C9B8'}`, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2C1A0E' }}>{s.name}</p>
          {s.owner_name && <p style={{ fontSize: 12, color: '#7C5C3E', marginTop: 2 }}>{s.owner_name}</p>}
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 999, backgroundColor: s.status === 'pending' ? '#fdf3f1' : s.status === 'reviewed' ? '#f0f7f1' : '#f5f0eb', color: s.status === 'pending' ? '#D4735E' : s.status === 'reviewed' ? '#6B8F71' : '#7C5C3E', marginLeft: 8 }}>
          {s.status}
        </span>
      </div>

      {/* Contact info */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
        {s.whatsapp && (
          <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#25D366', textDecoration: 'none', fontWeight: 500 }}>
            💬 {s.whatsapp}
          </a>
        )}
        {s.phone && <span style={{ fontSize: 12, color: '#7C5C3E' }}>📞 {s.phone}</span>}
        {s.email && <span style={{ fontSize: 12, color: '#7C5C3E' }}>✉ {s.email}</span>}
      </div>

      {/* Key details */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {s.price_guide && <span style={{ fontSize: 11, backgroundColor: '#FAF7F2', border: '1px solid #D6C9B8', borderRadius: 999, padding: '2px 8px', color: '#7C5C3E' }}>₹ {s.price_guide}</span>}
        {s.area && <span style={{ fontSize: 11, backgroundColor: '#FAF7F2', border: '1px solid #D6C9B8', borderRadius: 999, padding: '2px 8px', color: '#7C5C3E' }}>📍 {s.area}</span>}
        {s.capacity && <span style={{ fontSize: 11, backgroundColor: '#FAF7F2', border: '1px solid #D6C9B8', borderRadius: 999, padding: '2px 8px', color: '#7C5C3E' }}>👥 {s.capacity}</span>}
      </div>

      {/* Expand for full details */}
      <button onClick={() => setExpanded(!expanded)} style={{ fontSize: 12, color: '#7C5C3E', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', marginBottom: expanded ? 10 : 0, padding: 0 }}>
        {expanded ? 'Show less' : 'Show full details'}
      </button>

      {expanded && (
        <div style={{ marginBottom: 12 }}>
          {s.tagline && <p style={{ fontSize: 13, color: '#2C1A0E', fontStyle: 'italic', marginBottom: 6 }}>"{s.tagline}"</p>}
          {s.description && <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6, marginBottom: 6 }}>{s.description}</p>}
          {s.facilities && <p style={{ fontSize: 12, color: '#7C5C3E', marginBottom: 6 }}>Facilities: {s.facilities}</p>}
          {s.message && <p style={{ fontSize: 12, color: '#B4A898', fontStyle: 'italic' }}>"{s.message}"</p>}
          <p style={{ fontSize: 10, color: '#B4A898', marginTop: 6 }}>Submitted {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
      )}

      {/* Action buttons */}
      {s.status === 'pending' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <a
            href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(`Hi ${s.owner_name || ''}! I'm from Theeram Spaces. I'd like to visit your property "${s.name}" to discuss listing it on our directory. When would be a good time?`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ flex: 1, textAlign: 'center', backgroundColor: '#25D366', color: 'white', fontWeight: 600, fontSize: 13, borderRadius: 8, padding: '8px 0', textDecoration: 'none' }}
          >
            💬 Contact to visit
          </a>
          <button onClick={() => onUpdate(s.id, 'reviewed')} style={{ flex: 1, backgroundColor: '#6B8F71', color: 'white', fontWeight: 600, fontSize: 13, borderRadius: 8, padding: '8px 0', border: 'none', cursor: 'pointer' }}>
            ✓ Mark reviewed
          </button>
          <button onClick={() => onUpdate(s.id, 'rejected')} style={{ border: '1px solid #D4735E', color: '#D4735E', fontSize: 13, borderRadius: 8, padding: '8px 12px', backgroundColor: 'transparent', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
