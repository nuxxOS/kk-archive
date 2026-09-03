#!/usr/bin/env node
/**
 * Post newly-discovered shows to the Telegram broadcast channel.
 * Keeps state in app/data/.telegram-posted.json so each show posts exactly once.
 *
 * Setup (one-time, ~5 min):
 *   1. @BotFather → /newbot → copy token
 *   2. Create a public channel, add the bot as admin (post rights)
 *   3. export TELEGRAM_BOT_TOKEN="123:abc"  TELEGRAM_CHAT_ID="@yourchannel"
 *
 * Without env vars it exits quietly (so `pnpm sync` works before setup).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const token = process.env.TELEGRAM_BOT_TOKEN
const chatId = process.env.TELEGRAM_CHAT_ID
if (!token || !chatId) {
  console.log('Telegram: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set, skipping')
  process.exit(0)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { shows } = JSON.parse(readFileSync(join(root, 'app', 'data', 'shows.json'), 'utf8'))
const statePath = join(root, 'app', 'data', '.telegram-posted.json')
const posted = new Set(existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : [])

const today = new Date().toISOString().slice(0, 10)
const fresh = shows
  .filter((s) => s.date >= today && !posted.has(s.id))
  .sort((a, b) => a.date.localeCompare(b.date))

const fmtDate = (d) => {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

for (const s of fresh) {
  const lines = [
    `🆕 <b>KlangKuenstler — ${s.event}</b>`,
    `📅 ${fmtDate(s.date)}${s.status !== 'confirmed' ? ` (${s.status})` : ''}`,
    `📍 ${[s.venue, s.city, s.country].filter(Boolean).join(', ')}`,
    s.ticketUrl ? `🎟 <a href="${s.ticketUrl}">Tickets</a>` : null,
  ].filter(Boolean)

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })
  const body = await res.json()
  if (!body.ok) {
    console.error(`Telegram: failed for ${s.id}: ${body.description}`)
    continue
  }
  posted.add(s.id)
  console.log(`Telegram: posted ${s.id}`)
  await new Promise((r) => setTimeout(r, 1100)) // stay under rate limits
}

writeFileSync(statePath, JSON.stringify([...posted], null, 2) + '\n')
console.log(`Telegram: ${fresh.length} new, ${posted.size} total posted`)
