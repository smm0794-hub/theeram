'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { C, sans, serif } from '@/lib/design'
import { VENDOR_CATEGORIES, VENDOR_CATEGORY_LABELS, VENDOR_CATEGORY_ICONS, VendorCategory } from '@/lib/supabase'

const inp: React.CSSProperties = { width:'100%',border:`1px solid ${C.cream3}`,padding:'12px 14px',fontSize:14,fontFamily:'system-ui,sans-serif',background:C.cream,outline:'none',color:C.text,fontWeight:300,boxSizing:'border-box',marginBottom:12 }
const lbl: React.CSSProperties = { ...sans,fontSize:10,color:C.terra,letterSpacing:'.08em',textTransform:'uppercase',display:'block',marginBottom:6 } as React.CSSProperties

export default function JoinPage() {
  const [submitted,setSubmitted]=useState(false)
  const [submitting,setSubmitting]=useState(false)
  const [error,setError]=useState('')
  const [name,setName]=useState('')
  const [category,setCategory]=useState<VendorCategory|''>('')
  const [tagline,setTagline]=useState('')
  const [desc,setDesc]=useState('')
  const [whatsapp,setWhatsapp]=useState('')
  const [phone,setPhone]=useState('')
  const [email,setEmail]=useState('')
  const [instagram,setInstagram]=useState('')
  const [price,setPrice]=useState('')
  const [area,setArea]=useState('Pala & surrounding areas')
  const [message,setMessage]=useState('')

  async function submit() {
    if (!name||!category||!whatsapp||!desc) { setError('Please fill in name, category, WhatsApp and description.'); return }
    setSubmitting(true); setError('')
    try {
      const r = await fetch('/api/vendor-submissions',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,category,tagline,description:desc,whatsapp,phone,email,instagram_url:instagram,price_guide:price,area_served:area,message}) })
      if (r.ok) { setSubmitted(true); try{const{notifyUrl}=await r.json();if(notifyUrl)window.open(notifyUrl,'_blank')}catch{} }
      else { const{error:e}=await r.json(); setError('Something went wrong. '+(e??'')) }
    } catch { setError('Connection error.') }
    setSubmitting(false)
  }

  if (submitted) return (
    <div style={{ minHeight:'100vh',background:C.cream,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center' }}>
      <div style={{ ...serif,fontSize:40,color:C.gold,marginBottom:16 }}>🪔</div>
      <h1 style={{ ...serif,fontSize:22,color:C.text,marginBottom:12,fontWeight:400 }}>Thank you, {name.split(' ')[0]}.</h1>
      <p style={{ ...sans,fontSize:14,color:C.muted,lineHeight:1.7,maxWidth:280,marginBottom:24,fontWeight:300 }}>Your application has been received. We review every listing personally and will be in touch soon.</p>
      <a href="https://wa.me/919447000000" style={{ ...sans,fontSize:14,color:C.wa,fontWeight:600,textDecoration:'none',marginBottom:20 }}>💬 +91 94470 00000</a>
      <Link href="/services" style={{ ...sans,fontSize:12,color:C.terra,textDecoration:'underline' }}>Browse makers →</Link>
    </div>
  )

  return (
    <div style={{ background:C.cream,minHeight:'100vh',paddingBottom:100 }}>
      <Header/>
      <div style={{ background:C.green,padding:'32px 20px 28px' }}>
        <h1 style={{ ...serif,fontSize:26,color:'white',fontWeight:300,marginBottom:8 }}>List your service</h1>
        <p style={{ ...sans,fontSize:13,color:'rgba(255,255,255,.65)',lineHeight:1.7,fontWeight:300 }}>Theeram curates every listing. Fill in your details and we will review your application.</p>
      </div>
      <div style={{ padding:'24px 16px 0' }}>
        <label style={lbl}>Business name *</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your business or personal name" style={inp}/>

        <label style={lbl}>Category *</label>
        <div style={{ display:'flex',flexDirection:'column',gap:8,marginBottom:16 }}>
          {VENDOR_CATEGORIES.map(cat=>(
            <button key={cat} onClick={()=>setCategory(cat)} style={{ padding:'12px 14px',border:`1px solid ${category===cat?C.terra:C.cream3}`,background:category===cat?'#fdf0ec':'white',color:category===cat?C.terra:C.muted,fontSize:13,fontFamily:'system-ui,sans-serif',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ fontSize:16 }}>{VENDOR_CATEGORY_ICONS[cat]}</span>
              {VENDOR_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <label style={lbl}>Tagline</label>
        <input value={tagline} onChange={e=>setTagline(e.target.value)} placeholder="One line — what makes you special" style={inp}/>
        <label style={lbl}>About your service *</label>
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4} placeholder="Describe your services, experience, and what makes you the right choice." style={{ ...inp,resize:'vertical' }}/>
        <label style={lbl}>WhatsApp *</label>
        <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="919447000000" type="tel" style={inp}/>
        <label style={lbl}>Phone</label>
        <input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" style={inp}/>
        <label style={lbl}>Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" style={inp}/>
        <label style={lbl}>Instagram</label>
        <input value={instagram} onChange={e=>setInstagram(e.target.value)} placeholder="@handle" style={inp}/>
        <label style={lbl}>Price guide</label>
        <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Starting from ₹15,000 per event" style={inp}/>
        <label style={lbl}>Area served</label>
        <input value={area} onChange={e=>setArea(e.target.value)} style={inp}/>
        <label style={lbl}>Anything else?</label>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3} style={{ ...inp,resize:'vertical' }}/>
        {error&&<p style={{ ...sans,fontSize:13,color:C.terra,marginBottom:12 }}>{error}</p>}
      </div>
      <div style={{ position:'fixed',bottom:0,left:0,right:0,background:C.cream,borderTop:`1px solid ${C.cream3}`,padding:'12px 16px',zIndex:30 }}>
        <button onClick={submit} disabled={submitting} style={{ ...sans,width:'100%',background:C.green,color:'white',fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',height:48,border:'none',cursor:submitting?'not-allowed':'pointer',opacity:submitting?.7:1 }}>
          {submitting?'Submitting...':'Submit application'}
        </button>
      </div>
    </div>
  )
}
