#!/usr/bin/env node
/**
 * One-shot import of Songkick's full gigography (past shows) via headless Chrome.
 * Fills historical gaps RA doesn't cover (e.g. Lisbon 2025-12-20).
 * Dedupe: same date + accent-normalized city == same show.
 *
 * Usage: node scripts/import-songkick-history.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const BASE = 'https://www.songkick.com/artists/6349284-klangkuenstler/gigography'

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean)
  return candidates.find((p) => existsSync(p)) ?? null
}

const chrome = findChrome()
if (!chrome) {
  console.error('No Chrome binary found (set CHROME_PATH)')
  process.exit(1)
}

function fetchPage(page) {
  const html = execFileSync(
    chrome,
    ['--headless', '--disable-gpu', '--dump-dom', '--virtual-time-budget=10000', `${BASE}?page=${page}`],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 90_000, stdio: ['ignore', 'pipe', 'ignore'] },
  )
  const events = []
  for (const [, raw] of html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    let parsed
    try {
      parsed = JSON.parse(raw.trim())
    } catch {
      continue
    }
    for (const item of Array.isArray(parsed) ? parsed : [parsed]) {
      if (item['@type'] !== 'MusicEvent' || !item.startDate) continue
      if (typeof item.eventStatus === 'string' && /cancelled|postponed/i.test(item.eventStatus)) continue
      events.push(item)
    }
  }
  return events
}

const norm = (s = '') =>
  s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

const dataPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data', 'shows.json')
const file = JSON.parse(readFileSync(dataPath, 'utf8'))
const seen = new Set(file.shows.map((s) => `${s.date}|${norm(s.city)}`))

let added = 0
const addedShows = []
for (let page = 1; page <= 30; page++) {
  let events
  try {
    events = fetchPage(page)
  } catch (e) {
    console.warn(`page ${page}: ${e.message?.slice(0, 100)} — stopping`)
    break
  }
  if (!events.length) {
    console.log(`page ${page}: empty — done`)
    break
  }
  let pageAdded = 0
  for (const ev of events) {
    const date = ev.startDate.slice(0, 10)
    const venue = ev.location?.name ?? 'TBA'
    const city = (ev.location?.address?.addressLocality ?? '').split(',')[0].trim()
    const key = `${date}|${norm(city)}`
    if (seen.has(key)) continue
    seen.add(key)
    const url = typeof ev.url === 'string' ? ev.url : ''
    file.shows.push({
      id: `sk-${date}-${norm(venue).replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`,
      date,
      event: ev.name?.replace(/\s+\(.*?\)\s*$/, '').trim() || `Klangkuenstler @ ${venue}`,
      venue,
      city,
      country: ev.location?.address?.addressCountry ?? '',
      status: 'confirmed',
      ticketUrl: url.startsWith('http') ? url : url ? `https://www.songkick.com${url}` : '',
      setRecorded: false,
      source: 'songkick',
    })
    addedShows.push(`${date} ${city} — ${venue}`)
    pageAdded++
    added++
  }
  console.log(`page ${page}: ${events.length} events, ${pageAdded} new`)
}

file.shows.sort((a, b) => b.date.localeCompare(a.date))
writeFileSync(dataPath, JSON.stringify(file, null, 2) + '\n')
console.log(`\nAdded ${added} shows RA didn't have — total ${file.shows.length}`)
if (addedShows.length) console.log(addedShows.slice(0, 40).join('\n'))
