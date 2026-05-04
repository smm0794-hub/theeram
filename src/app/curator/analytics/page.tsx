'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { EVENT_TYPE_LABELS } from '@/lib/supabase'

interface Analytics {
  weekTotal: number
  allTime: number
  topProperties: { name: string; slug: string; count: number }[]
  topEventTypes: { event_type: string; count: number }[]
  dailyData: { date: string; count: number }[]
  activeProperties: number
  pendingVendors: number
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div style={{ flex: 1, height: 6, backgroundColor: '#F0E8DC', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#C9A84C', borderRadius: 3, transition: 'width 0.4s ease' }} />
    </div>
  )
}

export default function CuratorAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/analytics')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error)
        else setData(json)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load analytics'); setLoading(false) })
  }, [])

  const maxDaily = data ? Math.max(...data.dailyData.map((d) => d.count), 1) : 1
  const maxProp = data ? Math.max(...data.topProperties.map((p) => p.count), 1) : 1

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 20, backgroundColor: '#FAF7F2', borderBottom: '0.5px solid #D6C9B8', padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/curator" style={{ color: '#7C5C3E', display: 'flex' }}>
          <svg viewBox="0 0 20 20" fill="none" width={20} height={20} stroke="currentColor" strokeWidth={2}><path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E' }}>Analytics</span>
      </header>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #7C5C3E', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : error ? (
        <p style={{ textAlign: 'center', color: '#D4735E', padding: 32 }}>{error}</p>
      ) : data ? (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Inquiries this week', value: data.weekTotal, color: '#D4735E' },
              { label: 'All-time inquiries', value: data.allTime, color: '#7C5C3E' },
              { label: 'Active listings', value: data.activeProperties, color: '#6B8F71' },
              { label: 'Pending vendors', value: data.pendingVendors, color: '#C9A84C' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ backgroundColor: 'white', borderRadius: 14, border: '1px solid #D6C9B8', padding: 16 }}>
                <p style={{ fontSize: 28, fontFamily: 'Georgia, serif', color, marginBottom: 4 }}>{value}</p>
                <p style={{ fontSize: 11, color: '#7C5C3E', lineHeight: 1.4 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Daily inquiry chart */}
          <div style={{ backgroundColor: 'white', borderRadius: 14, border: '1px solid #D6C9B8', padding: 16 }}>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C5C3E', marginBottom: 16 }}>Inquiries — last 7 days</p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
              {data.dailyData.map(({ date, count }) => {
                const h = maxDaily > 0 ? Math.max((count / maxDaily) * 72, count > 0 ? 6 : 2) : 2
                return (
                  <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <p style={{ fontSize: 9, color: '#D4735E', fontWeight: 600 }}>{count > 0 ? count : ''}</p>
                    <div style={{ width: '100%', height: h, backgroundColor: count > 0 ? '#D4735E' : '#F0E8DC', borderRadius: 3, transition: 'height 0.3s' }} />
                    <p style={{ fontSize: 8, color: '#B4A898', textAlign: 'center', lineHeight: 1.2 }}>{date}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Top properties */}
          {data.topProperties.length > 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: 14, border: '1px solid #D6C9B8', padding: 16 }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C5C3E', marginBottom: 14 }}>Most enquired this week</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.topProperties.map((p, i) => (
                  <div key={p.slug}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <p style={{ fontSize: 13, color: '#2C1A0E', fontWeight: i === 0 ? 600 : 400 }}>
                        {i === 0 ? '🔥 ' : ''}{p.name}
                      </p>
                      <span style={{ fontSize: 12, color: '#7C5C3E', fontWeight: 600, marginLeft: 8, flexShrink: 0 }}>
                        {p.count} {p.count === 1 ? 'enquiry' : 'enquiries'}
                      </span>
                    </div>
                    <MiniBar value={p.count} max={maxProp} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top event types */}
          {data.topEventTypes.length > 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: 14, border: '1px solid #D6C9B8', padding: 16 }}>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7C5C3E', marginBottom: 14 }}>Popular event types this week</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.topEventTypes.map(({ event_type, count }) => (
                  <div key={event_type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: 13, color: '#2C1A0E' }}>
                      {EVENT_TYPE_LABELS[event_type as keyof typeof EVENT_TYPE_LABELS] ?? event_type}
                    </p>
                    <span style={{ fontSize: 12, color: '#7C5C3E', fontWeight: 600 }}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.weekTotal === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#B4A898', fontSize: 13 }}>
              No enquiries yet this week. Share your listings to get started.
            </div>
          )}

        </div>
      ) : null}
    </div>
  )
}
