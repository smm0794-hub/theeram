import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { townName, district } = await req.json()
    if (!townName) return NextResponse.json({ error: 'Town name required' }, { status: 400 })

    const system = `You are a local content writer and researcher for Theeram Spaces — a curated event venue directory for Kerala, India.

Given a town name in Kerala, research it thoroughly and generate all content needed for a Theeram town landing page.

Return ONLY a valid JSON object. No preamble, no markdown. Raw JSON only.

The object must have exactly these fields:
{
  "name": "Town name (properly capitalised)",
  "slug": "lowercase-hyphenated",
  "district": "District name",
  "tagline": "One evocative sentence — the soul of this town for celebrations",
  "description": "2-3 sentences about the town for SEO",
  "hero_headline": "HTML string, 8-12 words, wrap 1-2 key words in <em> tags — these render in gold italic. Evocative, poetic, local.",
  "hero_subtext": "2-3 sentence intro for the hero section. Warm, editorial. Mentions the town's character, geography, and what kind of spaces Theeram curates here.",
  "why_here_heading": "Short heading for the Why This Town section e.g. Why Thodupuzha?",
  "why_here_text": "3-4 sentences about why this town is special for celebrations. Mention geography, culture, family traditions, what makes events here memorable. Warm and local in tone.",
  "stat_1_value": "e.g. 45 min",
  "stat_1_label": "e.g. FROM KOTTAYAM (uppercase)",
  "stat_2_value": "e.g. 2 hrs",
  "stat_2_label": "e.g. FROM KOCHI (uppercase)",
  "stat_3_value": "e.g. 150+",
  "stat_3_label": "e.g. YEARS OF TRADITION (uppercase)",
  "hero_bg_color": "A dark muted hex color that evokes this town's character — forest green, deep teal, dark olive, deep brown etc. NOT black or pure white.",
  "suggested_search_queries": ["3-4 search queries to pass to the venue discovery agent for this town, e.g. event spaces Thodupuzha Kerala"]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Research ${townName}${district ? `, ${district} district` : ''}, Kerala thoroughly and generate all landing page content for Theeram Spaces. Search for the town's geography, culture, significance, distance from major cities, and what makes it special for family celebrations and events. Return only the JSON object.`
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
    const s = clean.indexOf('{'), e = clean.lastIndexOf('}')
    if (s === -1) return NextResponse.json({ error: 'No JSON returned. Try again.' }, { status: 500 })
    const town = JSON.parse(clean.slice(s, e + 1))
    return NextResponse.json({ town })

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
