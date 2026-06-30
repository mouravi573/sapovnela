export const dynamic = 'force-dynamic'

import { getSystemStats, getActiveSignals, getOpenPositions, getCalibration } from '@/lib/db'
import type { Signal, Position, SystemStats, CalibrationBucket } from '@/types'

const STRENGTH_COLOR: Record<string, string> = {
  strong: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  weak: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
}

const TYPE_LABEL: Record<string, string> = {
  arb: '⚖️ Arb',
  model: '🧮 Model',
  volume_spike: '📈 Volume',
  momentum: '🚀 Momentum',
}

function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: boolean
}) {
  return (
    <div className={`rounded-xl border p-4 ${accent
      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40'
      : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
    }`}>
      <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>}
    </div>
  )
}

function SignalRow({ signal }: { signal: Signal }) {
  const strengthClass = STRENGTH_COLOR[signal.strength] ?? ''
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
      <td className="py-3 pr-3 text-sm text-zinc-700 dark:text-zinc-200 max-w-xs">
        <span className="line-clamp-2">{signal.question}</span>
      </td>
      <td className="py-3 pr-3">
        <span className="text-xs font-medium">{TYPE_LABEL[signal.type] ?? signal.type}</span>
      </td>
      <td className="py-3 pr-3">
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${strengthClass}`}>
          {signal.strength}
        </span>
      </td>
      <td className="py-3 pr-3 text-sm font-medium">
        <span className={signal.side === 'YES' ? 'text-green-600' : 'text-red-600'}>
          {signal.side}
        </span>
      </td>
      <td className="py-3 pr-3 text-sm tabular-nums">{(signal.poly_price * 100).toFixed(0)}¢</td>
      <td className="py-3 text-sm tabular-nums font-semibold text-green-600">
        +{(signal.edge * 100).toFixed(1)}¢
      </td>
    </tr>
  )
}

function PositionRow({ position }: { position: Position }) {
  const pnlPos = position.unrealized_pnl >= 0
  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800">
      <td className="py-3 pr-3 text-sm max-w-xs">
        <span className="line-clamp-2">{position.question}</span>
      </td>
      <td className="py-3 pr-3">
        <span className={`text-sm font-medium ${position.side === 'YES' ? 'text-green-600' : 'text-red-600'}`}>
          {position.side}
        </span>
      </td>
      <td className="py-3 pr-3 text-sm tabular-nums">{(position.avg_entry_price * 100).toFixed(0)}¢</td>
      <td className="py-3 pr-3 text-sm tabular-nums">{(position.current_price * 100).toFixed(0)}¢</td>
      <td className="py-3 pr-3 text-sm tabular-nums">${position.cost_usdc.toFixed(0)}</td>
      <td className={`py-3 text-sm tabular-nums font-semibold ${pnlPos ? 'text-green-600' : 'text-red-600'}`}>
        {pnlPos ? '+' : ''}${position.unrealized_pnl.toFixed(2)}
      </td>
    </tr>
  )
}

function CalibrationChart({ buckets }: { buckets: CalibrationBucket[] }) {
  if (buckets.length === 0) return (
    <p className="text-sm text-zinc-400">No resolved positions yet — calibration available after first closed trades.</p>
  )

  return (
    <div className="space-y-2">
      {buckets.map(b => (
        <div key={b.predicted_range} className="flex items-center gap-3">
          <span className="w-16 text-right text-xs text-zinc-400 tabular-nums">{b.predicted_range}</span>
          <div className="relative flex-1 h-5 rounded bg-zinc-100 dark:bg-zinc-800">
            {/* Predicted bar */}
            <div
              className="absolute top-0 left-0 h-full rounded bg-blue-200 dark:bg-blue-800"
              style={{ width: `${b.predicted_mid * 100}%` }}
            />
            {/* Actual bar */}
            <div
              className="absolute top-0 left-0 h-full rounded bg-blue-500 dark:bg-blue-400 opacity-80"
              style={{ width: `${b.actual_win_rate * 100}%` }}
            />
          </div>
          <span className="w-12 text-xs tabular-nums text-zinc-500">
            {(b.actual_win_rate * 100).toFixed(0)}%
          </span>
          <span className="w-8 text-xs text-zinc-400">n={b.sample_count}</span>
        </div>
      ))}
      <p className="text-xs text-zinc-400 mt-2">
        <span className="inline-block w-3 h-3 rounded bg-blue-200 dark:bg-blue-800 mr-1" />predicted
        <span className="inline-block w-3 h-3 rounded bg-blue-500 dark:bg-blue-400 mx-1" />actual
      </p>
    </div>
  )
}

export default async function Dashboard() {
  const [stats, signals, positions, calibration] = await Promise.all([
    getSystemStats().catch(() => null as SystemStats | null),
    getActiveSignals(20).catch(() => [] as Signal[]),
    getOpenPositions().catch(() => [] as Position[]),
    getCalibration().catch(() => [] as CalibrationBucket[]),
  ])

  const totalPnl = (stats?.unrealized_pnl ?? 0) + (stats?.realized_pnl ?? 0)
  const pnlPos = totalPnl >= 0

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Polymarket Dashboard</h1>
            <p className="text-xs text-zinc-400">Strategy engine · Georgia</p>
          </div>
          <div className="text-xs text-zinc-400">
            {stats?.last_sync
              ? `Last sync: ${new Date(stats.last_sync).toLocaleTimeString('ka-GE')}`
              : 'Not synced'}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* Stats row */}
        {stats && (
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            <StatCard label="Markets" value={stats.markets_tracked.toString()} />
            <StatCard label="Signals" value={stats.active_signals.toString()} accent />
            <StatCard label="Positions" value={stats.open_positions.toString()} />
            <StatCard label="Deployed" value={`$${stats.total_deployed_usdc.toFixed(0)}`} />
            <StatCard
              label="Unrealized"
              value={`${stats.unrealized_pnl >= 0 ? '+' : ''}$${stats.unrealized_pnl.toFixed(2)}`}
            />
            <StatCard
              label="Realized"
              value={`${stats.realized_pnl >= 0 ? '+' : ''}$${stats.realized_pnl.toFixed(2)}`}
            />
            <StatCard
              label="Win rate"
              value={`${(stats.win_rate * 100).toFixed(0)}%`}
              sub={`Total P&L: ${pnlPos ? '+' : ''}$${totalPnl.toFixed(2)}`}
            />
          </section>
        )}

        {/* Active signals */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Active signals ({signals.length})
          </h2>
          {signals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
              <p className="text-zinc-400 text-sm">No active signals. Run POST /api/signals to scan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    {['Question', 'Type', 'Strength', 'Side', 'Price', 'Edge'].map(h => (
                      <th key={h} className="py-3 pr-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {signals.map((s, i) => <SignalRow key={s.id ?? i} signal={s} />)}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Open positions */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Open positions ({positions.length})
          </h2>
          {positions.length === 0 ? (
            <p className="text-sm text-zinc-400">No open positions.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800">
                    {['Question', 'Side', 'Entry', 'Current', 'Size', 'P&L'].map(h => (
                      <th key={h} className="py-3 pr-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p, i) => <PositionRow key={p.id ?? i} position={p} />)}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Calibration */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Calibration (did 70% signals win 70%?)
          </h2>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <CalibrationChart buckets={calibration} />
          </div>
        </section>

      </main>
    </div>
  )
}
