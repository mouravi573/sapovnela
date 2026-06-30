import type { PolyMarket, Orderbook, PriceTick, MarketCategory } from '@/types'

const CLOB_BASE = 'https://clob.polymarket.com'
const GAMMA_BASE = 'https://gamma-api.polymarket.com' // enriched market metadata

// ─── Geoblock check ──────────────────────────────────────────────────────────

export async function checkGeoblock(): Promise<{ blocked: boolean; country: string }> {
  try {
    const res = await fetch(`https://polymarket.com/api/geoblock`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return { blocked: false, country: 'unknown' }
    return res.json()
  } catch {
    return { blocked: false, country: 'unknown' }
  }
}

// ─── Markets ─────────────────────────────────────────────────────────────────

interface RawClobMarket {
  condition_id?: string
  conditionId?: string
  question?: string
  description?: string
  end_date_iso?: string
  endDate?: string
  market_slug?: string
  slug?: string
  tokens?: Array<{ token_id: string; outcome: string; price: string }>
  outcomes?: string[]
  outcomePrices?: string[]
  volume?: string
  volumeNum?: number
  liquidity?: string
  liquidityNum?: number
  active?: boolean
  closed?: boolean
  archived?: boolean
  enable_order_book?: boolean
  category?: string
  groupItemTitle?: string
  questionID?: string
}

function normalizeCategory(raw?: string): MarketCategory {
  const map: Record<string, MarketCategory> = {
    economics: 'economics',
    economy: 'economics',
    politics: 'politics',
    political: 'politics',
    sports: 'sports',
    sport: 'sports',
    crypto: 'crypto',
    cryptocurrency: 'crypto',
    weather: 'weather',
    science: 'science',
    technology: 'science',
  }
  return map[raw?.toLowerCase() ?? ''] ?? 'other'
}

function rawToMarket(raw: RawClobMarket): PolyMarket | null {
  const condition_id = raw.condition_id || raw.conditionId
  const question = raw.question
  if (!condition_id || !question) return null

  // Handle Gamma API format (outcomePrices array) or CLOB format (tokens array)
  let yes_price = 0.5
  let no_price = 0.5

  if (raw.tokens && raw.tokens.length >= 2) {
    const yesToken = raw.tokens.find(t => t.outcome === 'Yes' || t.outcome === 'YES') ?? raw.tokens[0]
    const noToken  = raw.tokens.find(t => t.outcome === 'No'  || t.outcome === 'NO')  ?? raw.tokens[1]
    yes_price = parseFloat(yesToken?.price ?? '0.5')
    no_price  = parseFloat(noToken?.price  ?? '0.5')
  } else if (raw.outcomePrices && raw.outcomePrices.length >= 2) {
    yes_price = parseFloat(raw.outcomePrices[0])
    no_price  = parseFloat(raw.outcomePrices[1])
  }

  if (isNaN(yes_price) || isNaN(no_price)) return null

  const closed = raw.closed ?? raw.archived ?? false

  return {
    condition_id,
    question,
    description: raw.description,
    end_date: raw.end_date_iso || raw.endDate || null,
    category: normalizeCategory(raw.category),
    yes_price,
    no_price,
    volume_24h: 0,
    volume_total: raw.volumeNum ?? parseFloat(raw.volume ?? '0'),
    liquidity: raw.liquidityNum ?? parseFloat(raw.liquidity ?? '0'),
    active: raw.active ?? !closed,
    closed,
    fetched_at: new Date(Date.now()).toISOString(),
  }
}

export async function fetchMarkets(params?: {
  category?: MarketCategory
  active?: boolean
  limit?: number
  next_cursor?: string
}): Promise<{ markets: PolyMarket[]; next_cursor?: string }> {
  const qs = new URLSearchParams()
  if (params?.active !== undefined) qs.set('active', String(params.active))
  if (params?.limit) qs.set('limit', String(params.limit))
  if (params?.next_cursor) qs.set('next_cursor', params.next_cursor)

  const res = await fetch(`${CLOB_BASE}/markets?${qs}`, {
    next: { revalidate: 0 }, // always fresh
  })
  if (!res.ok) throw new Error(`Polymarket markets fetch failed: ${res.status}`)

  const data = await res.json()
  const rawMarkets: RawClobMarket[] = data.data ?? []

  const markets = rawMarkets
    .map(rawToMarket)
    .filter((m): m is PolyMarket => m !== null)
    // Only markets with meaningful liquidity (>$1k) and volume
    .filter(m => !m.closed)

  return { markets, next_cursor: data.next_cursor }
}

export async function fetchMarket(conditionId: string): Promise<PolyMarket | null> {
  const res = await fetch(`${CLOB_BASE}/markets/${conditionId}`, {
    next: { revalidate: 0 },
  })
  if (!res.ok) return null
  const raw: RawClobMarket = await res.json()
  return rawToMarket(raw)
}

// ─── Orderbook ────────────────────────────────────────────────────────────────

export async function fetchOrderbook(conditionId: string): Promise<Orderbook | null> {
  const res = await fetch(`${CLOB_BASE}/markets/${conditionId}/orderbook`, {
    next: { revalidate: 0 },
  })
  if (!res.ok) return null

  const data = await res.json()
  const book = data.orderbook ?? data

  const parseLevel = (arr: [number, number][]): Array<{ price: number; size: number }> =>
    (arr ?? []).map(([price, size]) => ({ price: price / 100, size }))

  const yesBids = parseLevel(book.bids ?? [])
  const yesAsks = parseLevel(book.asks ?? [])

  const bestBid = yesBids[0]?.price ?? 0
  const bestAsk = yesAsks[0]?.price ?? 1
  const spread = bestAsk - bestBid
  const mid_price = (bestBid + bestAsk) / 2

  return {
    condition_id: conditionId,
    yes_bids: yesBids.slice(0, 10),
    yes_asks: yesAsks.slice(0, 10),
    no_bids: yesAsks.map(l => ({ price: 1 - l.price, size: l.size })), // inverse
    no_asks: yesBids.map(l => ({ price: 1 - l.price, size: l.size })),
    spread,
    mid_price,
    fetched_at: new Date().toISOString(),
  }
}

// ─── Price history ────────────────────────────────────────────────────────────

export async function fetchPriceHistory(
  conditionId: string,
  fidelity: 60 | 3600 = 3600, // seconds between points
): Promise<PriceTick[]> {
  const res = await fetch(
    `${CLOB_BASE}/prices-history?market=${conditionId}&fidelity=${fidelity}`,
    { next: { revalidate: 300 } }
  )
  if (!res.ok) return []

  const data = await res.json()
  const history = data.history ?? []

  return history.map((h: { t: number; p: number }) => ({
    condition_id: conditionId,
    yes_price: h.p,
    no_price: 1 - h.p,
    volume: 0,
    timestamp: new Date(h.t * 1000).toISOString(),
  }))
}

// ─── All active markets (paginated) ──────────────────────────────────────────

interface GammaMarket {
  id: string
  conditionId: string
  question: string
  description?: string
  endDateIso?: string
  endDate?: string
  outcomePrices?: string   // JSON string e.g. '["0.515", "0.485"]'
  volumeNum?: number
  liquidityNum?: number
  volume24hr?: number
  active?: boolean
  closed?: boolean
  archived?: boolean
  category?: string
  groupItemTitle?: string
}

function gammaToMarket(raw: GammaMarket): PolyMarket | null {
  if (!raw.conditionId || !raw.question) return null
  if (raw.closed || raw.archived) return null

  // outcomePrices is a JSON string: '["0.515", "0.485"]'
  let yes_price = 0.5
  let no_price = 0.5
  try {
    const prices: string[] = typeof raw.outcomePrices === 'string'
      ? JSON.parse(raw.outcomePrices)
      : (raw.outcomePrices ?? [])
    yes_price = parseFloat(prices[0] ?? '0.5')
    no_price  = parseFloat(prices[1] ?? '0.5')
  } catch { /* keep defaults */ }

  if (isNaN(yes_price) || isNaN(no_price)) return null

  return {
    condition_id: raw.conditionId,
    question: raw.question,
    description: raw.description,
    end_date: raw.endDateIso ? `${raw.endDateIso}T00:00:00Z` : (raw.endDate ?? null),
    category: normalizeCategory(raw.category),
    yes_price,
    no_price,
    volume_24h: raw.volume24hr ?? 0,
    volume_total: raw.volumeNum ?? 0,
    liquidity: raw.liquidityNum ?? 0,
    active: raw.active ?? true,
    closed: raw.closed ?? false,
    fetched_at: new Date(Date.now()).toISOString(),
  }
}

export async function fetchAllActiveMarkets(maxPages = 10): Promise<PolyMarket[]> {
  const all: PolyMarket[] = []

  for (let offset = 0; offset < maxPages * 100; offset += 100) {
    try {
      const url = `https://gamma-api.polymarket.com/markets?closed=false&archived=false&active=true&limit=100&offset=${offset}`
      const res = await fetch(url, { next: { revalidate: 0 } })
      if (!res.ok) break

      const raw: GammaMarket[] = await res.json()
      if (!Array.isArray(raw) || raw.length === 0) break

      const parsed = raw
        .map(gammaToMarket)
        .filter((m): m is PolyMarket => m !== null)

      all.push(...parsed)
      if (raw.length < 100) break
      await new Promise(r => setTimeout(r, 200))
    } catch (e) {
      console.error('[fetchAllActiveMarkets] error:', e)
      break
    }
  }

  return all
}
