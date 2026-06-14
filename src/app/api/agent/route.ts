import { NextRequest, NextResponse } from 'next/server'

// ── Town context — read from Supabase so no code change needed when adding towns ──
import { createServiceClient } from '@/lib/supabase'

interface TownContext {
  name: string; district: string; malayalam: string; alt: string
}

async function getTownContext(query: string, slug?: string): Promise<TownContext> {
  try {
    const db = createServiceClient()
    const { data: towns } = await db
      .from('towns')
      .select('slug, name, district, malayalam_name, alt_name')
      .eq('is_active', true)

    if (towns?.length) {
      // Try exact slug match first
      if (slug) {
        const match = towns.find((t: any) => t.slug === slug)
        if (match) return {
          name: match.name,
          district: match.district ?? 'Kerala',
          malayalam: match.malayalam_name ?? '',
          alt: match.alt_name ?? match.name,
        }
      }
      // Fall back to matching against query text
      const q = query.toLowerCase()
      const match = towns.find((t: any) =>
        q.includes(t.slug) || q.includes(t.name.toLowerCase())
      )
      if (match) return {
        name: match.name,
        district: match.district ?? 'Kerala',
        malayalam: match.malayalam_name ?? '',
        alt: match.alt_name ?? match.name,
      }
    }
  } catch {}
  // Fallback — still works even if DB is unavailable
  return { name: 'Kerala', district: 'Kerala', malayalam: 'കേരള', alt: 'Kerala' }
}

// ── Serper search ─────────────────────────────────────────────────────────────
async function serperSearch(q: string, apiKey: string): Promise<string> {
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ q, gl: 'in', hl: 'en', num: 10 }),
    })
    const data = await r.json()
    const items = [
      ...(data.organic ?? []),
      ...(data.places ?? []),
      ...(data.localResults ?? []),
    ]
    if (!items.length) return ''
    return items.map((item: any) =>
      [
        `NAME: ${item.title ?? item.name ?? ''}`,
        item.phoneNumber ? `PHONE: ${item.phoneNumber}` : '',
        item.address    ? `ADDRESS: ${item.address}`   : '',
        item.snippet    ? `INFO: ${item.snippet}`      : '',
        item.rating     ? `RATING: ${item.rating}`     : '',
        item.link       ? `URL: ${item.link}`          : '',
      ].filter(Boolean).join('\n')
    ).join('\n---\n')
  } catch { return '' }
}

// ── Serper images ─────────────────────────────────────────────────────────────
async function serperImages(name: string, town: string, apiKey: string): Promise<string[]> {
  try {
    const r = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ q: `"${name}" ${town} Kerala event venue`, gl: 'in', num: 6 }),
    })
    const data = await r.json()
    return (data.images ?? [])
      .map((img: any) => img.imageUrl)
      .filter((url: string) => url?.startsWith('http'))
      .slice(0, 4)
  } catch { return [] }
}

// ── Discovery searches — 5 varied queries ─────────────────────────────────────
function buildDiscoverySearches(townName: string, district: string, malayalam: string, alt: string): string[] {
  return [
    `"${townName}" party hall marriage hall Kerala`,
    `"${townName}" villa homestay event space ${district}`,
    `"${alt}" heritage home tharavadu nalukettu Kerala events`,
    `"${townName}" event venue site:justdial.com OR site:sulekha.com OR site:quickerala.com`,
    `${malayalam} കല്യാണ മണ്ഡപം ഓഡിറ്റോറിയം`,  // Malayalam: wedding hall / auditorium
  ]
}

// ── Name lookup searches ──────────────────────────────────────────────────────
function buildNameSearches(name: string, townName: string, district: string): string[] {
  return [
    `"${name}" ${townName} Kerala`,
    `"${name}" ${district} Kerala event venue contact`,
  ]
}

// ── Normalise a name for dedup comparison ─────────────────────────────────────
function normaliseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(by|the|at|in|near|homes?|llp|pvt|ltd|private|limited)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

// ── Deduplicate venues by normalised name ─────────────────────────────────────
function dedupeVenues(venues: any[]): any[] {
  const seen = new Map<string, any>()
  for (const v of venues) {
    if (!v?.name) continue
    const key = normaliseName(v.name)
    if (!key) continue
    const existing = seen.get(key)
    if (!existing) {
      seen.set(key, v)
    } else {
      // Merge — keep the more complete record
      const merged = { ...existing }
      for (const field of Object.keys(v)) {
        const cur = existing[field]
        const incoming = v[field]
        // Prefer non-empty values
        if ((cur === '' || cur === 0 || cur === false || cur == null) &&
            (incoming !== '' && incoming !== 0 && incoming !== false && incoming != null)) {
          merged[field] = incoming
        }
      }
      // Keep highest confidence
      const rank = { high: 3, medium: 2, low: 1 } as Record<string, number>
      if ((rank[v.confidence] ?? 0) > (rank[existing.confidence] ?? 0)) {
        merged.confidence = v.confidence
      }
      seen.set(key, merged)
    }
  }
  return Array.from(seen.values())
}

// ── Haiku extraction prompt ───────────────────────────────────────────────────
function buildExtractionPrompt(snippets: string, townName: string, district: string, mode: string): string {
  const context = mode === 'name_lookup'
    ? `Extract details for the specific venue that was searched. Return all details you can find as a single-item array.`
    : `Extract all unique event venues. Only include venues physically located in ${townName}, ${district} district, Kerala. Reject results from other districts or states.`

  return `${context}

Search results:
${snippets}

Return ONLY a raw JSON array. No markdown, no explanation, no text before or after.

Each object must have exactly these fields:
{
  "name": string,
  "type": "villa_with_pool|villa_without_pool|heritage_home|open_event_space|auditorium|river_frontage|lodging|resort",
  "tagline": "one warm sentence about what makes it special",
  "description": "2-3 sentences, warm local tone, mention specific features if known",
  "phone": "country code format e.g. 919447000000 — empty string if not found, NEVER invent",
  "whatsapp": "same format — empty string if not found",
  "price_guide": "Contact owner for pricing — or Rs.X/day if explicitly found",
  "location": "specific area or ward within ${townName}",
  "instagram": "full URL or empty string",
  "maps_url": "Google Maps URL or empty string",
  "room_count": 0, "bathroom_count": 0, "max_overnight": 0, "max_day": 0,
  "has_pool": false, "has_ac_hall": false, "has_open_lawn": false,
  "has_kitchen": false, "has_parking": false, "has_generator": false,
  "alcohol_allowed": false, "outside_catering": false,
  "ac_hall_capacity": 0, "parking_count": 0,
  "event_types": ["family_gathering","wedding","corporate","birthday"],
  "confidence": "high|medium|low",
  "source": "website name or URL where found"
}

Rules:
- confidence=high only if a phone number was found in the results
- confidence=medium if name and address found but no phone
- confidence=low if name only
- NEVER invent phone numbers, addresses, or facility details — use empty/0/false when unknown
- Infer type from name: "hall/auditorium/convention/mandapam" → auditorium, "villa/bungalow" → villa_without_pool, "resort" → resort, "tharavadu/heritage/nalukettu/mana" → heritage_home, "river/backwater/lake" → river_frontage, "homestay/lodge" → lodging
- Merge venues that appear in multiple results into ONE entry with the most complete details
- Exclude: restaurants, pure hotels with no event space, shops, offices, hospitals, schools, churches (unless they explicitly rent a hall)`
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { query, townId, townSlug, mode: requestedMode, existingSlugs } = await req.json()
    if (!query?.trim()) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const serperKey = process.env.SERPER_API_KEY
    if (!anthropicKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set in Vercel.' }, { status: 500 })
    if (!serperKey) return NextResponse.json({ error: 'SERPER_API_KEY not set in Vercel.' }, { status: 500 })

    const town = await getTownContext(query, townSlug)
    // Mode is now explicit from the UI — falls back to discovery
    const mode: 'discovery' | 'name_lookup' = requestedMode === 'name_lookup' ? 'name_lookup' : 'discovery'

    const searchQueries = mode === 'name_lookup'
      ? buildNameSearches(query.trim(), town.name, town.district)
      : buildDiscoverySearches(town.name, town.district, town.malayalam, town.alt)

    const searchResults = await Promise.all(searchQueries.map(q => serperSearch(q, serperKey)))
    const allSnippets = searchResults.filter(s => s.trim()).join('\n\n===\n\n')

    if (!allSnippets.trim()) {
      return NextResponse.json({
        error: mode === 'name_lookup'
          ? `No results found for "${query}". Try the full venue name.`
          : `No results found for ${town.name}. Try a more specific search.`
      }, { status: 404 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: mode === 'discovery' ? 6000 : 2000,
        messages: [{ role: 'user', content: buildExtractionPrompt(allSnippets, town.name, town.district, mode) }],
      }),
    })

    if (!response.ok) {
      const raw = await response.json()
      return NextResponse.json({ error: `Claude error: ${raw?.error?.message ?? JSON.stringify(raw)}` }, { status: response.status })
    }

    const data = await response.json()
    const text = data.content.map((b: any) => b.type === 'text' ? b.text : '').join('\n')
    const clean = text.replace(/```json|```/g, '').trim()
    const s = clean.indexOf('['), e = clean.lastIndexOf(']')
    if (s === -1) {
      return NextResponse.json({
        error: mode === 'name_lookup'
          ? `Could not extract details for "${query}". Try the full venue name.`
          : 'No venues extracted. Try a more specific search query.'
      }, { status: 500 })
    }

    let venues: any[]
    try {
      venues = JSON.parse(clean.slice(s, e + 1))
    } catch {
      return NextResponse.json({ error: 'Agent returned malformed data. Try again.' }, { status: 500 })
    }

    // ── Deduplicate within this scan ───────────────────────────────────────────
    venues = dedupeVenues(venues)

    // ── Flag venues already in the database ────────────────────────────────────
    const existing: string[] = Array.isArray(existingSlugs) ? existingSlugs : []
    const existingNorm = new Set(existing.map((sl: string) => normaliseName(sl.replace(/-/g, ''))))
    venues = venues.map(v => ({
      ...v,
      already_listed: existingNorm.has(normaliseName(v.name)),
    }))

    // ── Fetch images only for high/medium confidence + not already listed ──────
    const venuesWithImages = await Promise.all(
      venues.map(async (v: any) => {
        const shouldFetchImages = !v.already_listed && (v.confidence === 'high' || v.confidence === 'medium')
        return {
          ...v,
          candidate_images: shouldFetchImages ? await serperImages(v.name, town.name, serperKey) : [],
        }
      })
    )

    // Sort: new high-confidence first, already-listed last
    venuesWithImages.sort((a, b) => {
      if (a.already_listed !== b.already_listed) return a.already_listed ? 1 : -1
      const rank = { high: 3, medium: 2, low: 1 } as Record<string, number>
      return (rank[b.confidence] ?? 0) - (rank[a.confidence] ?? 0)
    })

    return NextResponse.json({
      venues: venuesWithImages,
      townId: townId ?? null,
      mode,
      townName: town.name,
      searchCount: searchQueries.length,
      newCount: venuesWithImages.filter(v => !v.already_listed).length,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
