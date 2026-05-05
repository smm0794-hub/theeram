import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Protect all /curator routes except the main login page itself
  if (pathname.startsWith('/curator/')) {
    const session = req.cookies.get('curator_session')

    if (session?.value !== 'authenticated') {
      const loginUrl = new URL('/curator', req.url)
      loginUrl.searchParams.set('expired', '1')
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/curator/:path+'],
}
