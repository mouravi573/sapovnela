'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

export default function ArbCalculator() {
  const [polyPrice, setPolyPrice] = useState('43.5')
  const [kalshiPrice, setKalshiPrice] = useState('37')
  const [budget, setBudget] = useState('10')
  const [kalshiFee, setKalshiFee] = useState('3')
  const [polyFee, setPolyFee] = useState('0')

  const result = useMemo(() => {
    const P = parseFloat(polyPrice) / 100
    const K = parseFloat(kalshiPrice) / 100
    const T = parseFloat(budget)
    const fK = parseFloat(kalshiFee) / 100
    const fP = parseFloat(polyFee) / 100

    if (isNaN(P) || isNaN(K) || isNaN(T) || P <= 0 || K <= 0 || T <= 0) return null

    const isArbitrage = (P + K) < 1

    // Correct proportional split:
    // Invest MORE on cheaper leg, LESS on expensive leg
    // A = T × P / (P + K)  → Polymarket stake
    // B = T × K / (P + K)  → Kalshi stake
    const A = T * P / (P + K)  // Polymarket stake
    const B = T * K / (P + K)  // Kalshi stake

    // Fees
    const feeA = A * fP
    const feeB = B * fK
    const totalCost = A + B + feeA + feeB

    // Payout is the same regardless of outcome
    const payout = A / P  // = B / K (same value)

    const profit = payout - totalCost
    const returnPct = profit / totalCost

    // Show what happens in each scenario
    const ifWin = payout   // Polymarket pays, Kalshi loses
    const ifLose = payout  // Kalshi pays, Polymarket loses

    return {
      A, B, feeA, feeB,
      totalCost, payout,
      profit, returnPct,
      ifWin, ifLose,
      isArbitrage,
      combinedPrice: P + K,
    }
  }, [polyPrice, kalshiPrice, budget, kalshiFee, polyFee])

  const mono = { fontFamily: "'JetBrains Mono', monospace" }
  const teal = '#00c9a7'
  const green = '#3dd68c'
  const red = '#ff4d4d'
  const dim = '#ffffff'
  const dimmer = '#8892a4'

  return (
    <div style={{ minHeight: '100vh', background: '#080b0e', color: '#dde3ed' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        .inp { width: 100%; background: #080b0e; border: 1px solid #243040; color: #dde3ed; font-family: 'JetBrains Mono', monospace; font-size: 15px; padding: 10px 12px; outline: none; box-sizing: border-box; }
        .inp:focus { border-color: #00c9a7; }
        label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: #8892a4; margin-bottom: 6px; display: block; }
      `}</style>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0 20px', borderBottom: '1px solid #1a2230', marginBottom: 40 }}>
          <Link href="/" style={{ ...mono, fontSize: 13, fontWeight: 600, color: teal, letterSpacing: '0.08em', textTransform: 'uppercase' as const, textDecoration: 'none' }}>
            Sapovnela <span style={{ color: dim, fontWeight: 400 }}>/ Calculator</span>
          </Link>
          <Link href="/arbitrage" style={{ ...mono, fontSize: 11, color: dimmer, textDecoration: 'none' }}>← Signals</Link>
        </nav>

        {/* Intro */}
        <p style={{ fontSize: 13, color: dimmer, lineHeight: 1.8, marginBottom: 32 }}>
          Enter the same team&apos;s price on both platforms and your total budget.
          The calculator finds the exact split that <strong style={{ color: '#dde3ed' }}>guarantees maximum profit regardless of outcome</strong>.
        </p>

        {/* Inputs */}
        <div style={{ background: '#0e1318', border: '1px solid #1a2230', padding: 24, marginBottom: 16 }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: dim, marginBottom: 20 }}>Inputs</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label>Polymarket YES price (¢)</label>
              <input className="inp" type="number" step="0.1" value={polyPrice} onChange={e => setPolyPrice(e.target.value)} style={{ color: teal }} />
            </div>
            <div>
              <label>Kalshi NO price (¢)</label>
              <input className="inp" type="number" step="0.1" value={kalshiPrice} onChange={e => setKalshiPrice(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Total budget ($)</label>
            <input className="inp" type="number" step="1" value={budget} onChange={e => setBudget(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label>Kalshi trading fee (%)</label>
              <input className="inp" type="number" step="0.1" value={kalshiFee} onChange={e => setKalshiFee(e.target.value)} style={{ color: dimmer }} />
            </div>
            <div>
              <label>Polymarket fee (%)</label>
              <input className="inp" type="number" step="0.1" value={polyFee} onChange={e => setPolyFee(e.target.value)} style={{ color: dimmer }} />
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div style={{ background: '#0e1318', border: `1px solid ${result.isArbitrage ? 'rgba(61,214,140,0.35)' : 'rgba(255,77,77,0.35)'}`, padding: 24 }}>

            {/* Arbitrage verdict */}
            <div style={{ ...mono, fontSize: 11, letterSpacing: '0.08em', color: result.isArbitrage ? green : red, marginBottom: 24 }}>
              {result.isArbitrage
                ? `✓ GENUINE ARBITRAGE — combined price ${(result.combinedPrice * 100).toFixed(1)}¢ < 100¢`
                : `✗ NOT ARBITRAGE — combined price ${(result.combinedPrice * 100).toFixed(1)}¢ > 100¢`}
            </div>

            {/* How to split */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ ...mono, fontSize: 9, color: dim, marginBottom: 12, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                How to split your ${parseFloat(budget).toFixed(2)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#1a2230' }}>
                <div style={{ background: '#080b0e', padding: 16 }}>
                  <div style={{ ...mono, fontSize: 9, color: dim, marginBottom: 6 }}>BUY YES ON POLYMARKET</div>
                  <div style={{ ...mono, fontSize: 26, fontWeight: 600, color: teal }}>${result.A.toFixed(2)}</div>
                  {result.feeA > 0 && <div style={{ ...mono, fontSize: 10, color: dim }}>+ ${result.feeA.toFixed(2)} fee</div>}
                  <div style={{ ...mono, fontSize: 10, color: dim, marginTop: 4 }}>at {polyPrice}¢ per contract</div>
                </div>
                <div style={{ background: '#080b0e', padding: 16 }}>
                  <div style={{ ...mono, fontSize: 9, color: dim, marginBottom: 6 }}>BUY NO ON KALSHI</div>
                  <div style={{ ...mono, fontSize: 26, fontWeight: 600, color: '#dde3ed' }}>${result.B.toFixed(2)}</div>
                  {result.feeB > 0 && <div style={{ ...mono, fontSize: 10, color: dim }}>+ ${result.feeB.toFixed(2)} fee</div>}
                  <div style={{ ...mono, fontSize: 10, color: dim, marginTop: 4 }}>at {kalshiPrice}¢ per contract</div>
                </div>
              </div>
            </div>

            {/* What happens each scenario */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ ...mono, fontSize: 9, color: dim, marginBottom: 12, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
                What you receive — either outcome
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#1a2230' }}>
                <div style={{ background: '#080b0e', padding: 16 }}>
                  <div style={{ ...mono, fontSize: 9, color: dim, marginBottom: 4 }}>IF TEAM WINS</div>
                  <div style={{ ...mono, fontSize: 18, fontWeight: 600, color: green }}>${result.ifWin.toFixed(2)}</div>
                  <div style={{ ...mono, fontSize: 10, color: dim }}>Polymarket pays out</div>
                </div>
                <div style={{ background: '#080b0e', padding: 16 }}>
                  <div style={{ ...mono, fontSize: 9, color: dim, marginBottom: 4 }}>IF TEAM LOSES</div>
                  <div style={{ ...mono, fontSize: 18, fontWeight: 600, color: green }}>${result.ifLose.toFixed(2)}</div>
                  <div style={{ ...mono, fontSize: 10, color: dim }}>Kalshi pays out</div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: '#080b0e', padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ ...mono, fontSize: 9, color: dim, marginBottom: 4 }}>TOTAL COST</div>
                  <div style={{ ...mono, fontSize: 18, fontWeight: 600 }}>${result.totalCost.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: 9, color: dim, marginBottom: 4 }}>GUARANTEED PROFIT</div>
                  <div style={{ ...mono, fontSize: 18, fontWeight: 600, color: result.profit >= 0 ? green : red }}>
                    {result.profit >= 0 ? '+' : ''}${result.profit.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: 9, color: dim, marginBottom: 4 }}>RETURN</div>
                  <div style={{ ...mono, fontSize: 18, fontWeight: 600, color: result.returnPct >= 0 ? green : red }}>
                    {result.returnPct >= 0 ? '+' : ''}{(result.returnPct * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        <div style={{ marginTop: 20, ...mono, fontSize: 10, color: dim, lineHeight: 1.8 }}>
          Prices move in real time. Verify the actual bid/ask on both platforms immediately before placing a real trade.
          This calculator assumes you can execute both legs at the prices shown.
        </div>

      </div>
    </div>
  )
}
