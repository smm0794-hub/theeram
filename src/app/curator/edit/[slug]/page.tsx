'use client'

import { useEffect, useState } from 'react'
import { Property } from '@/lib/supabase'
import PropertyForm from '@/components/PropertyForm'

export default function EditPropertyPage({ params }: { params: { slug: string } }) {
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/properties')
      .then((r) => r.json())
      .then(({ data, error }) => {
        if (error) { setError(error); setLoading(false); return }
        const found = (data ?? []).find((p: Property) => p.slug === params.slug)
        setProperty(found ?? null)
        setLoading(false)
      })
      .catch(() => { setError('Failed to load'); setLoading(false) })
  }, [params.slug])

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #7C5C3E', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (error || !property) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#7C5C3E' }}>{error || 'Property not found. Are you logged in?'}</p>
    </div>
  )

  return <PropertyForm initial={property} />
}
