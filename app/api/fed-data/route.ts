import type { NextRequest } from "next/server";
import { getMarkets } from "@/lib/db";

/**
 * Fed Rates signal source — Polymarket only, same pattern as World Cup/Stocks.
 *
 * The earlier version of this route depended on scraping CME FedWatch,
 * which proved unreliable. This version reads directly from Polymarket's
 * own Fed Rates category instead — markets like "Fed Decision in July?"
 * and "How many Fed rate cuts in 2026?" already encode the crowd's
 * probability distribution without needing an external benchmark.
 *
 * Edge here is narrower than World Cup/Stocks (no second data source to
 * compare against yet), so this surfaces the raw distribution and lets
 * the operator judge it against their own read of Fed commentary.
 */

function isFedMarket(question: string): boolean {
  const q = question.toLowerCase();
  return (
    q.includes("fed decision") ||
    q.includes("fed rate") ||
    q.includes("fomc") ||
    q.includes("rate cut") ||
    q.includes("rate hike") ||
    (q.includes("fed") && q.includes("cut"))
  );
}

export async function GET(req: NextRequest) {
  try {
    const markets = await getMarkets({ limit: 500 });
    const fedMarkets = markets
      .filter((m) => isFedMarket(m.question ?? ""))
      .map((m) => ({
        condition_id: m.condition_id,
        question: m.question,
        yes_price: m.yes_price,
        no_price: m.no_price,
        volume_24h: m.volume_24h ?? 0,
        volume_total: m.volume_total ?? 0,
        liquidity: m.liquidity ?? 0,
        end_date: m.end_date,
      }))
      .sort((a, b) => b.volume_24h - a.volume_24h);

    return Response.json({
      markets: fedMarkets,
      total_fed_markets: fedMarkets.length,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
