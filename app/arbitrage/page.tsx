'use client'

import { useState, useEffect, useCallback } from 'react'
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

export default function ArbitrageDashboard() {
  const [comparisons, setComparisons] = useState<ArbResult[]>([])
  const [stats, setStats] = useState({ poly: 0, kalshi: 0, matched: 0 })
  const [status, setStatus] = useState('Connecting…')
  const [trades, setTrades] = useState<PaperTrade[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ question: '', side: 'YES' as 'YES' | 'NO', entry: '', size: '25', notes: '' })
  const [clock, setClock] = useState('')

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
      setComparisons(data.comparisons ?? [])
      setStats({
        poly: data.total_polymarket_matches ?? 0,
        kalshi: data.total_kalshi_advance_markets ?? 0,
        matched: data.matched_count ?? 0,
      })
      setStatus('Live')
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

  const significantGaps = comparisons.filter(c => c.is_arbitrage && (c.edge ?? 0) > 0.03)
  const otherGaps = comparisons.filter(c => !(c.is_arbitrage && (c.edge ?? 0) > 0.03))

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
            <div className="ar-mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 6 }}>Kalshi advance markets</div>
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

        {significantGaps.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div className="ar-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#f5a623', marginBottom: 16 }}>
              Genuine arbitrage — buy YES on Polymarket + NO on Kalshi, live prices
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {significantGaps.map(c => (
                <div key={c.matchup} style={{ background: '#0e1318', border: '1px solid rgba(245,166,35,0.3)', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#8892a4', marginBottom: 4 }}>{c.matchup} {c.stale && <span style={{ color: '#f5a623' }}>(stale book — last trade)</span>}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{c.team} advances</div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <button
                          onClick={() => prefillTrade(c.team, 'Polymarket', c.polymarket_ask ?? 0, 'YES')}
                          className="ar-mono"
                          style={{ fontSize: 11, color: '#00c9a7', background: 'transparent', border: '1px solid #00c9a7', padding: '4px 10px', cursor: 'pointer' }}
                        >
                          Buy YES Polymarket: {((c.polymarket_ask ?? 0) * 100).toFixed(2)}¢
                        </button>
                        <button
                          onClick={() => prefillTrade(c.team, 'Kalshi', c.kalshi_no_ask ?? 0, 'NO')}
                          className="ar-mono"
                          style={{ fontSize: 11, color: '#8892a4', background: 'transparent', border: '1px solid #243040', padding: '4px 10px', cursor: 'pointer' }}
                        >
                          Buy NO Kalshi: {((c.kalshi_no_ask ?? 0) * 100).toFixed(2)}¢
                        </button>
                      </div>
                      <div className="ar-mono" style={{ fontSize: 10, color: '#ffffff', marginTop: 8 }}>
                        Kalshi vol: ${(c.kalshi_volume / 1000).toFixed(0)}K · Poly vol: ${(c.polymarket_volume / 1000).toFixed(0)}K/24h · combined {((c.combined_price ?? 0) * 100).toFixed(1)}¢
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="ar-mono" style={{ fontSize: 16, fontWeight: 600, color: '#f5a623' }}>
                        +{((c.edge ?? 0) * 100).toFixed(1)}% edge
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={{ marginBottom: 32 }}>
          <div className="ar-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffffff', marginBottom: 16 }}>
            All matched World Cup winner markets
          </div>
          {comparisons.length === 0 ? (
            <div style={{ background: '#0e1318', border: '1px dashed #243040', padding: 48, textAlign: 'center' }}>
              <div className="ar-mono" style={{ fontSize: 12, color: '#ffffff' }}>Loading comparisons…</div>
            </div>
          ) : (
            <div style={{ background: '#0e1318', border: '1px solid #1a2230', overflow: 'hidden' }}>
              <div className="ar-mono" style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px 90px', gap: 12, padding: '10px 16px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ffffff', borderBottom: '1px solid #1a2230' }}>
                <div>Matchup — team to advance</div><div>Poly ask (YES)</div><div>Kalshi ask (NO)</div><div>Edge</div><div>Kalshi vol</div>
              </div>
              {otherGaps.map(c => (
                <div
                  key={c.matchup}
                  className="ar-row"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px 90px', gap: 12, padding: '12px 16px', borderBottom: '1px solid #1a2230', alignItems: 'center' }}
                >
                  <div style={{ fontSize: 12 }}>
                    {c.matchup} <span style={{ color: '#ffffff' }}>— {c.team}</span>
                    {!c.equivalent_market && (
                      <span className="ar-mono" style={{ fontSize: 9, color: '#ff4d4d', marginLeft: 8 }} title="Polymarket side is regulation-time only — not equivalent to Kalshi's whole-tie advance market">
                        ⚠ not equivalent
                      </span>
                    )}
                  </div>
                  <div className="ar-mono" style={{ fontSize: 11, color: '#00c9a7' }}>{((c.polymarket_ask ?? 0) * 100).toFixed(2)}¢</div>
                  <div className="ar-mono" style={{ fontSize: 11, color: '#8892a4' }}>{((c.kalshi_no_ask ?? 0) * 100).toFixed(2)}¢</div>
                  <div className="ar-mono" style={{ fontSize: 11, color: (c.edge ?? 0) > 0 ? '#3dd68c' : '#ff4d4d' }}>{((c.edge ?? 0) * 100).toFixed(1)}%</div>
                  <div className="ar-mono" style={{ fontSize: 11, color: '#ffffff' }}>${(c.kalshi_volume / 1000).toFixed(0)}K</div>
                </div>
              ))}
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
