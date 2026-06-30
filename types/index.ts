// ─── Market types ────────────────────────────────────────────────────────────

export type MarketCategory =
  | 'economics'
  | 'politics'
  | 'sports'
  | 'crypto'
  | 'weather'
  | 'science'
  | 'other'

export type SignalType =
  | 'arb'          // cross-platform price divergence
  | 'model'        // our probability model disagrees with market
  | 'volume_spike' // unusual volume detected
  | 'momentum'     // price moving fast in one direction

export type SignalStrength = 'weak' | 'medium' | 'strong'

export type OrderSide = 'YES' | 'NO'

export type OrderStatus = 'pending' | 'open' | 'filled' | 'cancelled' | 'failed'

export type PositionStatus = 'open' | 'closed' | 'resolved'

// ─── Polymarket data ──────────────────────────────────────────────────────────

export interface PolyMarket {
  condition_id: string
  question: string
  description?: string
  end_date: string | null    // ISO timestamp
  category: MarketCategory
  yes_price: number          // 0–1
  no_price: number           // 0–1
  volume_24h: number         // USDC
  volume_total: number       // USDC
  liquidity: number          // USDC
  active: boolean
  closed: boolean
  resolved?: boolean
  resolution?: 'YES' | 'NO'
  fetched_at: string
}

export interface OrderbookLevel {
  price: number   // 0–1
  size: number    // contracts
}

export interface Orderbook {
  condition_id: string
  yes_bids: OrderbookLevel[]
  yes_asks: OrderbookLevel[]
  no_bids: OrderbookLevel[]
  no_asks: OrderbookLevel[]
  spread: number
  mid_price: number
  fetched_at: string
}

export interface PriceTick {
  condition_id: string
  yes_price: number
  no_price: number
  volume: number
  timestamp: string
}

// ─── Kalshi (for arb) ─────────────────────────────────────────────────────────

export interface KalshiMarket {
  ticker: string
  title: string
  yes_bid: number    // 0–1
  yes_ask: number    // 0–1
  volume: number
  category: string
  fetched_at: string
}

// ─── Signals ─────────────────────────────────────────────────────────────────

export interface Signal {
  id?: string
  type: SignalType
  strength: SignalStrength
  condition_id: string
  question: string
  side: OrderSide              // which side to buy
  poly_price: number           // current poly price for that side
  fair_value: number           // our estimated true probability
  edge: number                 // fair_value - poly_price (positive = we have edge)
  confidence: number           // 0–1
  source: string               // 'cme_fedwatch' | 'kalshi_arb' | 'poll_aggregate' | etc
  metadata?: Record<string, unknown>
  created_at?: string
  expires_at?: string          // signal validity window
  acted_on?: boolean
}

// ─── Execution ───────────────────────────────────────────────────────────────

export interface Order {
  id?: string
  signal_id?: string
  condition_id: string
  question: string
  side: OrderSide
  price: number
  size_usdc: number
  contracts: number
  status: OrderStatus
  poly_order_id?: string
  fill_price?: number
  created_at?: string
  filled_at?: string
  error?: string
}

export interface Position {
  id?: string
  condition_id: string
  question: string
  side: OrderSide
  avg_entry_price: number
  contracts: number
  cost_usdc: number
  current_price: number
  unrealized_pnl: number
  unrealized_pnl_pct: number
  status: PositionStatus
  opened_at: string
  closed_at?: string
  resolved_at?: string
  resolution?: 'WIN' | 'LOSS'
  realized_pnl?: number
}

// ─── External benchmark sources ───────────────────────────────────────────────

export interface FedProbability {
  meeting_date: string       // 'YYYY-MM'
  cut_prob: number           // 0–1
  hold_prob: number          // 0–1
  hike_prob: number          // 0–1
  source: 'cme_fedwatch'
  fetched_at: string
}

export interface PollAggregate {
  question: string
  yes_prob: number           // 0–1
  sample_size?: number
  source: string             // '538' | 'polymarket_external' | 'metaculus'
  fetched_at: string
}

// ─── System ───────────────────────────────────────────────────────────────────

export interface SystemStats {
  markets_tracked: number
  active_signals: number
  open_positions: number
  total_deployed_usdc: number
  unrealized_pnl: number
  realized_pnl: number
  win_rate: number           // 0–1
  signal_accuracy: number    // calibration: did 70% signals win 70%?
  last_sync: string
}

export interface CalibrationBucket {
  predicted_range: string    // '60-70%'
  predicted_mid: number
  actual_win_rate: number
  sample_count: number
}
