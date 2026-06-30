import type { NextRequest } from 'next/server'
import { fetchAllActiveMarkets } from '@/lib/polymarket/client'
import { upsertMarkets, getMarkets } from '@/lib/db'

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.SCRAPE_SECRET
  if (!secret) return true
  return req.headers.get('x-api-secret') === secret
}

// POST: trigger a full market sync from Polymarket
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const markets = await fetchAllActiveMarkets(5) // up to 500 markets
    const count = await upsertMarkets(markets)

    return Response.json({
      synced: count,
      fetched: markets.length,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}

// GET: fetch markets from DB with filters
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const category = searchParams.get('category') ?? undefined
  const minLiquidity = parseFloat(searchParams.get('min_liquidity') ?? '5000')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 500)

  try {
    const markets = await getMarkets({ category, minLiquidity, limit, active: true })
    return Response.json({ markets, count: markets.length })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
