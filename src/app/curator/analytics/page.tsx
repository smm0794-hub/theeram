'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const C = { green:'#1C3A2B', cream:'#F5F0E8', cream2:'#EDE8DC', cream3:'#E5DFD0', gold:'#C9A84C', terra:'#9B3D1E', text:'#1C1C1A', muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const

interface Stats {
  enquiries_7d: number; enquiries_30d: number; enquiries_all: number
  views_7d: number; views_30d: number; views_all: number
}
interface TrendDay { date: string; label: string; enquiries: number; views: number }
interface PropStat { name: string; slug: string; town_name: string; town_color: string; enquiries: number; views: number }
interface TownStat { name: string; color: string; enquiries: number; views: number }
interface Town { id: string; name: string; slug: string; hero_bg_color: string }

export default function AnalyticsPage() {
  const [towns, setTowns] = useState<Town[]>([])
  const [selectedTown, setSelectedTown] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [trend, setTrend] = useState<TrendDay[]>([])
  const [topProperties, setTopProperties] = useState<PropStat[]>([])
  const [townBreakdown, setTownBreakdown] = useState<TownStat[]>([])
  const [eventTypes, setEventTypes] = useState<[string, number][]>([])

  useEffect(() => {
    // Load towns for filter
    fetch('/api/towns').then(r => r.json()).then(d => { if (d.data) setTowns(d.data) })
  }, [])

  useEffect(() => {
    loadAnalytics()
  }, [selectedTown])

  async function loadAnalytics() {
    setLoading(true)
    const url = selectedTown === 'all' ? '/api/analytics' : `/api/analytics?townId=${selectedTown}`
    const r = await fetch(url)
    const data = await r.json()
    if (!r.ok) { setLoading(false); return }
    setStats(data.stats)
    setTrend(data.trend)
    setTopProperties(data.topProperties)
    setTownBreakdown(data.townBreakdown)
    setEventTypes(data.eventTypes)
    setLoading(false)
  }

  const selectedTownObj = towns.find(t => t.id === selectedTown)
  const maxTrend = Math.max(...trend.map(d => Math.max(d.enquiries, d.views)), 1)

  return (
    <div style={{ minHeight:'100vh', background:C.cream, paddingBottom:48 }}>
      <div style={{ background:C.green, padding:'6px 16px' }}>
        <span style={{ ...sans, fontSize:10, color:'rgba(255,255,255,.5)' }}>theeram</span>
      </div>
      <div style={{ background:C.cream, borderBottom:`1px solid ${C.cream3}`, padding:'13px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:40 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Link href="/curator" style={{ ...sans, fontSize:12, color:C.muted, textDecoration:'none' }}>← Curator</Link>
          <span style={{ fontFamily:'Georgia,serif', fontSize:18, color:C.text }}>Analytics</span>
        </div>
      </div>

      <div style={{ padding:'16px 16px 0' }}>

        {/* Town filter */}
        <div style={{ marginBottom:18 }}>
          <div style={{ ...sans, fontSize:9, color:C.terra, letterSpacing:'.08em', marginBottom:8 }}>FILTER BY TOWN</div>
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:4 }} className="no-scrollbar">
            <button onClick={() => setSelectedTown('all')} style={{ ...sans, flexShrink:0, padding:'7px 14px', border:`1px solid ${selectedTown==='all'?C.green:C.cream3}`, background:selectedTown==='all'?C.green:'white', color:selectedTown==='all'?'white':C.muted, fontSize:11, cursor:'pointer', fontWeight:selectedTown==='all'?600:400 }}>All towns</button>
            {towns.map(t => (
              <button key={t.id} onClick={() => setSelectedTown(t.id)} style={{ ...sans, flexShrink:0, padding:'7px 14px', border:`1px solid ${selectedTown===t.id?t.hero_bg_color:C.cream3}`, background:selectedTown===t.id?t.hero_bg_color:'white', color:selectedTown===t.id?'white':C.muted, fontSize:11, cursor:'pointer', fontWeight:selectedTown===t.id?600:400 }}>{t.name}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <div style={{ width:28, height:28, border:`2px solid ${C.terra}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto' }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : stats && (
          <>
            <div style={{ ...serif, fontSize:16, color:C.text, marginBottom:16 }}>
              {selectedTown === 'all' ? 'All towns' : selectedTownObj?.name}
            </div>

            {/* Key stats — 2x2 grid */}
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

            {/* 14-day trend — shows both enquiries and views */}
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

            {/* Town breakdown — only in all towns view */}
            {selectedTown === 'all' && townBreakdown.length > 0 && (
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

            {/* Top properties */}
            {topProperties.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px', marginBottom:16 }}>
                <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:12 }}>TOP SPACES</div>
                {topProperties.map((p, i) => (
                  <div key={p.slug} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div style={{ ...sans, fontSize:11, color:C.muted, width:16, textAlign:'right' as const }}>{i+1}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ ...sans, fontSize:12, color:C.text, fontWeight:500 }}>{p.name}</div>
                        {selectedTown === 'all' && p.town_name && <div style={{ ...sans, fontSize:10, color:C.muted }}>{p.town_name}</div>}
                      </div>
                      <div style={{ ...sans, fontSize:10, color:C.muted }}>{p.enquiries}e · {p.views}v</div>
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

            {/* Event type breakdown */}
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
              <p style={{ ...sans, fontSize:14, color:C.muted, textAlign:'center', padding:'20px 0' }}>No data yet{selectedTown !== 'all' ? ` for ${selectedTownObj?.name}` : ''}.</p>
            )}
          </>
        )}
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  )
}
