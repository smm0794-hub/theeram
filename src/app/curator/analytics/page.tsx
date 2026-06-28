'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const C = { green:'#1C3A2B', cream:'#F5F0E8', cream2:'#EDE8DC', cream3:'#E5DFD0', gold:'#C9A84C', terra:'#9B3D1E', text:'#1C1C1A', muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const

interface Stats { enquiries_7d:number; enquiries_30d:number; enquiries_all:number; views_7d:number; views_30d:number; views_all:number }
interface TrendDay { date:string; label:string; enquiries:number; views:number }
interface PropStat { name:string; slug:string; town_name:string; town_color:string; enquiries:number; views:number; photo_count:number; is_featured:boolean; conversion_pct:number }
interface TownStat { name:string; color:string; enquiries:number; views:number }
interface PitchInsights {
  bestConverter: PropStat | null
  mostEnquired: PropStat | null
  photoInsight: { well_photographed_avg:number|null; under_photographed_avg:number|null; well_photographed_count:number; under_photographed_count:number }
  momentum: { this_week:number; last_week:number; multiplier:number|null }
}

// A single shareable, screenshot-ready pitch card. Designed to look complete and
// branded on its own — this is the unit you'd actually screenshot and send to an owner.
function PitchCard({ icon, eyebrow, headline, sub, cardRef }: { icon: string; eyebrow: string; headline: string; sub: string; cardRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={cardRef} style={{ background: C.green, padding: '22px 20px', position: 'relative', overflow: 'hidden' }}>
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

export default function AnalyticsPage() {
  const [towns, setTowns] = useState<{ id: string; name: string; hero_bg_color: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [trend, setTrend] = useState<TrendDay[]>([])
  const [topProperties, setTopProperties] = useState<PropStat[]>([])
  const [townBreakdown, setTownBreakdown] = useState<TownStat[]>([])
  const [eventTypes, setEventTypes] = useState<[string, number][]>([])
  const [pitch, setPitch] = useState<PitchInsights | null>(null)

  const bestConverterRef = useRef<HTMLDivElement>(null)
  const mostEnquiredRef = useRef<HTMLDivElement>(null)
  const momentumRef = useRef<HTMLDivElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const r = await fetch('/api/analytics')
    const data = await r.json()
    if (!r.ok) { setLoading(false); return }
    setStats(data.stats); setTrend(data.trend); setTopProperties(data.topProperties)
    setTownBreakdown(data.townBreakdown); setEventTypes(data.eventTypes)
    setPitch(data.pitchInsights)
    setLoading(false)
  }

  const maxTrend = Math.max(...trend.map(d => Math.max(d.enquiries, d.views)), 1)

  return (
    <div style={{ minHeight:'100vh', background:C.cream, paddingBottom:48 }}>
      <div style={{ background:C.green, padding:'6px 16px' }}><span style={{ ...sans, fontSize:10, color:'rgba(255,255,255,.5)' }}>theeram</span></div>
      <div style={{ background:C.cream, borderBottom:`1px solid ${C.cream3}`, padding:'13px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Link href="/curator" style={{ ...sans, fontSize:12, color:C.muted, textDecoration:'none' }}>← Curator</Link>
          <span style={{ fontFamily:'Georgia,serif', fontSize:18, color:C.text }}>Analytics</span>
        </div>
      </div>

      <div style={{ padding:'16px 16px 0' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ width:28, height:28, border:`2px solid ${C.terra}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : stats && (
          <>
            {/* ── Pitch-ready cards — screenshot and send to owners ──────────── */}
            {pitch && (pitch.bestConverter || pitch.mostEnquired || pitch.momentum.multiplier) && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:12 }}>
                  <div style={{ width:14, height:1, background:C.terra }}/>
                  <span style={{ ...sans, fontSize:10, color:C.terra, letterSpacing:'.08em' }}>PITCH-READY · SCREENSHOT TO SHARE</span>
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {pitch.mostEnquired && pitch.mostEnquired.enquiries > 0 && (
                    <PitchCard
                      cardRef={mostEnquiredRef}
                      icon="🔥"
                      eyebrow="PROOF OF DEMAND"
                      headline={`${pitch.mostEnquired.enquiries} people enquired about ${pitch.mostEnquired.name} on Theeram`}
                      sub={`${pitch.mostEnquired.views} page views in the same period · ${pitch.mostEnquired.town_name}`}
                    />
                  )}

                  {pitch.bestConverter && pitch.bestConverter.conversion_pct > 0 && (
                    <PitchCard
                      cardRef={bestConverterRef}
                      icon="⭐"
                      eyebrow="TOP CONVERTER"
                      headline={`${pitch.bestConverter.name} converts ${pitch.bestConverter.conversion_pct}% of viewers into enquiries`}
                      sub={`With ${pitch.bestConverter.photo_count} photos and a complete listing — this is what great performance looks like on Theeram.`}
                    />
                  )}

                  {pitch.momentum.multiplier && pitch.momentum.multiplier >= 1.3 && (
                    <PitchCard
                      cardRef={momentumRef}
                      icon="📈"
                      eyebrow="GROWING FAST"
                      headline={`Enquiries up ${pitch.momentum.multiplier}× this week`}
                      sub={`${pitch.momentum.this_week} enquiries this week, up from ${pitch.momentum.last_week} last week. Theeram's traffic is accelerating.`}
                    />
                  )}
                </div>

                {pitch.photoInsight.well_photographed_avg !== null && pitch.photoInsight.under_photographed_avg !== null && pitch.photoInsight.well_photographed_avg > pitch.photoInsight.under_photographed_avg && (
                  <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px', marginTop:12 }}>
                    <div style={{ ...sans, fontSize:10, color:C.terra, letterSpacing:'.07em', marginBottom:8 }}>💡 INSIGHT — USE THIS TO COACH OWNERS</div>
                    <p style={{ ...sans, fontSize:13, color:C.text, lineHeight:1.6, margin:0 }}>
                      Listings with <strong>8+ photos</strong> convert at <strong>{pitch.photoInsight.well_photographed_avg.toFixed(1)}%</strong> on average ({pitch.photoInsight.well_photographed_count} listings),
                      versus <strong>{pitch.photoInsight.under_photographed_avg.toFixed(1)}%</strong> for listings with under 5 photos ({pitch.photoInsight.under_photographed_count} listings).
                      Encourage owners with thin photo sets to add more.
                    </p>
                  </div>
                )}
              </div>
            )}

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

            {townBreakdown.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px', marginBottom:16 }}>
                <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:12 }}>BY TOWN</div>
                {townBreakdown.map(t => (
                  <div key={t.name} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div style={{ width:10, height:10, background:t.color, flexShrink:0 }}/>
                      <div style={{ ...sans, fontSize:12, color:C.text, flex:1 }}>{t.name}</div>
                      <div style={{ ...sans, fontSize:11, color:C.muted }}>{t.enquiries}e · {t.views}v</div>
                    </div>
                    <div style={{ display:'flex', gap:3 }}>
                      <div style={{ flex:1, background:C.cream2, borderRadius:2, overflow:'hidden' }}>
                        <div style={{ height:5, background:C.terra, width:`${townBreakdown[0].enquiries>0?(t.enquiries/townBreakdown[0].enquiries)*100:0}%`, transition:'width .3s' }}/>
                      </div>
                      <div style={{ flex:1, background:C.cream2, borderRadius:2, overflow:'hidden' }}>
                        <div style={{ height:5, background:'#2D7A4F', width:`${townBreakdown[0].views>0?(t.views/townBreakdown[0].views)*100:0}%`, transition:'width .3s' }}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {topProperties.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px', marginBottom:16 }}>
                <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:12 }}>TOP SPACES · CONVERSION</div>
                {topProperties.map((p, i) => (
                  <div key={p.slug} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div style={{ ...sans, fontSize:11, color:C.muted, width:16, textAlign:'right' as const }}>{i+1}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ ...sans, fontSize:12, color:C.text, fontWeight:500, display:'flex', alignItems:'center', gap:6 }}>
                          {p.name}{p.is_featured && <span style={{ fontSize:9, background:C.gold, color:C.text, padding:'1px 6px', fontWeight:700 }}>PICK</span>}
                        </div>
                        <div style={{ ...sans, fontSize:10, color:C.muted }}>{p.town_name} · {p.photo_count} photos</div>
                      </div>
                      <div style={{ textAlign:'right' as const }}>
                        <div style={{ ...sans, fontSize:11, color:C.muted }}>{p.enquiries}e · {p.views}v</div>
                        {p.views > 0 && <div style={{ ...sans, fontSize:10, color: p.conversion_pct >= 15 ? '#2D7A4F' : C.muted, fontWeight:600 }}>{p.conversion_pct}% conv.</div>}
                      </div>
                    </div>
                    <div style={{ paddingLeft:24, display:'flex', gap:6 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ ...sans, fontSize:8, color:C.muted, marginBottom:2 }}>ENQUIRIES</div>
                        <div style={{ background:C.cream2, borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:4, background:C.terra, width:`${topProperties[0].enquiries>0?(p.enquiries/topProperties[0].enquiries)*100:0}%`, transition:'width .3s' }}/>
                        </div>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ ...sans, fontSize:8, color:C.muted, marginBottom:2 }}>VIEWS</div>
                        <div style={{ background:C.cream2, borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:4, background:'#2D7A4F', width:`${topProperties[0].views>0?(p.views/topProperties[0].views)*100:0}%`, transition:'width .3s' }}/>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {eventTypes.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px', marginBottom:16 }}>
                <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:12 }}>BY EVENT TYPE</div>
                {eventTypes.map(([et, count]) => (
                  <div key={et} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ ...sans, fontSize:12, color:C.text, flex:1, textTransform:'capitalize' as const }}>{et.replace(/_/g,' ')}</div>
                    <div style={{ flex:2, background:C.cream2, borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:6, background:C.gold, width:`${(count/eventTypes[0][1])*100}%` }}/>
                    </div>
                    <div style={{ ...sans, fontSize:12, fontWeight:600, color:C.text, minWidth:24, textAlign:'right' as const }}>{count}</div>
                  </div>
                ))}
              </div>
            )}

            {stats.enquiries_all === 0 && stats.views_all === 0 && (
              <p style={{ ...sans, fontSize:14, color:C.muted, textAlign:'center', padding:'20px 0' }}>No data yet.</p>
            )}
          </>
        )}
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  )
}
