import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Theeram — Event Spaces & Venues in Pala, Kerala',
  description: 'Theeram is a hand-curated directory of event spaces, villas, and venues in Pala, Kottayam district, Kerala. Weddings, family gatherings, corporate events and more — no booking fees, direct WhatsApp contact.',
  alternates: { canonical: 'https://www.theeramspaces.in/about' },
}

const faqs = [
  {
    q: 'What types of event spaces are available in Pala, Kerala?',
    a: 'Theeram lists a wide range of venues across Pala and Kottayam district — private villas with swimming pools, open event lawns, AC and non-AC banquet halls, heritage nalukettu homes, riverside properties, and auditoriums. Spaces range from intimate venues for 30 guests to large properties accommodating 300 or more. Listings cover Pala, Ettumanoor, Erattupetta, Kanjirappally, Changanassery, and nearby areas in the Meenachil region.',
  },
  {
    q: 'How do I book a venue through Theeram?',
    a: 'There is no booking form or payment on Theeram. When you find a space you like, tap the WhatsApp button and you are connected directly to the property owner. You discuss availability, pricing, and terms one-on-one — no commission, no platform fee, no middleman.',
  },
  {
    q: 'What is the price range for event venues in Pala?',
    a: 'Venues on Theeram range from approximately ₹8,000 to ₹35,000 per day depending on the property size, facilities, and season. Smaller villas for staycations and family gatherings start lower, while large wedding venues with AC halls, open lawns, and pool facilities are priced higher. Contact the owner directly for current availability and pricing.',
  },
  {
    q: 'Are these venues suitable for weddings?',
    a: 'Yes. Several properties on Theeram are well-suited for Kerala weddings — including Christian weddings, Hindu ceremonies, and receptions. Look for venues with AC halls, open lawns for outdoor ceremonies, and adequate guest capacity. Many properties also allow outside catering and have generator backup, which is essential for large events.',
  },
  {
    q: 'Can I find venues for corporate events and team offsites near Pala?',
    a: 'Yes. Theeram lists properties suitable for corporate offsites, team gatherings, training sessions, and company retreats in and around Pala and Kottayam district. Use the event type filter to find spaces with the right combination of hall capacity, accommodation, and facilities.',
  },
  {
    q: 'Does Theeram cover event service vendors too?',
    a: 'Yes. Beyond venues, Theeram connects you with trusted event vendors in Pala — photographers, videographers, caterers, decorators, florists, and bridal stylists. The same WhatsApp-first model applies — contact vendors directly, no commission charged.',
  },
  {
    q: 'Which areas near Pala does Theeram cover?',
    a: 'Theeram currently focuses on Pala and the surrounding Meenachil region in Kottayam district — covering Ettumanoor, Erattupetta, Kanjirappally, Changanassery, Ramapuram, and nearby panchayats. We are gradually expanding to cover more towns across Kerala.',
  },
  {
    q: 'How can I list my property or service on Theeram?',
    a: 'Property owners can submit a listing request at theeramspaces.in/list. Service vendors — photographers, caterers, decorators, and others — can apply at theeramspaces.in/join. Every listing is personally reviewed before going live.',
  },
]

export default function AboutPage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', paddingBottom: 60 }}>
      <header style={{ borderBottom: '0.5px solid #D6C9B8', padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/" style={{ color: '#7C5C3E', display: 'flex', textDecoration: 'none' }}>
          <svg viewBox="0 0 20 20" fill="none" width={20} height={20} stroke="currentColor" strokeWidth={2}><path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E' }}>About Theeram</span>
      </header>

      <div style={{ padding: '28px 16px 0', maxWidth: 640, margin: '0 auto' }}>

        {/* Kasavu accent line */}
        <div style={{ width: 40, height: 2, backgroundColor: '#C9A84C', marginBottom: 20 }} />

        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#2C1A0E', lineHeight: 1.3, marginBottom: 20 }}>
          Event spaces and services in Pala, Kerala — curated, verified, and one WhatsApp away.
        </h1>

        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.85, marginBottom: 16 }}>
          Theeram is a hand-curated directory of event spaces, villas, and venues in and around Pala, Kottayam district, Kerala. Whether you are planning a wedding, a family gathering, a corporate offsite, a birthday celebration, or a quiet retreat — Theeram connects you directly with the right space and the right people to make it happen.
        </p>

        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.85, marginBottom: 16 }}>
          Every listing is personally visited and verified. We cover villas with private pools, open lawns, AC banquet halls, heritage nalukettu homes, and riverside properties across Pala, Ettumanoor, Erattupetta, Changanassery, and the wider Meenachil region. Alongside venues, Theeram also connects you with trusted local vendors — photographers, caterers, decorators, florists, and bridal stylists — all in one place.
        </p>

        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.85, marginBottom: 32 }}>
          No booking fees. No middlemen. Every enquiry goes directly to the property owner or vendor on WhatsApp — you negotiate availability, pricing, and terms one-on-one. Theeram exists to make finding the right venue for a meaningful occasion feel as considered as the occasion itself.
        </p>

        {/* Why Pala section */}
        <div style={{ borderTop: '0.5px solid #D6C9B8', paddingTop: 28, marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E', marginBottom: 14 }}>
            Why Pala for your next event?
          </h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.85, marginBottom: 14 }}>
            Pala, in the heart of Kottayam district, is one of Kerala's most sought-after regions for family celebrations and events. Surrounded by rubber plantations, the banks of the Meenachil river, and rolling green countryside, the area offers a natural beauty that few urban venues can match.
          </p>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.85 }}>
            The region is well connected — approximately 45 minutes from Kottayam town, 90 minutes from Kochi, and accessible from all four of Kerala's international airports. Event spaces in Pala tend to offer more generous grounds, better value, and a more personal experience compared to commercial venues in larger cities — making them ideal for weddings, family reunions, corporate retreats, and milestone celebrations.
          </p>
        </div>

        {/* FAQ section */}
        <div style={{ borderTop: '0.5px solid #D6C9B8', paddingTop: 28 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E', marginBottom: 20 }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {faqs.map(({ q, a }, i) => (
              <div key={i} style={{ borderBottom: '0.5px solid #D6C9B8', padding: '16px 0' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2C1A0E', marginBottom: 8, lineHeight: 1.4 }}>{q}</p>
                <p style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', paddingTop: 32 }}>
          <Link href="/" style={{ display: 'inline-block', backgroundColor: '#2C1A0E', color: 'white', fontWeight: 700, fontSize: 14, borderRadius: 999, padding: '12px 28px', textDecoration: 'none', marginBottom: 12 }}>
            Browse event spaces
          </Link>
          <br />
          <Link href="/services" style={{ fontSize: 13, color: '#7C5C3E', textDecoration: 'underline', display: 'inline-block', marginTop: 8 }}>
            Find vendors →
          </Link>
        </div>
      </div>
    </main>
  )
}
