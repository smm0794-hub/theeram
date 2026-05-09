import { NextResponse } from 'next/server'

export async function GET() {
  const response = NextResponse.redirect(new URL('/curator-login', process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.theeramspaces.in'))
  response.cookies.delete('curator_session')
  return response
}

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('curator_session')
  return response
}
