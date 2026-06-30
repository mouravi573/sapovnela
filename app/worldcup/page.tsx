'use client'

import { useState, useEffect, useCallback } from 'react'

interface WCMarket {
  condition_id: string
  question: string
  yes_price: number
  no_price: number
  volume_24h: number
  volume_total: number
  liquidity: number
  end_date: string | null
  category: string
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

const STORAGE_KEY = 'sapovnela_wc_trades'

export default function WorldCupDashboard() {
  const [tab, setTab] = useState<'winners' | 'matches'>('winners')
  const [winners, setWinners] = useState<WCMarket[]>([])
  const [matches, setMatches] = useState<WCMarket[]>([])
  const [stats, setStats] = useState({ wcMarkets: 0, total: 0 })
  const [status, setStatus] = useState('Connecting…')
  const [trades, setTrades] = useState<PaperTrade[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ question: '', side: 'YES' as 'YES' | 'NO', entry: '', size: '25', notes: '' })
  const [clock, setClock] = useState('')

  // Load trades from localStorage on mount
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

  // Clock
  useEffect(() => {
    const tick = () => setClock(
      new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Tbilisi', hour12: false }) + ' TBS'
    )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const loadWinners = useCallback(async () => {
    try {
      const res = await fetch('/api/worldcup?mode=winners')
      const data = await res.json()
      setWinners((data.matches ?? []).sort((a: WCMarket, b: WCMarket) => b.yes_price - a.yes_price))
      setStats({ wcMarkets: data.total_wc_markets ?? 0, total: data.total_markets_scanned ?? 0 })
      setStatus('Live')
    } catch {
      setStatus('Error')
    }
  }, [])

  const loadMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/worldcup?mode=matches')
      const data = await res.json()
      setMatches(data.matches ?? [])
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    loadWinners()
    const id = setInterval(loadWinners, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [loadWinners])

  useEffect(() => {
    if (tab === 'matches') loadMatches()
  }, [tab, loadMatches])

  function prefillTrade(question: string, side: 'YES' | 'NO', entry: number) {
    setForm({ question, side, entry: entry.toFixed(2), size: '25', notes: '' })
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
  const maxPrice = Math.max(...winners.map(w => w.yes_price), 0.01)

  return (
    <div style={{ minHeight: '100vh', background: '#080b0e', color: '#dde3ed', fontFamily: 'var(--font-sans, sans-serif)' }}>
      <style>{`
        .wc-mono { font-family: 'JetBrains Mono', monospace; }
        .wc-row:hover { background: rgba(255,255,255,0.02); }
      `}</style>

      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '0 24px 80px' }}>
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0 20px', borderBottom: '1px solid #1a2230', marginBottom: 40 }}>
          <div className="wc-mono" style={{ fontSize: 13, fontWeight: 600, color: '#00c9a7', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Sapovnela <span style={{ color: '#4a5568', fontWeight: 400 }}>/ World Cup Signals</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="wc-mono" style={{ fontSize: 11, color: '#8892a4', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3dd68c', boxShadow: '0 0 8px #3dd68c', display: 'inline-block' }} />
              {status}
            </div>
            <div className="wc-mono" style={{ fontSize: 11, color: '#4a5568' }}>{clock}</div>
          </div>
        </nav>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: '#1a2230', border: '1px solid #1a2230', marginBottom: 32 }}>
          {[
            { label: 'WC markets found', value: stats.wcMarkets, color: '#00c9a7' },
            { label: 'Markets scanned', value: stats.total, color: '#8892a4' },
            { label: 'Paper P&L', value: `${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`, color: totalPnl >= 0 ? '#3dd68c' : '#ff4d4d' },
            { label: 'Win rate', value: winRate, color: resolved.length > 0 ? (wins.length / resolved.length > 0.6 ? '#3dd68c' : '#f5a623') : '#4a5568' },
          ].map(s => (
            <div key={s.label} style={{ background: '#0e1318', padding: '16px 20px' }}>
              <div className="wc-mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 6 }}>{s.label}</div>
              <div className="wc-mono" style={{ fontSize: 22, fontWeight: 600, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#1a2230', padding: 2, border: '1px solid #1a2230', width: 'fit-content' }}>
          {(['winners', 'matches'] as const).map(t => (
            <div
              key={t}
              onClick={() => setTab(t)}
              className="wc-mono"
              style={{
                fontSize: 11, letterSpacing: '0.06em', padding: '8px 18px', cursor: 'pointer',
                textTransform: 'uppercase', transition: 'all 0.15s',
                background: tab === t ? 'rgba(0,201,167,0.08)' : '#0e1318',
                color: tab === t ? '#00c9a7' : '#8892a4',
              }}
            >
              {t === 'winners' ? 'Tournament winner' : 'Live matches'}
            </div>
          ))}
        </div>

        {tab === 'winners' && (
          <div style={{ marginBottom: 32 }}>
            <div className="wc-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 16 }}>
              Will [team] win the 2026 World Cup? — ranked by implied probability
            </div>
            <div style={{ background: '#0e1318', border: '1px solid #1a2230', overflow: 'hidden' }}>
              <div className="wc-mono wc-row" style={{ display: 'grid', gridTemplateColumns: '32px 1fr 90px 100px 110px', gap: 12, alignItems: 'center', padding: '10px 16px', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5568' }}>
                <div>#</div><div>Team</div><div>Probability</div><div></div><div>Volume</div>
              </div>
              {winners.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center' }} className="wc-mono">
                  <span style={{ color: '#4a5568', fontSize: 12 }}>Loading live odds…</span>
                </div>
              ) : winners.map((w, i) => {
                const team = w.question.replace('Will ', '').replace(' win the 2026 FIFA World Cup?', '')
                const barWidth = (w.yes_price / maxPrice * 100).toFixed(0)
                return (
                  <div
                    key={w.condition_id}
                    className="wc-row"
                    onClick={() => prefillTrade(w.question, 'YES', w.yes_price * 100)}
                    style={{ display: 'grid', gridTemplateColumns: '32px 1fr 90px 100px 110px', gap: 12, alignItems: 'center', padding: '12px 16px', borderTop: '1px solid #1a2230', cursor: 'pointer' }}
                  >
                    <div className="wc-mono" style={{ fontSize: 11, color: '#4a5568', textAlign: 'center' }}>{i + 1}</div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{team}</div>
                    <div style={{ position: 'relative', height: 8, background: '#1a2230', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${barWidth}%`, background: '#00c9a7', borderRadius: 4, transition: 'width 0.8s ease-out' }} />
                    </div>
                    <div className="wc-mono" style={{ fontSize: 13, fontWeight: 600, color: '#00c9a7', textAlign: 'right' }}>{(w.yes_price * 100).toFixed(2)}¢</div>
                    <div className="wc-mono" style={{ fontSize: 11, color: '#8892a4', textAlign: 'right' }}>${(w.volume_24h / 1_000_000).toFixed(1)}M/24h</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'matches' && (
          <div style={{ marginBottom: 32 }}>
            <div className="wc-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 16 }}>
              Live World Cup match markets
            </div>
            {matches.length === 0 ? (
              <div style={{ background: '#0e1318', border: '1px dashed #243040', padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>⚽</div>
                <div className="wc-mono" style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.8 }}>
                  No individual match markets found right now.<br />
                  Tournament winner markets are the active signal source.
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {matches.map(m => (
                  <div
                    key={m.condition_id}
                    onClick={() => prefillTrade(m.question, 'YES', m.yes_price * 100)}
                    style={{ background: '#0e1318', border: '1px solid #1a2230', padding: 16, cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, lineHeight: 1.4 }}>{m.question}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="wc-mono" style={{ fontSize: 20, fontWeight: 600, color: '#00c9a7' }}>{(m.yes_price * 100).toFixed(1)}¢</div>
                      <div className="wc-mono" style={{ fontSize: 10, color: '#4a5568' }}>${(m.volume_24h / 1000).toFixed(0)}K vol/24h</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Paper log */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="wc-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4a5568' }}>Paper trade log</div>
            <button
              onClick={() => { setForm({ question: '', side: 'YES', entry: '', size: '25', notes: '' }); setModalOpen(true) }}
              className="wc-mono"
              style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 16px', border: '1px solid #243040', background: 'transparent', color: '#8892a4', cursor: 'pointer' }}
            >
              + Log trade
            </button>
          </div>
          <div style={{ background: '#0e1318', border: '1px solid #1a2230', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #243040' }}>
                  {['Date', 'Team/Match', 'Side', 'Entry ¢', 'Notes', 'Size $', 'Result', 'P&L', ''].map(h => (
                    <th key={h} className="wc-mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5568', padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.slice().reverse().map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #1a2230' }}>
                    <td className="wc-mono" style={{ padding: '13px 16px', color: '#4a5568', whiteSpace: 'nowrap' }}>{t.date}</td>
                    <td style={{ padding: '13px 16px', maxWidth: 240 }}>{t.question}</td>
                    <td className="wc-mono" style={{ padding: '13px 16px', fontWeight: 600, color: t.side === 'YES' ? '#3dd68c' : '#ff4d4d' }}>{t.side}</td>
                    <td className="wc-mono" style={{ padding: '13px 16px', color: '#00c9a7' }}>{t.entry}</td>
                    <td style={{ padding: '13px 16px', fontSize: 11, color: '#8892a4' }}>{t.notes || '—'}</td>
                    <td className="wc-mono" style={{ padding: '13px 16px' }}>${t.size}</td>
                    <td style={{ padding: '13px 16px' }}>
                      {t.resolution === 'WIN' && <span className="wc-mono" style={{ fontSize: 9, padding: '2px 7px', background: 'rgba(61,214,140,0.10)', color: '#3dd68c' }}>WIN</span>}
                      {t.resolution === 'LOSS' && <span className="wc-mono" style={{ fontSize: 9, padding: '2px 7px', background: 'rgba(255,77,77,0.10)', color: '#ff4d4d' }}>LOSS</span>}
                      {t.resolution === 'pending' && <span className="wc-mono" style={{ fontSize: 9, padding: '2px 7px', border: '1px solid #243040', color: '#4a5568' }}>PENDING</span>}
                    </td>
                    <td className="wc-mono" style={{ padding: '13px 16px', fontWeight: 600, color: t.pnl === null ? '#4a5568' : t.pnl >= 0 ? '#3dd68c' : '#ff4d4d' }}>
                      {t.pnl !== null ? `${t.pnl >= 0 ? '+' : ''}$${t.pnl.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                      {t.resolution === 'pending' ? (
                        <>
                          <button onClick={() => resolveTrade(t.id, 'WIN')} className="wc-mono" style={{ fontSize: 9, padding: '3px 8px', background: 'transparent', border: '1px solid #243040', color: '#4a5568', cursor: 'pointer', marginRight: 4 }}>WIN</button>
                          <button onClick={() => resolveTrade(t.id, 'LOSS')} className="wc-mono" style={{ fontSize: 9, padding: '3px 8px', background: 'transparent', border: '1px solid #243040', color: '#4a5568', cursor: 'pointer' }}>LOSS</button>
                        </>
                      ) : (
                        <button onClick={() => deleteTrade(t.id)} className="wc-mono" style={{ fontSize: 9, padding: '3px 8px', background: 'transparent', border: '1px solid #243040', color: '#4a5568', cursor: 'pointer' }}>✕</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {trades.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center' }} className="wc-mono">
                <span style={{ fontSize: 11, color: '#4a5568' }}>No trades logged yet. Click a team above to log a paper trade.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(8,11,14,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' }}
        >
          <div style={{ background: '#0e1318', border: '1px solid #243040', padding: 32, width: 480, maxWidth: '95vw' }}>
            <div className="wc-mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#00c9a7', marginBottom: 24 }}>Log paper trade</div>

            <div style={{ marginBottom: 16 }}>
              <label className="wc-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 6, display: 'block' }}>Question</label>
              <input
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
                placeholder="Will Argentina win the 2026 FIFA World Cup?"
                style={{ width: '100%', background: '#080b0e', border: '1px solid #243040', color: '#dde3ed', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '9px 12px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="wc-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 6, display: 'block' }}>Side</label>
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
                <label className="wc-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 6, display: 'block' }}>Entry price (¢)</label>
                <input
                  type="number" step="0.1" min="0.1" max="99"
                  value={form.entry}
                  onChange={e => setForm(f => ({ ...f, entry: e.target.value }))}
                  placeholder="20.85"
                  style={{ width: '100%', background: '#080b0e', border: '1px solid #243040', color: '#dde3ed', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '9px 12px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label className="wc-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 6, display: 'block' }}>Size (USDC $)</label>
                <input
                  type="number" min="1"
                  value={form.size}
                  onChange={e => setForm(f => ({ ...f, size: e.target.value }))}
                  placeholder="25"
                  style={{ width: '100%', background: '#080b0e', border: '1px solid #243040', color: '#dde3ed', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '9px 12px', outline: 'none' }}
                />
              </div>
              <div>
                <label className="wc-mono" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 6, display: 'block' }}>Notes</label>
                <input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="why this trade"
                  style={{ width: '100%', background: '#080b0e', border: '1px solid #243040', color: '#dde3ed', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, padding: '9px 12px', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button onClick={saveTrade} className="wc-mono" style={{ flex: 1, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: 10, background: '#00c9a7', color: '#080b0e', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Log trade</button>
              <button onClick={() => setModalOpen(false)} className="wc-mono" style={{ fontSize: 11, padding: '10px 20px', background: 'transparent', color: '#4a5568', border: '1px solid #243040', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
