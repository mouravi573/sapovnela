import type { NextRequest } from 'next/server'
import { getMarkets } from '@/lib/db'
import type { PolyMarket } from '@/types'

/**
 * World Cup signal source — Polymarket only, no external odds API.
 *
 * This surfaces World Cup markets directly: win probabilities,
 * volume, and price movement. No sportsbook comparison yet —
 * that's a future enhancement once this core loop is proven.
 */

interface WorldCupMatch {
  condition_id: string
  question: string
  yes_price: number
  no_price: number
  volume_24h: number
  volume_total: number
  liquidity: number
  end_date: string | null
  category: string
}

function isWorldCupMarket(question: string): boolean {
  const q = question.toLowerCase()
  return q.includes('world cup') || q.includes('fifa')
}

function isMatchMarket(question: string): boolean {
  const q = question.toLowerCase()
  return (q.includes(' vs ') || q.includes(' vs. ') || /win on \d{4}-\d{2}-\d{2}/.test(q))
}

function isTournamentWinnerMarket(question: string): boolean {
  const q = question.toLowerCase()
  return q.includes('win the 2026 fifa world cup')
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const mode = searchParams.get('mode') ?? 'matches' // 'matches' | 'winners'

  try {
    const markets = await getMarkets({ limit: 500 })
    const wcMarkets = markets.filter(m => isWorldCupMarket(m.question ?? ''))

    let filtered: PolyMarket[]
    if (mode === 'winners') {
      filtered = wcMarkets.filter(m => isTournamentWinnerMarket(m.question ?? ''))
    } else {
      filtered = wcMarkets.filter(m => isMatchMarket(m.question ?? ''))
    }

    const sorted = filtered
      .map((m): WorldCupMatch => ({
        condition_id: m.condition_id,
        question: m.question,
        yes_price: m.yes_price,
        no_price: m.no_price,
        volume_24h: m.volume_24h ?? 0,
        volume_total: m.volume_total ?? 0,
        liquidity: m.liquidity ?? 0,
        end_date: m.end_date,
        category: m.category,
      }))
      .sort((a, b) => b.volume_24h - a.volume_24h)
      .slice(0, 20)

    return Response.json({
      mode,
      matches: sorted,
      total_wc_markets: wcMarkets.length,
      total_markets_scanned: markets.length,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
