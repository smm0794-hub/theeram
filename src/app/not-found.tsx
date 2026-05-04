import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E' }}>Page not found</p>
      <Link href="/" style={{ fontSize: 13, color: '#7C5C3E', textDecoration: 'underline' }}>
        Back to listings
      </Link>
    </div>
  )
}
