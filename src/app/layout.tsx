import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.theeramspaces.in'),
  title: {
    default: 'Theeram Spaces - Event Venues & Villas in Kerala',
    template: '%s | Theeram Spaces Kerala',
  },
  description: 'A hand-curated directory of event spaces, villas, and venues across Kerala. Weddings, family gatherings, corporate events, birthday parties and retreats. No booking fees. Talk directly to owners on WhatsApp.',
  keywords: [
    'event space Kerala', 'wedding venue Kerala', 'party hall Kerala',
    'villa for rent Kerala', 'event venue Pala', 'wedding venue Pala Kottayam',
    'event space Thodupuzha', 'party hall Kanjirappally', 'villa Pala Kerala',
    'heritage home Kerala events', 'riverside venue Kerala', 'tharavadu events Kerala',
  ],
  authors: [{ name: 'Theeram Spaces' }],
  creator: 'Theeram Spaces',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.theeramspaces.in',
    siteName: 'Theeram Spaces',
    title: 'Theeram Spaces - Event Venues & Villas in Kerala',
    description: 'Hand-curated event spaces and venues across Kerala. Talk directly to owners on WhatsApp.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Theeram Spaces - Event Venues in Kerala',
    description: 'Hand-curated event spaces across Kerala. No booking fees.',
  },
  robots: { index: true, follow: true },
  icons: { icon: '/favicon.svg', apple: '/favicon.svg' },
  alternates: { canonical: 'https://www.theeramspaces.in' },
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