import type { Signal, PolyMarket, KalshiMarket, SignalStrength } from '@/types'
import { fetchAllKalshiEconomic } from '@/lib/polymarket/kalshi'

const ARB_THRESHOLD_WEAK = 0.03    // 3 cent gap → weak signal
const ARB_THRESHOLD_MEDIUM = 0.05  // 5 cent gap → medium signal
const ARB_THRESHOLD_STRONG = 0.08  // 8 cent gap → strong signal

function edgeToStrength(edge: number): SignalStrength {
  if (edge >= ARB_THRESHOLD_STRONG) return 'strong'
  if (edge >= ARB_THRESHOLD_MEDIUM) return 'medium'
  return 'weak'
}

// Fuzzy match: does this Kalshi title correspond to this Polymarket question?
function questionsMatch(polyQuestion: string, kalshiTitle: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()

  const poly = normalize(polyQuestion)
  const kalshi = normalize(kalshiTitle)

  // Extract key terms (numbers, key words)
  const polyTerms = poly.split(' ').filter(w => w.length > 3)
  const kalshiTerms = kalshi.split(' ').filter(w => w.length > 3)

  const matches = polyTerms.filter(t => kalshiTerms.includes(t))
  const matchRatio = matches.length / Math.min(polyTerms.length, kalshiTerms.length)

  return matchRatio >= 0.5 // 50% term overlap = likely same event
}

export async function detectArbSignals(
  polyMarkets: PolyMarket[]
): Promise<Signal[]> {
  const signals: Signal[] = []

  // Only scan economic/politics markets — highest overlap with Kalshi
  const relevant = polyMarkets.filter(
    m => ['economics', 'politics', 'crypto'].includes(m.category)
  )

  let kalshiMarkets: KalshiMarket[]
  try {
    kalshiMarkets = await fetchAllKalshiEconomic()
  } catch (e) {
    console.error('[arb] Kalshi fetch failed:', e)
    return []
  }

  for (const poly of relevant) {
    for (const kalshi of kalshiMarkets) {
      if (!questionsMatch(poly.question, kalshi.title)) continue

      // Compare YES prices (both normalized to 0–1)
      const polyYes = poly.yes_price
      const kalshiYes = kalshi.yes_bid // use bid (conservative)

      if (!kalshiYes || kalshiYes === 0) continue

      const gap = Math.abs(polyYes - kalshiYes)
      if (gap < ARB_THRESHOLD_WEAK) continue

      // Determine which side to buy on Poly
      // If poly is cheaper → buy YES on poly (kalshi prices it higher)
      // If poly is more expensive → buy NO on poly (kalshi prices it lower)
      const side = polyYes < kalshiYes ? 'YES' : 'NO'
      const polyPrice = side === 'YES' ? poly.yes_price : poly.no_price
      const fairValue = side === 'YES' ? kalshiYes : 1 - kalshiYes
      const edge = fairValue - polyPrice

      if (edge <= 0) continue

      signals.push({
        type: 'arb',
        strength: edgeToStrength(edge),
        condition_id: poly.condition_id,
        question: poly.question,
        side,
        poly_price: polyPrice,
        fair_value: fairValue,
        edge: Math.round(edge * 1000) / 1000,
        confidence: Math.min(edge / 0.10, 1), // 10-cent gap = 100% confidence
        source: `kalshi_arb:${kalshi.ticker}`,
        metadata: {
          kalshi_ticker: kalshi.ticker,
          kalshi_title: kalshi.title,
          kalshi_yes_bid: kalshi.yes_bid,
          poly_yes_price: poly.yes_price,
          poly_liquidity: poly.liquidity,
          gap,
        },
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2hr
        acted_on: false,
      })
    }
  }

  // Sort by edge descending
  return signals.sort((a, b) => b.edge - a.edge)
}
