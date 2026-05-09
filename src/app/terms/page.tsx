import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Terms of Service | Theeram Spaces',
  description: 'Terms of service for Theeram Spaces — a curated event venue directory for Kerala.',
  robots: { index: false },
}

const C = { green:'#1C3A2B', green2:'#163023', cream:'#F5F0E8', cream3:'#E5DFD0', terra:'#9B3D1E', text:'#1C1C1A', muted:'#6B5E4E' }
const serif = { fontFamily:'Georgia,serif' } as const
const sans = { fontFamily:'system-ui,sans-serif' } as const

const sections = [
  {
    title: 'What Theeram Spaces is',
    body: `Theeram Spaces is a curated discovery directory. We list event spaces, villas, and service providers in Kerala to help you find and contact them directly. We are not a booking platform, payment processor, or event management company.`
  },
  {
    title: 'Our role',
    body: `Theeram Spaces acts solely as an introduction service. We connect guests with property owners and service providers. Any arrangement, agreement, payment, or booking made as a result of a connection through Theeram Spaces is entirely between the guest and the property owner or vendor. Theeram Spaces is not a party to any such arrangement.`
  },
  {
    title: 'Listing accuracy',
    body: `Every listing on Theeram Spaces is personally visited and verified at the time of listing. However, facilities, pricing, availability, and ownership may change after a listing goes live. We make no warranty that the information displayed is current or complete. Always confirm details directly with the property owner or vendor before making any commitment.`
  },
  {
    title: 'No booking guarantee',
    body: `Theeram Spaces does not guarantee the availability of any listed space or service. A listing on Theeram Spaces does not constitute a reservation or booking of any kind. Any booking must be confirmed directly with the property owner or vendor.`
  },
  {
    title: 'Limitation of liability',
    body: `Theeram Spaces shall not be liable for any loss, damage, injury, or dispute arising from your use of this directory, any communication with a listed owner or vendor, any booking made through or as a result of Theeram Spaces, or any inaccuracy in a listing. Use of Theeram Spaces is entirely at your own risk.`
  },
  {
    title: 'Voluntary contributions',
    body: `The "Buy a coffee" payment prompt is entirely voluntary. It is not a fee for using the directory, not a booking deposit, and not a payment for any service. You are under no obligation to contribute. Contributions are non-refundable.`
  },
  {
    title: 'Listing on Theeram Spaces',
    body: `Property owners and vendors who submit listings confirm that the information provided is accurate, that they have the authority to list the property or service, and that the property or service is legally available for private events. Theeram Spaces reserves the right to remove any listing at any time without notice.`
  },
  {
    title: 'Governing law',
    body: `These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Kottayam, Kerala.`
  },
  {
    title: 'Contact',
    body: `For any questions about these terms, contact us at smm0794@gmail.com.`
  },
]

export default function TermsPage() {
  return (
    <div style={{ background:C.cream, minHeight:'100vh', paddingBottom:48 }}>
      <Header/>
      <div style={{ background:C.green2, padding:'32px 20px 28px' }}>
        <h1 style={{ ...serif, fontSize:26, color:'white', fontWeight:300 }}>Terms of Service</h1>
      </div>
      <div style={{ padding:'24px 16px 0', maxWidth:640, margin:'0 auto' }}>
        <p style={{ ...sans, fontSize:11, color:C.muted, marginBottom:24 }}>
          Last updated: {new Date().toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}
        </p>
        <p style={{ ...sans, fontSize:14, color:C.muted, lineHeight:1.8, marginBottom:28, fontWeight:300 }}>
          By using Theeram Spaces, you agree to the following terms. Please read them carefully. If you do not agree, please do not use this directory.
        </p>
        {sections.map(({ title, body }) => (
          <section key={title} style={{ marginBottom:22, borderTop:`1px solid ${C.cream3}`, paddingTop:18 }}>
            <h2 style={{ ...serif, fontSize:17, color:C.text, marginBottom:8, fontWeight:400 }}>{title}</h2>
            <p style={{ ...sans, fontSize:13, color:C.muted, lineHeight:1.85, fontWeight:300 }}>{body}</p>
          </section>
        ))}
        <div style={{ borderTop:`1px solid ${C.cream3}`, paddingTop:16, display:'flex', gap:20 }}>
          <Link href="/privacy" style={{ ...sans, fontSize:12, color:C.terra, textDecoration:'none', borderBottom:`1px solid ${C.terra}`, paddingBottom:1 }}>Privacy Policy</Link>
          <Link href="/" style={{ ...sans, fontSize:12, color:C.muted, textDecoration:'none' }}>← Back to site</Link>
        </div>
      </div>
    </div>
  )
}
