import type { NextRequest } from "next/server";
import { getMarkets } from "@/lib/db";

/**
 * Cross-platform arbitrage — per-match World Cup advancement markets.
 *
 * Both platforms run "Will [Team] advance past [Opponent]?" markets for
 * each knockout match. These have real volume (millions of dollars on
 * Kalshi alone) and resolve within days, unlike tournament-winner markets
 * which are thin and weeks from resolving.
 *
 * Kalshi series: KXWCADVANCE, ticker format KXWCADVANCE-{YYMonDD}{team1}{team2}
 *   e.g. KXWCADVANCE-26JUN30MEXECU for Mexico vs Ecuador on June 30 2026.
 * Discovered via the public events endpoint, no auth required.
 */

interface KalshiMarket {
  ticker: string;
  yes_sub_title: string;
  no_sub_title: string;
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  volume_fp: string;
  volume_24h_fp: string;
  title: string;
  close_time: string;
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

function isMatchAdvanceQuestion(question: string): boolean {
  const q = question.toLowerCase();
  return q.includes(" vs ") || q.includes(" vs. ") || /win on \d{4}-\d{2}-\d{2}/.test(q);
}

// Extract two team names from a Polymarket "Team A vs Team B" style question
function extractTeams(question: string): [string, string] | null {
  const match = question.match(/(.+?)\s+vs\.?\s+(.+?)(\?|$)/i);
  if (!match) return null;
  return [match[1].trim(), match[2].trim()];
}

function normalizeTeam(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z]/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const [polyMarkets, kalshiMarkets] = await Promise.all([
      getMarkets({ limit: 500 }),
      fetchKalshiAdvanceMarkets(),
    ]);

    const polyMatches = polyMarkets.filter(m => isMatchAdvanceQuestion(m.question ?? ""));

    // Index Kalshi markets by normalized team name for lookup
    const kalshiByTeam = new Map<string, KalshiMarket>();
    for (const m of kalshiMarkets) {
      const team = normalizeTeam(m.yes_sub_title);
      kalshiByTeam.set(team, m);
    }

    const results: MatchComparison[] = [];

    for (const pm of polyMatches) {
      const teams = extractTeams(pm.question ?? "");
      if (!teams) continue;
      const [teamA] = teams;
      const normA = normalizeTeam(teamA);
      const kalshiMatch = kalshiByTeam.get(normA);

      const polyPrice = pm.yes_price;
      const kalshiPrice = kalshiMatch
        ? (parseFloat(kalshiMatch.yes_bid_dollars) + parseFloat(kalshiMatch.yes_ask_dollars)) / 2
        : null;

      const gap = kalshiPrice !== null ? Math.abs(polyPrice - kalshiPrice) : null;
      const gapPct = gap !== null && Math.max(polyPrice, kalshiPrice ?? 0) > 0
        ? gap / Math.max(polyPrice, kalshiPrice ?? 0.001)
        : null;

      results.push({
        matchup: pm.question ?? "",
        team: teamA,
        polymarket_price: polyPrice,
        polymarket_volume: pm.volume_24h ?? 0,
        kalshi_price: kalshiPrice,
        kalshi_volume: kalshiMatch ? parseFloat(kalshiMatch.volume_fp) : 0,
        gap,
        gap_pct: gapPct,
      });
    }

    const matched = results
      .filter(r => r.kalshi_price !== null)
      .sort((a, b) => (b.kalshi_volume + b.polymarket_volume) - (a.kalshi_volume + a.polymarket_volume));

    return Response.json({
      comparisons: matched,
      total_polymarket_matches: polyMatches.length,
      total_kalshi_advance_markets: kalshiMarkets.length,
      matched_count: matched.length,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
