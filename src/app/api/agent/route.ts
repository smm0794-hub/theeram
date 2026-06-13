import { NextRequest, NextResponse } from 'next/server'

const TOWN_CONTEXT: Record<string, { district: string; malayalam: string; nearby: string }> = {
  pala: { district: 'Kottayam', malayalam: 'പാല', nearby: 'Meenachil taluk' },
  thodupuzha: { district: 'Idukki', malayalam: 'തൊടുപുഴ', nearby: 'Idukki district' },
  kanjirappally: { district: 'Kottayam', malayalam: 'കാഞ്ഞിരപ്പള്ളി', nearby: 'Kottayam district' },
  theekoy: { district: 'Kottayam', malayalam: 'തീക്കോയ്', nearby: 'near Pala' },
  erattupetta: { district: 'Kottayam', malayalam: 'ഏറ്റുമാനൂർ', nearby: 'Meenachil taluk' },
  changanassery: { district: 'Kottayam', malayalam: 'ചങ്ങനാശ്ശേരി', nearby: 'Kottayam district' },
  ettumanoor: { district: 'Kottayam', malayalam: 'ഏറ്റുമാനൂർ', nearby: 'Kottayam district' },
}

function getTownFromQuery(query: string, slug?: string) {
  if (slug && TOWN_CONTEXT[slug]) return { name: slug, ...TOWN_CONTEXT[slug] }
  for (const [town, ctx] of Object.entries(TOWN_CONTEXT)) {
    if (query.toLowerCase().includes(town)) return { name: town, ...ctx }
  }
  return null
}

async function serperSearch(q: string, apiKey: string) {
  const r = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
    body: JSON.stringify({ q, gl: 'in', hl: 'en', num: 10 }),
  })
  const data = await r.json()
  return [...(data.organic ?? []), ...(data.places ?? [])]
    .map((item: any) =>
      `NAME: ${item.title ?? item.name ?? ''}
PHONE: ${item.phoneNumber ?? ''}
ADDRESS: ${item.address ?? ''}
SNIPPET: ${item.snippet ?? ''}
URL: ${item.link ?? ''}`
    ).join('\n---\n')
}

async function serperImages(venueName: string, town: string, district: string, apiKey: string): Promise<string[]> {
  try {
    const r = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ q: `"${venueName}" ${town} ${district} Kerala event`, gl: 'in', num: 5 }),
    })
    const data = await r.json()
    return (data.images ?? [])
      .map((img: any) => img.imageUrl)
      .filter((url: string) => url?.startsWith('http'))
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

    const town = getTownFromQuery(query, townSlug)
    const townName = town?.name ?? townSlug ?? 'Kerala'
    const district = town?.district ?? 'Kerala'
    const malayalam = town?.malayalam ?? ''
    const nearby = town?.nearby ?? 'Kerala'

    // 3 highly targeted searches — town + district enforced in every query
    const searches = await Promise.all([
      serperSearch(`party hall marriage hall auditorium "${townName}" ${district} Kerala`, serperKey),
      serperSearch(`villa homestay event space "${townName}" ${district} Kerala`, serperKey),
      serperSearch(`${malayalam} event venue convention centre ${townName} Kerala site:justdial.com OR site:sulekha.com OR site:quickerala.com`, serperKey),
    ])

    const allSnippets = searches.filter(s => s.trim()).join('\n\n===\n\n')

    if (!allSnippets.trim()) {
      return NextResponse.json({ error: 'No search results. Try a different query.' }, { status: 500 })
    }

    // Use Haiku to extract — cheap and fast
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
          content: `Extract event venues from these search results. 

IMPORTANT: Only include venues physically located in ${townName}, ${district} district, Kerala, India. 
Reject any result from outside Kerala or from other districts.
Reject hotels that are purely accommodation with no event facilities.

Search results:
${allSnippets}

Return ONLY a raw JSON array. No markdown.

Each object:
{
  "name": string,
  "type": "villa_with_pool|villa_without_pool|heritage_home|open_event_space|auditorium|river_frontage|lodging|resort",
  "tagline": "one sentence",
  "description": "2-3 sentences warm local tone",
  "phone": "with country code e.g. 919447000000 or empty string",
  "whatsapp": "same or empty string",
  "price_guide": "Contact owner or Rs.X/day",
  "location": "specific ward or area within ${townName}",
  "instagram": "full URL or empty string",
  "maps_url": "Google Maps URL or empty string",
  "room_count": 0, "bathroom_count": 0, "max_overnight": 0, "max_day": 0,
  "has_pool": false, "has_ac_hall": false, "has_open_lawn": false,
  "has_kitchen": false, "has_parking": false, "has_generator": false,
  "alcohol_allowed": false, "outside_catering": false,
  "ac_hall_capacity": 0, "parking_count": 0,
  "event_types": ["family_gathering","wedding","corporate","birthday"],
  "confidence": "high|medium|low",
  "source": "website or URL"
}`
        }],
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
    if (s === -1) return NextResponse.json({ error: 'No venues extracted. Try a more specific query.' }, { status: 500 })

    const venues = JSON.parse(clean.slice(s, e + 1))

    // Fetch images in parallel for all venues
    const venuesWithImages = await Promise.all(
      venues.map(async (v: any) => ({
        ...v,
        candidate_images: await serperImages(v.name, townName, district, serperKey),
      }))
    )

    return NextResponse.json({ venues: venuesWithImages, townId: townId ?? null })

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
