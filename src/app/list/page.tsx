import { Metadata } from 'next'
import ListClient from './client'

export const metadata: Metadata = {
  title: 'List Your Event Space or Villa in Kerala',
  description: 'Own a villa, heritage tharavadu, event lawn, or auditorium in Kerala? List your venue on Theeram Spaces and receive direct WhatsApp inquiries with zero commission.',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.theeramspaces.in/list',
    siteName: 'Theeram Spaces',
    title: 'List Your Event Space or Villa in Kerala | Theeram Spaces',
    description: 'List your villa, tharavadu, or event venue on Theeram Spaces. Zero commission, direct WhatsApp leads.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'List Your Event Space or Villa in Kerala | Theeram Spaces',
    description: 'List your villa, tharavadu, or event venue on Theeram Spaces. Zero commission.',
  },
  alternates: { canonical: 'https://www.theeramspaces.in/list' },
}

export default function ListPage() {
  return <ListClient />
}
