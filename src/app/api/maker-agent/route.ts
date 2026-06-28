import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

// ── Category context — drives search queries and extraction schema ───────────
const CATEGORY_CONTEXT: Record<string, { malayalam: string; searchTerms: string[]; label: string }> = {
  photography_video: {
    malayalam: 'ഫോട്ടോഗ്രാഫി',
    label: 'Photography & Video',
    searchTerms: ['wedding photographer', 'candid photography', 'wedding videographer cinematic'],
  },
  catering: {
    malayalam: 'കാറ്ററിംഗ്',
    label: 'Catering',
    searchTerms: ['wedding caterers', 'sadhya catering', 'event catering service'],
  },
  decoration_florals: {
    malayalam: 'അലങ്കാരം',
    label: 'Decoration & Florals',
    searchTerms: ['wedding decoration', 'mandapam decorators', 'event florist'],
  },
  event_management: {
    malayalam: 'ഇവന്റ് മാനേജ്മെന്റ്',
    label: 'Event Management',
    searchTerms: ['wedding planner', 'event management company', 'wedding coordination'],
  },
  beauty_styling: {
    malayalam: 'ബ്യൂട്ടി',
    label: 'Beauty & Styling',
    searchTerms: ['bridal makeup artist', 'bridal styling', 'makeup artist home service'],
  },
}

async function serperSearch(q: string, apiKey: string): Promise<string> {
  try {
    const r = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ q, gl: 'in', hl: 'en', num: 10 }),
    })
    const data = await r.json()
    const items = [...(data.organic ?? []), ...(data.places ?? []), ...(data.localResults ?? [])]
    if (!items.length) return ''
    return items.map((item: any) =>
      [
        `NAME: ${item.title ?? item.name ?? ''}`,
        item.phoneNumber ? `PHONE: ${item.phoneNumber}` : '',
        item.address ? `ADDRESS: ${item.address}` : '',
        item.snippet ? `INFO: ${item.snippet}` : '',
        item.rating ? `RATING: ${item.rating}` : '',
        item.link ? `URL: ${item.link}` : '',
      ].filter(Boolean).join('\n')
    ).join('\n---\n')
  } catch { return '' }
}

async function serperImages(name: string, location: string, apiKey: string): Promise<string[]> {
  try {
    const r = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ q: `"${name}" ${location} Kerala`, gl: 'in', num: 6 }),
    })
    const data = await r.json()
    return (data.images ?? [])
      .map((img: any) => img.imageUrl)
      .filter((url: string) => url?.startsWith('http'))
      .slice(0, 4)
  } catch { return [] }
}

function normaliseName(name: string): string {
  return name.toLowerCase().replace(/\b(by|the|at|in|near|llp|pvt|ltd|private|limited|studio)\b/g, '').replace(/[^a-z0-9]/g, '').trim()
}

function dedupeMakers(makers: any[]): any[] {
  const seen = new Map<string, any>()
  for (const m of makers) {
    if (!m?.name) continue
    const key = normaliseName(m.name)
    if (!key) continue
    const existing = seen.get(key)
    if (!existing) { seen.set(key, m); continue }
    const merged = { ...existing }
    for (const field of Object.keys(m)) {
      const cur = existing[field], incoming = m[field]
      if ((cur === '' || cur === 0 || cur === false || cur == null) && (incoming !== '' && incoming !== 0 && incoming !== false && incoming != null)) {
        merged[field] = incoming
      }
    }
    const rank = { high: 3, medium: 2, low: 1 } as Record<string, number>
    if ((rank[m.confidence] ?? 0) > (rank[existing.confidence] ?? 0)) merged.confidence = m.confidence
    seen.set(key, merged)
  }
  return Array.from(seen.values())
}

function buildExtractionPrompt(snippets: string, category: string, location: string): string {
  const ctx = CATEGORY_CONTEXT[category]
  return `Extract all unique ${ctx.label} service providers from these search results. Location context: ${location}, Kerala (this is a search anchor, not a hard restriction — providers serving a wider area are still valid).

Search results:
${snippets}

Return ONLY a raw JSON array. No markdown, no explanation.

Each object must have exactly these fields:
{
  "name": string,
  "tagline": "one warm sentence about what makes them notable",
  "description": "2-3 sentences, warm tone, mention specific specialties if known",
  "phone": "country code format e.g. 919447000000 — empty string if not found, NEVER invent",
  "whatsapp": "same format — empty string if not found",
  "instagram_url": "full Instagram URL or empty string",
  "facebook_url": "full Facebook URL or empty string",
  "price_guide": "specific range if found, else 'Contact for pricing'",
  "years_experience": 0,
  "team_size": 0,
  "min_guests": 0,
  "max_guests": 0,
  "offers_trial": false,
  "home_service": false,
  "category_details": { ${categoryDetailsSchema(category)} },
  "confidence": "high|medium|low",
  "source": "website name or URL where found"
}

Rules:
- confidence=high only if a phone number AND name match was found
- confidence=medium if name and some details found but no phone
- confidence=low if name only
- NEVER invent phone numbers or details — use empty string/0/false when unknown
- min_guests/max_guests only relevant for catering and event_management — leave 0 for other categories
- offers_trial and home_service mainly relevant for beauty_styling — leave false for other categories unless explicitly mentioned
- Merge providers appearing in multiple results into ONE entry with the most complete details
- Exclude: venues, halls (those are properties, not makers), unrelated businesses`
}

function categoryDetailsSchema(category: string): string {
  switch (category) {
    case 'photography_video':
      return `"style": "candid|traditional|cinematic|mixed", "offers_video": false, "has_drone": false, "turnaround_days": 0`
    case 'catering':
      return `"cuisine_type": "Kerala sadhya|North Indian|multi-cuisine|other", "veg_nonveg": "veg|nonveg|both", "live_counters": false, "brings_staff": false`
    case 'decoration_florals':
      return `"style": "traditional|contemporary|theme-based", "does_mandapam": false, "flower_type": "fresh|artificial|both", "includes_lighting": false`
    case 'event_management':
      return `"scope": "full_planning|day_of_coordination", "has_vendor_network": false, "events_handled": 0`
    case 'beauty_styling':
      return `"bridal_specialist": false, "products_used": ""`
    default:
      return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query, category, districtIds, mode: requestedMode, existingSlugs } = await req.json()
    if (!query?.trim()) return NextResponse.json({ error: 'Query required' }, { status: 400 })
    if (!category || !CATEGORY_CONTEXT[category]) return NextResponse.json({ error: 'Valid category required' }, { status: 400 })

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const serperKey = process.env.SERPER_API_KEY
    if (!anthropicKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set.' }, { status: 500 })
    if (!serperKey) return NextResponse.json({ error: 'SERPER_API_KEY not set.' }, { status: 500 })

    const ctx = CATEGORY_CONTEXT[category]
    const mode: 'discovery' | 'name_lookup' = requestedMode === 'name_lookup' ? 'name_lookup' : 'discovery'
    const location = query.match(/\b(in|near|at)\s+([A-Za-z\s]+)/i)?.[2]?.trim() || 'Kerala'

    const searchQueries = mode === 'name_lookup'
      ? [`"${query.trim()}" ${ctx.label} Kerala`, `"${query.trim()}" ${ctx.label} Kerala contact`]
      : [
          `${ctx.searchTerms[0]} ${query}`,
          `${ctx.searchTerms[1] ?? ctx.searchTerms[0]} ${query} site:justdial.com OR site:weddingwire.in OR site:wedmegood.com`,
          `${ctx.malayalam} ${query} Kerala`,
        ]

    const searchResults = await Promise.all(searchQueries.map(q => serperSearch(q, serperKey)))
    const allSnippets = searchResults.filter(s => s.trim()).join('\n\n===\n\n')

    if (!allSnippets.trim()) {
      return NextResponse.json({ error: mode === 'name_lookup' ? `No results for "${query}".` : `No results found. Try a different search.` }, { status: 404 })
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: mode === 'discovery' ? 6000 : 2000,
        messages: [{ role: 'user', content: buildExtractionPrompt(allSnippets, category, location) }],
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
    if (s === -1) return NextResponse.json({ error: 'No makers extracted. Try a more specific query.' }, { status: 500 })

    let makers: any[]
    try { makers = JSON.parse(clean.slice(s, e + 1)) } catch { return NextResponse.json({ error: 'Malformed data returned. Try again.' }, { status: 500 }) }

    makers = dedupeMakers(makers)

    const existing: string[] = Array.isArray(existingSlugs) ? existingSlugs : []
    const existingNorm = new Set(existing.map((sl: string) => normaliseName(sl.replace(/-/g, ''))))
    makers = makers.map(m => ({ ...m, already_listed: existingNorm.has(normaliseName(m.name)) }))

    const makersWithImages = await Promise.all(
      makers.map(async (m: any) => {
        const shouldFetch = !m.already_listed && (m.confidence === 'high' || m.confidence === 'medium')
        return { ...m, candidate_images: shouldFetch ? await serperImages(m.name, location, serperKey) : [] }
      })
    )

    makersWithImages.sort((a, b) => {
      if (a.already_listed !== b.already_listed) return a.already_listed ? 1 : -1
      const rank = { high: 3, medium: 2, low: 1 } as Record<string, number>
      return (rank[b.confidence] ?? 0) - (rank[a.confidence] ?? 0)
    })

    return NextResponse.json({
      makers: makersWithImages,
      category,
      categoryLabel: ctx.label,
      districtIds: districtIds ?? [],
      mode,
      newCount: makersWithImages.filter(m => !m.already_listed).length,
    })

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
