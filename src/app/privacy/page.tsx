import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Theeram Spaces',
  description: 'How Theeram Spaces collects, uses and protects your data.',
}

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', padding: '0 0 60px' }}>
      <header style={{ borderBottom: '0.5px solid #D6C9B8', padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href="/" style={{ color: '#7C5C3E', display: 'flex', textDecoration: 'none' }}>
          <svg viewBox="0 0 20 20" fill="none" width={20} height={20} stroke="currentColor" strokeWidth={2}><path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Link>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#2C1A0E' }}>Privacy Policy</span>
      </header>

      <div style={{ padding: '24px 16px', maxWidth: 640, margin: '0 auto' }}>
        <p style={{ fontSize: 11, color: '#B4A898', marginBottom: 24 }}>Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <p style={{ fontSize: 14, color: '#7C5C3E', lineHeight: 1.8, marginBottom: 28 }}>
          Theeram Spaces is a curated directory of event spaces and services in Pala, Kerala. This policy explains what data we collect, why we collect it, and how we use it. We keep this simple because we are a small independent platform, not a corporation.
        </p>

        {[
          {
            title: 'What we collect',
            body: `When you use Theeram Spaces, we may collect the following:

• Inquiry data: When you tap "Check availability on WhatsApp," we log the property you enquired about and the event type you selected, along with a timestamp. We do not collect your name, phone number, or any personal identifier.

• Vendor applications: When a vendor submits a listing request through /join, we collect the business name, category, contact details (WhatsApp, phone, email), description, and any other information voluntarily provided in the form.

• UPI payment intent: When you tap the "Pay with UPI" button, we log the timestamp and the property you were viewing. We do not process, receive, or store payment details. All payments go directly to the platform operator's UPI account.

• Technical data: Standard web server logs including IP address, browser type, and pages visited. This is collected automatically by our hosting provider (Vercel) and is not used by us for profiling.`
          },
          {
            title: 'What we do not collect',
            body: `We do not collect:
• Your name, phone number, or WhatsApp number as a visitor
• Payment card details or bank information
• Cookies beyond what is strictly necessary for the site to function
• Location data
• Any data from children under 18`
          },
          {
            title: 'How we use your data',
            body: `Inquiry logs are used solely to understand which properties and event types are most popular, so we can improve the directory. This data is never shared with third parties, advertisers, or property owners.

Vendor application data is used to review and respond to listing requests. Approved vendor details are published on the site as submitted.`
          },
          {
            title: 'Data sharing',
            body: `We do not sell, rent, or share your data with any third party for commercial purposes. The only third parties who may process data are:

• Vercel (hosting) — processes server logs per their privacy policy
• Supabase (database) — stores inquiry and submission data per their privacy policy
• Cloudinary (image hosting) — stores property and vendor photos

All three are GDPR-compliant processors.`
          },
          {
            title: 'Data retention',
            body: `Inquiry logs are retained for 12 months and then deleted. Vendor submissions (approved or rejected) are retained for 24 months. You may request deletion of your data at any time by contacting us.`
          },
          {
            title: 'Your rights',
            body: `Under the Indian Digital Personal Data Protection Act (DPDP) 2023 and applicable law, you have the right to:

• Know what data we hold about you
• Request correction of inaccurate data
• Request deletion of your data
• Withdraw consent at any time

To exercise any of these rights, contact us at the email below.`
          },
          {
            title: 'Vendor data',
            body: `If you are a vendor listed on Theeram Spaces, your business name, contact details, and description are publicly visible on the site. You may request removal or update of your listing at any time by contacting us. Removal will be completed within 7 working days.`
          },
          {
            title: 'Contact',
            body: `For any privacy-related questions or requests, contact us at smm0794@gmail.com. We will respond within 7 working days.`
          },
        ].map(({ title, body }) => (
          <section key={title} style={{ marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: '#2C1A0E', marginBottom: 10 }}>{title}</h2>
            <p style={{ fontSize: 13, color: '#555', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{body}</p>
          </section>
        ))}

        <div style={{ borderTop: '0.5px solid #D6C9B8', paddingTop: 20, marginTop: 8 }}>
          <p style={{ fontSize: 11, color: '#B4A898', lineHeight: 1.7 }}>
            Theeram Spaces · Pala, Kerala · smm0794@gmail.com
          </p>
        </div>
      </div>
    </main>
  )
}
