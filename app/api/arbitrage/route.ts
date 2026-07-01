import type { NextRequest } from "next/server";

/**
 * Cross-platform arbitrage — per-match World Cup moneyline markets.
 *
 * Self-updating: pulls Polymarket's full World Cup series via series_id
 * (no hardcoded match list, works for every match all tournament long)
 * and Kalshi's KXWCADVANCE series, both public, no auth.
 *
 * REAL BIDS, NOT LAST-TRADE PRICES:
 * - Polymarket: Gamma API only gives last-trade price. The actual tradeable
 *   price lives on the separate CLOB API's public order book (still no auth
 *   required — CLOB read endpoints are public). We fetch clobTokenIds from
 *   Gamma, then hit CLOB's /book for each to get the real best ask (the
 *   price you'd actually pay to buy YES right now).
 * - Kalshi: yes/no bid & ask are already directly exposed as
 *   no_ask_dollars — no derivation needed, just use it.
 *
 * The genuine-arbitrage check mirrors the calculator: buy YES on Polymarket
 * (at its live ask) + buy NO on Kalshi (at its live ask). If that combined
 * cost is under $1, it's a locked profit regardless of outcome.
 *
 * Revalidate window is short (15s) since this now reflects live tradeable
 * prices, not a slow-moving snapshot.
 */

const POLYMARKET_SERIES_ID = "11433"; // soccer-fifwc
const REVALIDATE_SECONDS = 15;

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
  clobTokenIds: string; // stringified JSON array: [yesTokenId, noTokenId]
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
  no_bid_dollars: string;
  no_ask_dollars: string;
  volume_fp: string;
  title: string;
}

interface ClobBookLevel {
  price: string;
  size: string;
}

interface ClobBook {
  bids?: ClobBookLevel[];
  asks?: ClobBookLevel[];
}

interface MatchComparison {
  matchup: string;
  team: string;
  polymarket_ask: number | null; // real live price to buy YES on Polymarket now
  polymarket_bid: number | null;
  polymarket_volume: number;
  kalshi_no_ask: number | null; // real live price to buy NO on Kalshi now
  kalshi_no_bid: number | null;
  kalshi_volume: number;
  combined_price: number | null; // polymarket_ask + kalshi_no_ask
  edge: number | null; // 1 - combined_price (before fees)
  is_arbitrage: boolean;
  equivalent_market: boolean; // false = Polymarket side is a reg-time-only fallback, not a true hedge
  stale: boolean; // true if Polymarket live book fetch failed, falling back to last-trade
}

async function fetchPolymarketWorldCupEvents(): Promise<PolyMarketEvent[]> {
  try {
    const res = await fetch(
      `https://gamma-api.polymarket.com/events?series_id=${POLYMARKET_SERIES_ID}&closed=false&limit=100`,
      { next: { revalidate: REVALIDATE_SECONDS } }
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
      { next: { revalidate: REVALIDATE_SECONDS } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.markets ?? [];
  } catch {
    return [];
  }
}

// Live order book for a single Polymarket outcome token — public, no auth.
async function fetchPolymarketBook(tokenId: string): Promise<{ bestBid: number | null; bestAsk: number | null }> {
  try {
    const res = await fetch(`https://clob.polymarket.com/book?token_id=${tokenId}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return { bestBid: null, bestAsk: null };
    const data: ClobBook = await res.json();
    const bids = data.bids ?? [];
    const asks = data.asks ?? [];
    const bestBid = bids.length ? Math.max(...bids.map((b) => parseFloat(b.price))) : null;
    const bestAsk = asks.length ? Math.min(...asks.map((a) => parseFloat(a.price))) : null;
    return { bestBid, bestAsk };
  } catch {
    return { bestBid: null, bestAsk: null };
  }
}

function normalizeTeam(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*advances\s*$/i, "")
    .trim()
    .replace(/[^a-z]/g, "");
}

// Filter sub-markets to just the moneyline "Will X win" questions,
// Kalshi's KXWCADVANCE markets resolve on the WHOLE tie — regulation +
// extra time + penalties. To compare apples-to-apples we need Polymarket's
// equivalent "Team to Advance" market, NOT the "Moneyline REG TIME" market
// (which only resolves on the 90-minute result and excludes ET/penalties).
// Comparing REG-TIME-only prices against Kalshi's advance price creates a
// false arbitrage signal: in a draw-then-penalties scenario, a hedge built
// from REG-TIME YES + advance-NO can lose BOTH legs simultaneously.
function isAdvanceMarket(m: PolySubMarket): boolean {
  if (m.closed) return false;
  const q = m.question.toLowerCase();
  return q.includes("advance");
}

// Fallback only — regulation-time-only moneyline. Kept for events where
// Polymarket hasn't listed a "Team to Advance" market yet, but flagged as
// non-equivalent so the frontend can warn instead of treating it as a
// genuine hedge against Kalshi's advance price.
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

    // First pass: find matched (Polymarket sub-market, Kalshi market) pairs
    type Candidate = {
      matchup: string;
      team: string;
      lastTradePrice: number;
      yesTokenId: string | null;
      polymarketVolume: number;
      kalshiMatch: KalshiMarket;
      equivalentMarket: boolean; // false = fell back to reg-time-only, NOT a true hedge vs Kalshi's advance price
    };
    const candidates: Candidate[] = [];

    function buildCandidates(m: PolySubMarket, event: PolyMarketEvent, equivalentMarket: boolean) {
      let yesPrice = 0;
      let yesTokenId: string | null = null;
      try {
        const prices = JSON.parse(m.outcomePrices);
        yesPrice = parseFloat(prices[0]);
      } catch {
        return;
      }
      try {
        const tokenIds = JSON.parse(m.clobTokenIds);
        yesTokenId = tokenIds?.[0] ?? null;
      } catch {
        yesTokenId = null;
      }

      const team = m.groupItemTitle || m.question.replace(/^Will /i, "").split(/ win on | advance/i)[0];
      const normTeam = normalizeTeam(team);
      const kalshiMatch = kalshiByTeam.get(normTeam);

      if (!kalshiMatch) return; // only show matches we can actually compare

      candidates.push({
        matchup: event.title,
        team,
        lastTradePrice: yesPrice,
        yesTokenId,
        polymarketVolume: m.volume24hr ?? 0,
        kalshiMatch,
        equivalentMarket,
      });
    }

    for (const event of events) {
      if (event.closed) continue;
      const advanceMarkets = (event.markets ?? []).filter(isAdvanceMarket);

      if (advanceMarkets.length > 0) {
        // True apples-to-apples: Polymarket's own "Team to Advance" market,
        // same resolution criteria (reg + ET + penalties) as Kalshi.
        for (const m of advanceMarkets) buildCandidates(m, event, true);
      } else {
        // No advance market listed yet for this event — fall back to the
        // regulation-time moneyline, but flag it so the frontend can warn
        // this is NOT a genuine hedge against Kalshi's advance price.
        const moneylineMarkets = (event.markets ?? []).filter(isMoneylineWinMarket);
        for (const m of moneylineMarkets) buildCandidates(m, event, false);
      }
    }

    // Second pass: pull live Polymarket order books in parallel for every candidate
    const books = await Promise.all(
      candidates.map((c) => (c.yesTokenId ? fetchPolymarketBook(c.yesTokenId) : Promise.resolve({ bestBid: null, bestAsk: null })))
    );

    const results: MatchComparison[] = candidates.map((c, i) => {
      const book = books[i];
      const stale = book.bestAsk === null;
      const polymarketAsk = book.bestAsk ?? c.lastTradePrice; // fall back to last trade if book fetch failed
      const polymarketBid = book.bestBid ?? c.lastTradePrice;

      const kalshiNoAsk = parseFloat(c.kalshiMatch.no_ask_dollars);
      const kalshiNoBid = parseFloat(c.kalshiMatch.no_bid_dollars);

      const combinedPrice = polymarketAsk + kalshiNoAsk;
      const edge = 1 - combinedPrice;

      return {
        matchup: c.matchup,
        team: c.team,
        polymarket_ask: polymarketAsk,
        polymarket_bid: polymarketBid,
        polymarket_volume: c.polymarketVolume,
        kalshi_no_ask: kalshiNoAsk,
        kalshi_no_bid: kalshiNoBid,
        kalshi_volume: parseFloat(c.kalshiMatch.volume_fp) || 0,
        combined_price: combinedPrice,
        edge,
        // Only a genuine hedge if both platforms resolve on the same
        // criteria. A regulation-time-only fallback can look like an edge
        // while actually being able to lose both legs (see draw→penalties).
        is_arbitrage: edge > 0 && c.equivalentMarket,
        equivalent_market: c.equivalentMarket,
        stale,
      };
    });

    const sorted = results.sort((a, b) => (b.edge ?? -1) - (a.edge ?? -1));

    return Response.json({
      comparisons: sorted,
      total_polymarket_matches: events.length,
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
