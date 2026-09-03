#!/usr/bin/env node
/**
 * Sync KlangKuenstler shows into app/data/shows.json from multiple sources:
 *
 *  1. Resident Advisor — GraphQL API (ported from the guestlist app's edge function).
 *     Primary source; upserted by `raId`.
 *  2. Songkick — artist calendar page via headless Chrome (JSON-LD in the DOM;
 *     plain curl gets bot-blocked with 406). Fills dates RA doesn't have.
 *
 * Cross-source dedupe: a Songkick event is skipped if ANY existing show (manual,
 * RA, or earlier Songkick) is on the same date. Manual entries are never touched.
 *
 * Usage: node scripts/sync-shows.mjs
 * Env:   CHROME_PATH to override the Chrome binary location.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RA_ARTIST_ID = '41146'
const RA_GRAPHQL_URL = 'https://ra.co/graphql'

const RA_HEADERS = {
  'Content-Type': 'application/json',
  Referer: 'https://ra.co',
  Origin: 'https://ra.co',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
}

const QUERY = `
  query GET_ARTIST_EVENTS($id: ID!, $year: Int) {
    artist(id: $id) {
      events(type: FROMDATE, limit: 50, year: $year) {
        id
        title
        startTime
        contentUrl
        venue {
          name
          area { name country { name urlCode } }
        }
      }
    }
  }
`

async function fetchRaEvents(year) {
  const res = await fetch(RA_GRAPHQL_URL, {
    method: 'POST',
    headers: RA_HEADERS,
    body: JSON.stringify({
      operationName: 'GET_ARTIST_EVENTS',
      variables: { id: RA_ARTIST_ID, year },
      query: QUERY,
    }),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`RA returned ${res.status}: ${text.slice(0, 300)}`)
  const data = JSON.parse(text)
  if (data.errors) throw new Error(`RA GraphQL error: ${JSON.stringify(data.errors).slice(0, 300)}`)
  return data?.data?.artist?.events ?? []
}

function toShow(ev) {
  const date = ev.startTime?.slice(0, 10)
  if (!date) return null
  const venue = ev.venue?.name ?? 'TBA'
  const city = ev.venue?.area?.name ?? ''
  const country = normalizeCountry(
    ev.venue?.area?.country?.urlCode?.toUpperCase() ?? ev.venue?.area?.country?.name ?? '',
  )
  return {
    id: `ra-${ev.id}`,
    raId: String(ev.id),
    date,
    event: ev.title?.trim() || `Klangkuenstler @ ${venue}`,
    venue,
    city,
    country,
    status: 'confirmed',
    ticketUrl: ev.contentUrl ? `https://ra.co${ev.contentUrl}` : '',
    setRecorded: false,
    source: 'ra',
  }
}

// ---------- Songkick (headless Chrome + JSON-LD) ----------

const SONGKICK_URL = 'https://www.songkick.com/artists/6349284-klangkuenstler/calendar'

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean)
  return candidates.find((p) => existsSync(p)) ?? null
}

/** Generic: render any URL with headless Chrome and extract schema.org MusicEvents. */
function fetchJsonLdEvents(url, label) {
  const chrome = findChrome()
  if (!chrome) {
    console.warn(`${label}: no Chrome binary found, skipping (set CHROME_PATH)`)
    return []
  }
  let html
  try {
    html = execFileSync(
      chrome,
      ['--headless', '--disable-gpu', '--dump-dom', '--virtual-time-budget=12000', url],
      { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 90_000, stdio: ['ignore', 'pipe', 'ignore'] },
    )
  } catch (e) {
    console.warn(`${label}: headless Chrome failed (${e.message?.slice(0, 120)}), skipping`)
    return []
  }

  const events = []
  const blocks = html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)
  for (const [, raw] of blocks) {
    let parsed
    try {
      parsed = JSON.parse(raw.trim())
    } catch {
      continue
    }
    const items = Array.isArray(parsed) ? parsed : parsed['@graph'] ?? [parsed]
    for (const item of items) {
      const type = Array.isArray(item?.['@type']) ? item['@type'] : [item?.['@type']]
      if (!type.some((t) => t === 'MusicEvent' || t === 'Event' || t === 'Festival')) continue
      if (!item.startDate) continue
      events.push(item)
    }
  }
  return events
}

/** Does a JSON-LD event involve KlangKuenstler? (name or performer match) */
function isKkEvent(ev) {
  const hay = [
    ev.name,
    ...(Array.isArray(ev.performer) ? ev.performer : [ev.performer]).map((p) => p?.name ?? p),
  ]
    .filter((x) => typeof x === 'string')
    .join(' ')
    .toLowerCase()
  return hay.includes('klangkuenstler') || hay.includes('klangkünstler') || hay.includes('outworld')
}

const fetchSongkickEvents = () => fetchJsonLdEvents(SONGKICK_URL, 'Songkick')

// Songkick/JSON-LD sources send full country names; shows.json uses RA-style 2-letter codes
const COUNTRY_CODES = {
  Germany: 'DE', Italy: 'IT', France: 'FR', Spain: 'ES', Netherlands: 'NL',
  Belgium: 'BE', Austria: 'AT', Mexico: 'MX', Canada: 'CA', Portugal: 'PT',
  India: 'IN', Switzerland: 'CH', Thailand: 'TH', Australia: 'AU', Denmark: 'DK',
  Brazil: 'BR', Turkey: 'TR', Türkiye: 'TR', 'United States': 'US', USA: 'US',
  'United Kingdom': 'UK', UK: 'UK', Poland: 'PL', Hungary: 'HU', Croatia: 'HR',
  Serbia: 'RS', Slovenia: 'SI', Greece: 'GR', Malta: 'MT', Colombia: 'CO',
  Chile: 'CL', Argentina: 'AR', Japan: 'JP', Georgia: 'GE', Ireland: 'IE',
  'Czech Republic': 'CZ', Czechia: 'CZ', Estonia: 'EE', Latvia: 'LV',
  Lithuania: 'LT', Ukraine: 'UA', Romania: 'RO', Bulgaria: 'BG', Finland: 'FI',
  Luxembourg: 'LU', Albania: 'AL', 'United Arab Emirates': 'AE', Mongolia: 'MN',
  'South Korea': 'KR', Taiwan: 'TW', Malaysia: 'MY', Russia: 'RU',
}

function normalizeCountry(raw) {
  if (!raw) return ''
  if (/^[A-Z]{2}$/.test(raw)) return raw === 'TK' ? 'TR' : raw
  return COUNTRY_CODES[raw] ?? raw
}

function songkickToShow(ev) {
  const date = ev.startDate.slice(0, 10)
  const venue = ev.location?.name ?? 'TBA'
  const city = (ev.location?.address?.addressLocality ?? '').split(',')[0].trim()
  const country = normalizeCountry(ev.location?.address?.addressCountry ?? '')
  const url = typeof ev.url === 'string' ? ev.url : ''
  return {
    id: `sk-${date}-${venue.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`,
    date,
    event: ev.name?.replace(/\s+\(.*?\)\s*$/, '').trim() || `Klangkuenstler @ ${venue}`,
    venue,
    city,
    country,
    status: 'confirmed',
    ticketUrl: url.startsWith('http') ? url : url ? `https://www.songkick.com${url}` : '',
    setRecorded: false,
    source: 'songkick',
  }
}

const dataPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data', 'shows.json')
const file = JSON.parse(readFileSync(dataPath, 'utf8'))

const thisYear = new Date().getFullYear()
const events = (
  await Promise.all([fetchRaEvents(thisYear), fetchRaEvents(thisYear + 1).catch(() => [])])
).flat()

const incoming = events.map(toShow).filter(Boolean)

const byRaId = new Map(file.shows.filter((s) => s.raId).map((s) => [s.raId, s]))
let added = 0
let updated = 0

for (const show of incoming) {
  const existing = byRaId.get(show.raId)
  if (existing) {
    // refresh volatile fields, keep everything manually curated (setRecorded, setSlug, notes…)
    Object.assign(existing, {
      date: show.date,
      event: show.event,
      venue: show.venue,
      city: show.city || existing.city,
      country: show.country || existing.country,
      ticketUrl: show.ticketUrl || existing.ticketUrl,
    })
    updated++
  } else {
    file.shows.push(show)
    added++
  }
}

console.log(`RA: ${incoming.length} fetched, ${added} added, ${updated} updated`)

// Songkick pass — only fills dates no other source has
const skEvents = fetchSongkickEvents()
const takenDates = new Set(file.shows.map((s) => s.date))
let skAdded = 0
for (const ev of skEvents) {
  const show = songkickToShow(ev)
  if (takenDates.has(show.date)) continue
  file.shows.push(show)
  takenDates.add(show.date)
  skAdded++
}
console.log(`Songkick: ${skEvents.length} fetched, ${skAdded} added after date-dedupe`)

// Promoter watchlist pass — direct sources, generic JSON-LD strategy
const promotersPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data', 'promoters.json')
const promoters = JSON.parse(readFileSync(promotersPath, 'utf8')).promoters
for (const promoter of promoters.filter((p) => p.status === 'active' && p.strategy === 'jsonld')) {
  const events = fetchJsonLdEvents(promoter.eventsUrl, promoter.name).filter(isKkEvent)
  let added = 0
  for (const ev of events) {
    const show = songkickToShow(ev) // same JSON-LD shape
    show.id = `${promoter.id}-${show.date}`
    show.source = promoter.id
    if (takenDates.has(show.date)) continue
    file.shows.push(show)
    takenDates.add(show.date)
    added++
  }
  console.log(`${promoter.name}: ${events.length} KK events found, ${added} added`)
}

file.shows.sort((a, b) => b.date.localeCompare(a.date))
writeFileSync(dataPath, JSON.stringify(file, null, 2) + '\n')

console.log(`Total shows in shows.json: ${file.shows.length}`)
