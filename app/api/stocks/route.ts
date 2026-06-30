import type { NextRequest } from "next/server";

/**
 * Stocks signal source — direct event lookups, not bulk discovery.
 *
 * Polymarket's general /markets feed doesn't reliably surface weekly
 * stock-price-bracket markets (they're buried behind World Cup/crypto
 * volume right now). Instead we hit Gamma's /events?slug= endpoint
 * directly for each ticker's current-week event, using the predictable
 * slug pattern: {ticker}-week-{month}-{day}-{year}
 *
 * Each event groups multiple price-bracket sub-markets (e.g. "$200-$205",
 * "$205-$210"). We surface the bracket with the highest yes_price as the
 * market's current implied close range, plus compare to the real-time
 * Yahoo Finance quote.
 */

const TICKERS = ["NVDA", "TSLA", "AAPL", "META", "GOOGL", "AMZN", "MSFT", "COIN", "SPY"];

interface SubMarket {
  question: string;
  groupItemTitle: string;
  outcomePrices: string;
  volume: string;
  active: boolean;
  closed: boolean;
}

interface GammaEvent {
  id: string;
  slug: string;
  title: string;
  active: boolean;
  closed: boolean;
  volume: number;
  markets: SubMarket[];
}

interface StockResult {
  ticker: string;
  slug: string;
  title: string;
  brackets: Array<{ label: string; yes_price: number; volume: number }>;
  top_bracket: { label: string; yes_price: number } | null;
  real_price: number | null;
  volume_total: number;
}

function getFridayOfThisWeek(): { month: string; day: number; year: number } {
  const now = new Date();
  const day = now.getUTCDay();
  const daysUntilFriday = (5 - day + 7) % 7;
  const friday = new Date(now);
  friday.setUTCDate(now.getUTCDate() + daysUntilFriday);

  const months = [
    "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december",
  ];

  return {
    month: months[friday.getUTCMonth()],
    day: friday.getUTCDate(),
    year: friday.getUTCFullYear(),
  };
}

async function fetchEventBySlug(slug: string): Promise<GammaEvent | null> {
  try {
    const res = await fetch(
      `https://gamma-api.polymarket.com/events?slug=${slug}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

async function fetchRealPrice(ticker: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === "number" ? price : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { month, day, year } = getFridayOfThisWeek();
    const weekSuffix = `week-${month}-${day}-${year}`;

    const results: StockResult[] = [];

    for (const ticker of TICKERS) {
      const slug = `${ticker.toLowerCase()}-${weekSuffix}`;
      const [event, realPrice] = await Promise.all([
        fetchEventBySlug(slug),
        fetchRealPrice(ticker),
      ]);

      if (!event || event.closed) continue;

      const brackets = (event.markets ?? [])
        .map((m) => {
          let yesPrice = 0;
          try {
            const prices = JSON.parse(m.outcomePrices ?? '["0","0"]');
            yesPrice = parseFloat(prices[0]);
          } catch {
            /* skip */
          }
          return {
            label: m.groupItemTitle,
            yes_price: yesPrice,
            volume: parseFloat(m.volume ?? "0"),
          };
        })
        .filter((b) => !isNaN(b.yes_price));

      const topBracket = brackets.length
        ? brackets.reduce((a, b) => (b.yes_price > a.yes_price ? b : a))
        : null;

      results.push({
        ticker,
        slug,
        title: event.title,
        brackets: brackets.sort((a, b) => b.yes_price - a.yes_price),
        top_bracket: topBracket ? { label: topBracket.label, yes_price: topBracket.yes_price } : null,
        real_price: realPrice,
        volume_total: event.volume ?? 0,
      });

      await new Promise((r) => setTimeout(r, 150));
    }

    return Response.json({
      stocks: results.sort((a, b) => b.volume_total - a.volume_total),
      week_slug: weekSuffix,
      tickers_checked: TICKERS.length,
      tickers_found: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
