import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const COOKIE_NAME = 'sapovnela_session'
const SESSION_DAYS = 30

function getSecret(): string {
  const secret = process.env.SITE_PASSWORD
  if (!secret) throw new Error('SITE_PASSWORD not configured')
  return secret
}

function signToken(): string {
  const secret = getSecret()
  const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const payload = `${expiry}`
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const password = body?.password

  if (!password || password !== process.env.SITE_PASSWORD) {
    return Response.json({ error: 'Incorrect password' }, { status: 401 })
  }

  const token = signToken()
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: '/',
  })

  return Response.json({ ok: true })
}
