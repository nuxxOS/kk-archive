#!/usr/bin/env node
/**
 * Generate public/klangkuenstler-tour.ics from app/data/shows.json.
 * Fans subscribe once (webcal) and every deploy updates their calendar.
 * Run after sync-shows: node scripts/build-ics.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { shows } = JSON.parse(readFileSync(join(root, 'app', 'data', 'shows.json'), 'utf8'))

const esc = (s = '') => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
const dateNum = (d) => d.replaceAll('-', '')
// include future shows + last 30 days, so a fresh subscriber sees recent context
const cutoff = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)

const events = shows
  .filter((s) => s.date >= cutoff)
  .map((s) => {
    const end = new Date(new Date(s.date + 'T00:00:00Z').getTime() + 86400_000).toISOString().slice(0, 10)
    return [
      'BEGIN:VEVENT',
      `UID:${s.id}@kk-fanhub`,
      `DTSTAMP:${dateNum(s.date)}T000000Z`,
      `DTSTART;VALUE=DATE:${dateNum(s.date)}`,
      `DTEND;VALUE=DATE:${dateNum(end)}`,
      `SUMMARY:${esc(`KlangKuenstler — ${s.event}`)}`,
      `LOCATION:${esc([s.venue, s.city, s.country].filter(Boolean).join(', '))}`,
      s.ticketUrl ? `URL:${esc(s.ticketUrl)}` : null,
      `DESCRIPTION:${esc(`Status: ${s.status}${s.ticketUrl ? ` · Tickets: ${s.ticketUrl}` : ''} · via KK Fan Hub (unofficial)`)}`,
      'END:VEVENT',
    ]
      .filter(Boolean)
      .join('\r\n')
  })

const ics = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//KK Fan Hub//Tour Calendar//EN',
  'CALSCALE:GREGORIAN',
  'METHOD:PUBLISH',
  'X-WR-CALNAME:KlangKuenstler — Tour (unofficial)',
  'X-WR-CALDESC:All announced KlangKuenstler shows. Fan-maintained\\, not affiliated with the artist.',
  ...events,
  'END:VCALENDAR',
].join('\r\n')

mkdirSync(join(root, 'public'), { recursive: true })
writeFileSync(join(root, 'public', 'klangkuenstler-tour.ics'), ics + '\r\n')
console.log(`Wrote ${events.length} events to public/klangkuenstler-tour.ics`)
