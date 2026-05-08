import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { query, townId } = await req.json()
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    const SYSTEM_PROMPT = `You are a venue discovery agent for Theeram Spaces — a curated event venue directory for Pala, Kerala.

Search the web and find event spaces, party halls, villas, homestays, convention centres, and heritage homes in and around Pala, Kottayam district, Kerala. Also cover: Ettumanoor, Erattupetta, Kanjirappally, Changanassery, Bharananganam, Ramapuram.

Return ONLY a valid JSON array. No preamble, no markdown fences. Raw JSON only.

Each object must have exactly these fields:
{
  "name": string,
  "type": "villa_with_pool|villa_without_pool|heritage_home|open_event_space|auditorium|river_frontage|lodging|resort",
  "tagline": "one warm compelling sentence",
  "description": "3-5 sentences, warm editorial tone as if written by a local who visited",
  "phone": "with country code e.g. 919447000000",
  "whatsapp": "same format, empty string if unknown",
  "price_guide": "e.g. Contact owner for pricing",
  "location": "area, Pala or nearby town",
  "instagram": "full URL or empty string",
  "maps_url": "Google Maps URL or empty string",
  "room_count": 0, "bathroom_count": 0, "max_overnight": 0, "max_day": 0,
  "has_pool": false, "has_ac_hall": false, "has_open_lawn": false,
  "has_kitchen": false, "has_parking": false, "has_generator": false,
  "alcohol_allowed": false, "outside_catering": false,
  "ac_hall_capacity": 0, "parking_count": 0,
  "event_types": ["staycation","family_gathering","wedding","corporate","birthday","retreat"],
  "confidence": "high|medium|low",
  "source": "URL or source name"
}

confidence: high = official website or multiple reliable sources with full details. medium = Justdial/Quickerala/Facebook with partial details. low = single mention, minimal details.

Only include venues suitable for private events. No government buildings, schools, hospitals.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: SYSTEM_PROMPT,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Find all event venues for: "${query}". Search Google Maps, Justdial, Quickerala, Facebook, booking sites, local directories. Find as many as possible. Return only the JSON array.`
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json({ error: err.error?.message ?? `API error ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    const text = data.content.map((b: any) => b.type === 'text' ? b.text : '').filter(Boolean).join('\n')
    const clean = text.replace(/```json|```/g, '').trim()
    const s = clean.indexOf('['), e = clean.lastIndexOf(']')
    if (s === -1 || e === -1) return NextResponse.json({ error: 'Agent did not return a valid venue list. Try again.' }, { status: 500 })
    const venues = JSON.parse(clean.slice(s, e + 1))
    return NextResponse.json({ venues, townId: townId ?? null })

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
