import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const correctPassword = process.env.CURATOR_PASSWORD

    if (!correctPassword || password !== correctPassword) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set('curator_session', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
