import type { NextRequest } from 'next/server'
import { getMarkets } from '@/lib/db'

const CME_URL = 'https://www.cmegroup.com/CmeWS/mvc/ProductCalendar/FedWatch.json'

// Upcoming FOMC meeting dates 2026 — fallback if CME scrape fails
const FOMC_FALLBACK = [
  { meeting_date: '2026-07', label: 'July 2026' },
  { meeting_date: '2026-09', label: 'September 2026' },
  { meeting_date: '2026-11', label: 'November 2026' },
  { meeting_date: '2026-12', label: 'December 2026' },
]

async function fetchCME() {
  try {
    const res = await fetch(CME_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`CME ${res.status}`)
    const data = await res.json()
    const raw = data.meetings ?? data ?? []

    return raw.map((m: {
      meeting_date: string
      probabilities?: {
        probDown25?: number
        probDown50?: number
        probNoChange?: number
        probUp25?: number
      }
    }) => {
      const p = m.probabilities ?? {}
      const cut_prob = ((p.probDown25 ?? 0) + (p.probDown50 ?? 0)) / 100
      const hold_prob = (p.probNoChange ?? 0) / 100
      const hike_prob = (p.probUp25 ?? 0) / 100

      // Parse "Jan 2026" → "2026-01"
      const parsed = new Date(m.meeting_date)
      const meeting_date = isNaN(parsed.getTime())
        ? m.meeting_date
        : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`

      return { meeting_date, label: m.meeting_date, cut_prob, hold_prob, hike_prob }
    })
  } catch (e) {
    console.warn('[fed-data] CME fetch failed:', e)
    return null
  }
}

async function getPolyFedPrices(): Promise<Record<string, number>> {
  try {
    // Fetch Fed-specific markets directly from Gamma API
    const searches = [
      'federal reserve rate cut',
      'FOMC rate decision',
      'fed funds rate 2026',
    ]

    const allMarkets: Array<{question: string; outcomePrices: string; conditionId: string}> = []

    for (const q of searches) {
      try {
        const res = await fetch(
          `https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=50&keyword=${encodeURIComponent(q)}`,
          { next: { revalidate: 3600 } }
        )
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) allMarkets.push(...data)
        }
      } catch { continue }
    }

    const byMonth: Record<string, number> = {}
    const months = ['january','february','march','april','may','june',
                    'july','august','september','october','november','december']

    for (const m of allMarkets) {
      const question = m.question?.toLowerCase() ?? ''
      const fedKeywords = ['fed', 'fomc', 'federal reserve', 'rate cut', 'interest rate']
      if (!fedKeywords.some(kw => question.includes(kw))) continue

      let yes_price = 0.5
      try {
        const prices = JSON.parse(m.outcomePrices ?? '["0.5","0.5"]')
        yes_price = parseFloat(prices[0])
      } catch { continue }

      const yearMatch = question.match(/20\d\d/)
      const year = yearMatch ? yearMatch[0] : '2026'
      for (let i = 0; i < months.length; i++) {
        if (question.includes(months[i])) {
          const key = `${year}-${String(i + 1).padStart(2, '0')}`
          if (!byMonth[key]) byMonth[key] = yes_price
        }
      }
    }
    return byMonth
  } catch { return {} }
}

export async function GET(_req: NextRequest) {
  const [cmeData, polyPrices] = await Promise.all([
    fetchCME(),
    getPolyFedPrices(),
  ])

  const meetings = (cmeData ?? FOMC_FALLBACK).map((m: {
    meeting_date: string
    label?: string
    cut_prob?: number
    hold_prob?: number
    hike_prob?: number
  }) => ({
    ...m,
    poly_price: polyPrices[m.meeting_date] ?? null,
    has_poly_data: !!polyPrices[m.meeting_date],
  }))

  return Response.json({
    meetings,
    poly_prices: polyPrices,
    cme_available: !!cmeData,
    timestamp: new Date().toISOString(),
  })
}
