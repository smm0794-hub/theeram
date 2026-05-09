import Link from 'next/link'
import { Metadata } from 'next'
import Header from '@/components/Header'

export const metadata: Metadata = { title:'Privacy Policy | Theeram Spaces', description:'How Theeram Spaces collects, uses and protects your data.' }

const C = { green:'#1C3A2B',cream:'#F5F0E8',cream3:'#E5DFD0',terra:'#9B3D1E',text:'#1C1C1A',muted:'#6B5E4E' }
const serif = { fontFamily:'Georgia,serif' } as const
const sans = { fontFamily:'system-ui,sans-serif' } as const

const sections = [
  { title:'What we collect', body:`When you use Theeram Spaces, we may collect:\n\nâ€¢ Page view data: When you view a property listing, we record the property ID and a timestamp. We do not collect your name, phone number, or device identifier. IP addresses are used only for rate limiting (one count per property per 30 minutes) and are not stored.\n\nâ€¢ Inquiry data: When you tap "Talk to owner," we log the property and event type with a timestamp. We do not collect your name or phone number.\n\nâ€¢ Vendor applications: Business name, category, contact details, and description submitted via /join.\n\nâ€¢ Property submissions: Details submitted via /list.\n\nâ€¢ Technical data: Standard server logs including IP address and pages visited, collected by our hosting provider (Vercel).` },
  { title:'What we do not collect', body:'We do not collect your name, phone number, or WhatsApp number as a visitor. We do not collect payment card details, location data, or data from children under 18.' },
  { title:'How we use your data', body:'Inquiry logs are used solely to understand which properties are most popular, so we can improve the directory. Vendor and property submission data is used to review and respond to listing requests.' },
  { title:'Data sharing', body:'We do not sell, rent, or share your data with any third party for commercial purposes. Third parties who may process data: Vercel (hosting), Supabase (database), Cloudinary (image hosting). All are GDPR-compliant.' },
  { title:'Data retention', body:'Inquiry logs are retained for 12 months then deleted. Vendor submissions are retained for 24 months. You may request deletion at any time.' },
  { title:'Your rights', body:'Under the Indian Digital Personal Data Protection Act (DPDP) 2023, you have the right to know what data we hold, request correction or deletion, and withdraw consent at any time.' },
  { title:'Contact', body:'For any privacy-related requests, contact us at smm0794@gmail.com. We will respond within 7 working days.' },
]

export default function PrivacyPage() {
  return (
    <div style={{ background:C.cream,minHeight:'100vh',paddingBottom:48 }}>
      <Header/>
      <div style={{ background:C.green,padding:'32px 20px 28px' }}>
        <h1 style={{ ...serif,fontSize:26,color:'white',fontWeight:300 }}>Privacy Policy</h1>
      </div>
      <div style={{ padding:'24px 16px 0',maxWidth:640,margin:'0 auto' }}>
        <p style={{ ...sans,fontSize:11,color:C.muted,marginBottom:24 }}>Last updated: {new Date().toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'})}</p>
        <p style={{ ...sans,fontSize:14,color:C.muted,lineHeight:1.8,marginBottom:28,fontWeight:300 }}>
          Theeram Spaces is a curated directory of event spaces and services in Pala, Kerala. This policy explains what data we collect, why, and how we use it.
        </p>
        {sections.map(({title,body})=>(
          <section key={title} style={{ marginBottom:24,borderTop:`1px solid ${C.cream3}`,paddingTop:20 }}>
            <h2 style={{ ...serif,fontSize:17,color:C.text,marginBottom:10,fontWeight:400 }}>{title}</h2>
            <p style={{ ...sans,fontSize:13,color:C.muted,lineHeight:1.85,whiteSpace:'pre-line',fontWeight:300 }}>{body}</p>
          </section>
        ))}
        <div style={{ borderTop:`1px solid ${C.cream3}`,paddingTop:16 }}>
          <p style={{ ...sans,fontSize:11,color:C.muted }}>Theeram Spaces Â· Pala, Kerala Â· smm0794@gmail.com</p>
        </div>
      </div>
    </div>
  )
}
