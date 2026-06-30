import type { NextRequest } from "next/server";

/**
 * Cross-platform arbitrage — per-match World Cup moneyline markets.
 *
 * Self-updating: pulls Polymarket's full World Cup series via series_id
 * (no hardcoded match list, works for every match all tournament long)
 * and Kalshi's KXWCADVANCE series, both public, no auth.
 *
 * Polymarket's soccer-fifwc series (id 11433) lists every match event as
 * it's created — past, live, and upcoming. We filter for open, moneyline-
 * type sub-markets (team-to-win, not props/player markets) and match them
 * against Kalshi's per-match advance markets by team name.
 */

const POLYMARKET_SERIES_ID = "11433"; // soccer-fifwc

interface PolyMarketEvent {
  id: string;
  slug: string;
  title: string;
  closed: boolean;
  startDate: string;
  markets: PolySubMarket[];
}

interface PolySubMarket {
  question: string;
  outcomePrices: string;
  volume: string;
  volume24hr: number;
  sportsMarketType?: string;
  closed: boolean;
  groupItemTitle: string;
}

interface KalshiMarket {
  ticker: string;
  yes_sub_title: string;
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  volume_fp: string;
  title: string;
}

interface MatchComparison {
  matchup: string;
  team: string;
  polymarket_price: number | null;
  polymarket_volume: number;
  kalshi_price: number | null;
  kalshi_volume: number;
  gap: number | null;
  gap_pct: number | null;
}

async function fetchPolymarketWorldCupEvents(): Promise<PolyMarketEvent[]> {
  try {
    const res = await fetch(
      `https://gamma-api.polymarket.com/events?series_id=${POLYMARKET_SERIES_ID}&closed=false&limit=100`,
      { next: { revalidate: 180 } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

async function fetchKalshiAdvanceMarkets(): Promise<KalshiMarket[]> {
  try {
    const res = await fetch(
      "https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=KXWCADVANCE&status=open&limit=200",
      { next: { revalidate: 180 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.markets ?? [];
  } catch {
    return [];
  }
}

function normalizeTeam(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z]/g, "");
}

// Filter sub-markets to just the moneyline "Will X win" questions,
// skip draws, props, player-specific markets, and already-closed events
function isMoneylineWinMarket(m: PolySubMarket): boolean {
  if (m.closed) return false;
  const q = m.question.toLowerCase();
  return q.startsWith("will ") && q.includes(" win on ");
}

export async function GET(req: NextRequest) {
  try {
    const [events, kalshiMarkets] = await Promise.all([
      fetchPolymarketWorldCupEvents(),
      fetchKalshiAdvanceMarkets(),
    ]);

    const kalshiByTeam = new Map<string, KalshiMarket>();
    for (const m of kalshiMarkets) {
      kalshiByTeam.set(normalizeTeam(m.yes_sub_title), m);
    }

    const results: MatchComparison[] = [];

    for (const event of events) {
      if (event.closed) continue;
      const moneylineMarkets = (event.markets ?? []).filter(isMoneylineWinMarket);

      for (const m of moneylineMarkets) {
        let yesPrice = 0;
        try {
          const prices = JSON.parse(m.outcomePrices);
          yesPrice = parseFloat(prices[0]);
        } catch {
          continue;
        }

        const team = m.groupItemTitle || m.question.replace("Will ", "").split(" win on ")[0];
        const normTeam = normalizeTeam(team);
        const kalshiMatch = kalshiByTeam.get(normTeam);

        if (!kalshiMatch) continue; // only show matches we can actually compare

        const kalshiPrice = (parseFloat(kalshiMatch.yes_bid_dollars) + parseFloat(kalshiMatch.yes_ask_dollars)) / 2;
        const gap = Math.abs(yesPrice - kalshiPrice);
        const gapPct = Math.max(yesPrice, kalshiPrice) > 0 ? gap / Math.max(yesPrice, kalshiPrice, 0.001) : null;

        results.push({
          matchup: event.title,
          team,
          polymarket_price: yesPrice,
          polymarket_volume: m.volume24hr ?? 0,
          kalshi_price: kalshiPrice,
          kalshi_volume: parseFloat(kalshiMatch.volume_fp) || 0,
          gap,
          gap_pct: gapPct,
        });
      }
    }

    const sorted = results.sort(
      (a, b) => (b.kalshi_volume + b.polymarket_volume) - (a.kalshi_volume + a.polymarket_volume)
    );

    return Response.json({
      comparisons: sorted,
      total_polymarket_events: events.length,
      total_kalshi_advance_markets: kalshiMarkets.length,
      matched_count: sorted.length,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
