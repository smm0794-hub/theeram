'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const C = { green:'#1C3A2B', cream:'#F5F0E8', cream2:'#EDE8DC', cream3:'#E5DFD0', gold:'#C9A84C', terra:'#9B3D1E', text:'#1C1C1A', muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const

const CATEGORY_LABEL: Record<string,string> = {
  photography_video: 'Photography & Video', catering: 'Catering',
  decoration_florals: 'Decoration & Florals', event_management: 'Event Management',
  beauty_styling: 'Beauty & Styling',
}
const CATEGORY_COLOR: Record<string,string> = {
  photography_video: '#2E5C4E', catering: '#7B3B2A', decoration_florals: '#8A7040',
  event_management: '#4A3E6A', beauty_styling: '#9B3D1E',
}

interface Stats { enquiries_7d:number; enquiries_30d:number; enquiries_all:number; views_7d:number; views_30d:number; views_all:number }
interface TrendDay { date:string; label:string; enquiries:number; views:number }
interface MakerStat { name:string; slug:string; category:string; is_featured:boolean; enquiries:number; views:number; photo_count:number; conversion_pct:number }
interface CategoryStat { category:string; enquiries:number; views:number }
interface PitchInsights {
  bestConverter: MakerStat | null
  mostEnquired: MakerStat | null
  momentum: { this_week:number; last_week:number; multiplier:number|null }
}

function PitchCard({ icon, eyebrow, headline, sub }: { icon: string; eyebrow: string; headline: string; sub: string }) {
  return (
    <div style={{ background: C.green, padding: '22px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: -16, top: -16, opacity: .08 }}>
        <svg viewBox="0 0 100 100" width={100} height={100}><circle cx="50" cy="50" r="45" stroke="white" strokeWidth={1} fill="none"/></svg>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.08em' }}>{eyebrow}</span>
      </div>
      <div style={{ ...serif, fontSize: 19, color: 'white', fontWeight: 300, lineHeight: 1.35, marginBottom: 8 }}>{headline}</div>
      <div style={{ ...sans, fontSize: 12, color: 'rgba(255,255,255,.6)', fontWeight: 300, lineHeight: 1.5 }}>{sub}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.1)' }}>
        <span style={{ ...serif, fontSize: 12, color: C.gold }}>തീരം</span>
        <span style={{ ...sans, fontSize: 10, color: 'rgba(255,255,255,.4)' }}>theeram · theeramspaces.in</span>
      </div>
    </div>
  )
}

export default function MakerAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [trend, setTrend] = useState<TrendDay[]>([])
  const [topMakers, setTopMakers] = useState<MakerStat[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryStat[]>([])
  const [totalMakers, setTotalMakers] = useState(0)
  const [pitch, setPitch] = useState<PitchInsights | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const r = await fetch('/api/maker-analytics')
    const data = await r.json()
    if (r.ok) {
      setStats(data.stats); setTrend(data.trend); setTopMakers(data.topMakers)
      setCategoryBreakdown(data.categoryBreakdown); setTotalMakers(data.totalMakers)
      setPitch(data.pitchInsights)
    }
    setLoading(false)
  }

  const maxTrend = Math.max(...trend.map(d => Math.max(d.enquiries, d.views)), 1)
  const hasPitchData = pitch && (pitch.mostEnquired || pitch.bestConverter || (pitch.momentum.multiplier && pitch.momentum.multiplier >= 1.3))

  return (
    <div style={{ minHeight:'100vh', background:C.cream, paddingBottom:48 }}>
      <div style={{ background:C.green, padding:'6px 16px' }}><span style={{ ...sans, fontSize:10, color:'rgba(255,255,255,.5)' }}>theeram</span></div>
      <div style={{ background:C.cream, borderBottom:`1px solid ${C.cream3}`, padding:'13px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Link href="/curator" style={{ ...sans, fontSize:12, color:C.muted, textDecoration:'none' }}>← Curator</Link>
          <span style={{ fontFamily:'Georgia,serif', fontSize:18, color:C.text }}>Maker Analytics</span>
        </div>
        <span style={{ ...sans, fontSize:11, color:C.muted }}>{totalMakers} makers</span>
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ width:28, height:28, border:`2px solid ${C.terra}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : stats && (
          <>
            {/* ── Pitch section — real cards if data exists, honest placeholder if not ── */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:12 }}>
                <div style={{ width:14, height:1, background:C.terra }}/>
                <span style={{ ...sans, fontSize:10, color:C.terra, letterSpacing:'.08em' }}>PITCH-READY · SCREENSHOT TO SHARE</span>
              </div>

              {hasPitchData ? (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {pitch!.mostEnquired && (
                    <PitchCard icon="🔥" eyebrow="PROOF OF DEMAND"
                      headline={`${pitch!.mostEnquired.enquiries} people enquired about ${pitch!.mostEnquired.name} on Theeram`}
                      sub={`${pitch!.mostEnquired.views} page views in the same period · ${CATEGORY_LABEL[pitch!.mostEnquired.category] ?? pitch!.mostEnquired.category}`}/>
                  )}
                  {pitch!.bestConverter && pitch!.bestConverter.conversion_pct > 0 && (
                    <PitchCard icon="⭐" eyebrow="TOP CONVERTER"
                      headline={`${pitch!.bestConverter.name} converts ${pitch!.bestConverter.conversion_pct}% of viewers into enquiries`}
                      sub="Strong proof that quality makers get noticed on Theeram."/>
                  )}
                  {pitch!.momentum.multiplier && pitch!.momentum.multiplier >= 1.3 && (
                    <PitchCard icon="📈" eyebrow="GROWING FAST"
                      headline={`Maker enquiries up ${pitch!.momentum.multiplier}× this week`}
                      sub={`${pitch!.momentum.this_week} enquiries this week, up from ${pitch!.momentum.last_week} last week.`}/>
                  )}
                </div>
              ) : (
                <div style={{ background:'white', border:`1px dashed ${C.cream3}`, padding:'24px 20px', textAlign:'center' }}>
                  <div style={{ fontSize: 22, marginBottom: 10 }}>🌱</div>
                  <p style={{ ...serif, fontSize: 15, color: C.text, fontWeight: 300, marginBottom: 6 }}>Not enough maker activity yet</p>
                  <p style={{ ...sans, fontSize: 12, color: C.muted, fontWeight: 300, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
                    Once makers start getting views and enquiries, shareable proof-of-demand cards will appear here — the same way they already do for spaces.
                    {totalMakers <= 2 && ' Run the maker agent to add more listings first.'}
                  </p>
                  {totalMakers <= 2 && (
                    <Link href="/curator/maker-agent" style={{ ...sans, display: 'inline-block', marginTop: 14, fontSize: 12, color: C.terra, textDecoration: 'underline' }}>Run maker agent →</Link>
                  )}
                </div>
              )}
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:12 }}>
              <div style={{ width:14, height:1, background:C.terra }}/>
              <span style={{ ...sans, fontSize:10, color:C.terra, letterSpacing:'.08em' }}>RAW NUMBERS</span>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {[
                ['Enquiries · 7 days', stats.enquiries_7d, C.terra],
                ['Enquiries · all time', stats.enquiries_all, C.terra],
                ['Page views · 7 days', stats.views_7d, '#2D7A4F'],
                ['Page views · all time', stats.views_all, '#2D7A4F'],
              ].map(([label, val, color]) => (
                <div key={label as string} style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px 10px', textAlign:'center' }}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:28, color: color as string, fontWeight:300, marginBottom:3 }}>{val as number}</div>
                  <div style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em' }}>{(label as string).toUpperCase()}</div>
                </div>
              ))}
            </div>

            <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'16px 14px', marginBottom:16 }}>
              <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:4 }}>LAST 14 DAYS</div>
              <div style={{ display:'flex', gap:12, marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ width:10, height:4, background:C.terra, borderRadius:2 }}/><span style={{ ...sans, fontSize:10, color:C.muted }}>Enquiries</span></div>
                <div style={{ display:'flex', alignItems:'center', gap:4 }}><div style={{ width:10, height:4, background:'#2D7A4F', borderRadius:2 }}/><span style={{ ...sans, fontSize:10, color:C.muted }}>Views</span></div>
              </div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:2, height:70 }}>
                {trend.map((d, i) => (
                  <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, height:'100%', justifyContent:'flex-end' }}>
                    <div style={{ width:'100%', display:'flex', gap:1, alignItems:'flex-end', height:52 }}>
                      <div style={{ flex:1, background:C.terra, borderRadius:'1px 1px 0 0', height:`${Math.max((d.enquiries/maxTrend)*52,d.enquiries>0?3:0)}px`, transition:'height .3s' }}/>
                      <div style={{ flex:1, background:'#2D7A4F', borderRadius:'1px 1px 0 0', height:`${Math.max((d.views/maxTrend)*52,d.views>0?3:0)}px`, transition:'height .3s' }}/>
                    </div>
                    {i % 2 === 0 && <div style={{ ...sans, fontSize:7, color:C.muted, whiteSpace:'nowrap' as const }}>{d.label}</div>}
                  </div>
                ))}
              </div>
            </div>

            {categoryBreakdown.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px', marginBottom:16 }}>
                <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:12 }}>BY CATEGORY</div>
                {categoryBreakdown.map(c => (
                  <div key={c.category} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div style={{ width:10, height:10, background:CATEGORY_COLOR[c.category] ?? C.green, flexShrink:0 }}/>
                      <div style={{ ...sans, fontSize:12, color:C.text, flex:1 }}>{CATEGORY_LABEL[c.category] ?? c.category}</div>
                      <div style={{ ...sans, fontSize:11, color:C.muted }}>{c.enquiries}e · {c.views}v</div>
                    </div>
                    <div style={{ display:'flex', gap:3 }}>
                      <div style={{ flex:1, background:C.cream2, borderRadius:2, overflow:'hidden' }}><div style={{ height:5, background:C.terra, width:`${((c.enquiries+c.views)/Math.max(categoryBreakdown[0].enquiries+categoryBreakdown[0].views,1))*100}%`, transition:'width .3s' }}/></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {topMakers.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px', marginBottom:16 }}>
                <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:12 }}>TOP MAKERS</div>
                {topMakers.map((m, i) => (
                  <div key={m.slug} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div style={{ ...sans, fontSize:11, color:C.muted, width:16, textAlign:'right' as const }}>{i+1}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ ...sans, fontSize:12, color:C.text, fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
                          {m.name}{m.is_featured && <span style={{ fontSize:9, background:C.gold, color:C.text, padding:'1px 6px', fontWeight:700 }}>PICK</span>}
                        </div>
                        <div style={{ ...sans, fontSize:10, color:C.muted }}>{CATEGORY_LABEL[m.category] ?? m.category}</div>
                      </div>
                      <div style={{ textAlign:'right' as const }}>
                        <div style={{ ...sans, fontSize:10, color:C.muted }}>{m.enquiries}e · {m.views}v</div>
                        {m.views > 0 && <div style={{ ...sans, fontSize:10, color: m.conversion_pct >= 15 ? '#2D7A4F' : C.muted, fontWeight:600 }}>{m.conversion_pct}% conv.</div>}
                      </div>
                    </div>
                    <div style={{ paddingLeft:24, display:'flex', gap:6 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ background:C.cream2, borderRadius:2, overflow:'hidden' }}><div style={{ height:4, background:C.terra, width:`${topMakers[0].enquiries>0?(m.enquiries/topMakers[0].enquiries)*100:0}%`, transition:'width .3s' }}/></div>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ background:C.cream2, borderRadius:2, overflow:'hidden' }}><div style={{ height:4, background:'#2D7A4F', width:`${topMakers[0].views>0?(m.views/topMakers[0].views)*100:0}%`, transition:'width .3s' }}/></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {stats.enquiries_all === 0 && stats.views_all === 0 && totalMakers > 0 && (
              <p style={{ ...sans, fontSize:13, color:C.muted, textAlign:'center', padding:'10px 0', fontStyle:'italic' as const }}>
                {totalMakers} maker{totalMakers !== 1 ? 's' : ''} listed, no activity tracked yet. Share maker pages to start collecting data.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
