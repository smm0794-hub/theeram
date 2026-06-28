'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const C = { green:'#1C3A2B', cream:'#F5F0E8', cream2:'#EDE8DC', cream3:'#E5DFD0', gold:'#C9A84C', terra:'#9B3D1E', text:'#1C1C1A', muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const

interface Stats { enquiries_7d:number; enquiries_30d:number; enquiries_all:number; views_7d:number; views_30d:number; views_all:number; avg_duration_seconds:number|null; views_with_duration_count:number }
interface TrendDay { date:string; label:string; views:number; enquiries:number }
interface PropStat { name:string; slug:string; town_name:string; town_color:string; enquiries:number; views:number; photo_count:number; is_featured:boolean; conversion_pct:number; avg_duration_seconds:number|null }
interface TownStat { name:string; color:string; enquiries:number; views:number }
interface MovementItem { name:string; slug:string; last7:number; prev7:number; delta:number; pct_change:number }

// Two-series line chart — views and enquiries, each its own line, with the daily
// count printed above each point so exact numbers don't require hovering.
function LineChart({ data }: { data: TrendDay[] }) {
  const max = Math.max(...data.map(d => Math.max(d.views, d.enquiries)), 1)
  const width = 320, height = 130, padding = 14
  const plotW = width - padding * 2, plotH = height - padding * 2 - 14 // leave room for number labels on top

  function pointsFor(key: 'views' | 'enquiries') {
    return data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * plotW
      const y = padding + 14 + plotH - (d[key] / max) * plotH
      return { x, y, val: d[key] }
    })
  }

  const viewPoints = pointsFor('views')
  const enqPoints = pointsFor('enquiries')

  return (
    <div>
      <div style={{ display:'flex', gap:14, marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:14, height:2, background:'#2D7A4F' }}/><span style={{ ...sans, fontSize:10, color:C.muted }}>Views</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:14, height:2, background:C.terra }}/><span style={{ ...sans, fontSize:10, color:C.muted }}>Enquiries</span></div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
        <polyline points={viewPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#2D7A4F" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
        <polyline points={enqPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke={C.terra} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
        {viewPoints.map((p, i) => (
          <g key={`v${i}`}>
            {p.val > 0 && <circle cx={p.x} cy={p.y} r={2.3} fill="#2D7A4F"/>}
            {p.val > 0 && <text x={p.x} y={p.y - 6} fontSize="8" fill="#2D7A4F" textAnchor="middle">{p.val}</text>}
          </g>
        ))}
        {enqPoints.map((p, i) => (
          <g key={`e${i}`}>
            {p.val > 0 && <circle cx={p.x} cy={p.y} r={2.3} fill={C.terra}/>}
            {p.val > 0 && <text x={p.x} y={p.y + 13} fontSize="8" fill={C.terra} textAnchor="middle">{p.val}</text>}
          </g>
        ))}
      </svg>
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60), s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [trend, setTrend] = useState<TrendDay[]>([])
  const [topProperties, setTopProperties] = useState<PropStat[]>([])
  const [townBreakdown, setTownBreakdown] = useState<TownStat[]>([])
  const [topGainer, setTopGainer] = useState<MovementItem | null>(null)
  const [topDecliner, setTopDecliner] = useState<MovementItem | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const r = await fetch('/api/analytics')
    const data = await r.json()
    if (!r.ok) { setLoading(false); return }
    setStats(data.stats); setTrend(data.trend); setTopProperties(data.topProperties)
    setTownBreakdown(data.townBreakdown)
    setTopGainer(data.movement?.topGainer ?? null)
    setTopDecliner(data.movement?.topDecliner ?? null)
    setLoading(false)
  }

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
            {/* ── Key numbers ───────────────────────────────────────────────── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
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

            {/* ── Avg. time on page — the new metric ──────────────────────── */}
            <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px 10px', textAlign:'center', marginBottom:16 }}>
              <div style={{ fontFamily:'Georgia,serif', fontSize:24, color:C.gold, fontWeight:300, marginBottom:3 }}>
                {stats.avg_duration_seconds !== null ? formatDuration(stats.avg_duration_seconds) : '—'}
              </div>
              <div style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em' }}>
                AVG. TIME ON A LISTING {stats.views_with_duration_count > 0 ? `· FROM ${stats.views_with_duration_count} TRACKED VISITS` : '· NO DATA YET'}
              </div>
            </div>

            {/* ── Views over time — single clean line ──────────────────────── */}
            <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'16px 14px', marginBottom:16 }}>
              <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:12 }}>PAGE VIEWS — LAST 14 DAYS</div>
              <LineChart data={trend}/>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                <span style={{ ...sans, fontSize:9, color:C.muted }}>{trend[0]?.label}</span>
                <span style={{ ...sans, fontSize:9, color:C.muted }}>{trend[trend.length-1]?.label}</span>
              </div>
            </div>

            {/* ── Growth & decline — the two numbers that actually tell a story ── */}
            {(topGainer || topDecliner) && (
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
                {topGainer && topGainer.delta > 0 && (
                  <div style={{ background:'white', border:`1px solid #b8e0c4`, padding:'14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:14 }}>📈</span>
                      <span style={{ ...sans, fontSize:10, color:'#2D7A4F', letterSpacing:'.07em' }}>BIGGEST GAIN IN VIEWS</span>
                    </div>
                    <div style={{ ...serif, fontSize:15, color:C.text }}>{topGainer.name}</div>
                    <div style={{ ...sans, fontSize:12, color:C.muted, marginTop:2 }}>
                      {topGainer.last7} views this week vs {topGainer.prev7} last week
                      <span style={{ color:'#2D7A4F', fontWeight:600 }}> · +{topGainer.delta} ({topGainer.pct_change > 0 ? '+' : ''}{topGainer.pct_change}%)</span>
                    </div>
                  </div>
                )}
                {topDecliner && topDecliner.delta < 0 && (
                  <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:14 }}>📉</span>
                      <span style={{ ...sans, fontSize:10, color:C.terra, letterSpacing:'.07em' }}>BIGGEST DROP IN VIEWS</span>
                    </div>
                    <div style={{ ...serif, fontSize:15, color:C.text }}>{topDecliner.name}</div>
                    <div style={{ ...sans, fontSize:12, color:C.muted, marginTop:2 }}>
                      {topDecliner.last7} views this week vs {topDecliner.prev7} last week
                      <span style={{ color:C.terra, fontWeight:600 }}> · {topDecliner.delta} ({topDecliner.pct_change}%)</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Top performers table ─────────────────────────────────────── */}
            {topProperties.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, marginBottom:16 }}>
                <div style={{ padding:'14px 14px 0' }}>
                  <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:10 }}>TOP PERFORMERS</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1.3fr 0.5fr 0.5fr 0.6fr 0.6fr', padding:'0 14px 8px', borderBottom:`1px solid ${C.cream3}` }}>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em' }}>SPACE</span>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em', textAlign:'right' as const }}>VIEWS</span>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em', textAlign:'right' as const }}>ENQ.</span>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em', textAlign:'right' as const }}>CONV.</span>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em', textAlign:'right' as const }}>TIME</span>
                </div>
                {topProperties.map((p, i) => (
                  <div key={p.slug} style={{ display:'grid', gridTemplateColumns:'1.3fr 0.5fr 0.5fr 0.6fr 0.6fr', padding:'10px 14px', borderBottom: i < topProperties.length - 1 ? `1px solid ${C.cream2}` : 'none', alignItems:'center' }}>
                    <div>
                      <div style={{ ...sans, fontSize:12, color:C.text, fontWeight:500, display:'flex', alignItems:'center', gap:5 }}>
                        {p.name}{p.is_featured && <span style={{ fontSize:8, background:C.gold, color:C.text, padding:'1px 5px', fontWeight:700 }}>PICK</span>}
                      </div>
                      <div style={{ ...sans, fontSize:10, color:C.muted }}>{p.town_name}</div>
                    </div>
                    <span style={{ ...sans, fontSize:12, color:'#2D7A4F', textAlign:'right' as const }}>{p.views}</span>
                    <span style={{ ...sans, fontSize:12, color:C.terra, textAlign:'right' as const }}>{p.enquiries}</span>
                    <span style={{ ...sans, fontSize:12, color: p.conversion_pct >= 15 ? '#2D7A4F' : C.muted, fontWeight: p.conversion_pct >= 15 ? 600 : 400, textAlign:'right' as const }}>{p.views > 0 ? `${p.conversion_pct}%` : '—'}</span>
                    <span style={{ ...sans, fontSize:11, color:C.muted, textAlign:'right' as const }}>{p.avg_duration_seconds !== null ? formatDuration(p.avg_duration_seconds) : '—'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── By town ───────────────────────────────────────────────────── */}
            {townBreakdown.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px', marginBottom:16 }}>
                <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:12 }}>BY TOWN</div>
                {townBreakdown.map(t => (
                  <div key={t.name} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div style={{ width:10, height:10, background:t.color, flexShrink:0 }}/>
                      <div style={{ ...sans, fontSize:12, color:C.text, flex:1 }}>{t.name}</div>
                      <div style={{ ...sans, fontSize:11, color:C.muted }}>{t.views} views · {t.enquiries} enq.</div>
                    </div>
                    <div style={{ background:C.cream2, borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:5, background:'#2D7A4F', width:`${townBreakdown[0].views>0?(t.views/townBreakdown[0].views)*100:0}%`, transition:'width .3s' }}/>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {stats.views_with_duration_count === 0 && (
              <div style={{ background:C.cream2, border:`1px dashed ${C.cream3}`, padding:'12px 14px', marginBottom:16 }}>
                <p style={{ ...sans, fontSize:11, color:C.muted, lineHeight:1.6, margin:0 }}>
                  ⏱️ Time-on-page tracking just went live — durations will start appearing here as new visits come in. Past views recorded before this update won't have a duration.
                </p>
              </div>
            )}

            {stats.enquiries_all === 0 && stats.views_all === 0 && (
              <p style={{ ...sans, fontSize:14, color:C.muted, textAlign:'center', padding:'20px 0' }}>No data yet.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
