import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.theeramspaces.in'),
  title: {
    default: 'Theeram — Event Spaces & Villas in Pala, Kerala',
    template: '%s | Theeram Spaces Pala',
  },
  description: 'Discover the best event spaces, villas and venues in Pala, Kerala. Find properties for weddings, family gatherings, corporate events, birthday parties and retreats. Contact owners directly on WhatsApp.',
  keywords: [
    'event space Pala Kerala',
    'villa rental Pala',
    'wedding venue Pala Kerala',
    'party hall Pala',
    'family gathering venue Kerala',
    'corporate event space Pala',
    'birthday party venue Pala',
    'retreat space Kerala',
    'Meenachil event venue',
    'Kottayam event space',
  ],
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  authors: [{ name: 'Theeram Spaces' }],
  creator: 'Theeram Spaces',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.theeramspaces.in',
    siteName: 'Theeram Spaces',
    title: 'Theeram — Event Spaces & Villas in Pala, Kerala',
    description: 'Discover the best event spaces and villas in Pala, Kerala. Weddings, family gatherings, corporate events and more. Contact owners directly on WhatsApp.',
    images: [
      {
        url: '/illustrations/landmarks/pala.svg',
        width: 390,
        height: 530,
        alt: 'Theeram — Event Spaces in Pala, Kerala',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Theeram — Event Spaces & Villas in Pala, Kerala',
    description: 'Discover the best event spaces and villas in Pala, Kerala.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://www.theeramspaces.in',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#FAF7F2', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
