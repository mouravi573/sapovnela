-- ============================================================
-- Polymarket Strategy Engine — Database Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Markets ───────────────────────────────────────────────────
create table if not exists markets (
  condition_id   text primary key,
  question       text not null,
  description    text,
  end_date       timestamptz,
  category       text not null default 'other',
  yes_price      numeric(6,4) not null,
  no_price       numeric(6,4) not null,
  volume_24h     numeric(16,2) default 0,
  volume_total   numeric(16,2) default 0,
  liquidity      numeric(16,2) default 0,
  active         boolean not null default true,
  closed         boolean not null default false,
  resolved       boolean,
  resolution     text check (resolution in ('YES','NO') or resolution is null),
  fetched_at     timestamptz not null default now()
);

-- ── Price ticks (time series) ─────────────────────────────────
create table if not exists price_ticks (
  id           bigserial primary key,
  condition_id text not null references markets(condition_id) on delete cascade,
  yes_price    numeric(6,4) not null,
  timestamp    timestamptz not null default now()
);

-- ── Signals ───────────────────────────────────────────────────
create table if not exists signals (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in ('arb','model','volume_spike','momentum')),
  strength     text not null check (strength in ('weak','medium','strong')),
  condition_id text not null references markets(condition_id) on delete cascade,
  question     text not null,
  side         text not null check (side in ('YES','NO')),
  poly_price   numeric(6,4) not null,
  fair_value   numeric(6,4) not null,
  edge         numeric(6,4) not null,
  confidence   numeric(5,4) not null,
  source       text not null,
  metadata     jsonb,
  acted_on     boolean not null default false,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz
);

-- ── Orders ────────────────────────────────────────────────────
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  signal_id     uuid references signals(id),
  condition_id  text not null references markets(condition_id),
  question      text not null,
  side          text not null check (side in ('YES','NO')),
  price         numeric(6,4) not null,
  size_usdc     numeric(10,2) not null,
  contracts     numeric(12,4) not null,
  status        text not null default 'pending' check (status in ('pending','open','filled','cancelled','failed')),
  poly_order_id text,
  fill_price    numeric(6,4),
  error         text,
  created_at    timestamptz not null default now(),
  filled_at     timestamptz
);

-- ── Positions ─────────────────────────────────────────────────
create table if not exists positions (
  id                  uuid primary key default gen_random_uuid(),
  condition_id        text not null references markets(condition_id),
  question            text not null,
  side                text not null check (side in ('YES','NO')),
  avg_entry_price     numeric(6,4) not null,
  contracts           numeric(12,4) not null,
  cost_usdc           numeric(10,2) not null,
  current_price       numeric(6,4) not null default 0,
  unrealized_pnl      numeric(10,2) not null default 0,
  unrealized_pnl_pct  numeric(6,4) not null default 0,
  status              text not null default 'open' check (status in ('open','closed','resolved')),
  opened_at           timestamptz not null default now(),
  closed_at           timestamptz,
  resolved_at         timestamptz,
  resolution          text check (resolution in ('WIN','LOSS') or resolution is null),
  realized_pnl        numeric(10,2),
  unique (condition_id)  -- one position per market
);

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists idx_markets_active       on markets(active, liquidity desc);
create index if not exists idx_markets_category     on markets(category);
create index if not exists idx_markets_end_date     on markets(end_date);
create index if not exists idx_signals_active       on signals(acted_on, expires_at) where not acted_on;
create index if not exists idx_signals_type         on signals(type, strength);
create index if not exists idx_signals_condition    on signals(condition_id);
create index if not exists idx_price_ticks_market   on price_ticks(condition_id, timestamp desc);
create index if not exists idx_orders_status        on orders(status);
create index if not exists idx_positions_status     on positions(status);

-- ── Row Level Security ────────────────────────────────────────
alter table markets       enable row level security;
alter table price_ticks   enable row level security;
alter table signals       enable row level security;
alter table orders        enable row level security;
alter table positions     enable row level security;

-- Public read (dashboard works without auth)
create policy "markets_read"    on markets    for select using (true);
create policy "signals_read"    on signals    for select using (true);
create policy "orders_read"     on orders     for select using (true);
create policy "positions_read"  on positions  for select using (true);
create policy "ticks_read"      on price_ticks for select using (true);

-- Service role writes
create policy "markets_write"    on markets    for all using (auth.role() = 'service_role');
create policy "signals_write"    on signals    for all using (auth.role() = 'service_role');
create policy "orders_write"     on orders     for all using (auth.role() = 'service_role');
create policy "positions_write"  on positions  for all using (auth.role() = 'service_role');
create policy "ticks_write"      on price_ticks for all using (auth.role() = 'service_role');

-- ── Useful views ──────────────────────────────────────────────
create or replace view active_signals_view as
  select s.*, m.category, m.liquidity, m.volume_24h
  from signals s
  join markets m on m.condition_id = s.condition_id
  where not s.acted_on
    and (s.expires_at is null or s.expires_at > now())
  order by s.edge * s.confidence desc;

create or replace view portfolio_summary as
  select
    count(*)                                    as open_positions,
    sum(cost_usdc)                              as total_deployed,
    sum(unrealized_pnl)                         as total_unrealized_pnl,
    avg(unrealized_pnl_pct)                     as avg_unrealized_pct
  from positions
  where status = 'open';

create or replace view signal_performance as
  select
    s.type,
    s.strength,
    s.source,
    count(*)                                          as total_signals,
    count(p.id)                                       as traded,
    count(*) filter (where p.resolution = 'WIN')      as wins,
    avg(p.realized_pnl)                               as avg_pnl
  from signals s
  left join positions p on p.condition_id = s.condition_id
  group by s.type, s.strength, s.source
  order by wins desc;
