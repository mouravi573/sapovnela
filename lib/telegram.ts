import type { Signal, Position, SystemStats } from '@/types'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHAT_ID

async function send(text: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('[telegram] Not configured — skipping')
    return
  }

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })

  if (!res.ok) console.error('[telegram] Failed:', await res.text())
}

const TYPE_EMOJI: Record<string, string> = {
  arb: '⚖️',
  model: '🧮',
  volume_spike: '📈',
  momentum: '🚀',
}

const STRENGTH_EMOJI: Record<string, string> = {
  weak: '🟡',
  medium: '🟠',
  strong: '🔴',
}

export async function notifySignal(signal: Signal): Promise<void> {
  const typeEmoji = TYPE_EMOJI[signal.type] ?? '📊'
  const strengthEmoji = STRENGTH_EMOJI[signal.strength] ?? '⚪'

  const lines = [
    `${strengthEmoji} ${typeEmoji} <b>სიგნალი: ${signal.strength.toUpperCase()}</b>`,
    '',
    `❓ ${signal.question}`,
    '',
    `📌 მხარე: <b>${signal.side}</b>`,
    `💰 Poly ფასი: <b>${(signal.poly_price * 100).toFixed(1)}¢</b>`,
    `🎯 სამართლიანი ღირებულება: <b>${(signal.fair_value * 100).toFixed(1)}¢</b>`,
    `📐 Edge: <b>+${(signal.edge * 100).toFixed(1)}¢</b>`,
    `🔬 წყარო: ${signal.source}`,
    signal.expires_at
      ? `⏰ ვადა: ${new Date(signal.expires_at).toLocaleString('ka-GE', { timeZone: 'Asia/Tbilisi' })}`
      : '',
  ].filter(Boolean)

  await send(lines.join('\n'))
}

export async function notifyStrongSignals(signals: Signal[]): Promise<void> {
  const strong = signals.filter(s => s.strength === 'strong')
  if (strong.length === 0) return

  const lines = [
    `🔴 <b>${strong.length} ძლიერი სიგნალი</b>`,
    '',
    ...strong.slice(0, 5).map((s, i) => {
      const emoji = TYPE_EMOJI[s.type] ?? '📊'
      return `${i + 1}. ${emoji} ${s.side} @ ${(s.poly_price * 100).toFixed(0)}¢ → Edge: +${(s.edge * 100).toFixed(1)}¢\n   ${s.question.slice(0, 60)}...`
    }),
    '',
    `<i>სულ ${signals.length} სიგნალი სკანირებისას</i>`,
  ]

  await send(lines.join('\n'))
}

export async function notifyOrderPlaced(
  signal: Signal,
  sizeUsdc: number,
  polyOrderId: string
): Promise<void> {
  await send([
    `✅ <b>ორდერი განთავსდა</b>`,
    '',
    `❓ ${signal.question}`,
    `📌 ${signal.side} @ ${(signal.poly_price * 100).toFixed(1)}¢`,
    `💵 ზომა: $${sizeUsdc.toFixed(2)} USDC`,
    `🔑 ID: <code>${polyOrderId}</code>`,
  ].join('\n'))
}

export async function notifyPositionClosed(position: Position): Promise<void> {
  const pnlSign = (position.realized_pnl ?? 0) >= 0 ? '✅' : '❌'
  await send([
    `${pnlSign} <b>პოზიცია დაიხურა</b>`,
    '',
    `❓ ${position.question}`,
    `📌 ${position.side} — ${position.resolution}`,
    `💰 P&L: ${(position.realized_pnl ?? 0) >= 0 ? '+' : ''}$${(position.realized_pnl ?? 0).toFixed(2)}`,
  ].join('\n'))
}

export async function notifyDailySummary(stats: SystemStats): Promise<void> {
  const pnlSign = stats.realized_pnl >= 0 ? '+' : ''
  await send([
    `📊 <b>Polymarket — დღიური ანგარიში</b>`,
    `📅 ${new Date().toLocaleString('ka-GE', { timeZone: 'Asia/Tbilisi' })}`,
    '',
    `📈 ბაზრები: ${stats.markets_tracked}`,
    `⚡ აქტიური სიგნალები: ${stats.active_signals}`,
    `🏦 ღია პოზიციები: ${stats.open_positions}`,
    `💵 განთავსებული: $${stats.total_deployed_usdc.toFixed(2)}`,
    `📐 Unrealized P&L: ${stats.unrealized_pnl >= 0 ? '+' : ''}$${stats.unrealized_pnl.toFixed(2)}`,
    `💰 Realized P&L: ${pnlSign}$${stats.realized_pnl.toFixed(2)}`,
    `🎯 Win rate: ${(stats.win_rate * 100).toFixed(1)}%`,
  ].join('\n'))
}

export async function notifyKillSwitch(cancelled: number): Promise<void> {
  await send(`🚨 <b>KILL SWITCH გააქტიურდა</b>\n${cancelled} ორდერი გაუქმდა`)
}

export { send as sendRaw }
