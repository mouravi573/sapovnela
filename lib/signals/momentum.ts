import type { Signal, PolyMarket, PriceTick } from '@/types'
import { fetchPriceHistory } from '@/lib/polymarket/client'

const VOLUME_SPIKE_MULTIPLIER = 3    // 3x average = spike
const MOMENTUM_THRESHOLD = 0.05      // 5-cent move in last 4 hours
const MIN_LIQUIDITY = 10_000         // only liquid markets

export async function detectVolumeSpikes(
  markets: PolyMarket[]
): Promise<Signal[]> {
  const signals: Signal[] = []

  const liquid = markets.filter(m => !m.closed)

  for (const market of liquid.slice(0, 50)) { // cap API calls
    try {
      const history = await fetchPriceHistory(market.condition_id, 3600) // hourly
      if (history.length < 24) continue // need at least 24 hours

      // Average hourly volume from last 7 days
      const avgVolume =
        history.slice(-168).reduce((s, t) => s + t.volume, 0) / 168

      const recentVolume =
        history.slice(-4).reduce((s, t) => s + t.volume, 0) / 4 // last 4hr avg

      if (avgVolume === 0 || recentVolume < avgVolume * VOLUME_SPIKE_MULTIPLIER) continue

      signals.push({
        type: 'volume_spike',
        strength: recentVolume > avgVolume * 6 ? 'strong' : 'medium',
        condition_id: market.condition_id,
        question: market.question,
        side: 'YES', // volume spikes often precede resolution — watch both sides
        poly_price: market.yes_price,
        fair_value: market.yes_price, // no directional model — just alert
        edge: 0,
        confidence: Math.min(recentVolume / (avgVolume * 10), 1),
        source: 'volume_spike',
        metadata: {
          avg_volume_hourly: Math.round(avgVolume),
          recent_volume_hourly: Math.round(recentVolume),
          spike_ratio: Math.round(recentVolume / avgVolume * 10) / 10,
          market_liquidity: market.liquidity,
        },
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1hr
        acted_on: false,
      })

      await new Promise(r => setTimeout(r, 100)) // polite
    } catch {
      continue
    }
  }

  return signals
}

export async function detectMomentum(
  markets: PolyMarket[]
): Promise<Signal[]> {
  const signals: Signal[] = []

  const liquid = markets.filter(m => !m.closed)

  for (const market of liquid.slice(0, 50)) {
    try {
      const history = await fetchPriceHistory(market.condition_id, 3600)
      if (history.length < 6) continue

      const priceNow = history[history.length - 1]?.yes_price ?? market.yes_price
      const price4hAgo = history[history.length - 5]?.yes_price ?? priceNow
      const move = priceNow - price4hAgo

      if (Math.abs(move) < MOMENTUM_THRESHOLD) continue

      // Momentum: follow the move if strong
      const side = move > 0 ? 'YES' : 'NO'
      const polyPrice = side === 'YES' ? market.yes_price : market.no_price

      signals.push({
        type: 'momentum',
        strength: Math.abs(move) >= 0.10 ? 'strong' : 'medium',
        condition_id: market.condition_id,
        question: market.question,
        side,
        poly_price: polyPrice,
        fair_value: polyPrice + Math.abs(move) * 0.3, // expect 30% continuation
        edge: Math.abs(move) * 0.3,
        confidence: Math.min(Math.abs(move) / 0.15, 0.7), // momentum is weaker signal
        source: 'momentum_4h',
        metadata: {
          price_4h_ago: price4hAgo,
          price_now: priceNow,
          move_4h: Math.round(move * 1000) / 1000,
          direction: move > 0 ? 'up' : 'down',
        },
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2hr
        acted_on: false,
      })
    } catch {
      continue
    }
  }

  return signals
}
