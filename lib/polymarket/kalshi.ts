import type { KalshiMarket } from '@/types'

const BASE = 'https://external-api.kalshi.com/trade-api/v2'

interface RawKalshiMarket {
  ticker: string
  title: string
  yes_bid?: number    // in cents (0-100)
  yes_ask?: number
  volume?: number
  category?: string
  status?: string
}

export async function fetchKalshiMarkets(params?: {
  series?: string
  status?: 'open' | 'all'
  limit?: number
}): Promise<KalshiMarket[]> {
  const qs = new URLSearchParams()
  if (params?.series) qs.set('series_ticker', params.series)
  qs.set('status', params?.status ?? 'open')
  qs.set('limit', String(params?.limit ?? 100))

  const res = await fetch(`${BASE}/markets?${qs}`, {
    next: { revalidate: 60 },
  })
  if (!res.ok) throw new Error(`Kalshi fetch failed: ${res.status}`)

  const data = await res.json()
  const raw: RawKalshiMarket[] = data.markets ?? []

  return raw
    .filter(m => m.status === 'open' || !m.status)
    .map(m => ({
      ticker: m.ticker,
      title: m.title,
      yes_bid: (m.yes_bid ?? 0) / 100,   // cents → 0–1
      yes_ask: (m.yes_ask ?? 0) / 100,
      volume: m.volume ?? 0,
      category: m.category ?? 'other',
      fetched_at: new Date().toISOString(),
    }))
}

// Key Kalshi series to monitor for arb vs Polymarket
export const KALSHI_SERIES = {
  FED: 'KXFED',          // Federal Reserve rate decisions
  CPI: 'KXCPI',          // CPI inflation
  NFP: 'KXNFP',          // Non-Farm Payrolls
  GDP: 'KXGDP',          // GDP growth
  UNEMPLOYMENT: 'KXUNEM', // Unemployment rate
  SP500: 'KXSP500',      // S&P 500 level
  BTC: 'KXBTC',          // Bitcoin price
  POTUS: 'KXPOTUS',      // Presidential approval
}

export async function fetchAllKalshiEconomic(): Promise<KalshiMarket[]> {
  const series = Object.values(KALSHI_SERIES)
  const results = await Promise.allSettled(
    series.map(s => fetchKalshiMarkets({ series: s }))
  )

  return results
    .filter((r): r is PromiseFulfilledResult<KalshiMarket[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
}
