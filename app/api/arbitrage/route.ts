import type { NextRequest } from "next/server";
import { getMarkets } from "@/lib/db";

/**
 * Cross-platform arbitrage — World Cup tournament winner markets.
 *
 * Both Polymarket and Kalshi run independent "Will [team] win the 2026
 * World Cup?" markets. Since both ask the identical real-world question,
 * any meaningful price gap between them is a genuine arbitrage signal —
 * not a judgment call, just two markets disagreeing on the same fact.
 *
 * Kalshi's market data is fully public, no auth required:
 * https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=KXMENWORLDCUP
 *
 * Country name normalization handles the small differences between how
 * each platform labels teams (e.g. "Congo DR" vs "DR Congo").
 */

interface KalshiMarket {
  ticker: string;
  yes_sub_title: string;
  yes_bid_dollars: string;
  yes_ask_dollars: string;
  volume_fp: string;
  volume_24h_fp: string;
}

interface ArbResult {
  team: string;
  polymarket_price: number | null;
  polymarket_volume: number;
  kalshi_price: number | null;
  kalshi_volume: number;
  gap: number | null;
  gap_pct: number | null;
}

// Normalize team names between platforms — they don't always match exactly
const NAME_MAP: Record<string, string> = {
  "congo dr": "congo dr",
  "dr congo": "congo dr",
  "democratic republic of the congo": "congo dr",
  "bosnia and herzegovina": "bosnia-herzegovina",
  "bosnia-herzegovina": "bosnia-herzegovina",
  "ivory coast": "ivory coast",
  "côte d'ivoire": "ivory coast",
  "cote d'ivoire": "ivory coast",
  "usa": "usa",
  "united states": "usa",
};

function normalizeTeam(name: string): string {
  const lower = name.toLowerCase().trim();
  return NAME_MAP[lower] ?? lower;
}

async function fetchKalshiWorldCupMarkets(): Promise<KalshiMarket[]> {
  try {
    const res = await fetch(
      "https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker=KXMENWORLDCUP&status=open&limit=100",
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.markets ?? [];
  } catch {
    return [];
  }
}

function isWorldCupWinnerMarket(question: string): boolean {
  const q = question.toLowerCase();
  return q.includes("win the 2026 fifa world cup") || q.includes("win the 2026 men's world cup");
}

export async function GET(req: NextRequest) {
  try {
    const [polyMarkets, kalshiMarkets] = await Promise.all([
      getMarkets({ limit: 500 }),
      fetchKalshiWorldCupMarkets(),
    ]);

    const polyWinners = polyMarkets.filter(m => isWorldCupWinnerMarket(m.question ?? ""));

    const kalshiByTeam = new Map<string, KalshiMarket>();
    for (const m of kalshiMarkets) {
      const team = normalizeTeam(m.yes_sub_title);
      kalshiByTeam.set(team, m);
    }

    const results: ArbResult[] = polyWinners.map(pm => {
      const team = (pm.question ?? "")
        .replace("Will ", "")
        .replace(" win the 2026 FIFA World Cup?", "")
        .trim();
      const normalizedTeam = normalizeTeam(team);
      const kalshiMatch = kalshiByTeam.get(normalizedTeam);

      const polyPrice = pm.yes_price;
      const kalshiPrice = kalshiMatch
        ? (parseFloat(kalshiMatch.yes_bid_dollars) + parseFloat(kalshiMatch.yes_ask_dollars)) / 2
        : null;

      const gap = kalshiPrice !== null ? Math.abs(polyPrice - kalshiPrice) : null;
      const gapPct = gap !== null && Math.max(polyPrice, kalshiPrice ?? 0) > 0
        ? gap / Math.max(polyPrice, kalshiPrice ?? 0.001)
        : null;

      return {
        team,
        polymarket_price: polyPrice,
        polymarket_volume: pm.volume_24h ?? 0,
        kalshi_price: kalshiPrice,
        kalshi_volume: kalshiMatch ? parseFloat(kalshiMatch.volume_24h_fp) : 0,
        gap,
        gap_pct: gapPct,
      };
    });

    const sorted = results
      .filter(r => r.kalshi_price !== null)
      .sort((a, b) => (b.gap ?? 0) - (a.gap ?? 0));

    return Response.json({
      comparisons: sorted,
      total_polymarket_teams: polyWinners.length,
      total_kalshi_markets: kalshiMarkets.length,
      matched_teams: sorted.length,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
