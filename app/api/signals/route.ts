import type { NextRequest } from 'next/server'
import { getMarkets, saveSignals, getActiveSignals } from '@/lib/db'
import { runSignalEngine } from '@/lib/signals/engine'
import { notifyStrongSignals } from '@/lib/telegram'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.SCRAPE_SECRET
  if (!secret) return true
  return req.headers.get('x-api-secret') === secret
}

// POST: run signal engine and save new signals
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const options = {
    arb: body.arb !== false,
    fed: body.fed !== false,
    volume: body.volume === true,
    momentum: body.momentum === true,
  }

  try {
    // Get markets from DB (synced earlier)
    const markets = await getMarkets({ limit: 300 })

    if (markets.length === 0) {
      return Response.json({ error: 'No markets in DB — run POST /api/markets first' }, { status: 400 })
    }

    console.log('[signals] markets count:', markets.length, 'sample:', markets[0]?.question?.slice(0,50))
    const result = await runSignalEngine(markets, options)

    // Save all signals
    if (result.signals.length > 0) {
      await saveSignals(result.signals)
    }

    // Notify Telegram for strong signals only
    await notifyStrongSignals(result.signals)

    return Response.json({
      generated: result.signals.length,
      by_type: result.by_type,
      runtime_ms: result.runtime_ms,
      errors: result.errors,
      top_signals: result.signals.slice(0, 5).map(s => ({
        question: s.question,
        type: s.type,
        side: s.side,
        edge: s.edge,
        strength: s.strength,
        source: s.source,
      })),
    })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

// GET: fetch active signals from DB
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 200)

  try {
    const signals = await getActiveSignals(limit)
    return Response.json({ signals, count: signals.length })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
