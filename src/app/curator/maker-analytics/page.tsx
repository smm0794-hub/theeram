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
interface TrendDay { date:string; label:string; views:number; enquiries:number }
interface MakerStat { name:string; slug:string; category:string; is_featured:boolean; enquiries:number; views:number; photo_count:number; conversion_pct:number }
interface CategoryStat { category:string; enquiries:number; views:number }
interface MovementItem { name:string; slug:string; last7:number; prev7:number; delta:number; pct_change:number }

function LineChart({ data }: { data: TrendDay[] }) {
  const max = Math.max(...data.map(d => Math.max(d.views, d.enquiries)), 1)
  const width = 320, height = 130, padding = 14
  const plotW = width - padding * 2, plotH = height - padding * 2 - 14

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

export default function MakerAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [trend, setTrend] = useState<TrendDay[]>([])
  const [topMakers, setTopMakers] = useState<MakerStat[]>([])
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryStat[]>([])
  const [totalMakers, setTotalMakers] = useState(0)
  const [topGainer, setTopGainer] = useState<MovementItem | null>(null)
  const [topDecliner, setTopDecliner] = useState<MovementItem | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const r = await fetch('/api/maker-analytics')
    const data = await r.json()
    if (r.ok) {
      setStats(data.stats); setTrend(data.trend); setTopMakers(data.topMakers)
      setCategoryBreakdown(data.categoryBreakdown); setTotalMakers(data.totalMakers)
      setTopGainer(data.movement?.topGainer ?? null)
      setTopDecliner(data.movement?.topDecliner ?? null)
    }
    setLoading(false)
  }

  const hasAnyActivity = stats && (stats.enquiries_all > 0 || stats.views_all > 0)

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
              <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:12 }}>PAGE VIEWS — LAST 14 DAYS</div>
              <LineChart data={trend}/>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                <span style={{ ...sans, fontSize:9, color:C.muted }}>{trend[0]?.label}</span>
                <span style={{ ...sans, fontSize:9, color:C.muted }}>{trend[trend.length-1]?.label}</span>
              </div>
            </div>

            {(topGainer || topDecliner) ? (
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
            ) : !hasAnyActivity && (
              <div style={{ background:'white', border:`1px dashed ${C.cream3}`, padding:'24px 20px', textAlign:'center', marginBottom:16 }}>
                <div style={{ fontSize: 22, marginBottom: 10 }}>🌱</div>
                <p style={{ ...serif, fontSize: 15, color: C.text, fontWeight: 300, marginBottom: 6 }}>Not enough maker activity yet</p>
                <p style={{ ...sans, fontSize: 12, color: C.muted, fontWeight: 300, lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>
                  Growth and decline tracking will appear here once makers start getting views.
                  {totalMakers <= 2 && ' Run the maker agent to add more listings first.'}
                </p>
                {totalMakers <= 2 && (
                  <Link href="/curator/maker-agent" style={{ ...sans, display: 'inline-block', marginTop: 14, fontSize: 12, color: C.terra, textDecoration: 'underline' }}>Run maker agent →</Link>
                )}
              </div>
            )}

            {topMakers.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, marginBottom:16 }}>
                <div style={{ padding:'14px 14px 0' }}>
                  <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:10 }}>TOP PERFORMERS</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1.6fr 0.6fr 0.6fr 0.7fr', padding:'0 14px 8px', borderBottom:`1px solid ${C.cream3}` }}>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em' }}>MAKER</span>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em', textAlign:'right' as const }}>VIEWS</span>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em', textAlign:'right' as const }}>ENQ.</span>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em', textAlign:'right' as const }}>CONV.</span>
                </div>
                {topMakers.map((m, i) => (
                  <div key={m.slug} style={{ display:'grid', gridTemplateColumns:'1.6fr 0.6fr 0.6fr 0.7fr', padding:'10px 14px', borderBottom: i < topMakers.length - 1 ? `1px solid ${C.cream2}` : 'none', alignItems:'center' }}>
                    <div>
                      <div style={{ ...sans, fontSize:12, color:C.text, fontWeight:500, display:'flex', alignItems:'center', gap:5 }}>
                        {m.name}{m.is_featured && <span style={{ fontSize:8, background:C.gold, color:C.text, padding:'1px 5px', fontWeight:700 }}>PICK</span>}
                      </div>
                      <div style={{ ...sans, fontSize:10, color:C.muted }}>{CATEGORY_LABEL[m.category] ?? m.category}</div>
                    </div>
                    <span style={{ ...sans, fontSize:12, color:'#2D7A4F', textAlign:'right' as const }}>{m.views}</span>
                    <span style={{ ...sans, fontSize:12, color:C.terra, textAlign:'right' as const }}>{m.enquiries}</span>
                    <span style={{ ...sans, fontSize:12, color: m.conversion_pct >= 15 ? '#2D7A4F' : C.muted, fontWeight: m.conversion_pct >= 15 ? 600 : 400, textAlign:'right' as const }}>{m.views > 0 ? `${m.conversion_pct}%` : '—'}</span>
                  </div>
                ))}
              </div>
            )}

            {categoryBreakdown.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px', marginBottom:16 }}>
                <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:12 }}>BY CATEGORY</div>
                {categoryBreakdown.map(c => (
                  <div key={c.category} style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <div style={{ width:10, height:10, background:CATEGORY_COLOR[c.category] ?? C.green, flexShrink:0 }}/>
                      <div style={{ ...sans, fontSize:12, color:C.text, flex:1 }}>{CATEGORY_LABEL[c.category] ?? c.category}</div>
                      <div style={{ ...sans, fontSize:11, color:C.muted }}>{c.views} views · {c.enquiries} enq.</div>
                    </div>
                    <div style={{ background:C.cream2, borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:5, background:'#2D7A4F', width:`${((c.views)/Math.max(categoryBreakdown[0].views,1))*100}%`, transition:'width .3s' }}/>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ background:C.cream2, border:`1px dashed ${C.cream3}`, padding:'12px 14px', marginBottom:16 }}>
              <p style={{ ...sans, fontSize:11, color:C.muted, lineHeight:1.6, margin:0 }}>
                ⏱️ Time spent per maker page isn't tracked yet — only page-open events are logged. Would need additional tracking to measure dwell time.
              </p>
            </div>

            {!hasAnyActivity && totalMakers > 0 && (
              <p style={{ ...sans, fontSize:13, color:C.muted, textAlign:'center', padding:'10px 0', fontStyle:'italic' as const }}>
                {totalMakers} maker{totalMakers !== 1 ? 's' : ''} listed, no activity tracked yet.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
