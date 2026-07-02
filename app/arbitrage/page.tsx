'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

interface ArbResult {
  matchup: string
  team: string
  polymarket_ask: number | null
  polymarket_bid: number | null
  polymarket_volume: number
  kalshi_no_ask: number | null
  kalshi_no_bid: number | null
  kalshi_volume: number
  combined_price: number | null
  edge: number | null
  net_edge: number | null
  is_arbitrage: boolean
  equivalent_market: boolean
  stale: boolean
}

interface PaperTrade {
  id: number
  date: string
  question: string
  side: 'YES' | 'NO'
  entry: number
  notes: string
  size: number
  resolution: 'pending' | 'WIN' | 'LOSS'
  pnl: number | null
}

const STORAGE_KEY = 'sapovnela_arb_trades'
const NET_EDGE_HOT = 0.04 // matches the ⚡ tier threshold used in rendering
const NET_EDGE_WATCH = 0.015 // matches the ★ tier threshold used in rendering

export default function ArbitrageDashboard() {
  const [comparisons, setComparisons] = useState<ArbResult[]>([])
  const [stats, setStats] = useState({ poly: 0, kalshi: 0, matched: 0 })
  const [status, setStatus] = useState('Connecting…')
  const [trades, setTrades] = useState<PaperTrade[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ question: '', side: 'YES' as 'YES' | 'NO', entry: '', size: '25', notes: '' })
  const [clock, setClock] = useState('')
  const [notifyPermission, setNotifyPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const notifiedRowsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotifyPermission('unsupported')
      return
    }
    setNotifyPermission(Notification.permission)
  }, [])

  async function enableNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    const result = await Notification.requestPermission()
    setNotifyPermission(result)
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { setTrades(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  const saveTrades = useCallback((next: PaperTrade[]) => {
    setTrades(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  useEffect(() => {
    const tick = () => setClock(
      new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Tbilisi', hour12: false }) + ' TBS'
    )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const loadArb = useCallback(async () => {
    try {
      const res = await fetch('/api/arbitrage')
      const data = await res.json()
      const rows: ArbResult[] = data.comparisons ?? []
      setComparisons(rows)
      setStats({
        poly: data.total_polymarket_matches ?? 0,
        kalshi: data.total_kalshi_advance_markets ?? 0,
        matched: data.matched_count ?? 0,
      })
      setStatus('Live')

      // Notify only on NEW hot rows — a row that stays hot across polls
      // shouldn't re-fire every 20s. If it cools off and later goes hot
      // again, it's removed from the tracked set below and will re-notify.
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const currentHotKeys = new Set<string>()
        for (const r of rows) {
          if ((r.net_edge ?? -1) >= NET_EDGE_HOT) {
            const key = `${r.matchup}::${r.team}`
            currentHotKeys.add(key)
            if (!notifiedRowsRef.current.has(key)) {
              new Notification('Sapovnela — arbitrage opportunity', {
                body: `${r.team} (${r.matchup})\nNet edge: +${((r.net_edge ?? 0) * 100).toFixed(1)}% — Poly ${((r.polymarket_ask ?? 0) * 100).toFixed(1)}¢ / Kalshi NO ${((r.kalshi_no_ask ?? 0) * 100).toFixed(1)}¢`,
                tag: key, // replaces any existing notification for the same row instead of stacking
              })
            }
          }
        }
        notifiedRowsRef.current = currentHotKeys
      }
    } catch {
      setStatus('Error')
    }
  }, [])

  useEffect(() => {
    loadArb()
    const id = setInterval(loadArb, 20 * 1000)
    return () => clearInterval(id)
  }, [loadArb])

  function prefillTrade(team: string, platform: 'Polymarket' | 'Kalshi', price: number, side: 'YES' | 'NO' = 'YES') {
    setForm({
      question: platform === 'Polymarket'
        ? `Will ${team} win the 2026 World Cup? (${platform})`
        : `${team} advances (${platform})`,
      side,
      entry: (price * 100).toFixed(2),
      size: '25',
      notes: '',
    })
    setModalOpen(true)
  }

  function saveTrade() {
    const entry = parseFloat(form.entry)
    const size = parseFloat(form.size)
    if (!form.question || !entry || !size) return
    const next: PaperTrade[] = [
      ...trades,
      {
        id: Date.now(),
        date: new Date().toISOString().slice(0, 10),
        question: form.question,
        side: form.side,
        entry,
        notes: form.notes,
        size,
        resolution: 'pending',
        pnl: null,
      },
    ]
    saveTrades(next)
    setModalOpen(false)
  }

  function resolveTrade(id: number, outcome: 'WIN' | 'LOSS') {
    const next = trades.map(t => {
      if (t.id !== id) return t
      const resolvedPrice = outcome === 'WIN' ? (t.side === 'YES' ? 100 : 0) : (t.side === 'YES' ? 0 : 100)
      const contracts = t.size / (t.entry / 100)
      const pnl = contracts * (resolvedPrice / 100) - t.size
      return { ...t, resolution: outcome, pnl }
    })
    saveTrades(next)
  }

  function deleteTrade(id: number) {
    saveTrades(trades.filter(t => t.id !== id))
  }

  const resolved = trades.filter(t => t.resolution !== 'pending')
  const wins = resolved.filter(t => t.resolution === 'WIN')
  const totalPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const winRate = resolved.length > 0 ? (wins.length / resolved.length * 100).toFixed(0) + '%' : '—'

  return (
    <div style={{ minHeight: '100vh', background: '#080b0e', color: '#dde3ed' }}>
      <style>{`
        .ar-mono { font-family: 'JetBrains Mono', monospace; }
        .ar-row:hover { background: rgba(255,255,255,0.02); }
      `}</style>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 24px 80px' }}>
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0 20px', borderBottom: '1px solid #1a2230', marginBottom: 40 }}>
          <Link href="/" className="ar-mono" style={{ fontSize: 13, fontWeight: 600, color: '#00c9a7', letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none' }}>
            Sapovnela <span style={{ color: '#ffffff', fontWeight: 400 }}>/ Arbitrage Signals</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/calculator" className="ar-mono" style={{ fontSize: 11, color: '#00c9a7', textDecoration: 'none', letterSpacing: '0.06em', border: '1px solid rgba(0,201,167,0.3)', padding: '4px 10px' }}>⊞ Calculator</Link>
            {notifyPermission === 'unsupported' ? null : notifyPermission === 'granted' ? (
              <div className="ar-mono" style={{ fontSize: 11, color: '#3dd68c', display: 'flex', alignItems: 'center', gap: 5 }} title="You'll get a desktop notification when a row crosses the ⚡ hot threshold">
                🔔 Alerts on
              </div>
            ) : notifyPermission === 'denied' ? (
              <div className="ar-mono" style={{ fontSize: 11, color: '#8892a4' }} title="Notifications blocked in browser settings — re-enable in your browser's site settings">
                🔕 Blocked
              </div>
            ) : (
              <button
                onClick={enableNotifications}
                className="ar-mono"
                style={{ fontSize: 11, color: '#8892a4', background: 'transparent', border: '1px solid #243040', padding: '4px 10px', cursor: 'pointer' }}
              >
                🔔 Enable alerts
              </button>
            )}
            <div className="ar-mono" style={{ fontSize: 11, color: '#8892a4', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3dd68c', boxShadow: '0 0 8px #3dd68c', display: 'inline-block' }} />
              {status}
            </div>
            <div className="ar-mono" style={{ fontSize: 11, color: '#ffffff' }}>{clock}</div>
          </div>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#1a2230', border: '1px solid #1a2230', marginBottom: 32 }}>
          <div style={{ background: '#0e1318', padding: '16px 20px' }}>
            <div className="ar-mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 6 }}>Polymarket matches</div>
            <div className="ar-mono" style={{ fontSize: 22, fontWeight: 600, color: '#00c9a7' }}>{stats.poly}</div>
          </div>
          <div style={{ background: '#0e1318', padding: '16px 20px' }}>
            <div className="ar-mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 6 }}>Kalshi reg-time markets</div>
            <div className="ar-mono" style={{ fontSize: 22, fontWeight: 600, color: '#8892a4' }}>{stats.kalshi}</div>
          </div>
          <div style={{ background: '#0e1318', padding: '16px 20px' }}>
            <div className="ar-mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 6 }}>Paper P&L</div>
            <div className="ar-mono" style={{ fontSize: 22, fontWeight: 600, color: totalPnl >= 0 ? '#3dd68c' : '#ff4d4d' }}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </div>
          </div>
          <div style={{ background: '#0e1318', padding: '16px 20px' }}>
            <div className="ar-mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 6 }}>Win rate</div>
            <div className="ar-mono" style={{ fontSize: 22, fontWeight: 600, color: resolved.length > 0 ? (wins.length / resolved.length > 0.6 ? '#3dd68c' : '#f5a623') : '#ffffff' }}>
              {winRate}
            </div>
          </div>
        </div>

        <div style={{ background: '#0e1318', border: '1px solid #243040', padding: '12px 16px', marginBottom: 32 }}>
          <div className="ar-mono" style={{ fontSize: 10, color: '#8892a4', lineHeight: 1.6 }}>
            ⓘ Compares Polymarket's regulation-time market against Kalshi's KXWCGAME (also regulation-time-only) —
            a genuine equivalent pair. Real live bid/ask, refreshed every 20s. Still confirm exact prices on both
            platforms before placing a trade — books move between refreshes.
          </div>
        </div>

        <section style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="ar-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffffff' }}>
              All matched World Cup winner markets
            </div>
            <div className="ar-mono" style={{ fontSize: 9, color: '#8892a4', display: 'flex', gap: 14 }}>
              <span><span style={{ color: '#3dd68c' }}>⚡</span> net edge ≥ 4% — check now</span>
              <span><span style={{ color: '#f5a623' }}>★</span> net edge ≥ 1.5% — watch</span>
              <span>click a row to log a paper trade</span>
            </div>
          </div>
          {comparisons.length === 0 ? (
            <div style={{ background: '#0e1318', border: '1px dashed #243040', padding: 48, textAlign: 'center' }}>
              <div className="ar-mono" style={{ fontSize: 12, color: '#ffffff' }}>Loading comparisons…</div>
            </div>
          ) : (
            <div style={{ background: '#0e1318', border: '1px solid #1a2230', overflow: 'hidden' }}>
              <div className="ar-mono" style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 70px 70px 80px', gap: 10, padding: '10px 16px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', borderBottom: '1px solid #1a2230' }}>
                <div>Matchup — team to advance</div><div>Poly ask (YES)</div><div>Kalshi ask (NO)</div><div>Edge</div><div>Net edge</div><div>Kalshi vol</div>
              </div>
              {comparisons.map(c => {
                // Tier on NET edge, not raw — raw edge can look positive
                // while fees eat the whole thing (see the -1% to -2% rows
                // we've actually seen live: raw edge alone is misleading).
                const ne = c.net_edge ?? -1
                const tier = ne >= NET_EDGE_HOT ? 'hot' : ne >= NET_EDGE_WATCH ? 'watch' : 'normal'
                const rowStyle =
                  tier === 'hot'
                    ? { background: 'rgba(61,214,140,0.08)', borderLeft: '3px solid #3dd68c' }
                    : tier === 'watch'
                    ? { background: 'rgba(245,166,35,0.06)', borderLeft: '3px solid #f5a623' }
                    : { borderLeft: '3px solid transparent' }
                return (
                  <div
                    key={c.matchup}
                    className="ar-row"
                    onClick={() => prefillTrade(c.team, 'Polymarket', c.polymarket_ask ?? 0, 'YES')}
                    title="Click to log this as a Polymarket YES paper trade (adjust in the modal if you meant the Kalshi NO leg instead)"
                    style={{ display: 'grid', gridTemplateColumns: '1fr 90px 90px 70px 70px 80px', gap: 10, padding: '12px 16px 12px 13px', borderBottom: '1px solid #1a2230', alignItems: 'center', cursor: 'pointer', ...rowStyle }}
                  >
                    <div style={{ fontSize: 12 }}>
                      {tier === 'hot' && <span title="Net edge above 4% — worth checking now" style={{ marginRight: 6 }}>⚡</span>}
                      {tier === 'watch' && <span title="Net edge above 1.5% — worth watching" style={{ marginRight: 6 }}>★</span>}
                      {c.matchup} <span style={{ color: '#ffffff' }}>— {c.team}</span>
                      {!c.equivalent_market && (
                        <span className="ar-mono" style={{ fontSize: 9, color: '#ff4d4d', marginLeft: 8 }} title="Polymarket side is regulation-time only — not equivalent to Kalshi's whole-tie advance market">
                          ⚠ not equivalent
                        </span>
                      )}
                    </div>
                    <div className="ar-mono" style={{ fontSize: 11, color: '#00c9a7' }}>{((c.polymarket_ask ?? 0) * 100).toFixed(2)}¢</div>
                    <div className="ar-mono" style={{ fontSize: 11, color: '#8892a4' }}>{((c.kalshi_no_ask ?? 0) * 100).toFixed(2)}¢</div>
                    <div className="ar-mono" style={{ fontSize: 11, color: (c.edge ?? 0) > 0 ? '#3dd68c' : '#ff4d4d' }}>
                      {((c.edge ?? 0) * 100).toFixed(1)}%
                    </div>
                    <div className="ar-mono" style={{ fontSize: 11, fontWeight: tier === 'hot' ? 700 : 400, color: tier === 'hot' ? '#3dd68c' : tier === 'watch' ? '#f5a623' : (ne > 0 ? '#3dd68c' : '#ff4d4d') }}>
                      {(ne * 100).toFixed(1)}%
                    </div>
                    <div className="ar-mono" style={{ fontSize: 11, color: '#ffffff' }}>${(c.kalshi_volume / 1000).toFixed(0)}K</div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="ar-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffffff' }}>Paper trade log</div>
            <button
              onClick={() => { setForm({ question: '', side: 'YES', entry: '', size: '25', notes: '' }); setModalOpen(true) }}
              className="ar-mono"
              style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 16px', border: '1px solid #243040', background: 'transparent', color: '#8892a4', cursor: 'pointer' }}
            >
              + Log trade
            </button>
          </div>
          <div style={{ background: '#0e1318', border: '1px solid #1a2230', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #243040' }}>
                  {['Date', 'Question', 'Side', 'Entry ¢', 'Notes', 'Size $', 'Result', 'P&L', ''].map(h => (
                    <th key={h} className="ar-mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.slice().reverse().map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #1a2230' }}>
                    <td className="ar-mono" style={{ padding: '13px 16px', color: '#ffffff', whiteSpace: 'nowrap' }}>{t.date}</td>
                    <td style={{ padding: '13px 16px', maxWidth: 240 }}>{t.question}</td>
                    <td className="ar-mono" style={{ padding: '13px 16px', fontWeight: 600, color: t.side === 'YES' ? '#3dd68c' : '#ff4d4d' }}>{t.side}</td>
                    <td className="ar-mono" style={{ padding: '13px 16px', color: '#00c9a7' }}>{t.entry}</td>
                    <td style={{ padding: '13px 16px', fontSize: 11, color: '#8892a4' }}>{t.notes || '—'}</td>
                    <td className="ar-mono" style={{ padding: '13px 16px' }}>${t.size}</td>
                    <td style={{ padding: '13px 16px' }}>
                      {t.resolution === 'WIN' && <span className="ar-mono" style={{ fontSize: 9, padding: '2px 7px', background: 'rgba(61,214,140,0.10)', color: '#3dd68c' }}>WIN</span>}
                      {t.resolution === 'LOSS' && <span className="ar-mono" style={{ fontSize: 9, padding: '2px 7px', background: 'rgba(255,77,77,0.10)', color: '#ff4d4d' }}>LOSS</span>}
                      {t.resolution === 'pending' && <span className="ar-mono" style={{ fontSize: 9, padding: '2px 7px', border: '1px solid #243040', color: '#ffffff' }}>PENDING</span>}
                    </td>
                    <td className="ar-mono" style={{ padding: '13px 16px', fontWeight: 600, color: t.pnl === null ? '#ffffff' : t.pnl >= 0 ? '#3dd68c' : '#ff4d4d' }}>
                      {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      {t.resolution === 'pending' ? (
                        <>
                          <button onClick={() => resolveTrade(t.id, 'WIN')} className="ar-mono" style={{ fontSize: 9, padding: '3px 8px', background: 'transparent', border: '1px solid #243040', color: '#ffffff', cursor: 'pointer', marginRight: 4 }}>WIN</button>
                          <button onClick={() => resolveTrade(t.id, 'LOSS')} className="ar-mono" style={{ fontSize: 9, padding: '3px 8px', background: 'transparent', border: '1px solid #243040', color: '#ffffff', cursor: 'pointer' }}>LOSS</button>
                        </>
                      ) : (
                        <button onClick={() => deleteTrade(t.id)} className="ar-mono" style={{ fontSize: 9, padding: '3px 8px', background: 'transparent', border: '1px solid #243040', color: '#ffffff', cursor: 'pointer' }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trades.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center' }} className="ar-mono">
                <span style={{ fontSize: 11, color: '#ffffff' }}>No trades logged yet.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(8,11,14,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
        >
          <div style={{ background: '#0e1318', border: '1px solid #243040', padding: 32, width: 480, maxWidth: '95vw' }}>
            <div className="ar-mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#00c9a7', marginBottom: 24 }}>Log paper trade</div>
            <div style={{ marginBottom: 16 }}>
              <label className="ar-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 6, display: 'block' }}>Question</label>
              <input
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                style={{ width: '100%', background: '#080b0e', border: '1px solid #243040', color: '#dde3ed', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '9px 12px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="ar-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 6, display: 'block' }}>Side</label>
                <select
                  value={form.side}
                  onChange={e => setForm(f => ({ ...f, side: e.target.value as 'YES' | 'NO' }))}
                  style={{ width: '100%', background: '#080b0e', border: '1px solid #243040', color: '#dde3ed', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '9px 12px', outline: 'none' }}
                >
                  <option value="YES">YES</option>
                  <option value="NO">NO</option>
                </select>
              </div>
              <div>
                <label className="ar-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 6, display: 'block' }}>Entry price (¢)</label>
                <input
                  type="number" step="0.1" min="0.1" max="99"
                  value={form.entry}
                  onChange={e => setForm(f => ({ ...f, entry: e.target.value }))}
                  style={{ width: '100%', background: '#080b0e', border: '1px solid #243040', color: '#dde3ed', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '9px 12px', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="ar-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 6, display: 'block' }}>Size (USDC $)</label>
                <input
                  type="number" min="1"
                  value={form.size}
                  onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                  style={{ width: '100%', background: '#080b0e', border: '1px solid #243040', color: '#dde3ed', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '9px 12px', outline: 'none' }}
                />
              </div>
              <div>
                <label className="ar-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 6, display: 'block' }}>Notes</label>
                <input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  style={{ width: '100%', background: '#080b0e', border: '1px solid #243040', color: '#dde3ed', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '9px 12px', outline: 'none' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={saveTrade} className="ar-mono" style={{ flex: 1, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: 10, background: '#00c9a7', color: '#080b0e', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Log trade</button>
              <button onClick={() => setModalOpen(false)} className="ar-mono" style={{ fontSize: 11, padding: '10px 20px', background: 'transparent', color: '#ffffff', border: '1px solid #243040', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
