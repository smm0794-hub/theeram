import { Suspense } from 'react'
import CuratorLoginClient from './client'

export default function CuratorLoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:'100vh', background:'#F5F0E8', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:28, height:28, border:'2px solid #9B3D1E', borderTopColor:'transparent', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <CuratorLoginClient/>
    </Suspense>
  )
}
