/**
 * Polymarket order execution
 *
 * Requires: POLY_PRIVATE_KEY and POLY_API_KEY in env
 * Orders are signed with your Ethereum wallet (Polygon chain)
 * Settlement is in USDC on Polygon
 *
 * NEVER import this in client components — server/API routes only
 */

import type { Order, OrderSide } from '@/types'

const CLOB_BASE = 'https://clob.polymarket.com'
const CHAIN_ID = 137 // Polygon mainnet

interface PolyOrderRequest {
  token_id: string      // YES token id for the market
  price: number         // 0–1
  size: number          // number of contracts
  side: 'BUY' | 'SELL'
  type: 'GTC' | 'FOK' | 'GTD'
  expiration?: number   // unix timestamp for GTD
}

interface PolyOrderResponse {
  order_id: string
  status: string
  size_matched?: number
  price_matched?: number
  error?: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const apiKey = process.env.POLY_API_KEY
  const apiSecret = process.env.POLY_API_SECRET
  const apiPassphrase = process.env.POLY_API_PASSPHRASE

  if (!apiKey) throw new Error('Missing POLY_API_KEY — cannot place orders')

  // Polymarket uses HMAC-SHA256 request signing
  // Full implementation requires crypto.subtle in Node 18+
  // For production: use the official py-clob-client or JS SDK
  return {
    'POLY-API-KEY': apiKey,
    'POLY-SECRET': apiSecret ?? '',
    'POLY-PASSPHRASE': apiPassphrase ?? '',
    'POLY-TIMESTAMP': String(Math.floor(Date.now() / 1000)),
    'Content-Type': 'application/json',
  }
}

// ─── Token ID lookup ──────────────────────────────────────────────────────────

export async function getTokenId(
  conditionId: string,
  side: OrderSide
): Promise<string | null> {
  const res = await fetch(`${CLOB_BASE}/markets/${conditionId}`)
  if (!res.ok) return null

  const market = await res.json()
  const token = market.tokens?.find(
    (t: { outcome: string; token_id: string }) =>
      t.outcome === (side === 'YES' ? 'Yes' : 'No')
  )
  return token?.token_id ?? null
}

// ─── Order placement ──────────────────────────────────────────────────────────

export async function placeOrder(params: {
  conditionId: string
  side: OrderSide
  price: number       // limit price 0–1 (e.g. 0.65)
  sizeUsdc: number    // dollar amount to risk
}): Promise<PolyOrderResponse> {
  const { conditionId, side, price, sizeUsdc } = params

  // Safety checks
  if (sizeUsdc > 500) throw new Error(`Order too large: $${sizeUsdc} > $500 max`)
  if (price < 0.01 || price > 0.99) throw new Error(`Price out of range: ${price}`)

  const tokenId = await getTokenId(conditionId, side)
  if (!tokenId) throw new Error(`Cannot find ${side} token for ${conditionId}`)

  const contracts = sizeUsdc / price

  const body: PolyOrderRequest = {
    token_id: tokenId,
    price,
    size: Math.floor(contracts * 100) / 100, // 2dp
    side: 'BUY',
    type: 'GTC',
  }

  const res = await fetch(`${CLOB_BASE}/order`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(`Order failed: ${data.error ?? res.statusText}`)
  }

  return data as PolyOrderResponse
}

// ─── Cancel order ─────────────────────────────────────────────────────────────

export async function cancelOrder(polyOrderId: string): Promise<boolean> {
  const res = await fetch(`${CLOB_BASE}/order/${polyOrderId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  return res.ok
}

// ─── Cancel all open orders (kill switch) ─────────────────────────────────────

export async function cancelAllOrders(): Promise<{ cancelled: number }> {
  const res = await fetch(`${CLOB_BASE}/orders`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error(`Cancel all failed: ${res.status}`)
  const data = await res.json()
  return { cancelled: data.cancelled ?? 0 }
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

export interface PolyPosition {
  asset: string
  size: number
  average_price: number
}

export async function fetchPositions(): Promise<PolyPosition[]> {
  const res = await fetch(`${CLOB_BASE}/positions`, {
    headers: getAuthHeaders(),
    next: { revalidate: 0 },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.positions ?? []
}

export async function fetchBalance(): Promise<number> {
  const res = await fetch(`${CLOB_BASE}/account`, {
    headers: getAuthHeaders(),
    next: { revalidate: 0 },
  })
  if (!res.ok) return 0
  const data = await res.json()
  return parseFloat(data.balance ?? '0')
}
