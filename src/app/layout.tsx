import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Theeram Spaces - Event Venues and Villas in Pala, Kerala',
  description: 'A hand-curated directory of event spaces, villas, and venues in Pala, Kottayam district, Kerala. Weddings, family gatherings, corporate events. No booking fees. WhatsApp direct.',
  keywords: ['event space Pala Kerala', 'wedding venue Pala Kottayam', 'party hall Pala Kerala', 'villa for rent Pala Kerala', 'event venue Meenachil'],
  metadataBase: new URL('https://www.theeramspaces.in'),
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.theeramspaces.in',
    siteName: 'Theeram Spaces',
    title: 'Theeram Spaces - Event Venues in Pala, Kerala',
    description: 'Hand-curated event spaces, villas, and venues in Pala, Kerala. Talk directly to owners on WhatsApp.',
  },
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap" rel="stylesheet"/>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#F5F0E8' }}>{children}</body>
    </html>
  )
}