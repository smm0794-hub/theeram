import { NextRequest, NextResponse } from 'next/server'

const KERALA_TOWNS: Record<string, string> = {
  pala: 'Pala Kottayam Kerala',
  thodupuzha: 'Thodupuzha Idukki Kerala',
  kanjirappally: 'Kanjirappally Kottayam Kerala',
  theekoy: 'Theekoy Kottayam Kerala',
  erattupetta: 'Erattupetta Kottayam Kerala',
  changanassery: 'Changanassery Kottayam Kerala',
  ettumanoor: 'Ettumanoor Kottayam Kerala',
}

// Step 1: Search via Serper — cheap, structured, no token bloat
async function serperSearch(query: string, apiKey: string): Promise<string> {
  const searches = [
    `${query} party hall marriage hall`,
    `${query} villa homestay event space`,
    `${query} convention centre banquet hall`,
  ]

  const results: string[] = []

  for (const q of searches) {
    try {
      const r = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
        body: JSON.stringify({ q, gl: 'in', hl: 'en', num: 8 }),
      })
      const data = await r.json()
      const snippets = [
        ...(data.organic ?? []),
        ...(data.places ?? []),
      ].map((item: any) =>
        `NAME: ${item.title ?? item.name ?? ''}
PHONE: ${item.phoneNumber ?? ''}
ADDRESS: ${item.address ?? item.snippet ?? ''}
URL: ${item.link ?? ''}
RATING: ${item.rating ?? ''}`
      ).join('\n---\n')
      if (snippets) results.push(snippets)
    } catch { /* skip failed search */ }
  }

  return results.join('\n\n===\n\n')
}

// Step 2: Search images for a venue — returns candidate photo URLs
async function serperImages(venueName: string, location: string, apiKey: string): Promise<string[]> {
  try {
    const r = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ q: `${venueName} ${location} event venue`, gl: 'in', num: 5 }),
    })
    const data = await r.json()
    return (data.images ?? [])
      .map((img: any) => img.imageUrl)
      .filter((url: string) => url && url.startsWith('http'))
      .slice(0, 4)
  } catch { return [] }
}

export async function POST(req: NextRequest) {
  try {
    const { query, townId, townSlug } = await req.json()
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const serperKey = process.env.SERPER_API_KEY

    if (!anthropicKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set.' }, { status: 500 })
    if (!serperKey) return NextResponse.json({ error: 'SERPER_API_KEY not set. Sign up free at serper.dev.' }, { status: 500 })

    const locationContext = (townSlug && KERALA_TOWNS[townSlug]) ?? query

    // Step 1: Get raw search snippets via Serper (~3 searches, costs ~$0.001)
    const searchSnippets = await serperSearch(locationContext, serperKey)

    if (!searchSnippets.trim()) {
      return NextResponse.json({ error: 'No search results returned. Try a different query.' }, { status: 500 })
    }

    // Step 2: Use Haiku to extract and format venue details (~3000 tokens, costs ~$0.002)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `Extract event venues from these search results for ${locationContext}.

Search results:
${searchSnippets}

Return ONLY a raw JSON array. No markdown. Each venue object:
{
  "name": string,
  "type": "villa_with_pool|villa_without_pool|heritage_home|open_event_space|auditorium|river_frontage|lodging|resort",
  "tagline": "one sentence what makes it special",
  "description": "2-3 sentences warm local tone",
  "phone": "with country code e.g. 919447000000 or empty string",
  "whatsapp": "same or empty string",
  "price_guide": "Contact owner or Rs.X/day if found",
  "location": "specific area within town",
  "instagram": "full URL or empty string",
  "maps_url": "Google Maps URL or empty string",
  "room_count": 0, "bathroom_count": 0, "max_overnight": 0, "max_day": 0,
  "has_pool": false, "has_ac_hall": false, "has_open_lawn": false,
  "has_kitchen": false, "has_parking": false, "has_generator": false,
  "alcohol_allowed": false, "outside_catering": false,
  "ac_hall_capacity": 0, "parking_count": 0,
  "event_types": ["family_gathering","wedding","corporate","birthday"],
  "confidence": "high|medium|low",
  "source": "website name or URL"
}

Rules:
- Only include actual event venues — no shops, restaurants, or service providers
- confidence=high if phone number found, medium if address found, low if name only
- Infer type from name/description — "hall" = auditorium, "villa" = villa_without_pool, "resort" = resort
- Do not invent phone numbers — use empty string if not found`
        }],
      }),
    })

    if (!response.ok) {
      const raw = await response.json()
      const message = raw?.error?.message ?? JSON.stringify(raw)
      return NextResponse.json({ error: `Claude API error: ${message}` }, { status: response.status })
    }

    const data = await response.json()
    const text = data.content.map((b: any) => b.type === 'text' ? b.text : '').join('\n')
    const clean = text.replace(/```json|```/g, '').trim()
    const s = clean.indexOf('['), e = clean.lastIndexOf(']')
    if (s === -1) return NextResponse.json({ error: 'No venues extracted. Try a more specific query.' }, { status: 500 })

    const venues = JSON.parse(clean.slice(s, e + 1))

    // Step 3: Fetch candidate images for each venue in parallel (~1 Serper image call each)
    const venuesWithImages = await Promise.all(
      venues.map(async (v: any) => {
        const images = await serperImages(v.name, locationContext, serperKey)
        return { ...v, candidate_images: images }
      })
    )

    return NextResponse.json({ venues: venuesWithImages, townId: townId ?? null })

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
