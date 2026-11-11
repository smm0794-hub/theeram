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

// ── Serper organic search ─────────────────────────────────────────────────────
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

// ── Serper Google Maps Places search (richer phone, address & Maps URL data) ─
async function serperPlaces(q: string, apiKey: string): Promise<string> {
  try {
    const r = await fetch('https://google.serper.dev/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ q, gl: 'in', hl: 'en' }),
    })
    const data = await r.json()
    const places = data.places ?? []
    if (!places.length) return ''
    return places.map((p: any) =>
      [
        `PLACE NAME: ${p.title ?? ''}`,
        p.category    ? `CATEGORY: ${p.category}` : '',
        p.phoneNumber ? `PHONE: ${p.phoneNumber}` : '',
        p.address     ? `ADDRESS: ${p.address}`   : '',
        p.rating      ? `RATING: ${p.rating} (${p.ratingCount ?? 0} reviews)` : '',
        p.website     ? `WEBSITE: ${p.website}`   : '',
        p.cid         ? `MAPS_URL: https://www.google.com/maps?cid=${p.cid}` : '',
      ].filter(Boolean).join('\n')
    ).join('\n---\n')
  } catch { return '' }
}

// ── Serper images ─────────────────────────────────────────────────────────────
async function serperImages(name: string, town: string, apiKey: string): Promise<string[]> {
  if (!apiKey) return []
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

// ── Discovery searches — 5 varied queries (existing Claude pipeline) ──────────
function buildDiscoverySearches(townName: string, district: string, malayalam: string, alt: string): string[] {
  return [
    `"${townName}" party hall marriage hall Kerala`,
    `"${townName}" villa homestay event space ${district}`,
    `"${alt}" heritage home tharavadu nalukettu Kerala events`,
    `"${townName}" event venue site:justdial.com OR site:sulekha.com OR site:quickerala.com`,
    `${malayalam} കല്യാണ മണ്ഡപം ഓഡിറ്റോറിയം`,  // Malayalam: wedding hall / auditorium
  ]
}

// ── Enhanced discovery searches for Gemini (incorporates user query + places) ─
function buildGeminiDiscoverySearches(query: string, townName: string, district: string, malayalam: string, alt: string): { web: string[]; places: string[] } {
  const cleanQuery = query.trim()
  return {
    web: [
      cleanQuery,
      `"${townName}" villa resort heritage home event venue ${district} Kerala`,
      `"${townName}" party hall auditorium convention centre marriage hall Kerala contact`,
      `"${alt}" event venue OR homestay OR villa site:justdial.com OR site:instagram.com OR site:weddingwire.in`,
      malayalam ? `${malayalam} കല്യാണ മണ്ഡപം ഓഡിറ്റോറിയം റിസോർട്ട്` : `"${townName}" tharavadu nalukettu resort Kerala`,
    ],
    places: [
      cleanQuery,
      `event venues party halls auditoriums in ${townName} ${district} Kerala`,
      `villas resorts heritage homes homestays in ${townName} ${district} Kerala`,
    ],
  }
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
  return (name ?? '')
    .toLowerCase()
    .replace(/\b(by|the|at|in|near|homes?|llp|pvt|ltd|private|limited)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

// ── Deduplicate venues by normalised name (within a single provider) ──────────
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

// ── Sanitise a parsed venue object so all fields have safe types ──────────────
function sanitiseVenue(v: any, provider: 'gemini' | 'claude'): any {
  const validTypes = new Set([
    'villa_with_pool', 'villa_without_pool', 'heritage_home',
    'open_event_space', 'auditorium', 'river_frontage', 'lodging', 'resort',
  ])
  const validConfidence = new Set(['high', 'medium', 'low'])
  const rawPhone = String(v?.phone ?? '').replace(/[^\d+]/g, '').replace(/^\+/, '')
  const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone
  const rawWa = String(v?.whatsapp ?? '').replace(/[^\d+]/g, '').replace(/^\+/, '')
  const whatsapp = rawWa.length === 10 ? `91${rawWa}` : (rawWa || phone)

  return {
    name: String(v?.name ?? '').trim(),
    type: validTypes.has(v?.type) ? v.type : 'open_event_space',
    tagline: String(v?.tagline ?? '').trim(),
    description: String(v?.description ?? '').trim(),
    phone,
    whatsapp,
    price_guide: String(v?.price_guide || 'Ask owner for price').trim(),
    location: String(v?.location ?? '').trim(),
    instagram: String(v?.instagram ?? '').trim(),
    maps_url: String(v?.maps_url ?? '').trim(),
    room_count: Number(v?.room_count) || 0,
    bathroom_count: Number(v?.bathroom_count) || 0,
    max_overnight: Number(v?.max_overnight) || 0,
    max_day: Number(v?.max_day) || 0,
    has_pool: !!v?.has_pool,
    has_ac_hall: !!v?.has_ac_hall,
    has_open_lawn: !!v?.has_open_lawn,
    has_kitchen: !!v?.has_kitchen,
    has_parking: !!v?.has_parking,
    has_generator: !!v?.has_generator,
    alcohol_allowed: !!v?.alcohol_allowed,
    outside_catering: !!v?.outside_catering,
    ac_hall_capacity: Number(v?.ac_hall_capacity) || 0,
    parking_count: Number(v?.parking_count) || 0,
    event_types: Array.isArray(v?.event_types) && v.event_types.length
      ? v.event_types.map((e: any) => String(e))
      : ['family_gathering'],
    confidence: validConfidence.has(v?.confidence)
      ? v.confidence
      : (phone ? 'high' : 'medium'),
    source: String(v?.source ?? (provider === 'gemini' ? 'Google Search (Gemini)' : 'Serper')).trim(),
    provider,
  }
}

// ── Haiku extraction prompt (existing) ────────────────────────────────────────
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
  "price_guide": "Ask owner for price — or Rs.X/day if explicitly found",
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

// ── Gemini extraction prompt (uses Google Search grounding + Places context) ──
function buildGeminiPrompt(query: string, snippets: string, town: TownContext, mode: 'discovery' | 'name_lookup'): string {
  const taskDesc = mode === 'name_lookup'
    ? `You are scouting a specific event space or venue in Kerala for "Theeram Spaces": "${query.trim()}" (near ${town.name}, ${town.district} district, Kerala).
Use Google Search to find comprehensive, verified details about this specific venue (phone/WhatsApp number, exact area/locality, property type, rooms, event capacity, pool/lawn/AC hall facilities, Instagram link, Google Maps URL, and pricing if public). Return a single-item JSON array.`
    : `You are an expert local venue scout for "Theeram Spaces", a curated directory of event spaces, villas, heritage homes (tharavadus/nalukettus), resorts, party lawns, and auditoriums/convention centres in Kerala.
User search query: "${query.trim()}"
Target location: ${town.name} (${town.alt}${town.malayalam ? ` / ${town.malayalam}` : ''}), ${town.district} district, Kerala.

Use Google Search (and the reference search/places data below) to find all real, unique event venues, villas, heritage homes, resorts, homestays suitable for gatherings, and party halls/auditoriums matching "${query.trim()}" in and around ${town.name}, ${town.district} district, Kerala.`

  return `${taskDesc}

${snippets ? `Reference search & Google Maps Places data:\n${snippets}\n` : ''}
Return ONLY a raw JSON array (start with [ and end with ]). Do NOT wrap in markdown code fences or add commentary.

Each object in the JSON array must have these exact fields:
{
  "name": "Official name of the venue/property",
  "type": "villa_with_pool|villa_without_pool|heritage_home|open_event_space|auditorium|river_frontage|lodging|resort",
  "tagline": "One warm, editorial sentence capturing what makes this space special for a gathering or stay",
  "description": "2-3 warm, specific sentences mentioning its setting in ${town.name}, architecture or vibe, and known amenities/capacities",
  "phone": "Digits only with 91 prefix e.g. 919447000000 — empty string if not found, NEVER fabricate",
  "whatsapp": "Digits only with 91 prefix — copy phone if it is a mobile number, else empty string",
  "price_guide": "Specific rate e.g. '₹15,000/day' if publicly stated, otherwise 'Ask owner for price'",
  "location": "Specific road, junction, village, or locality in/near ${town.name}",
  "instagram": "Full Instagram URL if found, else empty string",
  "maps_url": "Google Maps URL if found, else empty string",
  "room_count": 0,
  "bathroom_count": 0,
  "max_overnight": 0,
  "max_day": 0,
  "has_pool": false,
  "has_ac_hall": false,
  "has_open_lawn": false,
  "has_kitchen": false,
  "has_parking": false,
  "has_generator": false,
  "alcohol_allowed": false,
  "outside_catering": false,
  "ac_hall_capacity": 0,
  "parking_count": 0,
  "event_types": ["family_gathering", "wedding", "corporate", "birthday", "staycation", "retreat"],
  "confidence": "high|medium|low",
  "source": "Website or directory where verified (e.g. Google Maps, Justdial, Instagram, official site)"
}

Strict rules:
1. NEVER invent or guess phone numbers, room counts, or URLs. Only include verified numbers; format Indian 10-digit numbers with leading 91 (e.g. 919847000000).
2. confidence="high" ONLY when a real phone number is found; confidence="medium" when name + specific locality/address + details are verified without phone; confidence="low" if minimal details.
3. Choose appropriate "event_types" from: "staycation", "family_gathering", "wedding", "corporate", "birthday", "retreat".
4. Choose "type" accurately:
   - "villa_with_pool" if it is a villa/private stay with a swimming pool
   - "villa_without_pool" for private villas/bungalows without a pool
   - "heritage_home" for tharavadu, nalukettu, mana, kovilakam, or heritage homesteads
   - "river_frontage" for waterfront/riverside/backwater properties
   - "open_event_space" for outdoor event lawns, garden venues, or boutique party spaces
   - "auditorium" for convention centres, kalyana mandapams, parish halls, AC auditoriums
   - "resort" for resorts with event/gathering spaces
   - "lodging" for homestays/lodges suited for group stays
5. Only include venues in or immediately serving ${town.name}, ${town.district} district, Kerala. Exclude pure restaurants, shops, hospitals, or offices.`
}

// ── Parse JSON array from model text response ─────────────────────────────────
function parseVenueArray(text: string): any[] | null {
  const clean = (text ?? '').replace(/```json|```/gi, '').trim()
  const s = clean.indexOf('[')
  const e = clean.lastIndexOf(']')
  if (s === -1 || e === -1 || e <= s) return null
  try {
    const parsed = JSON.parse(clean.slice(s, e + 1))
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

// ── Pipeline 1: Free Gemini API (with Google Search grounding + Serper Places) ─
async function runGeminiPipeline(
  query: string,
  town: TownContext,
  mode: 'discovery' | 'name_lookup',
  geminiKey: string,
  serperKey?: string,
): Promise<any[]> {
  let snippets = ''
  if (serperKey) {
    if (mode === 'name_lookup') {
      const nameQueries = buildNameSearches(query.trim(), town.name, town.district)
      const [webRes, placesRes] = await Promise.all([
        Promise.all(nameQueries.map(q => serperSearch(q, serperKey))),
        serperPlaces(`${query.trim()} ${town.name} Kerala`, serperKey),
      ])
      snippets = [...webRes, placesRes].filter(s => s.trim()).join('\n\n===\n\n')
    } else {
      const { web, places } = buildGeminiDiscoverySearches(query, town.name, town.district, town.malayalam, town.alt)
      const [webRes, placesRes] = await Promise.all([
        Promise.all(web.map(q => serperSearch(q, serperKey))),
        Promise.all(places.map(q => serperPlaces(q, serperKey))),
      ])
      snippets = [...webRes, ...placesRes].filter(s => s.trim()).join('\n\n===\n\n')
    }
  }

  const prompt = buildGeminiPrompt(query, snippets, town, mode)

  // Try gemini-2.5-flash with Google Search grounding first, fallback to gemini-2.0-flash or ungrounded JSON mode
  const attempts: { model: string; useSearchGrounding: boolean }[] = [
    { model: 'gemini-2.5-flash', useSearchGrounding: true },
    { model: 'gemini-2.5-flash', useSearchGrounding: false },
    { model: 'gemini-2.0-flash', useSearchGrounding: true },
    { model: 'gemini-2.0-flash', useSearchGrounding: false },
  ]

  let lastError = 'Gemini extraction failed'
  for (const attempt of attempts) {
    // If we don't have Serper snippets, we must use Google Search grounding
    if (!attempt.useSearchGrounding && !snippets.trim()) continue

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${attempt.model}:generateContent?key=${geminiKey}`
    const body: any = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        ...(attempt.useSearchGrounding ? {} : { responseMimeType: 'application/json' }),
      },
    }
    if (attempt.useSearchGrounding) {
      body.tools = [{ google_search: {} }]
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}))
      lastError = errBody?.error?.message ?? `Gemini HTTP ${res.status}`
      continue
    }

    const data = await res.json()
    const parts = data?.candidates?.[0]?.content?.parts ?? []
    const text = parts.map((p: any) => p.text ?? '').join('\n')
    const parsed = parseVenueArray(text)
    if (parsed && parsed.length > 0) {
      const sanitised = parsed
        .map(v => sanitiseVenue(v, 'gemini'))
        .filter(v => v.name)
      return dedupeVenues(sanitised)
    }
  }

  throw new Error(lastError)
}

// ── Pipeline 2: Existing Serper + Claude Haiku pipeline ──────────────────────
async function runClaudePipeline(
  query: string,
  town: TownContext,
  mode: 'discovery' | 'name_lookup',
  anthropicKey: string,
  serperKey: string,
): Promise<any[]> {
  const searchQueries = mode === 'name_lookup'
    ? buildNameSearches(query.trim(), town.name, town.district)
    : buildDiscoverySearches(town.name, town.district, town.malayalam, town.alt)

  const searchResults = await Promise.all(searchQueries.map(q => serperSearch(q, serperKey)))
  const allSnippets = searchResults.filter(s => s.trim()).join('\n\n===\n\n')

  if (!allSnippets.trim()) {
    throw new Error(
      mode === 'name_lookup'
        ? `No Serper results found for "${query}".`
        : `No Serper results found for ${town.name}.`
    )
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
    const raw = await response.json().catch(() => ({}))
    throw new Error(`Claude error: ${raw?.error?.message ?? `HTTP ${response.status}`}`)
  }

  const data = await response.json()
  const text = (data.content ?? []).map((b: any) => b.type === 'text' ? b.text : '').join('\n')
  const parsed = parseVenueArray(text)
  if (!parsed) {
    throw new Error('Claude returned no valid venue JSON.')
  }

  const sanitised = parsed
    .map(v => sanitiseVenue(v, 'claude'))
    .filter(v => v.name)
  return dedupeVenues(sanitised)
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const {
      query,
      townId,
      townSlug,
      mode: requestedMode,
      provider: requestedProvider,
      existingSlugs,
    } = await req.json()

    if (!query?.trim()) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    const provider: 'gemini' | 'claude' | 'both' =
      requestedProvider === 'gemini' || requestedProvider === 'claude' || requestedProvider === 'both'
        ? requestedProvider
        : 'both'

    const geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const serperKey = process.env.SERPER_API_KEY

    if (provider === 'gemini' && !geminiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not set. Get a free API key from Google AI Studio (aistudio.google.com/apikey) and add GEMINI_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }
    if (provider === 'claude') {
      if (!anthropicKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set in environment.' }, { status: 500 })
      if (!serperKey) return NextResponse.json({ error: 'SERPER_API_KEY not set in environment.' }, { status: 500 })
    }
    if (provider === 'both' && !geminiKey && (!anthropicKey || !serperKey)) {
      return NextResponse.json(
        { error: 'Neither GEMINI_API_KEY nor (ANTHROPIC_API_KEY + SERPER_API_KEY) is configured.' },
        { status: 500 }
      )
    }

    const town = await getTownContext(query, townSlug)
    const mode: 'discovery' | 'name_lookup' = requestedMode === 'name_lookup' ? 'name_lookup' : 'discovery'

    const warnings: string[] = []
    let geminiVenues: any[] = []
    let claudeVenues: any[] = []

    const tasks: Promise<void>[] = []

    if (provider === 'gemini' || provider === 'both') {
      if (!geminiKey) {
        warnings.push('GEMINI_API_KEY is not set — skipped Gemini scan. Add a free key from aistudio.google.com/apikey.')
      } else {
        tasks.push(
          runGeminiPipeline(query, town, mode, geminiKey, serperKey)
            .then(res => { geminiVenues = res })
            .catch(err => {
              if (provider === 'gemini') throw err
              warnings.push(`Gemini: ${err.message ?? 'failed'}`)
            })
        )
      }
    }

    if (provider === 'claude' || provider === 'both') {
      if (!anthropicKey || !serperKey) {
        warnings.push('ANTHROPIC_API_KEY or SERPER_API_KEY is not set — skipped Claude scan.')
      } else {
        tasks.push(
          runClaudePipeline(query, town, mode, anthropicKey, serperKey)
            .then(res => { claudeVenues = res })
            .catch(err => {
              if (provider === 'claude') throw err
              warnings.push(`Claude: ${err.message ?? 'failed'}`)
            })
        )
      }
    }

    await Promise.all(tasks)

    const geminiKeys = new Set(geminiVenues.map(v => normaliseName(v.name)).filter(Boolean))
    const claudeKeys = new Set(claudeVenues.map(v => normaliseName(v.name)).filter(Boolean))

    // Combine while keeping both providers' records separate so the curator can compare and choose
    let combined: any[] = []
    if (provider === 'both') {
      const matchedKeys = new Set<string>()
      for (const k of Array.from(geminiKeys)) {
        if (claudeKeys.has(k)) matchedKeys.add(k)
      }

      // Pair up venues found by both providers right next to each other (Gemini first, then Claude)
      const claudeByKey = new Map<string, any>()
      for (const cv of claudeVenues) {
        claudeByKey.set(normaliseName(cv.name), cv)
      }

      for (const gv of geminiVenues) {
        const key = normaliseName(gv.name)
        const isMatched = matchedKeys.has(key)
        combined.push({ ...gv, match_key: key, matched_in_both: isMatched })
        if (isMatched && claudeByKey.has(key)) {
          combined.push({ ...claudeByKey.get(key), match_key: key, matched_in_both: true })
        }
      }
      for (const cv of claudeVenues) {
        const key = normaliseName(cv.name)
        if (!matchedKeys.has(key)) {
          combined.push({ ...cv, match_key: key, matched_in_both: false })
        }
      }
    } else {
      const singleList = provider === 'gemini' ? geminiVenues : claudeVenues
      combined = singleList.map(v => ({
        ...v,
        match_key: normaliseName(v.name),
        matched_in_both: false,
      }))
    }

    if (!combined.length) {
      return NextResponse.json({
        error: warnings.length
          ? warnings.join(' · ')
          : mode === 'name_lookup'
            ? `No results found for "${query}". Try the full venue name.`
            : `No venues found for ${town.name}. Try a more specific search.`,
      }, { status: 404 })
    }

    // ── Flag venues already in the database ────────────────────────────────────
    const existing: string[] = Array.isArray(existingSlugs) ? existingSlugs : []
    const existingNorm = new Set(existing.map((sl: string) => normaliseName(sl.replace(/-/g, ''))))
    combined = combined.map(v => ({
      ...v,
      already_listed: existingNorm.has(v.match_key),
    }))

    // ── Fetch candidate images (cached by match_key so matched pairs share 1 call)
    const imageCache = new Map<string, Promise<string[]>>()
    const venuesWithImages = await Promise.all(
      combined.map(async (v: any) => {
        const shouldFetchImages =
          !!serperKey && !v.already_listed && (v.confidence === 'high' || v.confidence === 'medium')
        if (!shouldFetchImages) {
          return { ...v, candidate_images: [] }
        }
        const key = v.match_key || v.name
        if (!imageCache.has(key)) {
          imageCache.set(key, serperImages(v.name, town.name, serperKey))
        }
        const imgs = await imageCache.get(key)!
        return { ...v, candidate_images: imgs }
      })
    )

    // Sort: new venues first (matched pairs stay adjacent), then by confidence, already-listed last
    const rank = { high: 3, medium: 2, low: 1 } as Record<string, number>
    venuesWithImages.sort((a, b) => {
      if (a.already_listed !== b.already_listed) return a.already_listed ? 1 : -1
      if (a.matched_in_both !== b.matched_in_both) return a.matched_in_both ? -1 : 1
      if (a.matched_in_both && b.matched_in_both && a.match_key === b.match_key) {
        return a.provider === 'gemini' ? -1 : 1
      }
      return (rank[b.confidence] ?? 0) - (rank[a.confidence] ?? 0)
    })

    const matchedCount = new Set(
      venuesWithImages.filter(v => v.matched_in_both && !v.already_listed).map(v => v.match_key)
    ).size

    return NextResponse.json({
      venues: venuesWithImages,
      townId: townId ?? null,
      mode,
      provider,
      townName: town.name,
      geminiCount: venuesWithImages.filter(v => v.provider === 'gemini' && !v.already_listed).length,
      claudeCount: venuesWithImages.filter(v => v.provider === 'claude' && !v.already_listed).length,
      matchedCount,
      newCount: venuesWithImages.filter(v => !v.already_listed).length,
      warnings,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

