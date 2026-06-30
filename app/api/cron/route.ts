import type { NextRequest } from 'next/server'
import { fetchAllActiveMarkets } from '@/lib/polymarket/client'
import { upsertMarkets, getMarkets, getSystemStats, saveSignals } from '@/lib/db'
import { runSignalEngine } from '@/lib/signals/engine'
import { notifyStrongSignals, notifyDailySummary } from '@/lib/telegram'

// Vercel Cron: add to vercel.json
// { "crons": [{ "path": "/api/cron", "schedule": "0 */4 * * *" }] }
// Runs every 4 hours

export async function GET(req: NextRequest) {
  const isVercelCron = req.headers.get('x-vercel-cron') === '1'
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')

  if (cronSecret && !isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = new Date().toISOString()
  const log: string[] = []

  // Step 1: Sync markets
  try {
    const markets = await fetchAllActiveMarkets(5)
    const count = await upsertMarkets(markets)
    log.push(`✅ Markets: ${count} synced`)
  } catch (e) {
    log.push(`❌ Markets sync failed: ${e}`)
  }

  // Step 2: Run signal engine
  let signalCount = 0
  try {
    const markets = await getMarkets({ active: true, minLiquidity: 5000, limit: 300 })
    const result = await runSignalEngine(markets, { arb: true, fed: true })
    if (result.signals.length > 0) {
      await saveSignals(result.signals)
      signalCount = result.signals.length
    }
    await notifyStrongSignals(result.signals)
    log.push(`✅ Signals: ${signalCount} generated (${result.by_type ? JSON.stringify(result.by_type) : 'none'})`)
  } catch (e) {
    log.push(`❌ Signal engine failed: ${e}`)
  }

  // Step 3: Daily summary at 07:00
  const hour = new Date().getUTCHours()
  if (hour === 5) { // 05:00 UTC = 09:00 Tbilisi (UTC+4)
    try {
      const stats = await getSystemStats()
      await notifyDailySummary(stats)
      log.push(`✅ Daily summary sent`)
    } catch (e) {
      log.push(`❌ Summary failed: ${e}`)
    }
  }

  return Response.json({
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    log,
    signals_generated: signalCount,
  })
}
