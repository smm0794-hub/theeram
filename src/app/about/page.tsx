import Link from 'next/link'
import { Metadata } from 'next'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'About Theeram Spaces — Event Venues & Spaces in Kerala',
  description: 'Theeram Spaces is a hand-curated directory of event spaces, villas, and venues across Kerala. Weddings, family gatherings, corporate events. No booking fees. Talk directly to owners on WhatsApp.',
  alternates: { canonical: 'https://www.theeramspaces.in/about' },
}

const C = { green:'#1C3A2B',green2:'#163023',cream:'#F5F0E8',cream2:'#EDE8DC',cream3:'#E5DFD0',gold:'#C9A84C',terra:'#9B3D1E',text:'#1C1C1A',muted:'#6B5E4E' }
const serif = { fontFamily:'Georgia,serif' } as const
const sans = { fontFamily:'system-ui,sans-serif' } as const

const faqs = [
  {
    q: 'What types of event spaces does Theeram list?',
    a: 'Theeram lists private villas with swimming pools, heritage nalukettu homes, open event lawns, AC and non-AC banquet halls, riverside properties, plantation bungalows, and auditoriums. Spaces accommodate intimate gatherings of 15 guests up to large receptions of 1,200.'
  },
  {
    q: 'Which areas of Kerala does Theeram cover?',
    a: 'Theeram currently covers Pala, Thodupuzha, Kanjirappally, and Theekoy — with more towns being added regularly. Within each town, listings extend to surrounding panchayats and nearby villages.'
  },
  {
    q: 'How do I contact a property owner?',
    a: 'Tap the WhatsApp button on any listing. You are connected directly to the property owner — no booking fee, no commission, no middleman. Discuss availability, pricing, and details one-on-one, the way it has always been done in Kerala.'
  },
  {
    q: 'What is the price range for event venues?',
    a: 'Venues on Theeram range from approximately ₹8,000 to ₹35,000 per day depending on size, location, and facilities. Contact the owner directly for current pricing — every property is different.'
  },
  {
    q: 'Are the venues suitable for Kerala weddings?',
    a: 'Yes. Many properties are well-suited for Kerala wedding receptions — with AC halls, open lawns, outside catering permissions, generator backup, and parking. Use the "Wedding" event filter to find spaces that specifically suit your requirements.'
  },
  {
    q: 'Does Theeram cover photographers, caterers and other service providers?',
    a: 'Yes. The Makers section connects you with trusted local professionals — photographers, caterers, decorators, florists, and bridal stylists — in each town we cover. Find them under the Makers tab on any town page.'
  },
  {
    q: 'How does Theeram verify its listings?',
    a: 'Every listing on Theeram is personally visited and verified by our team before it goes live. We check facilities, take photographs, verify the owner\'s contact details, and confirm that the property is available for private events. We only list what we would genuinely recommend to someone we know.'
  },
  {
    q: 'Is there a booking fee?',
    a: 'No. Theeram is completely free for guests. We connect you to property owners directly, and you negotiate and book with the owner independently. Theeram charges no commission and takes no payment.'
  },
  {
    q: 'How can I list my property or service on Theeram?',
    a: 'Use the "List your space" link in the navigation to submit your property, or "List your service" if you are a photographer, caterer, or other vendor. Our team will visit and verify the property before listing it.'
  },
]

export default function AboutPage() {
  return (
    <div style={{ background:C.cream, minHeight:'100vh', paddingBottom:48 }}>
      <Header/>

      {/* Hero */}
      <div style={{ background:C.green2, padding:'40px 20px 36px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
          <div style={{ width:15,height:1,background:C.gold }}/>
          <span style={{ ...sans,fontSize:10,color:C.gold,letterSpacing:'.08em' }}>ഞങ്ങളേക്കുറിച്ച്</span>
          <div style={{ width:15,height:1,background:C.gold }}/>
        </div>
        <h1 style={{ ...serif,fontSize:26,color:'white',fontWeight:300,lineHeight:1.25,marginBottom:12 }}>
          A personal guide to the best event spaces in Kerala — curated, verified, and one WhatsApp away.
        </h1>
        <p style={{ ...sans,fontSize:13,color:'rgba(255,255,255,.6)',lineHeight:1.7,fontWeight:300 }}>
          From heritage tharavadus to riverside lawns, plantation estates to grand convention halls.
        </p>
      </div>

      <div style={{ padding:'28px 16px 0', maxWidth:640, margin:'0 auto' }}>

        {/* What is Theeram */}
        <p style={{ ...sans,fontSize:14,color:C.muted,lineHeight:1.85,marginBottom:14,fontWeight:300 }}>
          Theeram is a hand-curated directory of event spaces, villas, and venues across Kerala. Whether you are planning a wedding, a family gathering, a corporate offsite, a birthday celebration, or a quiet retreat — Theeram connects you directly with the right space and the right people.
        </p>
        <p style={{ ...sans,fontSize:14,color:C.muted,lineHeight:1.85,marginBottom:14,fontWeight:300 }}>
          Every listing is personally visited and verified. No auto-populated directories, no unverified listings, no spaces we would not recommend to someone we know. We cover private villas, heritage homes, open lawns, AC banquet halls, riverside properties, and auditoriums — from intimate gatherings to receptions of 1,200 guests.
        </p>
        <p style={{ ...sans,fontSize:14,color:C.muted,lineHeight:1.85,marginBottom:28,fontWeight:300 }}>
          Alongside venues, Theeram also connects you with trusted local makers — photographers, caterers, decorators, florists, and bridal stylists — who know these towns and the families that celebrate in them. No booking fees. No middlemen. Every enquiry goes directly to the owner on WhatsApp.
        </p>

        {/* How it works */}
        <div style={{ borderTop:`1px solid ${C.cream3}`,paddingTop:24,marginBottom:28 }}>
          <div style={{ display:'flex',alignItems:'center',gap:9,marginBottom:14 }}>
            <div style={{ width:14,height:1,background:C.terra }}/>
            <span style={{ ...sans,fontSize:10,color:C.terra,letterSpacing:'.08em' }}>എങ്ങനെ</span>
            <div style={{ flex:1,height:1,background:C.cream3 }}/>
          </div>
          <h2 style={{ ...serif,fontSize:20,fontWeight:400,color:C.text,marginBottom:16 }}>How Theeram works</h2>
          {[
            { step: '01', title: 'Browse and filter', body: 'Use the feel filters to find the type of space that suits your event — tharavadu, riverside, villa, grand hall, or quiet retreat. Every listing shows real facilities, real capacity, and honest pricing.' },
            { step: '02', title: 'Talk directly to the owner', body: 'Tap WhatsApp. You are connected to the property owner immediately. No forms, no waiting for callbacks, no booking engine. Discuss, negotiate, and decide — the way Kerala has always done business.' },
            { step: '03', title: 'Book on your terms', body: 'There is no booking fee on Theeram. The arrangement is entirely between you and the owner. We provide the introduction; you handle the rest.' },
          ].map(({ step, title, body }) => (
            <div key={step} style={{ display:'flex',gap:16,marginBottom:20 }}>
              <div style={{ ...serif,fontSize:22,color:C.gold,fontWeight:300,flexShrink:0,lineHeight:1 }}>{step}</div>
              <div>
                <div style={{ ...sans,fontSize:13,fontWeight:600,color:C.text,marginBottom:4 }}>{title}</div>
                <div style={{ ...sans,fontSize:13,color:C.muted,lineHeight:1.7,fontWeight:300 }}>{body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Where we are */}
        <div style={{ background:C.green,padding:'24px 20px',marginBottom:28 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:12 }}>
            <div style={{ width:14,height:1,background:C.gold }}/>
            <span style={{ ...sans,fontSize:10,color:C.gold,letterSpacing:'.08em' }}>ഇടങ്ങൾ</span>
            <div style={{ width:14,height:1,background:C.gold }}/>
          </div>
          <h2 style={{ ...serif,fontSize:20,color:'white',fontWeight:300,marginBottom:10 }}>Where we are</h2>
          <p style={{ ...sans,fontSize:13,color:'rgba(255,255,255,.65)',lineHeight:1.8,fontWeight:300,marginBottom:14 }}>
            Theeram currently covers Pala, Thodupuzha, Kanjirappally, and Theekoy in central Kerala — towns with rich traditions of family celebration, surrounded by rubber plantations, river valleys, and the foothills of the Western Ghats. More towns are added regularly.
          </p>
          <div style={{ display:'flex',gap:8,flexWrap:'wrap' as const }}>
            {[['Pala','/pala'],['Thodupuzha','/thodupuzha'],['Kanjirappally','/kanjirappally'],['Theekoy','/theekoy']].map(([name,href]) => (
              <Link key={name} href={href} style={{ ...sans,fontSize:11,color:C.gold,border:`1px solid rgba(201,168,76,.4)`,padding:'5px 12px',textDecoration:'none' }}>{name} →</Link>
            ))}
          </div>
        </div>

        {/* The curation promise */}
        <div style={{ borderTop:`1px solid ${C.cream3}`,paddingTop:24,marginBottom:28 }}>
          <div style={{ display:'flex',alignItems:'center',gap:9,marginBottom:14 }}>
            <div style={{ width:14,height:1,background:C.terra }}/>
            <span style={{ ...sans,fontSize:10,color:C.terra,letterSpacing:'.08em' }}>വാഗ്ദാനം</span>
            <div style={{ flex:1,height:1,background:C.cream3 }}/>
          </div>
          <h2 style={{ ...serif,fontSize:20,fontWeight:400,color:C.text,marginBottom:12 }}>The curation promise</h2>
          <p style={{ ...sans,fontSize:14,color:C.muted,lineHeight:1.85,fontWeight:300 }}>
            Every space on Theeram has been personally visited by our team. We verify the facilities, photograph the property, confirm the owner's contact details, and check that the space is genuinely available for private events. If we would not recommend it to a family member planning their wedding, it does not go on Theeram.
          </p>
        </div>

        {/* FAQ */}
        <div style={{ borderTop:`1px solid ${C.cream3}`,paddingTop:24 }}>
          <div style={{ display:'flex',alignItems:'center',gap:9,marginBottom:18 }}>
            <div style={{ width:14,height:1,background:C.terra }}/>
            <span style={{ ...sans,fontSize:10,color:C.terra,letterSpacing:'.08em' }}>ചോദ്യങ്ങൾ</span>
            <div style={{ flex:1,height:1,background:C.cream3 }}/>
          </div>
          <h2 style={{ ...serif,fontSize:20,fontWeight:400,color:C.text,marginBottom:18 }}>Frequently asked questions</h2>
          {faqs.map(({q,a},i) => (
            <div key={i} style={{ borderBottom:`0.5px solid ${C.cream3}`,padding:'16px 0' }}>
              <p style={{ ...sans,fontSize:13,fontWeight:600,color:C.text,marginBottom:7,lineHeight:1.4 }}>{q}</p>
              <p style={{ ...sans,fontSize:13,color:C.muted,lineHeight:1.8,fontWeight:300 }}>{a}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign:'center',paddingTop:32,display:'flex',flexDirection:'column',gap:14,alignItems:'center' }}>
          <Link href="/" style={{ ...sans,display:'inline-block',background:C.green,color:'white',fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase' as const,padding:'12px 28px',textDecoration:'none' }}>Browse spaces</Link>
          <Link href="/services" style={{ ...sans,fontSize:13,color:C.terra,textDecoration:'none',borderBottom:`1px solid ${C.terra}`,paddingBottom:1 }}>Find makers →</Link>
        </div>
      </div>
    </div>
  )
}
