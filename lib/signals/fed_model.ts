import type { Signal, PolyMarket, FedProbability } from '@/types'

/**
 * CME FedWatch implied probabilities
 *
 * CME publishes these as JSON at their API.
 * The endpoint below is the documented public data feed.
 * Format: probabilities per FOMC meeting date.
 *
 * Alternative data sources (if CME blocks):
 * - FRED API (free, requires key): https://fred.stlouisfed.org
 * - Quandl/Nasdaq Data Link
 * - Manual entry via env var for quick start
 */

const CME_FEDWATCH_URL =
  'https://www.cmegroup.com/CmeWS/mvc/ProductCalendar/FedWatch.json'

interface CmeRawMeeting {
  meeting_date: string   // 'Jan 2026'
  probabilities: {
    probUp25?: number
    probNoChange?: number
    probDown25?: number
    probDown50?: number
  }
}

export async function fetchFedProbabilities(): Promise<FedProbability[]> {
  try {
    const res = await fetch(CME_FEDWATCH_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 3600 }, // cache 1hr — Fed data moves slowly
    })
    if (!res.ok) throw new Error(`CME fetch ${res.status}`)

    const data = await res.json()
    const meetings: CmeRawMeeting[] = data.meetings ?? data ?? []

    return meetings.map(m => {
      const p = m.probabilities
      const cutProb =
        ((p.probDown25 ?? 0) + (p.probDown50 ?? 0)) / 100
      const holdProb = (p.probNoChange ?? 0) / 100
      const hikeProb = (p.probUp25 ?? 0) / 100

      // Parse meeting date to YYYY-MM
      const parsed = new Date(m.meeting_date)
      const meeting_date = isNaN(parsed.getTime())
        ? m.meeting_date
        : `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`

      return {
        meeting_date,
        cut_prob: cutProb,
        hold_prob: holdProb,
        hike_prob: hikeProb,
        source: 'cme_fedwatch' as const,
        fetched_at: new Date().toISOString(),
      }
    })
  } catch (e) {
    console.error('[fed_model] CME fetch failed:', e)
    // Fallback: read from env vars set manually
    const envProb = process.env.FED_CUT_PROB_NEXT
    if (envProb) {
      return [{
        meeting_date: process.env.FED_NEXT_MEETING ?? 'unknown',
        cut_prob: parseFloat(envProb),
        hold_prob: 1 - parseFloat(envProb),
        hike_prob: 0,
        source: 'cme_fedwatch',
        fetched_at: new Date().toISOString(),
      }]
    }
    return []
  }
}

// Keywords that identify Fed rate markets on Polymarket
const FED_KEYWORDS = [
  'fed cut', 'fed rate', 'federal reserve', 'fomc', 'rate cut',
  'interest rate cut', 'fed funds', 'basis points'
]

function isFedMarket(question: string): boolean {
  const q = question.toLowerCase()
  return FED_KEYWORDS.some(kw => q.includes(kw))
}

// Extract target meeting date from question if possible
function extractMeetingMonth(question: string): string | null {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ]
  const q = question.toLowerCase()
  for (let i = 0; i < months.length; i++) {
    if (q.includes(months[i])) {
      const year = q.match(/20\d\d/)?.[0] ?? new Date().getFullYear().toString()
      return `${year}-${String(i + 1).padStart(2, '0')}`
    }
  }
  return null
}

const MODEL_THRESHOLD = 0.05 // minimum 5-cent edge to generate signal

export async function generateFedSignals(
  polyMarkets: PolyMarket[]
): Promise<Signal[]> {
  const signals: Signal[] = []

  const fedMarkets = polyMarkets.filter(m => isFedMarket(m.question) && !m.closed)
  if (fedMarkets.length === 0) return []

  const fedProbs = await fetchFedProbabilities()
  if (fedProbs.length === 0) {
    console.warn('[fed_model] No CME data — skipping Fed signals')
    return []
  }

  for (const market of fedMarkets) {
    const targetMonth = extractMeetingMonth(market.question)
    const fedData = targetMonth
      ? fedProbs.find(f => f.meeting_date === targetMonth)
      : fedProbs[0] // use next meeting as default

    if (!fedData) continue

    const q = market.question.toLowerCase()

    // Determine what the market is asking
    // "Will Fed cut by X?" → compare to cut_prob
    // "Will Fed hold?" → compare to hold_prob
    const isAboutCut = q.includes('cut') || q.includes('lower') || q.includes('reduce')
    const isAboutHold = q.includes('hold') || q.includes('unchanged') || q.includes('pause')
    const isAboutHike = q.includes('hike') || q.includes('raise') || q.includes('increase')

    let modelProb: number
    if (isAboutCut) modelProb = fedData.cut_prob
    else if (isAboutHold) modelProb = fedData.hold_prob
    else if (isAboutHike) modelProb = fedData.hike_prob
    else continue

    const polyYes = market.yes_price
    const edge = modelProb - polyYes

    if (Math.abs(edge) < MODEL_THRESHOLD) continue

    const side = edge > 0 ? 'YES' : 'NO'
    const polyPrice = side === 'YES' ? market.yes_price : market.no_price
    const fairValue = side === 'YES' ? modelProb : 1 - modelProb
    const absEdge = Math.abs(edge)

    signals.push({
      type: 'model',
      strength: absEdge >= 0.10 ? 'strong' : absEdge >= 0.06 ? 'medium' : 'weak',
      condition_id: market.condition_id,
      question: market.question,
      side,
      poly_price: polyPrice,
      fair_value: fairValue,
      edge: Math.round(absEdge * 1000) / 1000,
      confidence: Math.min(absEdge / 0.12, 1),
      source: 'cme_fedwatch',
      metadata: {
        model_prob: modelProb,
        poly_price: polyYes,
        fed_meeting: fedData.meeting_date,
        cut_prob: fedData.cut_prob,
        hold_prob: fedData.hold_prob,
        hike_prob: fedData.hike_prob,
      },
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6hr
      acted_on: false,
    })
  }

  return signals.sort((a, b) => b.edge - a.edge)
}
