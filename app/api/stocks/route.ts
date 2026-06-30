import type { NextRequest } from 'next/server'
import { getMarkets } from '@/lib/db'
import type { PolyMarket } from '@/types'

/**
 * Stocks signal source.
 *
 * Polymarket runs weekly "What will X hit Week of [date]?" markets with
 * up/down strike prices. We compare the implied probability against the
 * real current price (free, no-auth Yahoo Finance chart API) to see if
 * the market has already moved past or fallen short of the strike —
 * a structural edge that doesn't require predicting anything.
 */

interface StockMarket {
  condition_id: string
  question: string
  ticker: string | null
  strike_price: number | null
  direction: 'up' | 'down' | null
  yes_price: number
  no_price: number
  volume_24h: number
  volume_total: number
  liquidity: number
  end_date: string | null
  real_price: number | null
  edge: number | null
}

const TICKER_PATTERNS: Array<{ ticker: string; aliases: string[] }> = [
  { ticker: 'NVDA', aliases: ['nvidia', 'nvda'] },
  { ticker: 'TSLA', aliases: ['tesla', 'tsla'] },
  { ticker: 'AAPL', aliases: ['apple inc', 'aapl'] },
  { ticker: 'META', aliases: ['meta platforms', 'meta'] },
  { ticker: 'GOOGL', aliases: ['alphabet', 'googl'] },
  { ticker: 'AMZN', aliases: ['amazon', 'amzn'] },
  { ticker: 'MSFT', aliases: ['microsoft', 'msft'] },
  { ticker: 'COIN', aliases: ['coinbase', 'coin'] },
  { ticker: 'SPY', aliases: ['s&p 500', 'spy'] },
  { ticker: 'RKLB', aliases: ['rocket lab', 'rklb'] },
]

function isStockMarket(question: string): boolean {
  const q = question.toLowerCase()
  return /what will .+ hit/.test(q) && (q.includes('week of') || q.includes('in '))
}

function extractTicker(question: string): string | null {
  const q = question.toLowerCase()
  for (const { ticker, aliases } of TICKER_PATTERNS) {
    if (aliases.some(a => q.includes(a))) return ticker
  }
  return null
}

function extractStrikeAndDirection(question: string): { strike: number | null; direction: 'up' | 'down' | null } {
  // Questions don't always embed the strike in the title text directly;
  // Polymarket often shows it as a separate outcome row (↑ $200 / ↓ $188).
  // We fall back to null here — real strike comes from market metadata if available.
  const upMatch = question.match(/(?:above|over|hit)\s*\$?([\d,]+\.?\d*)/i)
  if (upMatch) {
    return { strike: parseFloat(upMatch[1].replace(/,/g, '')), direction: 'up' }
  }
  return { strike: null, direction: null }
}

async function fetchRealPrice(ticker: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        next: { revalidate: 60 }, // cache 1 minute — prices move fast but we don't need sub-minute
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    return typeof price === 'number' ? price : null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const markets = await getMarkets({ limit: 500 })
    const stockMarkets = markets.filter(m => isStockMarket(m.question ?? ''))

    // Group by ticker, take top by volume to limit Yahoo API calls
    const withTicker = stockMarkets
      .map(m => ({ market: m, ticker: extractTicker(m.question ?? '') }))
      .filter((x): x is { market: PolyMarket; ticker: string } => x.ticker !== null)
      .sort((a, b) => (b.market.volume_24h ?? 0) - (a.market.volume_24h ?? 0))
      .slice(0, 15) // cap real-price lookups

    const uniqueTickers = Array.from(new Set(withTicker.map(x => x.ticker)))
    const priceMap: Record<string, number | null> = {}

    await Promise.all(
      uniqueTickers.map(async t => {
        priceMap[t] = await fetchRealPrice(t)
      })
    )

    const results: StockMarket[] = withTicker.map(({ market, ticker }) => {
      const { strike, direction } = extractStrikeAndDirection(market.question ?? '')
      const realPrice = priceMap[ticker] ?? null

      let edge: number | null = null
      if (strike !== null && realPrice !== null) {
        // If real price already exceeds the "up" strike, the market is underpriced if yes_price < 1
        if (direction === 'up' && realPrice >= strike) {
          edge = 1 - market.yes_price
        } else if (direction === 'down' && realPrice <= strike) {
          edge = 1 - market.yes_price
        }
      }

      return {
        condition_id: market.condition_id,
        question: market.question,
        ticker,
        strike_price: strike,
        direction,
        yes_price: market.yes_price,
        no_price: market.no_price,
        volume_24h: market.volume_24h ?? 0,
        volume_total: market.volume_total ?? 0,
        liquidity: market.liquidity ?? 0,
        end_date: market.end_date,
        real_price: realPrice,
        edge,
      }
    })

    const sorted = results.sort((a, b) => (b.edge ?? -1) - (a.edge ?? -1))

    return Response.json({
      stocks: sorted,
      total_stock_markets: stockMarkets.length,
      tickers_priced: uniqueTickers.filter(t => priceMap[t] !== null).length,
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
