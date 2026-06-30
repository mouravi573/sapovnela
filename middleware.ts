import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import crypto from 'crypto'

const COOKIE_NAME = 'sapovnela_session'

function isValidToken(token: string | undefined, secret: string): boolean {
  if (!token) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false

  const expectedSig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  if (sig !== expectedSig) return false

  const expiry = parseInt(payload, 10)
  if (isNaN(expiry) || Date.now() > expiry) return false

  return true
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow these paths through, unauthenticated
  const publicPaths = ['/login', '/api/auth/login', '/favicon.ico', '/apple-icon.png']
  if (publicPaths.some(p => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Allow Next.js internals and static assets
  if (pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next()
  }

  const secret = process.env.SITE_PASSWORD
  if (!secret) {
    // Fail open in dev if not configured, fail closed in production
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Site password not configured', { status: 500 })
    }
    return NextResponse.next()
  }

  const token = req.cookies.get(COOKIE_NAME)?.value
  if (isValidToken(token, secret)) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', req.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|apple-icon.png).*)',
  ],
}
