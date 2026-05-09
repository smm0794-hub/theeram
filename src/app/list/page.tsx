'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { C, sans, serif } from '@/lib/design'

const inp: React.CSSProperties = { width:'100%',border:`1px solid ${C.cream3}`,padding:'12px 14px',fontSize:14,fontFamily:'system-ui,sans-serif',background:C.cream,outline:'none',color:C.text,fontWeight:300,boxSizing:'border-box',marginBottom:12 }
const label: React.CSSProperties = { ...sans,fontSize:10,color:C.terra,letterSpacing:'.08em',textTransform:'uppercase',display:'block',marginBottom:6 } as React.CSSProperties

export default function ListPage() {
  const [submitted,setSubmitted]=useState(false)
  const [submitting,setSubmitting]=useState(false)
  const [error,setError]=useState('')
  const [name,setName]=useState('')
  const [ownerName,setOwnerName]=useState('')
  const [whatsapp,setWhatsapp]=useState('')
  const [phone,setPhone]=useState('')
  const [address,setAddress]=useState('')
  const [desc,setDesc]=useState('')
  const [price,setPrice]=useState('')
  const [guests,setGuests]=useState('')
  const [facilities,setFacilities]=useState('')
  const [message,setMessage]=useState('')

  async function submit() {
    if (!name||!whatsapp||!desc) { setError('Please fill in the property name, WhatsApp number and description.'); return }
    setSubmitting(true); setError('')
    try {
      const r = await fetch('/api/property-submissions',{ method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,owner_name:ownerName,whatsapp,phone,address,description:desc,price_guide:price,max_guests:guests,facilities,message}) })
      if (r.ok) { setSubmitted(true); try{const{notifyUrl}=await r.json();if(notifyUrl)window.open(notifyUrl,'_blank')}catch{} }
      else { const{error:e}=await r.json(); setError('Something went wrong. '+(e??'')) }
    } catch { setError('Connection error. Please try again.') }
    setSubmitting(false)
  }

  if (submitted) return (
    <div style={{ minHeight:'100vh',background:C.cream,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,textAlign:'center' }}>
      <Header/>
      <div style={{ ...serif,fontSize:40,color:C.gold,marginBottom:16 }}>🪔</div>
      <h1 style={{ ...serif,fontSize:22,color:C.text,marginBottom:12,fontWeight:400 }}>Thank you, {ownerName.split(' ')[0]||'there'}.</h1>
      <p style={{ ...sans,fontSize:14,color:C.muted,lineHeight:1.7,maxWidth:280,marginBottom:24,fontWeight:300 }}>Your listing request has been received. We individually review and verify every property before it goes live.</p>
      <a href="https://wa.me/919447000000" style={{ ...sans,fontSize:14,color:C.wa,fontWeight:600,textDecoration:'none',marginBottom:20 }}>💬 +91 94470 00000</a>
      <Link href="/" style={{ ...sans,fontSize:12,color:C.terra,textDecoration:'underline' }}>Browse listings →</Link>
    </div>
  )

  return (
    <div style={{ background:C.cream,minHeight:'100vh',paddingBottom:100 }}>
      <Header/>
      <div style={{ background:C.green,padding:'32px 20px 28px' }}>
        <h1 style={{ ...serif,fontSize:26,color:'white',fontWeight:300,marginBottom:8 }}>List your space</h1>
        <p style={{ ...sans,fontSize:13,color:'rgba(255,255,255,.65)',lineHeight:1.7,fontWeight:300 }}>Theeram individually reviews and curates every listing. Fill in your details and we will be in touch.</p>
      </div>
      <div style={{ padding:'24px 16px 0' }}>
        <label style={label}>Property name *</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Meenachil Garden Villa" style={inp}/>
        <label style={label}>Your name</label>
        <input value={ownerName} onChange={e=>setOwnerName(e.target.value)} placeholder="Owner or manager name" style={inp}/>
        <label style={label}>WhatsApp *</label>
        <input value={whatsapp} onChange={e=>setWhatsapp(e.target.value)} placeholder="919447000000" type="tel" style={inp}/>
        <label style={label}>Phone</label>
        <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Local phone number" type="tel" style={inp}/>
        <label style={label}>Location</label>
        <input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Ward, Panchayat, District" style={inp}/>
        <label style={label}>Description *</label>
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Tell us about the property — setting, facilities, what makes it special." rows={4} style={{ ...inp,resize:'vertical' }}/>
        <label style={label}>Max guests</label>
        <input value={guests} onChange={e=>setGuests(e.target.value)} placeholder="e.g. 200" style={inp}/>
        <label style={label}>Key facilities</label>
        <input value={facilities} onChange={e=>setFacilities(e.target.value)} placeholder="Pool, AC Hall, Lawn, Kitchen..." style={inp}/>
        <label style={label}>Price guide</label>
        <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="₹15,000–₹25,000 per day" style={inp}/>
        <label style={label}>Anything else?</label>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={3} style={{ ...inp,resize:'vertical' }}/>
        {error&&<p style={{ ...sans,fontSize:13,color:C.terra,marginBottom:12 }}>{error}</p>}
      </div>
      <div style={{ position:'fixed',bottom:0,left:0,right:0,background:C.cream,borderTop:`1px solid ${C.cream3}`,padding:'12px 16px',zIndex:30 }}>
        <button onClick={submit} disabled={submitting} style={{ ...sans,width:'100%',background:C.green,color:'white',fontSize:11,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',height:48,border:'none',cursor:submitting?'not-allowed':'pointer',opacity:submitting?.7:1 }}>
          {submitting?'Submitting...':'Submit listing request'}
        </button>
      </div>
    </div>
  )
}
