'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', backgroundColor: '#F4F5F3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <p style={{ fontFamily: 'var(--font-montserrat), Montserrat, sans-serif', fontSize: 18, color: '#111211' }}>Something went wrong</p>
          <button onClick={reset} style={{ fontSize: 13, color: '#7C5C3E', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
