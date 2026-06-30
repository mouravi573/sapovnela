import type { NextRequest } from 'next/server'
import { placeOrder, cancelAllOrders } from '@/lib/execution/orders'
import { getActiveSignals, saveOrder, markSignalActedOn, getOpenPositions } from '@/lib/db'
import { notifyOrderPlaced, notifyKillSwitch } from '@/lib/telegram'
import { sizePosition } from '@/lib/signals/engine'

const EXECUTION_SECRET = process.env.EXECUTION_SECRET
const MAX_TOTAL_EXPOSURE_USDC = 1000 // total bankroll limit

function isAuthorized(req: NextRequest): boolean {
  if (!EXECUTION_SECRET) return false // execution REQUIRES a secret — no open access
  return req.headers.get('x-execution-secret') === EXECUTION_SECRET
}

// POST /api/orders — place order for a specific signal
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return Response.json({ error: 'Unauthorized — execution requires EXECUTION_SECRET' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.signal_id) {
    return Response.json({ error: 'signal_id required' }, { status: 400 })
  }

  try {
    // Check total exposure
    const positions = await getOpenPositions()
    const totalExposure = positions.reduce((s, p) => s + p.cost_usdc, 0)
    if (totalExposure >= MAX_TOTAL_EXPOSURE_USDC) {
      return Response.json({
        error: `Max exposure reached: $${totalExposure.toFixed(2)} / $${MAX_TOTAL_EXPOSURE_USDC}`,
      }, { status: 429 })
    }

    // Fetch the signal
    const signals = await getActiveSignals(100)
    const signal = signals.find(s => s.id === body.signal_id)
    if (!signal) {
      return Response.json({ error: 'Signal not found or expired' }, { status: 404 })
    }

    // Size the position
    const bankroll = parseFloat(body.bankroll_usdc ?? '500')
    const sizeUsdc = body.size_usdc ?? sizePosition(signal, bankroll)
    if (sizeUsdc < 5) {
      return Response.json({ error: `Position too small: $${sizeUsdc.toFixed(2)}` }, { status: 400 })
    }

    // Place the order
    const polyResponse = await placeOrder({
      conditionId: signal.condition_id,
      side: signal.side,
      price: signal.poly_price,
      sizeUsdc,
    })

    // Record in DB
    const orderId = await saveOrder({
      signal_id: signal.id,
      condition_id: signal.condition_id,
      question: signal.question,
      side: signal.side,
      price: signal.poly_price,
      size_usdc: sizeUsdc,
      contracts: sizeUsdc / signal.poly_price,
      status: polyResponse.status === 'matched' ? 'filled' : 'open',
      poly_order_id: polyResponse.order_id,
      created_at: new Date().toISOString(),
    })

    await markSignalActedOn(signal.id!)
    await notifyOrderPlaced(signal, sizeUsdc, polyResponse.order_id)

    return Response.json({
      order_id: orderId,
      poly_order_id: polyResponse.order_id,
      size_usdc: sizeUsdc,
      status: polyResponse.status,
    })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}

// GET: list open orders
export async function GET(_req: NextRequest) {
  const { getOrders } = await import('@/lib/db')
  const orders = await getOrders(50)
  return Response.json({ orders, count: orders.length })
}

// DELETE /api/orders — KILL SWITCH: cancel everything
export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { cancelled } = await cancelAllOrders()
    await notifyKillSwitch(cancelled)
    return Response.json({ cancelled, killed_at: new Date().toISOString() })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
