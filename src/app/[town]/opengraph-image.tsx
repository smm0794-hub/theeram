import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'
export const alt = 'Event Spaces in Kerala | Theeram Spaces'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function TownOgImage({ params }: { params: { town: string } }) {
  let townName = params.town.charAt(0).toUpperCase() + params.town.slice(1)
  let district = 'Kerala'

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await supabase
      .from('towns')
      .select('name, district')
      .eq('slug', params.town)
      .single()
    if (data) {
      townName = data.name
      district = `${data.district} District · Kerala`
    }
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#1C3A2B',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          color: '#FFFFFF',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 22, letterSpacing: '0.14em', color: '#C9A84C', fontFamily: 'sans-serif', textTransform: 'uppercase' }}>
            Theeram Spaces
          </span>
          <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.65)', fontFamily: 'sans-serif' }}>
            {district}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 940 }}>
          <div style={{ fontSize: 68, lineHeight: 1.12, fontWeight: 400 }}>
            Event Spaces &amp; Villas in {townName}
          </div>
          <div style={{ width: 64, height: 3, background: '#C9A84C' }} />
          <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.78)', fontFamily: 'sans-serif', lineHeight: 1.4 }}>
            Weddings, family gatherings &amp; stays · No commission · Direct owner WhatsApp
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 20, color: 'rgba(255,255,255,0.55)', fontFamily: 'sans-serif' }}>
          <span>www.theeramspaces.in/{params.town}</span>
          <span>Hand-curated &amp; verified</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
