@AGENTS.md

# Polymarket Strategy Engine — Project Context

## What this is
A prediction market trading system built on Polymarket (CLOB API).
Targets binary event contracts on economics, politics, crypto.
Georgian developer (Tbilisi), Polymarket accessible, USDC/Polygon settlement.

## Architecture mirrors Sapovnela2
Same pattern: external API → Supabase → Next.js UI → Telegram alerts.
- Scrapers → Polymarket/Kalshi API clients
- Products → Markets + Signals
- Deal alerts → Signal + Order notifications

## Stack
- Next.js 16.2.6 (App Router, React 19, `cacheComponents: true`)
- Supabase (PostgreSQL + RLS, service role writes, anon reads)
- Tailwind 4
- TypeScript strict
- No extra dependencies — uses native fetch throughout

## File map
```
types/index.ts                   — All shared types (markets, signals, orders, positions)

lib/
  supabase.ts                    — anon client + getServiceClient()
  db.ts                          — All DB ops: markets, signals, orders, positions, stats
  telegram.ts                    — Notifications in Georgian + English
  polymarket/
    client.ts                    — CLOB API: markets, orderbook, price history
    kalshi.ts                    — Kalshi public API for arb scanning
  signals/
    arb.ts                       — Cross-platform arb detector (Poly vs Kalshi)
    fed_model.ts                 — CME FedWatch vs Polymarket probability model
    momentum.ts                  — Volume spike + 4hr momentum detectors
    engine.ts                    — Runs all detectors, deduplicates, Kelly sizing
  execution/
    orders.ts                    — Wallet-auth order placement + kill switch

app/
  page.tsx                       — Dashboard: stats, signals table, positions, calibration
  layout.tsx / globals.css       — Root layout
  api/
    markets/route.ts             — POST: sync from Poly | GET: fetch from DB
    signals/route.ts             — POST: run engine + save | GET: active signals
    orders/route.ts              — POST: place order | GET: list | DELETE: kill switch
    cron/route.ts                — Full pipeline: sync → signals → notify (every 4hr)

supabase-schema.sql              — Run once in Supabase SQL Editor
vercel.json                      — Cron: 0 */4 * * *
.env.local.example               — All required env vars
```

## Signal types
- `arb` — Kalshi prices same event differently from Polymarket (≥3¢ gap → signal)
- `model` — CME FedWatch probability diverges from Polymarket Fed markets (≥5¢)
- `volume_spike` — 3× average hourly volume (informational, no directional edge)
- `momentum` — 5¢+ price move in 4 hours (weak signal, lower confidence)

## Safety rules
- `EXECUTION_SECRET` env var MUST be set to place any order
- Max single position: 5% of bankroll or $200 USDC, whichever is smaller
- Max total exposure: $1000 USDC (hardcoded in orders/route.ts)
- Kill switch: DELETE /api/orders cancels all open orders
- Paper trade first: run signals for 30+ events before deploying capital

## Key conventions
- All DB writes use getServiceClient() (service role)
- All DB reads use supabase (anon key)
- Signal deduplication: same condition_id + side + type → keep highest edge
- Kelly sizing: 25% fractional Kelly × confidence score
- Polymarket prices: 0–1 scale (65¢ = 0.65)
- CME FedWatch: fallback to FED_CUT_PROB_NEXT env var if scrape fails

## Setup sequence
1. Run supabase-schema.sql in Supabase SQL Editor
2. Copy .env.local.example → .env.local, fill all values
3. npm install && npm run dev
4. POST /api/markets (sync markets from Polymarket)
5. POST /api/signals (run signal engine)
6. Watch Telegram for strong signal alerts
7. Paper trade 30 events → validate calibration → deploy capital

## To add a new signal type
1. Create lib/signals/your_model.ts returning Signal[]
2. Import and add to runSignalEngine() in lib/signals/engine.ts
3. Add the type literal to SignalType in types/index.ts
4. Add to signals table check constraint in supabase-schema.sql
