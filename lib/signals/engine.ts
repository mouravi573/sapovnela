import type { Signal, PolyMarket } from '@/types'
import { detectArbSignals } from './arb'
import { generateFedSignals } from './fed_model'
import { detectVolumeSpikes, detectMomentum } from './momentum'

export interface SignalRunResult {
  signals: Signal[]
  by_type: Record<string, number>
  runtime_ms: number
  errors: string[]
}

export async function runSignalEngine(
  markets: PolyMarket[],
  options: {
    arb?: boolean
    fed?: boolean
    volume?: boolean
    momentum?: boolean
  } = { arb: true, fed: true, volume: false, momentum: false }
): Promise<SignalRunResult> {
  const start = Date.now()
  const allSignals: Signal[] = []
  const errors: string[] = []

  const runs: Array<{ name: string; fn: () => Promise<Signal[]> }> = []

  if (options.arb) {
    runs.push({ name: 'arb', fn: () => detectArbSignals(markets) })
  }
  if (options.fed) {
    runs.push({ name: 'fed_model', fn: () => generateFedSignals(markets) })
  }
  if (options.volume) {
    runs.push({ name: 'volume', fn: () => detectVolumeSpikes(markets) })
  }
  if (options.momentum) {
    runs.push({ name: 'momentum', fn: () => detectMomentum(markets) })
  }

  for (const run of runs) {
    try {
      const signals = await run.fn()
      allSignals.push(...signals)
    } catch (e) {
      const msg = `${run.name}: ${e instanceof Error ? e.message : String(e)}`
      errors.push(msg)
      console.error(`[signal_engine] ${msg}`)
    }
  }

  // Deduplicate: same condition_id + same side → keep strongest
  const deduped = deduplicateSignals(allSignals)

  // Filter: only signals with meaningful edge
  const filtered = deduped.filter(s => s.edge >= 0.03 || s.type === 'volume_spike')

  // Sort by confidence × edge (expected value proxy)
  const sorted = filtered.sort((a, b) => {
    const evA = a.confidence * a.edge
    const evB = b.confidence * b.edge
    return evB - evA
  })

  const by_type = sorted.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1
    return acc
  }, {})

  return {
    signals: sorted,
    by_type,
    runtime_ms: Date.now() - start,
    errors,
  }
}

function deduplicateSignals(signals: Signal[]): Signal[] {
  const seen = new Map<string, Signal>()

  for (const signal of signals) {
    const key = `${signal.condition_id}:${signal.side}:${signal.type}`
    const existing = seen.get(key)
    if (!existing || signal.edge > existing.edge) {
      seen.set(key, signal)
    }
  }

  return Array.from(seen.values())
}

// Position sizing: Kelly-inspired, conservative fraction
export function sizePosition(signal: Signal, bankrollUsdc: number): number {
  const MAX_POSITION_PCT = 0.05     // never more than 5% bankroll per trade
  const MAX_POSITION_USDC = 200     // hard cap in dollars

  // Simplified Kelly: f = (p*(b+1) - 1) / b
  // where p = win probability (our fair_value), b = odds
  const p = signal.fair_value
  const b = (1 - signal.poly_price) / signal.poly_price // payout odds
  const kelly = (p * (b + 1) - 1) / b

  // Use 25% Kelly (very conservative) × confidence
  const fraction = kelly * 0.25 * signal.confidence

  const sizeFromKelly = bankrollUsdc * Math.max(fraction, 0)
  const sizeFromPct = bankrollUsdc * MAX_POSITION_PCT

  return Math.min(sizeFromKelly, sizeFromPct, MAX_POSITION_USDC)
}
