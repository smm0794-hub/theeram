'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const C = { green:'#1C3A2B', cream:'#F5F0E8', cream2:'#EDE8DC', cream3:'#E5DFD0', gold:'#C9A84C', terra:'#9B3D1E', text:'#1C1C1A', muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const

interface Stats { enquiries_7d:number; enquiries_30d:number; enquiries_all:number; views_7d:number; views_30d:number; views_all:number; avg_duration_seconds:number|null; views_with_duration_count:number }
interface TrendDay { date:string; label:string; views:number; enquiries:number }
interface PropStat { name:string; slug:string; town_name:string; town_color:string; enquiries:number; views:number; photo_count:number; is_featured:boolean; conversion_pct:number; avg_duration_seconds:number|null; avg_weekly_views:number; avg_weekly_enquiries:number; trend14:TrendDay[] }
interface TownStat { name:string; color:string; enquiries:number; views:number }
interface MovementItem { name:string; slug:string; last7:number; prev7:number; delta:number; pct_change:number }
interface DurationStats { avg_all:number|null; avg_viewed_only:number|null; avg_viewed_and_enquired:number|null; count_viewed_only:number; count_viewed_and_enquired:number }
interface SessionStats { total_sessions:number; single_property_sessions:number; multi_property_sessions:number; single_pct:number; multi_pct:number; avg_properties_per_session:number }
interface WeeklyStats { avg_views_per_week:number; avg_enquiries_per_week:number; weeks_window:number }
interface LocationStats { views_with_location:number; by_country:{country:string;views:number}[]; by_region:{region:string;country:string;views:number}[] }
interface ReadinessStats { threshold:number; current:number; pct_of_threshold:number; ready:boolean }
interface DayListing { slug:string; name:string; count:number }
interface DailyDetail { date:string; weekday:string; label:string; total_views:number; total_enquiries:number; viewed:DayListing[]; enquired:DayListing[] }

// Catmull-Rom → cubic Bézier conversion, so lines render as smooth curves
// instead of straight polyline segments.
function smoothPath(points: { x:number; y:number }[]): string {
  if (points.length < 2) return ''
  let d = `M${points[0].x},${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

// Two-series curved line chart — views and enquiries, each its own smoothed
// line, with the daily count printed above each point.
function LineChart({ data, width = 320, height = 130 }: { data: TrendDay[]; width?: number; height?: number }) {
  const max = Math.max(...data.map(d => Math.max(d.views, d.enquiries)), 1)
  const padding = 14
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
        <path d={smoothPath(viewPoints)} fill="none" stroke="#2D7A4F" strokeWidth={2} strokeLinecap="round"/>
        <path d={smoothPath(enqPoints)} fill="none" stroke={C.terra} strokeWidth={2} strokeLinecap="round"/>
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


// Listing × day grid — rows are listings, columns are the last 14 days (oldest → newest,
// same direction as the line chart). Green intensity = page views, red badge = enquiries.
function ListingDayMatrix({ days }: { days: DailyDetail[] }) {
  const cols = [...days].reverse()
  type Row = { slug:string; name:string; views:number[]; enqs:number[]; score:number }
  const rows: Record<string, Row> = {}
  const rowFor = (l: DayListing): Row => {
    if (!rows[l.slug]) rows[l.slug] = { slug:l.slug, name:l.name, views:Array(cols.length).fill(0), enqs:Array(cols.length).fill(0), score:0 }
    return rows[l.slug]
  }
  cols.forEach((d, ci) => {
    d.viewed.forEach(l => { const r = rowFor(l); r.views[ci] = l.count; r.score += l.count })
    d.enquired.forEach(l => { const r = rowFor(l); r.enqs[ci] = l.count; r.score += l.count * 3 })
  })
  const list = Object.values(rows).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
  const maxV = Math.max(1, ...list.flatMap(r => r.views))
  const NAME_W = 108, CELL = 24

  if (list.length === 0) return <div style={{ ...sans, fontSize:11, color:C.muted }}>No views or enquiries in the last 14 days.</div>

  return (
    <div>
      <div style={{ display:'flex', gap:14, marginBottom:10, flexWrap:'wrap' as const }}>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:12, height:12, background:'rgba(45,122,79,.25)' }}/><div style={{ width:12, height:12, background:'rgba(45,122,79,.9)' }}/>
          <span style={{ ...sans, fontSize:10, color:C.muted }}>Views (darker = more)</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          <div style={{ width:11, height:11, borderRadius:6, background:C.terra }}/><span style={{ ...sans, fontSize:10, color:C.muted }}>Enquiries</span>
        </div>
      </div>
      <div style={{ overflowX:'auto', paddingTop:4 }}>
        <div style={{ display:'inline-block', minWidth:'100%' }}>
          <div style={{ display:'flex', alignItems:'flex-end', marginBottom:3 }}>
            <div style={{ width:NAME_W, flexShrink:0, position:'sticky' as const, left:0, background:'white', zIndex:2, ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em' }}>LISTING</div>
            {cols.map((d, ci) => (
              <div key={d.date} style={{ width:CELL, marginLeft:2, flexShrink:0, textAlign:'center' as const, ...sans, fontSize:9, color: ci === cols.length - 1 ? C.text : C.muted, fontWeight: ci === cols.length - 1 ? 700 : 400 }}>
                {d.date.slice(8)}
              </div>
            ))}
          </div>
          {list.map(r => (
            <div key={r.slug} style={{ display:'flex', alignItems:'center', marginBottom:2 }}>
              <div title={r.name} style={{ width:NAME_W, flexShrink:0, position:'sticky' as const, left:0, background:'white', zIndex:1, paddingRight:6, ...sans, fontSize:11, color:C.text, whiteSpace:'nowrap' as const, overflow:'hidden', textOverflow:'ellipsis' }}>{r.name}</div>
              {r.views.map((v, ci) => {
                const e = r.enqs[ci]
                const k = v > 0 ? 0.18 + 0.82 * (v / maxV) : 0
                return (
                  <div key={ci} style={{ width:CELL, height:CELL, marginLeft:2, flexShrink:0, position:'relative' as const, background: v > 0 ? `rgba(45,122,79,${k})` : C.cream2, display:'flex', alignItems:'center', justifyContent:'center', ...sans, fontSize:9, color: k > 0.55 ? 'white' : C.text }}>
                    {v > 0 ? v : ''}
                    {e > 0 && <span style={{ position:'absolute' as const, top:-4, right:-3, minWidth:12, height:12, borderRadius:6, background:C.terra, color:'white', fontSize:8, lineHeight:'12px', textAlign:'center' as const, padding:'0 2px', fontWeight:700, boxShadow:'0 0 0 1.5px white' }}>{e}</span>}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...sans, fontSize:9, color:C.muted, marginTop:8, fontStyle:'italic' as const }}>Swipe sideways if the grid is wider than your screen · day numbers are dates of the month (IST)</div>
    </div>
  )
}

// Day-by-day accordion — tap a day to see exactly which listings were viewed and enquired.
function DailyBreakdown({ days, openDate, onToggle }: { days: DailyDetail[]; openDate: string | null; onToggle: (date: string) => void }) {
  return (
    <div>
      {days.map((d, i) => {
        const has = d.total_views + d.total_enquiries > 0
        const isOpen = openDate === d.date && has
        const maxC = Math.max(1, ...d.viewed.map(l => l.count))
        const enqBySlug: Record<string, number> = {}
        d.enquired.forEach(l => { enqBySlug[l.slug] = l.count })
        return (
          <div key={d.date} style={{ borderTop: i === 0 ? 'none' : `1px solid ${C.cream2}` }}>
            <div
              onClick={() => has && onToggle(d.date)}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 0', cursor: has ? 'pointer' : 'default', opacity: has ? 1 : 0.5 }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:9, color:C.muted, transform: isOpen ? 'rotate(90deg)' : 'none', display:'inline-block', transition:'transform .15s', width:8 }}>{has ? '▸' : ''}</span>
                <span style={{ ...sans, fontSize:12, color:C.text, fontWeight:500 }}>{d.weekday} {d.label}</span>
                {i === 0 && <span style={{ fontSize:8, background:C.gold, color:C.text, padding:'1px 5px', fontWeight:700 }}>TODAY</span>}
              </div>
              <div style={{ ...sans, fontSize:11 }}>
                <span style={{ color:'#2D7A4F' }}>{d.total_views} views</span>
                <span style={{ color:C.muted }}> · </span>
                <span style={{ color: d.total_enquiries > 0 ? C.terra : C.muted, fontWeight: d.total_enquiries > 0 ? 700 : 400 }}>{d.total_enquiries} enq.</span>
              </div>
            </div>
            {isOpen && (
              <div style={{ background:C.cream, padding:'12px 12px 4px', marginBottom:10 }}>
                {d.enquired.length > 0 && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ ...sans, fontSize:9, color:C.terra, letterSpacing:'.07em', marginBottom:6, fontWeight:700 }}>ENQUIRED ON WHATSAPP</div>
                    {d.enquired.map(l => (
                      <div key={l.slug} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 8px', marginBottom:4, background:'white', borderLeft:`3px solid ${C.terra}` }}>
                        <span style={{ ...sans, fontSize:12, color:C.text }}>{l.name}</span>
                        <span style={{ ...sans, fontSize:11, color:C.terra, fontWeight:700 }}>{l.count > 1 ? `×${l.count}` : '✓'}</span>
                      </div>
                    ))}
                  </div>
                )}
                {d.viewed.length > 0 && (
                  <div style={{ marginBottom:8 }}>
                    <div style={{ ...sans, fontSize:9, color:'#2D7A4F', letterSpacing:'.07em', marginBottom:6, fontWeight:700 }}>VIEWED</div>
                    {d.viewed.map(l => (
                      <div key={l.slug} style={{ marginBottom:8 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                          <span style={{ ...sans, fontSize:12, color:C.text }}>
                            {l.name}
                            {enqBySlug[l.slug] > 0 && <span style={{ color:C.terra, fontSize:10, fontWeight:700 }}> · enquired</span>}
                          </span>
                          <span style={{ ...sans, fontSize:11, color:C.muted }}>{l.count}</span>
                        </div>
                        <div style={{ background:C.cream2, borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:5, background:'#2D7A4F', width:`${(l.count / maxC) * 100}%`, transition:'width .3s' }}/>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {d.enquired.some(l => !d.viewed.find(v => v.slug === l.slug)) && (
                  <div style={{ ...sans, fontSize:9, color:C.muted, fontStyle:'italic' as const, marginBottom:8 }}>
                    Enquiries with no view that day came straight from the town-page card, without opening the listing.
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [trend, setTrend] = useState<TrendDay[]>([])
  const [topProperties, setTopProperties] = useState<PropStat[]>([])
  const [townBreakdown, setTownBreakdown] = useState<TownStat[]>([])
  const [topGainer, setTopGainer] = useState<MovementItem | null>(null)
  const [topDecliner, setTopDecliner] = useState<MovementItem | null>(null)
  const [durationStats, setDurationStats] = useState<DurationStats | null>(null)
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null)
  const [locationStats, setLocationStats] = useState<LocationStats | null>(null)
  const [readinessStats, setReadinessStats] = useState<ReadinessStats | null>(null)
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)
  const [daily, setDaily] = useState<DailyDetail[]>([])
  const [openDay, setOpenDay] = useState<string | null>(null)

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
    setDurationStats(data.durationStats ?? null)
    setSessionStats(data.sessionStats ?? null)
    setWeeklyStats(data.weeklyStats ?? null)
    setLocationStats(data.locationStats ?? null)
    setReadinessStats(data.readinessStats ?? null)
    setDaily(data.daily ?? [])
    setOpenDay(data.daily?.[0]?.date ?? null)
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
            {/* ── Vendor-fee readiness — your own bar: avg 100 enquiries/week ── */}
            {readinessStats && (
              <div style={{
                background: readinessStats.ready ? '#eaf5ee' : 'white',
                border: `1px solid ${readinessStats.ready ? '#b8e0c4' : C.cream3}`,
                padding:'14px', marginBottom:16,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                  <span style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em' }}>VENDOR-FEE READINESS</span>
                  <span style={{ ...sans, fontSize:11, color: readinessStats.ready ? '#2D7A4F' : C.muted, fontWeight:600 }}>
                    {readinessStats.ready ? '✓ THRESHOLD REACHED' : `${readinessStats.pct_of_threshold}% OF GOAL`}
                  </span>
                </div>
                <div style={{ background:C.cream2, borderRadius:2, overflow:'hidden', marginBottom:8 }}>
                  <div style={{ height:6, background: readinessStats.ready ? '#2D7A4F' : C.gold, width:`${Math.min(100, readinessStats.pct_of_threshold)}%`, transition:'width .3s' }}/>
                </div>
                <div style={{ ...sans, fontSize:12, color:C.text }}>
                  {readinessStats.current} avg enquiries/week <span style={{ color:C.muted }}>· target {readinessStats.threshold}/week before approaching vendors</span>
                </div>
              </div>
            )}

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

            {/* ── Weekly averages, site-wide ──────────────────────────────── */}
            {weeklyStats && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:8 }}>
                <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px 10px', textAlign:'center' }}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:24, color:'#2D7A4F', fontWeight:300, marginBottom:3 }}>{weeklyStats.avg_views_per_week}</div>
                  <div style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em' }}>AVG. VIEWS / WEEK · SITE-WIDE</div>
                </div>
                <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px 10px', textAlign:'center' }}>
                  <div style={{ fontFamily:'Georgia,serif', fontSize:24, color:C.terra, fontWeight:300, marginBottom:3 }}>{weeklyStats.avg_enquiries_per_week}</div>
                  <div style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em' }}>AVG. ENQUIRIES / WEEK · SITE-WIDE</div>
                </div>
              </div>
            )}
            {weeklyStats && (
              <div style={{ ...sans, fontSize:10, color:C.muted, textAlign:'center', marginBottom:16 }}>
                Averaged over the trailing {weeklyStats.weeks_window} weeks · per-listing weekly averages are in the table below
              </div>
            )}

            {/* ── Avg. time on page ────────────────────────────────────────── */}
            <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px 10px', textAlign:'center', marginBottom:8 }}>
              <div style={{ fontFamily:'Georgia,serif', fontSize:24, color:C.gold, fontWeight:300, marginBottom:3 }}>
                {stats.avg_duration_seconds !== null ? formatDuration(stats.avg_duration_seconds) : '—'}
              </div>
              <div style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em' }}>
                AVG. TIME ON A LISTING {stats.views_with_duration_count > 0 ? `· FROM ${stats.views_with_duration_count} TRACKED VISITS` : '· NO DATA YET'}
              </div>
            </div>

            {/* ── Time spent: viewed only vs. viewed + enquired ──────────────
                This is the "does time on page predict conversion" comparison. */}
            {durationStats && (durationStats.count_viewed_only > 0 || durationStats.count_viewed_and_enquired > 0) && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px', marginBottom:16 }}>
                <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:12 }}>TIME SPENT — VIEWED ONLY VS. VIEWED &amp; ENQUIRED</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ ...serif, fontSize:20, color:C.muted, fontWeight:300 }}>
                      {durationStats.avg_viewed_only !== null ? formatDuration(durationStats.avg_viewed_only) : '—'}
                    </div>
                    <div style={{ ...sans, fontSize:9, color:C.muted, marginTop:3 }}>VIEWED ONLY · {durationStats.count_viewed_only} visits</div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ ...serif, fontSize:20, color:'#2D7A4F', fontWeight:300 }}>
                      {durationStats.avg_viewed_and_enquired !== null ? formatDuration(durationStats.avg_viewed_and_enquired) : '—'}
                    </div>
                    <div style={{ ...sans, fontSize:9, color:C.muted, marginTop:3 }}>WENT ON TO ENQUIRE · {durationStats.count_viewed_and_enquired} visits</div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Session behaviour: single-listing vs. multi-listing browsing ── */}
            {sessionStats && sessionStats.total_sessions > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px', marginBottom:16 }}>
                <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:12 }}>HOW VISITORS BROWSE</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:10 }}>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ ...serif, fontSize:20, color:C.text, fontWeight:300 }}>{sessionStats.single_pct}%</div>
                    <div style={{ ...sans, fontSize:9, color:C.muted, marginTop:3 }}>VIEWED ONE LISTING ONLY<br/>— likely arrived looking for it specifically</div>
                  </div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ ...serif, fontSize:20, color:C.text, fontWeight:300 }}>{sessionStats.multi_pct}%</div>
                    <div style={{ ...sans, fontSize:9, color:C.muted, marginTop:3 }}>BROWSED 2+ LISTINGS<br/>— likely discovering generically</div>
                  </div>
                </div>
                <div style={{ ...sans, fontSize:10, color:C.muted, textAlign:'center' }}>
                  {sessionStats.total_sessions} sessions tracked · avg {sessionStats.avg_properties_per_session} listings viewed per session
                </div>
              </div>
            )}

            {/* ── Views by location: country + region within India ───────────── */}
            {locationStats && locationStats.views_with_location > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px', marginBottom:16 }}>
                <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:4 }}>VIEWS BY LOCATION</div>
                <div style={{ ...sans, fontSize:9, color:C.muted, marginBottom:12, fontStyle:'italic' as const }}>
                  {locationStats.views_with_location} of {stats.views_all} views have location data
                </div>
                {locationStats.by_country.map(c => (
                  <div key={c.country} style={{ marginBottom:8 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ ...sans, fontSize:12, color:C.text }}>{c.country}</span>
                      <span style={{ ...sans, fontSize:11, color:C.muted }}>{c.views} views</span>
                    </div>
                    <div style={{ background:C.cream2, borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:5, background:'#2D7A4F', width:`${(c.views/locationStats.by_country[0].views)*100}%`, transition:'width .3s' }}/>
                    </div>
                  </div>
                ))}
                {locationStats.by_region.length > 0 && (
                  <>
                    <div style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em', marginTop:14, marginBottom:8 }}>TOP REGIONS</div>
                    {locationStats.by_region.map(r => (
                      <div key={`${r.country}-${r.region}`} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}>
                        <span style={{ ...sans, fontSize:11, color:C.text }}>{r.region}, {r.country}</span>
                        <span style={{ ...sans, fontSize:11, color:C.muted }}>{r.views}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
            {locationStats && locationStats.views_with_location === 0 && (
              <div style={{ background:C.cream2, border:`1px dashed ${C.cream3}`, padding:'12px 14px', marginBottom:16 }}>
                <p style={{ ...sans, fontSize:11, color:C.muted, lineHeight:1.6, margin:0 }}>
                  📍 Location tracking is set up but not capturing yet — needs the geo headers wired into <code>/api/track-view</code>. New visits will start appearing here once that's connected.
                </p>
              </div>
            )}

            {/* ── Views over time — curved lines ─────────────────────────────── */}
            <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'16px 14px', marginBottom:16 }}>
              <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:12 }}>PAGE VIEWS — LAST 14 DAYS</div>
              <LineChart data={trend}/>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
                <span style={{ ...sans, fontSize:9, color:C.muted }}>{trend[0]?.label}</span>
                <span style={{ ...sans, fontSize:9, color:C.muted }}>{trend[trend.length-1]?.label}</span>
              </div>
            </div>

            {/* ── Listings × days grid: which listings got views/enquiries each day ── */}
            {daily.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'16px 14px', marginBottom:16 }}>
                <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:4 }}>LISTINGS BY DAY — LAST 14 DAYS</div>
                <div style={{ ...sans, fontSize:9, color:C.muted, marginBottom:12, fontStyle:'italic' as const }}>Each row is a listing, each column a day</div>
                <ListingDayMatrix days={daily}/>
              </div>
            )}

            {/* ── Day-by-day detail: exact listings viewed & enquired ──────── */}
            {daily.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, padding:'14px 14px 6px', marginBottom:16 }}>
                <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:4 }}>DAY-BY-DAY DETAIL</div>
                <div style={{ ...sans, fontSize:9, color:C.muted, marginBottom:6, fontStyle:'italic' as const }}>Tap a day to see which listings were viewed and enquired · days in IST</div>
                <DailyBreakdown days={daily} openDate={openDay} onToggle={d => setOpenDay(openDay === d ? null : d)}/>
              </div>
            )}

            {/* ── Growth & decline ────────────────────────────────────────────── */}
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

            {/* ── Top performers table — tap a row to expand its own 14-day chart ── */}
            {topProperties.length > 0 && (
              <div style={{ background:'white', border:`1px solid ${C.cream3}`, marginBottom:16 }}>
                <div style={{ padding:'14px 14px 0' }}>
                  <div style={{ ...sans, fontSize:10, color:C.muted, letterSpacing:'.07em', marginBottom:4 }}>TOP PERFORMERS</div>
                  <div style={{ ...sans, fontSize:9, color:C.muted, marginBottom:6, fontStyle:'italic' as const }}>Tap a listing to see its own 14-day trend</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1.3fr 0.5fr 0.5fr 0.6fr 0.6fr', padding:'0 14px 8px', borderBottom:`1px solid ${C.cream3}` }}>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em' }}>SPACE</span>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em', textAlign:'right' as const }}>VIEWS</span>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em', textAlign:'right' as const }}>ENQ.</span>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em', textAlign:'right' as const }}>CONV.</span>
                  <span style={{ ...sans, fontSize:9, color:C.muted, letterSpacing:'.05em', textAlign:'right' as const }}>TIME</span>
                </div>
                {topProperties.map((p, i) => {
                  const isOpen = expandedSlug === p.slug
                  return (
                    <div key={p.slug}>
                      <div
                        onClick={() => setExpandedSlug(isOpen ? null : p.slug)}
                        style={{ display:'grid', gridTemplateColumns:'1.3fr 0.5fr 0.5fr 0.6fr 0.6fr', padding:'10px 14px', borderBottom: (i < topProperties.length - 1 || isOpen) ? `1px solid ${C.cream2}` : 'none', alignItems:'center', cursor:'pointer', background: isOpen ? C.cream2 : 'transparent' }}
                      >
                        <div>
                          <div style={{ ...sans, fontSize:12, color:C.text, fontWeight:500, display:'flex', alignItems:'center', gap:5 }}>
                            <span style={{ fontSize:9, color:C.muted, transform: isOpen ? 'rotate(90deg)' : 'none', display:'inline-block', transition:'transform .15s' }}>▸</span>
                            {p.name}{p.is_featured && <span style={{ fontSize:8, background:C.gold, color:C.text, padding:'1px 5px', fontWeight:700 }}>PICK</span>}
                          </div>
                          <div style={{ ...sans, fontSize:10, color:C.muted, marginLeft:14 }}>{p.town_name}</div>
                        </div>
                        <span style={{ ...sans, fontSize:12, color:'#2D7A4F', textAlign:'right' as const }}>{p.views}</span>
                        <span style={{ ...sans, fontSize:12, color:C.terra, textAlign:'right' as const }}>{p.enquiries}</span>
                        <span style={{ ...sans, fontSize:12, color: p.conversion_pct >= 15 ? '#2D7A4F' : C.muted, fontWeight: p.conversion_pct >= 15 ? 600 : 400, textAlign:'right' as const }}>{p.views > 0 ? `${p.conversion_pct}%` : '—'}</span>
                        <span style={{ ...sans, fontSize:11, color:C.muted, textAlign:'right' as const }}>{p.avg_duration_seconds !== null ? formatDuration(p.avg_duration_seconds) : '—'}</span>
                      </div>
                      {isOpen && (
                        <div style={{ padding:'14px', background:C.cream, borderBottom: i < topProperties.length - 1 ? `1px solid ${C.cream2}` : 'none' }}>
                          <div style={{ display:'flex', gap:16, marginBottom:10 }}>
                            <div>
                              <div style={{ ...serif, fontSize:16, color:'#2D7A4F', fontWeight:300 }}>{p.avg_weekly_views}</div>
                              <div style={{ ...sans, fontSize:9, color:C.muted }}>AVG VIEWS / WEEK</div>
                            </div>
                            <div>
                              <div style={{ ...serif, fontSize:16, color:C.terra, fontWeight:300 }}>{p.avg_weekly_enquiries}</div>
                              <div style={{ ...sans, fontSize:9, color:C.muted }}>AVG ENQ. / WEEK</div>
                            </div>
                          </div>
                          <LineChart data={p.trend14} width={280} height={100}/>
                        </div>
                      )}
                    </div>
                  )
                })}
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
