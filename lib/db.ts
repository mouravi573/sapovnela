import { supabase, getServiceClient } from "./supabase";
import type {
  PolyMarket,
  Signal,
  Order,
  Position,
  SystemStats,
  CalibrationBucket,
} from "@/types";

// ─── Markets ─────────────────────────────────────────────────────────────────

export async function upsertMarkets(markets: PolyMarket[]): Promise<number> {
  if (!markets.length) return 0;
  const db = getServiceClient();

  // Deduplicate by condition_id — keep last occurrence
  const seen = new Map<string, PolyMarket>();
  for (const m of markets) seen.set(m.condition_id, m);
  const deduped = Array.from(seen.values());

  // Batch in chunks of 100
  let total = 0;
  for (let i = 0; i < deduped.length; i += 100) {
    const chunk = deduped.slice(i, i + 100);
    const { count, error } = await db
      .from("markets")
      .upsert(chunk, { onConflict: "condition_id" })
      .select("condition_id");
    if (error) throw new Error(`upsertMarkets: ${error.message}`);
    total += chunk.length;
  }
  return total;
}

export async function getMarkets(params?: {
  category?: string;
  active?: boolean;
  minLiquidity?: number;
  limit?: number;
}): Promise<PolyMarket[]> {
  let q = supabase.from("markets").select("*");

  if (params?.category) q = q.eq("category", params.category);
  // active filter removed — Polymarket sets active=false on many live markets
  if (params?.minLiquidity) q = q.gte("liquidity", params.minLiquidity);

  q = q.order("volume_24h", { ascending: false }).limit(params?.limit ?? 200);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as PolyMarket[];
}

export async function getMarketById(
  conditionId: string,
): Promise<PolyMarket | null> {
  const { data } = await supabase
    .from("markets")
    .select("*")
    .eq("condition_id", conditionId)
    .single();
  return data as PolyMarket | null;
}

// ─── Signals ─────────────────────────────────────────────────────────────────

export async function saveSignals(signals: Signal[]): Promise<number> {
  if (!signals.length) return 0;
  const db = getServiceClient();

  const { count, error } = await db
    .from("signals")
    .insert(signals)
    .select("id", { count: "exact", head: true });

  if (error) throw new Error(`saveSignals: ${error.message}`);
  return count ?? signals.length;
}

export async function getActiveSignals(limit = 50): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .eq("acted_on", false)
    .gt("expires_at", new Date(Date.now()).toISOString())
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as Signal[];
}

export async function markSignalActedOn(signalId: string): Promise<void> {
  const db = getServiceClient();
  await db.from("signals").update({ acted_on: true }).eq("id", signalId);
}

export async function getSignalHistory(limit = 100): Promise<Signal[]> {
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as Signal[];
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function saveOrder(order: Order): Promise<string> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("orders")
    .insert(order)
    .select("id")
    .single();

  if (error) throw new Error(`saveOrder: ${error.message}`);
  return data.id;
}

export async function updateOrderStatus(
  orderId: string,
  updates: Partial<Order>,
): Promise<void> {
  const db = getServiceClient();
  await db.from("orders").update(updates).eq("id", orderId);
}

export async function getOrders(limit = 100): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as Order[];
}

// ─── Positions ────────────────────────────────────────────────────────────────

export async function upsertPosition(position: Position): Promise<void> {
  const db = getServiceClient();
  const { error } = await db
    .from("positions")
    .upsert(position, { onConflict: "condition_id" });
  if (error) throw new Error(`upsertPosition: ${error.message}`);
}

export async function getOpenPositions(): Promise<Position[]> {
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .eq("status", "open")
    .order("opened_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Position[];
}

export async function getClosedPositions(limit = 50): Promise<Position[]> {
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .in("status", ["closed", "resolved"])
    .order("closed_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []) as Position[];
}

// ─── Stats & calibration ──────────────────────────────────────────────────────

export async function getSystemStats(): Promise<SystemStats> {
  const [marketsRes, signalsRes, positionsRes, closedRes] = await Promise.all([
    supabase.from("markets").select("*", { count: "exact", head: true }),
    supabase
      .from("signals")
      .select("*", { count: "exact", head: true })
      .eq("acted_on", false)
      .gt("expires_at", new Date(Date.now()).toISOString()),
    supabase.from("positions").select("*").eq("status", "open"),
    supabase
      .from("positions")
      .select("realized_pnl, resolution")
      .in("status", ["closed", "resolved"]),
  ]);

  const openPositions = (positionsRes.data ?? []) as Position[];
  const closedPositions = (closedRes.data ?? []) as Array<{
    realized_pnl: number;
    resolution: string;
  }>;

  const totalDeployed = openPositions.reduce((s, p) => s + p.cost_usdc, 0);
  const unrealizedPnl = openPositions.reduce((s, p) => s + p.unrealized_pnl, 0);
  const realizedPnl = closedPositions.reduce(
    (s, p) => s + (p.realized_pnl ?? 0),
    0,
  );

  const wins = closedPositions.filter((p) => p.resolution === "WIN").length;
  const winRate =
    closedPositions.length > 0 ? wins / closedPositions.length : 0;

  return {
    markets_tracked: marketsRes.count ?? 0,
    active_signals: signalsRes.count ?? 0,
    open_positions: openPositions.length,
    total_deployed_usdc: totalDeployed,
    unrealized_pnl: unrealizedPnl,
    realized_pnl: realizedPnl,
    win_rate: winRate,
    signal_accuracy: winRate, // placeholder — refine with calibration analysis
    last_sync: new Date(Date.now()).toISOString(),
  };
}

export async function getCalibration(): Promise<CalibrationBucket[]> {
  // Fetch all resolved positions with their signal's fair_value
  const { data } = await supabase
    .from("positions")
    .select("resolution, avg_entry_price, side")
    .eq("status", "resolved");

  if (!data || data.length === 0) return [];

  // Group into 10% probability buckets
  const buckets: Record<string, { wins: number; total: number; mid: number }> =
    {};

  for (const p of data as Array<{
    resolution: string;
    avg_entry_price: number;
    side: string;
  }>) {
    const pred = Math.round(p.avg_entry_price * 10) * 10; // nearest 10%
    const key = `${pred - 10}-${pred}%`;
    if (!buckets[key])
      buckets[key] = { wins: 0, total: 0, mid: (pred - 5) / 100 };
    buckets[key].total++;
    if (p.resolution === "WIN") buckets[key].wins++;
  }

  return Object.entries(buckets).map(([range, b]) => ({
    predicted_range: range,
    predicted_mid: b.mid,
    actual_win_rate: b.total > 0 ? b.wins / b.total : 0,
    sample_count: b.total,
  }));
}

// ─── Price ticks ──────────────────────────────────────────────────────────────

export async function savePriceTicks(
  ticks: Array<{ condition_id: string; yes_price: number; timestamp: string }>,
): Promise<void> {
  if (!ticks.length) return;
  const db = getServiceClient();
  await db.from("price_ticks").insert(ticks);
}
