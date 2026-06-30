'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Incorrect password')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080b0e', color: '#dde3ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .lg-mono { font-family: 'JetBrains Mono', monospace; }
        .lg-sans { font-family: 'Space Grotesk', sans-serif; }
      `}</style>

      <form onSubmit={handleSubmit} style={{ width: 360, maxWidth: '90vw' }}>
        <div className="lg-mono" style={{ fontSize: 13, fontWeight: 600, color: '#00c9a7', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, textAlign: 'center' }}>
          Sapovnela
        </div>
        <div className="lg-sans" style={{ fontSize: 14, color: '#8892a4', textAlign: 'center', marginBottom: 32 }}>
          Enter password to continue
        </div>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="lg-mono"
          style={{
            width: '100%',
            background: '#0e1318',
            border: error ? '1px solid #ff4d4d' : '1px solid #243040',
            color: '#dde3ed',
            fontSize: 14,
            padding: '12px 16px',
            outline: 'none',
            marginBottom: 12,
          }}
        />

        {error && (
          <div className="lg-mono" style={{ fontSize: 11, color: '#ff4d4d', marginBottom: 12, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="lg-mono"
          style={{
            width: '100%',
            fontSize: 12,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: 12,
            background: '#00c9a7',
            color: '#080b0e',
            border: 'none',
            cursor: loading ? 'default' : 'pointer',
            fontWeight: 600,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  )
}
