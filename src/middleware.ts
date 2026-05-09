import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect /curator root AND all /curator/* sub-routes
  if (pathname === '/curator' || pathname.startsWith('/curator/')) {
    const session = req.cookies.get('curator_session')
    if (session?.value !== 'authenticated') {
      const loginUrl = new URL('/curator-login', req.url)
      if (pathname !== '/curator') loginUrl.searchParams.set('expired', '1')
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect agent API routes — require curator session
  if (pathname.startsWith('/api/agent') || pathname.startsWith('/api/town-agent')) {
    const session = req.cookies.get('curator_session')
    if (session?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/curator', '/curator/:path*', '/api/agent', '/api/town-agent'],
}
