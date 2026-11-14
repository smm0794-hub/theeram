import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import { fetchAll } from '@/lib/fetch-all'
import { C, sans, serif } from '@/lib/design'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const db = createServiceClient()
  const { data } = await db.from('properties').select('name').eq('slug', params.slug).single()
  return {
    title: data?.name ? `${data.name} — Owner Pulse Report | Theeram Spaces` : 'Owner Pulse Report | Theeram Spaces',
    robots: { index: false, follow: false },
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

const OCCASION_LABELS: Record<string, string> = {
  wedding: 'Wedding / Engagement',
  baptism: 'Baptism / Communion',
  family_gathering: 'Family Gathering',
  birthday: 'Birthday',
  staycation: 'Staycation',
  corporate: 'Corporate / Retreat',
}

export default async function OwnerReportPage({ params }: { params: { slug: string } }) {
  const db = createServiceClient()

  const { data: prop } = await db
    .from('properties')
    .select('id, name, slug, property_type, owner_name, owner_whatsapp, price_guide, photos, is_featured, is_active, town_id, towns(id, name, district, hero_bg_color), property_attributes(max_guests_day_event)')
    .eq('slug', params.slug)
    .single()

  if (!prop) notFound()

  const rawTown = (prop as any).towns
  const town = Array.isArray(rawTown) ? rawTown[0] : rawTown
  const rawAttrs = (prop as any).property_attributes
  const attrs = Array.isArray(rawAttrs) ? rawAttrs[0] : rawAttrs
  const maxGuests = attrs?.max_guests_day_event ?? null

  const fetchPropInquiries = async () => {
    try {
      return await fetchAll((from, to) =>
        db.from('inquiries')
          .select('id, created_at, event_type, event_date, is_flexible_date, guest_count, is_over_capacity, channel')
          .eq('property_id', prop!.id)
          .order('created_at', { ascending: false })
          .order('id')
          .range(from, to)
      )
    } catch {
      return await fetchAll((from, to) =>
        db.from('inquiries')
          .select('id, created_at, event_type')
          .eq('property_id', prop!.id)
          .order('created_at', { ascending: false })
          .order('id')
          .range(from, to)
      )
    }
  }

  const [viewRows, rawInqRows, townPropsRes] = await Promise.all([
    fetchAll((from, to) =>
      db.from('property_views')
        .select('id, viewed_at, duration_seconds, visitor_country, session_id')
        .eq('property_id', prop.id)
        .order('viewed_at', { ascending: false })
        .order('id')
        .range(from, to)
    ),
    fetchPropInquiries(),
    prop.town_id
      ? db.from('properties').select('id').eq('town_id', prop.town_id).eq('is_active', true)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const now = Date.now()
  const day30 = 30 * 24 * 60 * 60 * 1000
  const todayIso = new Date(now + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const isDirectLead = (r: any) => !r.channel || r.channel === 'whatsapp' || r.channel === 'whatsapp_skip' || r.channel === 'phone'
  const directLeads = rawInqRows.filter(isDirectLead)

  const views30 = viewRows.filter((r: any) => now - new Date(r.viewed_at).getTime() < day30)
  const leads30 = directLeads.filter((r: any) => now - new Date(r.created_at).getTime() < day30)

  const conversionPct = viewRows.length > 0 ? Math.round((directLeads.length / viewRows.length) * 1000) / 10 : 0

  const durations = viewRows.filter((r: any) => typeof r.duration_seconds === 'number' && r.duration_seconds > 0)
  const avgDuration = durations.length
    ? Math.round(durations.reduce((s: number, r: any) => s + r.duration_seconds, 0) / durations.length)
    : null

  // Micro-signals
  let shares = 0
  let mapsClicks = 0
  let phoneCalls = 0
  let overCapCount = 0
  let paxSum = 0
  let paxCount = 0
  const occasionMap: Record<string, number> = {}
  const requestedDates: Record<string, { date: string; count: number; paxList: number[] }> = {}

  rawInqRows.forEach((r: any) => {
    const ch = r.channel || 'whatsapp'
    if (ch === 'share_family' || ch === 'share_link') shares++
    else if (ch === 'maps') mapsClicks++
    else if (ch === 'phone') phoneCalls++

    if (!isDirectLead(r)) return

    if (r.is_over_capacity) overCapCount++
    if (typeof r.guest_count === 'number' && r.guest_count > 0) {
      paxSum += r.guest_count
      paxCount++
    }
    if (r.event_type && r.event_type !== 'general') {
      occasionMap[r.event_type] = (occasionMap[r.event_type] ?? 0) + 1
    }
    if (r.event_date) {
      const d = String(r.event_date).slice(0, 10)
      if (d >= todayIso) {
        if (!requestedDates[d]) requestedDates[d] = { date: d, count: 0, paxList: [] }
        requestedDates[d].count++
        if (typeof r.guest_count === 'number' && r.guest_count > 0) requestedDates[d].paxList.push(r.guest_count)
      }
    }
  })

  const upcomingDates = Object.values(requestedDates)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

  const avgPax = paxCount > 0 ? Math.round(paxSum / paxCount) : null
  const topOccasions = Object.entries(occasionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  // NRI / Diaspora breakdown
  const countryCounts: Record<string, number> = {}
  let locatedViews = 0
  let nriViews = 0
  viewRows.forEach((r: any) => {
    if (!r.visitor_country) return
    locatedViews++
    countryCounts[r.visitor_country] = (countryCounts[r.visitor_country] ?? 0) + 1
    if (r.visitor_country !== 'India') nriViews++
  })
  const nriPct = locatedViews > 0 ? Math.round((nriViews / locatedViews) * 100) : 0
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  // Town benchmark (anonymized)
  const townPropIds = (townPropsRes.data ?? []).map((p: any) => p.id).filter(Boolean)
  let townAvgConversion: number | null = null
  if (townPropIds.length > 1) {
    const [tvRes, tiRes] = await Promise.all([
      db.from('property_views').select('id', { count: 'exact', head: true }).in('property_id', townPropIds),
      db.from('inquiries').select('id', { count: 'exact', head: true }).in('property_id', townPropIds),
    ])
    const tv = tvRes.count ?? 0
    const ti = tiRes.count ?? 0
    if (tv > 0) townAvgConversion = Math.round((ti / tv) * 1000) / 10
  }

  const heroBg = town?.hero_bg_color || C.green
  const coverPhoto = Array.isArray(prop.photos) && prop.photos.length > 0 ? prop.photos[0] : null
  const curatorWa = process.env.NEXT_PUBLIC_CURATOR_WHATSAPP || ''
  const upgradeMsg = encodeURIComponent(`Hi Theeram team! I saw the Pulse Report for ${prop.name} and would like to know about Featured / Pro insights.`)
  const reportGeneratedLabel = new Date(now + 5.5 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: C.cream, paddingBottom: 48 }}>
      {/* Top Bar */}
      <div style={{ background: heroBg, padding: '22px 18px 26px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, opacity: 0.07, pointerEvents: 'none' }}>
          <svg viewBox="0 0 200 200" fill="none" width={180} height={180}>
            <circle cx="100" cy="100" r="90" stroke="white" strokeWidth={1}/>
            <circle cx="100" cy="100" r="60" stroke="white" strokeWidth={1}/>
            <circle cx="100" cy="100" r="30" stroke="white" strokeWidth={1}/>
          </svg>
        </div>
        <div style={{ maxWidth: 560, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ ...serif, fontSize: 13, color: 'rgba(255,255,255,.7)' }}>തീരം · theeram pulse</span>
            <span style={{ ...sans, fontSize: 10, color: C.gold, letterSpacing: '.06em' }}>OWNER REPORT · {reportGeneratedLabel.toUpperCase()}</span>
          </div>

          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {coverPhoto && (
              <img src={coverPhoto} alt={prop.name} style={{ width: 64, height: 64, borderRadius: 14, objectFit: 'cover', border: '1.5px solid rgba(255,255,255,.25)', flexShrink: 0 }}/>
            )}
            <div>
              <h1 style={{ ...serif, fontSize: 23, color: 'white', fontWeight: 400, margin: '0 0 4px', lineHeight: 1.2 }}>{prop.name}</h1>
              <div style={{ ...sans, fontSize: 11.5, color: 'rgba(255,255,255,.72)', fontWeight: 300 }}>
                {town?.name ? `${town.name}, Kerala` : 'Kerala'}
                {prop.is_featured ? ' · ★ Theeram Pick' : ''}
                {prop.owner_name ? ` · For ${prop.owner_name}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '-14px auto 0', padding: '0 16px', position: 'relative', zIndex: 2 }}>
        {/* Headline KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div style={{ background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}`, padding: '16px 14px', boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
            <div style={{ ...sans, fontSize: 9.5, color: C.muted, letterSpacing: '.06em', marginBottom: 4 }}>LISTING VIEWS</div>
            <div style={{ ...serif, fontSize: 30, color: '#2D7A4F', fontWeight: 400, lineHeight: 1.1 }}>{viewRows.length}</div>
            <div style={{ ...sans, fontSize: 11, color: C.muted, marginTop: 4 }}>{views30.length} in last 30 days</div>
          </div>
          <div style={{ background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}`, padding: '16px 14px', boxShadow: '0 2px 10px rgba(0,0,0,.04)' }}>
            <div style={{ ...sans, fontSize: 9.5, color: C.muted, letterSpacing: '.06em', marginBottom: 4 }}>DIRECT LEADS</div>
            <div style={{ ...serif, fontSize: 30, color: C.terra, fontWeight: 400, lineHeight: 1.1 }}>{directLeads.length}</div>
            <div style={{ ...sans, fontSize: 11, color: C.muted, marginTop: 4 }}>
              {leads30.length} in 30d{phoneCalls > 0 ? ` · ${phoneCalls} calls` : ''}
            </div>
          </div>
        </div>

        {/* High-Intent Engagement Strip */}
        <div style={{ background: 'white', borderRadius: 18, border: `1px solid ${C.cream3}`, padding: '14px 16px', marginBottom: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
          <div>
            <div style={{ ...serif, fontSize: 18, color: C.text }}>{viewRows.length > 0 ? `${conversionPct}%` : '—'}</div>
            <div style={{ ...sans, fontSize: 8.5, color: C.muted, letterSpacing: '.04em' }}>LEAD RATE</div>
          </div>
          <div>
            <div style={{ ...serif, fontSize: 18, color: C.text }}>{avgDuration !== null ? formatDuration(avgDuration) : '—'}</div>
            <div style={{ ...sans, fontSize: 8.5, color: C.muted, letterSpacing: '.04em' }}>AVG DWELL</div>
          </div>
          <div>
            <div style={{ ...serif, fontSize: 18, color: C.text }}>{shares}</div>
            <div style={{ ...sans, fontSize: 8.5, color: C.muted, letterSpacing: '.04em' }}>FAMILY SHARES</div>
          </div>
          <div>
            <div style={{ ...serif, fontSize: 18, color: C.text }}>{mapsClicks}</div>
            <div style={{ ...sans, fontSize: 8.5, color: C.muted, letterSpacing: '.04em' }}>MAP CLICKS</div>
          </div>
        </div>

        {/* Town Benchmark Note */}
        {townAvgConversion !== null && viewRows.length > 0 && (
          <div style={{
            background: conversionPct >= townAvgConversion ? '#EDF7F0' : '#FDF4EF',
            border: `1px solid ${conversionPct >= townAvgConversion ? '#B8E0C4' : 'rgba(155,61,30,.25)'}`,
            borderRadius: 14, padding: '12px 14px', marginBottom: 12,
          }}>
            <div style={{ ...sans, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
              {conversionPct >= townAvgConversion ? (
                <>
                  <strong>Above town average:</strong> Your listing converts <strong>{conversionPct}%</strong> of visitors into WhatsApp/call leads vs. {town?.name ?? 'town'} average of {townAvgConversion}%.
                </>
              ) : (
                <>
                  <strong>Growth opportunity:</strong> Your lead rate is <strong>{conversionPct}%</strong> vs. {town?.name ?? 'town'} average of {townAvgConversion}%. Adding 3–4 more event setup photos usually lifts this significantly.
                </>
              )}
            </div>
          </div>
        )}

        {/* Guest Demand Profile (Dates, Pax, Occasions) */}
        {(upcomingDates.length > 0 || avgPax !== null || topOccasions.length > 0 || overCapCount > 0) && (
          <div style={{ background: 'white', borderRadius: 20, border: `1px solid ${C.cream3}`, padding: '18px 16px', marginBottom: 12 }}>
            <div style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em', fontWeight: 700, marginBottom: 10 }}>
              GUEST DEMAND SIGNALS
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: upcomingDates.length > 0 ? 14 : 0 }}>
              <div style={{ background: C.cream, borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ ...serif, fontSize: 20, color: C.text }}>{avgPax !== null ? `~${avgPax}` : '—'}</div>
                <div style={{ ...sans, fontSize: 9.5, color: C.muted }}>AVG GUEST COUNT</div>
              </div>
              <div style={{ background: C.cream, borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ ...serif, fontSize: 20, color: overCapCount > 0 ? C.terra : C.text }}>{overCapCount}</div>
                <div style={{ ...sans, fontSize: 9.5, color: C.muted }}>
                  OVER-CAPACITY{maxGuests ? ` (>${maxGuests})` : ''}
                </div>
              </div>
            </div>

            {topOccasions.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: upcomingDates.length > 0 ? 14 : 0 }}>
                {topOccasions.map(([occ, cnt]) => (
                  <span key={occ} style={{ ...sans, fontSize: 11, color: C.text, background: C.cream2, padding: '4px 10px', borderRadius: 999 }}>
                    {OCCASION_LABELS[occ] ?? occ} · <strong>{cnt}</strong>
                  </span>
                ))}
              </div>
            )}

            {upcomingDates.length > 0 && (
              <div>
                <div style={{ ...sans, fontSize: 9.5, color: C.muted, letterSpacing: '.06em', marginBottom: 8 }}>UPCOMING DATES GUESTS ASKED ABOUT</div>
                {upcomingDates.map(ud => {
                  const meanPax = ud.paxList.length ? Math.round(ud.paxList.reduce((s, n) => s + n, 0) / ud.paxList.length) : null
                  return (
                    <div key={ud.date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: C.cream, borderRadius: 10, marginBottom: 5, borderLeft: `3px solid ${C.gold}` }}>
                      <span style={{ ...sans, fontSize: 12, color: C.text, fontWeight: 500 }}>
                        {formatShortDate(ud.date)}{meanPax ? ` · ~${meanPax} guests` : ''}
                      </span>
                      <span style={{ ...sans, fontSize: 11, color: C.terra, fontWeight: 700 }}>{ud.count} {ud.count === 1 ? 'enquiry' : 'enquiries'}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* NRI / Diaspora Demand */}
        {locatedViews > 0 && (
          <div style={{ background: 'white', borderRadius: 20, border: `1px solid ${C.cream3}`, padding: '18px 16px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ ...sans, fontSize: 10, color: C.terra, letterSpacing: '.08em', fontWeight: 700 }}>WHERE VISITORS ARE FROM</span>
              {nriPct > 0 && (
                <span style={{ ...sans, fontSize: 10, background: '#FDF4EF', color: C.terra, padding: '3px 9px', borderRadius: 999, fontWeight: 600 }}>
                  {nriPct}% NRI / Abroad
                </span>
              )}
            </div>
            {topCountries.map(([country, count]) => (
              <div key={country} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ ...sans, fontSize: 12, color: C.text }}>{country}</span>
                  <span style={{ ...sans, fontSize: 11, color: C.muted }}>{Math.round((count / locatedViews) * 100)}% ({count})</span>
                </div>
                <div style={{ background: C.cream2, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: 5, background: C.green, width: `${(count / topCountries[0][1]) * 100}%` }}/>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Value-add Upgrade / Curator CTA */}
        <div style={{ background: C.green, borderRadius: 20, padding: '18px 16px', color: 'white', marginBottom: 14 }}>
          <div style={{ ...sans, fontSize: 9.5, color: C.gold, letterSpacing: '.08em', marginBottom: 6 }}>THEERAM PULSE · OWNER SERVICES</div>
          <div style={{ ...serif, fontSize: 18, fontWeight: 300, marginBottom: 6 }}>
            Want more bookings on empty dates?
          </div>
          <p style={{ ...sans, fontSize: 12, color: 'rgba(255,255,255,.75)', fontWeight: 300, lineHeight: 1.6, margin: '0 0 14px' }}>
            Pin {prop.name} as a <strong>★ Theeram Pick</strong> at the top of {town?.name ?? 'your town'}, refresh your photo gallery, or unlock town-wide hot-date alerts.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {curatorWa && (
              <a href={`https://wa.me/${curatorWa}?text=${upgradeMsg}`} target="_blank" rel="noopener noreferrer"
                style={{ ...sans, flex: '1 1 180px', height: 42, borderRadius: 11, background: C.gold, color: C.text, fontSize: 11.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                Talk to Theeram Team →
              </a>
            )}
            <Link href={`/property/${prop.slug}`}
              style={{ ...sans, flex: '1 1 130px', height: 42, borderRadius: 11, border: '1px solid rgba(255,255,255,.28)', color: 'white', fontSize: 11.5, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              View Live Listing
            </Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', ...sans, fontSize: 10.5, color: C.muted }}>
          Zero booking commission · Direct WhatsApp discovery by <Link href="/" style={{ color: C.terra, textDecoration: 'none' }}>theeramspaces.in</Link>
        </div>
      </div>
    </div>
  )
}
