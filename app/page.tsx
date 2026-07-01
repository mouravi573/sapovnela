export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getMarkets } from '@/lib/db'

interface InstrumentStatus {
  name: string
  category: string
  status: 'active' | 'dormant' | 'planned'
  marketsTracked: number
  description: string
  href?: string
}

async function getWorldCupMarketCount(): Promise<number> {
  try {
    const markets = await getMarkets({ limit: 500 })
    return markets.filter(m => {
      const q = m.question?.toLowerCase() ?? ''
      return q.includes('world cup') || q.includes('fifa')
    }).length
  } catch {
    return 0
  }
}

async function getTotalMarketCount(): Promise<number> {
  try {
    const markets = await getMarkets({ limit: 500 })
    return markets.length
  } catch {
    return 0
  }
}

export default async function Home() {
  const [wcCount, totalCount] = await Promise.all([
    getWorldCupMarketCount(),
    getTotalMarketCount(),
  ])

  const instruments: InstrumentStatus[] = [
    {
      name: 'FIFA World Cup 2026',
      category: 'Sports',
      status: 'active',
      marketsTracked: wcCount,
      description: 'Tournament winner odds, ranked by implied probability. Knockout stage matches resolve daily through July 19.',
      href: '/worldcup',
    },
    {
      name: 'Stocks — Weekly Up/Down',
      category: 'Equities',
      status: 'active',
      marketsTracked: 0,
      description: 'Polymarket strike prices vs real-time Yahoo Finance quotes. Flags markets where the real price already cleared the strike.',
      href: '/stocks',
    },
    {
      name: 'Fed Rate Decisions',
      category: 'Economics',
      status: 'active',
      marketsTracked: 0,
      description: 'Polymarket\'s own Fed Rates category — "Fed Decision in July?", rate cut count markets. July 29 FOMC is the next resolution catalyst.',
      href: '/fed',
    },
    {
      name: 'Cross-platform Arbitrage',
      category: 'Multi-source',
      status: 'active',
      marketsTracked: 0,
      description: 'Polymarket vs Kalshi — same "Will X win the World Cup?" question, two independent markets. Price gaps between them are a genuine signal, not a guess.',
      href: '/arbitrage',
    },
  ]

  const statusConfig = {
    active: { label: 'LIVE', color: 'var(--green)', bg: 'var(--green-dim)' },
    dormant: { label: 'DORMANT', color: 'var(--amber)', bg: 'var(--amber-dim)' },
    planned: { label: 'PLANNED', color: 'var(--dimmer)', bg: 'transparent' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080b0e', color: '#dde3ed' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        html, body { background: #080b0e; }
        .root-mono { font-family: 'JetBrains Mono', monospace; }
        .root-sans { font-family: 'Space Grotesk', sans-serif; }
        .root-card { transition: border-color 0.2s, transform 0.2s; }
        .root-card:hover { border-color: #243040; transform: translateY(-1px); }
        .root-cta:hover { opacity: 0.85; }
      `}</style>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 24px 100px' }}>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0 20px', borderBottom: '1px solid #1a2230', marginBottom: 48 }}>
          <div className="root-mono" style={{ fontSize: 13, fontWeight: 600, color: '#00c9a7', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Sapovnela <span style={{ color: '#4a5568', fontWeight: 400 }}>/ Signal Engine</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Link href="/calculator" className="root-mono" style={{ fontSize: 11, color: '#8892a4', textDecoration: 'none', letterSpacing: '0.06em' }}>Calculator</Link>
            <Link href="/arbitrage" className="root-mono" style={{ fontSize: 11, color: '#8892a4', textDecoration: 'none', letterSpacing: '0.06em' }}>Arbitrage</Link>
            <div className="root-mono" style={{ fontSize: 11, color: '#8892a4', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3dd68c', boxShadow: '0 0 8px #3dd68c', display: 'inline-block' }} />
              Operational
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ marginBottom: 56 }}>
          <h1 className="root-sans" style={{ fontSize: 32, fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 12 }}>
            Prediction market <strong style={{ fontWeight: 600 }}>signal engine</strong>
          </h1>
          <p style={{ fontSize: 14, color: '#8892a4', lineHeight: 1.7, maxWidth: 560 }}>
            Tracks Polymarket prices against external benchmarks to surface mispricings.
            Built and operated from Tbilisi, Georgia. Paper trading mode — no live capital deployed.
          </p>
        </section>

        {/* Stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: '#1a2230', border: '1px solid #1a2230', marginBottom: 56 }}>
          <div style={{ background: '#0e1318', padding: '18px 20px' }}>
            <div className="root-mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 6 }}>
              Total markets tracked
            </div>
            <div className="root-mono" style={{ fontSize: 24, fontWeight: 600, color: '#00c9a7' }}>{totalCount}</div>
          </div>
          <div style={{ background: '#0e1318', padding: '18px 20px' }}>
            <div className="root-mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 6 }}>
              Active instruments
            </div>
            <div className="root-mono" style={{ fontSize: 24, fontWeight: 600, color: '#3dd68c' }}>
              {instruments.filter(i => i.status === 'active').length} / {instruments.length}
            </div>
          </div>
          <div style={{ background: '#0e1318', padding: '18px 20px' }}>
            <div className="root-mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 6 }}>
              Mode
            </div>
            <div className="root-mono" style={{ fontSize: 24, fontWeight: 600, color: '#f5a623' }}>PAPER</div>
          </div>
        </div>

        {/* Instruments ranked list */}
        <section style={{ marginBottom: 48 }}>
          <div className="root-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4a5568', marginBottom: 16 }}>
            Instruments monitored — ranked by activity
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {instruments.map((inst, i) => {
              const cfg = statusConfig[inst.status]
              const Wrapper = inst.href ? Link : 'div'
              const wrapperProps = inst.href ? { href: inst.href } : {}

              return (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <Wrapper
                  key={inst.name}
                  {...(wrapperProps as any)}
                  className="root-card"
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                    background: '#0e1318',
                    border: '1px solid #1a2230',
                    padding: '20px 22px',
                    cursor: inst.href ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      <span className="root-mono" style={{ fontSize: 11, color: '#4a5568' }}>{String(i + 1).padStart(2, '0')}</span>
                      <span className="root-sans" style={{ fontSize: 16, fontWeight: 600 }}>{inst.name}</span>
                      <span className="root-mono" style={{ fontSize: 10, color: '#8892a4', letterSpacing: '0.04em' }}>{inst.category}</span>
                    </div>
                    <span
                      className="root-mono"
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.08em',
                        padding: '3px 9px',
                        color: cfg.color,
                        background: cfg.bg,
                        border: `1px solid ${cfg.color}33`,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: '#8892a4', lineHeight: 1.6, marginBottom: inst.status === 'active' ? 12 : 0 }}>
                    {inst.description}
                  </p>

                  {inst.status === 'active' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span className="root-mono" style={{ fontSize: 11, color: '#00c9a7' }}>
                        {inst.marketsTracked} markets tracked
                      </span>
                      <span className="root-mono" style={{ fontSize: 11, color: '#4a5568' }}>→ View dashboard</span>
                    </div>
                  )}
                </Wrapper>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', padding: '40px 0', borderTop: '1px solid #1a2230' }}>
          <p style={{ fontSize: 13, color: '#8892a4', marginBottom: 16 }}>
            The World Cup signal engine is live and updating every 5 minutes.
          </p>
          <Link
            href="/worldcup"
            className="root-cta root-mono"
            style={{
              display: 'inline-block',
              fontSize: 12,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '12px 28px',
              background: '#00c9a7',
              color: '#080b0e',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Open World Cup Dashboard →
          </Link>
        </section>

      </div>
    </div>
  )
}
