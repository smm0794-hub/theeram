import Link from 'next/link'
import { Metadata } from 'next'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'About Theeram — Event Spaces & Venues in Pala, Kerala',
  description: 'Theeram is a hand-curated directory of event spaces, villas, and venues in Pala, Kottayam district, Kerala.',
  alternates: { canonical: 'https://www.theeramspaces.in/about' },
}

const C = { green:'#1C3A2B',green2:'#163023',cream:'#F5F0E8',cream2:'#EDE8DC',cream3:'#E5DFD0',gold:'#C9A84C',terra:'#9B3D1E',text:'#1C1C1A',muted:'#6B5E4E' }
const serif = { fontFamily:'Georgia,serif' } as const
const sans = { fontFamily:'system-ui,sans-serif' } as const

const faqs = [
  { q:'What types of event spaces are available in Pala, Kerala?', a:'Theeram lists private villas with swimming pools, open event lawns, AC and non-AC banquet halls, heritage nalukettu homes, riverside properties, and auditoriums across Pala, Ettumanoor, Erattupetta, Kanjirappally, and Changanassery in Kottayam district. Spaces accommodate 30 to 300+ guests.' },
  { q:'How do I contact a property owner?', a:'Tap the WhatsApp button on any listing and you are connected directly to the property owner. No booking fee, no commission, no middleman. You discuss availability and pricing one-on-one.' },
  { q:'What is the price range for event venues in Pala?', a:'Venues range from approximately ₹8,000 to ₹35,000 per day depending on size, facilities, and season. Contact the owner directly for current pricing.' },
  { q:'Are venues suitable for weddings in Kerala?', a:'Yes. Many properties on Theeram are well-suited for Kerala weddings — with AC halls, open lawns, outside catering permissions, and generator backup.' },
  { q:'Does Theeram cover photographers, caterers and other vendors?', a:'Yes. Theeram connects you with trusted local makers in Pala — photographers, caterers, decorators, florists, and bridal stylists. Use the Makers tab on the home page.' },
  { q:'Which areas near Pala does Theeram cover?', a:'Theeram covers Pala and the Meenachil region — Ettumanoor, Erattupetta, Kanjirappally, Changanassery, Ramapuram, and nearby panchayats in Kottayam district, Kerala.' },
]

export default function AboutPage() {
  return (
    <div style={{ background:C.cream, minHeight:'100vh', paddingBottom:48 }}>
      <Header/>

      {/* Hero */}
      <div style={{ background:C.green2, padding:'40px 20px 36px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16 }}>
          <div style={{ width:15,height:1,background:C.gold }}/><span style={{ ...sans,fontSize:10,color:C.gold,letterSpacing:'.08em' }}>ഞങ്ങളേക്കുറിച്ച്</span><div style={{ width:15,height:1,background:C.gold }}/>
        </div>
        <h1 style={{ ...serif,fontSize:28,color:'white',fontWeight:300,lineHeight:1.2,marginBottom:12 }}>
          Event spaces and services in Pala, Kerala — curated, verified, and one WhatsApp away.
        </h1>
      </div>

      <div style={{ padding:'28px 16px 0',maxWidth:640,margin:'0 auto' }}>
        <p style={{ ...sans,fontSize:14,color:C.muted,lineHeight:1.85,marginBottom:14,fontWeight:300 }}>
          Theeram is a hand-curated directory of event spaces, villas, and venues in and around Pala, Kottayam district, Kerala. Whether you are planning a wedding, a family gathering, a corporate offsite, a birthday celebration, or a quiet retreat — Theeram connects you directly with the right space and the right people to make it happen.
        </p>
        <p style={{ ...sans,fontSize:14,color:C.muted,lineHeight:1.85,marginBottom:14,fontWeight:300 }}>
          Every listing is personally visited and verified. We cover villas with private pools, open lawns, AC banquet halls, heritage nalukettu homes, and riverside properties across Pala, Ettumanoor, Erattupetta, Changanassery, and the wider Meenachil region. Alongside venues, Theeram also connects you with trusted local makers — photographers, caterers, decorators, florists, and bridal stylists.
        </p>
        <p style={{ ...sans,fontSize:14,color:C.muted,lineHeight:1.85,marginBottom:32,fontWeight:300 }}>
          No booking fees. No middlemen. Every enquiry goes directly to the property owner or vendor on WhatsApp.
        </p>

        {/* Why Pala */}
        <div style={{ background:C.green,padding:'28px 20px',marginBottom:32 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14 }}>
            <div style={{ width:14,height:1,background:C.gold }}/><span style={{ ...sans,fontSize:10,color:C.gold,letterSpacing:'.08em' }}>എന്തുകൊണ്ട് പാലാ?</span><div style={{ width:14,height:1,background:C.gold }}/>
          </div>
          <h2 style={{ ...serif,fontSize:22,color:'white',fontWeight:300,lineHeight:1.25,marginBottom:12 }}>Why Pala for your next event?</h2>
          <p style={{ ...sans,fontSize:13,color:'rgba(255,255,255,.65)',lineHeight:1.8,fontWeight:300 }}>
            Pala, in the heart of Kottayam district, is one of Kerala's most sought-after regions for family celebrations. Surrounded by rubber plantations, the banks of the Meenachil river, and rolling green countryside, the area offers a natural beauty that few urban venues can match. Well connected — 45 minutes from Kottayam town, 90 minutes from Kochi.
          </p>
        </div>

        {/* FAQ */}
        <div style={{ borderTop:`1px solid ${C.cream3}`,paddingTop:28 }}>
          <div style={{ display:'flex',alignItems:'center',gap:9,marginBottom:20 }}>
            <div style={{ width:14,height:1,background:C.terra }}/><span style={{ ...sans,fontSize:10,color:C.terra,letterSpacing:'.08em' }}>ചോദ്യങ്ങൾ</span><div style={{ flex:1,height:1,background:C.cream3 }}/>
          </div>
          <h2 style={{ ...serif,fontSize:22,fontWeight:400,color:C.text,marginBottom:20 }}>Frequently asked questions</h2>
          {faqs.map(({q,a},i) => (
            <div key={i} style={{ borderBottom:`0.5px solid ${C.cream3}`,padding:'16px 0' }}>
              <p style={{ ...sans,fontSize:13,fontWeight:600,color:C.text,marginBottom:8,lineHeight:1.4 }}>{q}</p>
              <p style={{ ...sans,fontSize:13,color:C.muted,lineHeight:1.8,fontWeight:300 }}>{a}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign:'center',paddingTop:32,display:'flex',flexDirection:'column',gap:14,alignItems:'center' }}>
          <Link href="/" style={{ ...sans,display:'inline-block',background:C.green,color:'white',fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',padding:'12px 28px',textDecoration:'none' }}>Browse spaces</Link>
          <Link href="/services" style={{ ...sans,fontSize:13,color:C.terra,textDecoration:'none',borderBottom:`1px solid ${C.terra}`,paddingBottom:1 }}>Find makers →</Link>
        </div>
      </div>
    </div>
  )
}
