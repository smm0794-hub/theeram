'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const C = { green:'#1C3A2B',cream:'#F5F0E8',cream2:'#EDE8DC',cream3:'#E5DFD0',gold:'#C9A84C',terra:'#9B3D1E',text:'#1C1C1A',muted:'#6B5E4E' }
const sans = { fontFamily:'system-ui,sans-serif' } as const
const serif = { fontFamily:'Georgia,serif' } as const

interface Town { id: string; name: string; slug: string; hero_bg_color: string }
interface PropertyStat { name: string; slug: string; count: number; town_name: string }
interface InquiryRow { created_at: string; property_id: string; event_type: string; properties: { name: string; slug: string; town_id: string; towns: { name: string } | null } | null }

export default function AnalyticsPage() {
  const [towns, setTowns] = useState<Town[]>([])
  const [selectedTown, setSelectedTown] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [allInquiries, setAllInquiries] = useState<InquiryRow[]>([])
  const [allViews, setAllViews] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [tr, ir, vr] = await Promise.all([
        supabase.from('towns').select('id,name,slug,hero_bg_color').eq('is_active', true).order('sort_order'),
        supabase.from('inquiries').select('created_at,property_id,event_type,properties(name,slug,town_id,towns(name))').order('created_at', { ascending: false }),
        supabase.from('property_views').select('property_id,viewed_at,properties(name,slug,town_id,towns(name))').order('viewed_at', { ascending: false }),
      ])
      if (!tr.error && tr.data) setTowns(tr.data as Town[])
      if (!ir.error && ir.data) setAllInquiries(ir.data as any)
      if (!vr.error && vr.data) setAllViews(vr.data as any)
      setLoading(false)
    }
    load()
  }, [])

  const now = Date.now()
  const oneWeek = 7 * 24 * 60 * 60 * 1000
  const oneMonth = 30 * 24 * 60 * 60 * 1000

  // Filter inquiries by selected town
  const filteredViews = allViews.filter(v => {
    if (selectedTown === 'all') return true
    return (v.properties as any)?.town_id === selectedTown
  })

  const filtered = allInquiries.filter(i => {
    if (selectedTown === 'all') return true
    return (i.properties as any)?.town_id === selectedTown
  })

  const weekTotal = filtered.filter(i => now - new Date(i.created_at).getTime() < oneWeek).length
  const monthTotal = filtered.filter(i => now - new Date(i.created_at).getTime() < oneMonth).length
  const allTime = filtered.length

  // Top properties — enquiries + views
  const propCounts: Record<string, { name: string; slug: string; enquiries: number; views: number; town_name: string }> = {}
  filtered.forEach(i => {
    const p = i.properties as any
    if (!p) return
    const key = i.property_id
    if (!propCounts[key]) propCounts[key] = { name: p.name, slug: p.slug, enquiries: 0, views: 0, town_name: p.towns?.name ?? '' }
    propCounts[key].enquiries++
  })
  filteredViews.forEach(v => {
    const p = v.properties as any
    if (!p) return
    const key = v.property_id
    if (!propCounts[key]) propCounts[key] = { name: p.name, slug: p.slug, enquiries: 0, views: 0, town_name: p.towns?.name ?? '' }
    propCounts[key].views++
  })
  const topProps = Object.values(propCounts).sort((a,b) => (b.enquiries + b.views) - (a.enquiries + a.views)).slice(0,10)

  // Event type breakdown
  const etCounts: Record<string, number> = {}
  filtered.forEach(i => { etCounts[i.event_type] = (etCounts[i.event_type] || 0) + 1 })
  const topEvents = Object.entries(etCounts).sort((a,b) => b[1]-a[1])

  // By town (for all view)
  const townCounts: Record<string, { name: string; color: string; count: number }> = {}
  allInquiries.forEach(i => {
    const p = i.properties as any
    const tid = p?.town_id ?? 'unknown'
    const tname = p?.towns?.name ?? 'Unknown'
    const town = towns.find(t => t.id === tid)
    if (!townCounts[tid]) townCounts[tid] = { name: tname, color: town?.hero_bg_color ?? C.muted, count: 0 }
    townCounts[tid].count++
  })
  const townBreakdown = Object.values(townCounts).sort((a,b) => b.count - a.count)

  // Daily trend last 14 days
  const days: { label: string; count: number }[] = []
  for (let d = 13; d >= 0; d--) {
    const date = new Date(now - d * 24 * 60 * 60 * 1000)
    const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    const count = filtered.filter(i => {
      const id = new Date(i.created_at)
      return id.toDateString() === date.toDateString()
    }).length
    days.push({ label, count })
  }
  const maxDay = Math.max(...days.map(d => d.count), 1)

  const selectedTownObj = towns.find(t => t.id === selectedTown)

  return (
    <div style={{ minHeight:'100vh',background:C.cream,paddingBottom:48 }}>
      <div style={{ background:C.green,padding:'6px 16px' }}><span style={{ ...sans,fontSize:10,color:'rgba(255,255,255,.5)' }}>theeram</span></div>
      <div style={{ background:C.cream,borderBottom:`1px solid ${C.cream3}`,padding:'13px 16px',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:40 }}>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          <Link href="/curator" style={{ ...sans,fontSize:12,color:C.muted,textDecoration:'none' }}>← Curator</Link>
          <span style={{ fontFamily:'Georgia,serif',fontSize:18,color:C.text }}>Analytics</span>
        </div>
      </div>

      <div style={{ padding:'16px 16px 0' }}>

        {/* Town filter */}
        <div style={{ marginBottom:18 }}>
          <div style={{ ...sans,fontSize:9,color:C.terra,letterSpacing:'.08em',marginBottom:8 }}>FILTER BY TOWN</div>
          <div style={{ display:'flex',gap:6,overflowX:'auto',paddingBottom:4 }} className="no-scrollbar">
            <button onClick={() => setSelectedTown('all')} style={{ ...sans,flexShrink:0,padding:'7px 14px',border:`1px solid ${selectedTown==='all'?C.green:C.cream3}`,background:selectedTown==='all'?C.green:'white',color:selectedTown==='all'?'white':C.muted,fontSize:11,cursor:'pointer',fontWeight:selectedTown==='all'?600:400 }}>
              All towns
            </button>
            {towns.map(t => (
              <button key={t.id} onClick={() => setSelectedTown(t.id)} style={{ ...sans,flexShrink:0,padding:'7px 14px',border:`1px solid ${selectedTown===t.id?t.hero_bg_color:C.cream3}`,background:selectedTown===t.id?t.hero_bg_color:'white',color:selectedTown===t.id?'white':C.muted,fontSize:11,cursor:'pointer',fontWeight:selectedTown===t.id?600:400 }}>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center',padding:'40px 0' }}>
            <div style={{ width:28,height:28,border:`2px solid ${C.terra}`,borderTopColor:'transparent',borderRadius:'50%',animation:'spin .8s linear infinite',margin:'0 auto' }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <>
            {/* Context header */}
            <div style={{ ...serif,fontSize:16,color:C.text,marginBottom:16 }}>
              {selectedTown === 'all' ? 'All towns combined' : `${selectedTownObj?.name ?? ''}`}
            </div>

            {/* Key stats */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12 }}>
              {[['Enquiries (week)',weekTotal],['Enquiries (all)',allTime]].map(([label,val]) => (
                <div key={label as string} style={{ background:'white',border:`1px solid ${C.cream3}`,padding:'14px 10px',textAlign:'center' }}>
                  <div style={{ fontFamily:'Georgia,serif',fontSize:26,color:C.terra,fontWeight:300,marginBottom:3 }}>{val}</div>
                  <div style={{ ...sans,fontSize:9,color:C.muted,letterSpacing:'.06em' }}>{(label as string).toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20 }}>
              {[['Page views (week)',filteredViews.filter(v=>now-new Date(v.viewed_at).getTime()<oneWeek).length],['Page views (all)',filteredViews.length]].map(([label,val]) => (
                <div key={label as string} style={{ background:'white',border:`1px solid ${C.cream3}`,padding:'14px 10px',textAlign:'center' }}>
                  <div style={{ fontFamily:'Georgia,serif',fontSize:26,color:'#2D7A4F',fontWeight:300,marginBottom:3 }}>{val}</div>
                  <div style={{ ...sans,fontSize:9,color:C.muted,letterSpacing:'.06em' }}>{(label as string).toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* 14-day trend chart */}
            <div style={{ background:'white',border:`1px solid ${C.cream3}`,padding:'16px 14px',marginBottom:16 }}>
              <div style={{ ...sans,fontSize:10,color:C.muted,letterSpacing:'.07em',marginBottom:12 }}>LAST 14 DAYS</div>
              <div style={{ display:'flex',alignItems:'flex-end',gap:3,height:60 }}>
                {days.map((d,i) => (
                  <div key={i} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}>
                    <div style={{ width:'100%',background:d.count>0?C.terra:C.cream3,borderRadius:2,height:`${Math.max((d.count/maxDay)*52,d.count>0?4:2)}px`,transition:'height .3s' }}/>
                    {i % 3 === 0 && <div style={{ ...sans,fontSize:8,color:C.muted,whiteSpace:'nowrap' as const,transform:'rotate(-30deg)',transformOrigin:'top left',marginTop:4 }}>{d.label}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Town breakdown — only show when all towns selected */}
            {selectedTown === 'all' && townBreakdown.length > 0 && (
              <div style={{ background:'white',border:`1px solid ${C.cream3}`,padding:'14px',marginBottom:16 }}>
                <div style={{ ...sans,fontSize:10,color:C.muted,letterSpacing:'.07em',marginBottom:12 }}>BY TOWN</div>
                {townBreakdown.map(t => (
                  <div key={t.name} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
                    <div style={{ width:10,height:10,background:t.color,flexShrink:0 }}/>
                    <div style={{ ...sans,fontSize:12,color:C.text,flex:1 }}>{t.name}</div>
                    <div style={{ flex:2,background:C.cream2,borderRadius:2,overflow:'hidden' }}>
                      <div style={{ height:6,background:t.color,width:`${(t.count/allTime)*100}%`,transition:'width .3s' }}/>
                    </div>
                    <div style={{ ...sans,fontSize:12,fontWeight:600,color:C.text,minWidth:24,textAlign:'right' as const }}>{t.count}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Top properties */}
            {topProps.length > 0 && (
              <div style={{ background:'white',border:`1px solid ${C.cream3}`,padding:'14px',marginBottom:16 }}>
                <div style={{ ...sans,fontSize:10,color:C.muted,letterSpacing:'.07em',marginBottom:12 }}>TOP SPACES BY ENQUIRIES</div>
                {topProps.map((p,i) => (
                  <div key={p.slug} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                      <div style={{ ...sans,fontSize:11,color:C.muted,width:16,textAlign:'right' as const }}>{i+1}</div>
                      <div style={{ ...sans,fontSize:12,color:C.text,fontWeight:500,flex:1 }}>{p.name}</div>
                      {selectedTown === 'all' && p.town_name && <div style={{ ...sans,fontSize:10,color:C.muted }}>{p.town_name}</div>}
                    </div>
                    <div style={{ paddingLeft:24,display:'flex',gap:8 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ ...sans,fontSize:9,color:C.muted,marginBottom:2 }}>VIEWS</div>
                        <div style={{ background:C.cream2,borderRadius:2,overflow:'hidden',marginBottom:2 }}>
                          <div style={{ height:5,background:'#2D7A4F',width:`${topProps[0].views>0?(p.views/topProps[0].views)*100:0}%`,transition:'width .3s' }}/>
                        </div>
                        <div style={{ ...sans,fontSize:11,fontWeight:600,color:'#2D7A4F' }}>{p.views}</div>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ ...sans,fontSize:9,color:C.muted,marginBottom:2 }}>ENQUIRIES</div>
                        <div style={{ background:C.cream2,borderRadius:2,overflow:'hidden',marginBottom:2 }}>
                          <div style={{ height:5,background:C.terra,width:`${topProps[0].enquiries>0?(p.enquiries/topProps[0].enquiries)*100:0}%`,transition:'width .3s' }}/>
                        </div>
                        <div style={{ ...sans,fontSize:11,fontWeight:600,color:C.terra }}>{p.enquiries}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Event type breakdown */}
            {topEvents.length > 0 && (
              <div style={{ background:'white',border:`1px solid ${C.cream3}`,padding:'14px',marginBottom:16 }}>
                <div style={{ ...sans,fontSize:10,color:C.muted,letterSpacing:'.07em',marginBottom:12 }}>BY EVENT TYPE</div>
                {topEvents.map(([et, count]) => (
                  <div key={et} style={{ display:'flex',alignItems:'center',gap:10,marginBottom:8 }}>
                    <div style={{ ...sans,fontSize:12,color:C.text,flex:1,textTransform:'capitalize' as const }}>{et.replace(/_/g,' ')}</div>
                    <div style={{ flex:2,background:C.cream2,borderRadius:2,overflow:'hidden' }}>
                      <div style={{ height:6,background:C.gold,width:`${(count/topEvents[0][1])*100}%` }}/>
                    </div>
                    <div style={{ ...sans,fontSize:12,fontWeight:600,color:C.text,minWidth:24,textAlign:'right' as const }}>{count}</div>
                  </div>
                ))}
              </div>
            )}

            {allTime === 0 && (
              <p style={{ ...sans,fontSize:14,color:C.muted,textAlign:'center',padding:'20px 0' }}>No enquiries yet{selectedTown !== 'all' ? ` for ${selectedTownObj?.name}` : ''}.</p>
            )}
          </>
        )}
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}`}</style>
    </div>
  )
}
