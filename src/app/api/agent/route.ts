import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { query, townId } = await req.json()
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    const SYSTEM_PROMPT = `You are a venue discovery agent for Theeram Spaces, a curated event venue directory for Kerala, India.

Search the web exhaustively for event venues in the specified area. Look for all types: private villas (with/without pool), heritage nalukettu homes, rubber estate bungalows, riverside properties, convention centres, AC/non-AC banquet halls, marriage halls, party halls, open lawns, resorts, homestays, and club houses. Search Google Maps, Justdial, Quickerala, Facebook, and local Kerala directories.

Include every venue you find — even if details are incomplete. The curator will verify. Only exclude: schools, hospitals, government buildings not available for private hire.

Return ONLY a raw JSON array. No markdown, no explanation.

Each object:
{
  "name": string,
  "type": "villa_with_pool|villa_without_pool|heritage_home|open_event_space|auditorium|river_frontage|lodging|resort",
  "tagline": "one sentence — what makes it special",
  "description": "3-5 sentences, warm local tone, specific features and setting",
  "phone": "country code e.g. 919447000000 or empty string",
  "whatsapp": "same format or empty string",
  "price_guide": "e.g. Contact owner or Rs.15,000/day",
  "location": "specific area within town",
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
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 6000,
        system: SYSTEM_PROMPT,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Find all event venues for: "${query}". Search multiple sources and venue types. Return only the JSON array.`
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json({ error: err.error?.message ?? `API ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    const text = data.content.map((b: any) => b.type === 'text' ? b.text : '').join('\n')
    const clean = text.replace(/```json|```/g, '').trim()
    const s = clean.indexOf('['), e = clean.lastIndexOf(']')
    if (s === -1) return NextResponse.json({ error: 'No venue list returned. Try again.' }, { status: 500 })
    const venues = JSON.parse(clean.slice(s, e + 1))
    return NextResponse.json({ venues, townId: townId ?? null })

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
