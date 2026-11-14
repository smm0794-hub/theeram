import { Metadata } from 'next'
import JoinClient from './client'

export const metadata: Metadata = {
  title: 'Join as an Event Maker or Vendor in Kerala',
  description: 'Are you a wedding photographer, caterer, decorator, event manager, or bridal stylist in Kerala? List your service on Theeram Spaces and get direct WhatsApp inquiries.',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.theeramspaces.in/join',
    siteName: 'Theeram Spaces',
    title: 'Join as an Event Maker or Vendor in Kerala | Theeram Spaces',
    description: 'Photographers, caterers, decorators, and stylists — list your service on Theeram Spaces with zero commission.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join as an Event Maker or Vendor in Kerala | Theeram Spaces',
    description: 'List your event service on Theeram Spaces and connect directly with families on WhatsApp.',
  },
  alternates: { canonical: 'https://www.theeramspaces.in/join' },
}

export default function JoinPage() {
  return <JoinClient />
}
