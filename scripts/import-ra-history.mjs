#!/usr/bin/env node
/**
 * One-shot import of KlangKuenstler's historical gigography from RA (GraphQL,
 * type: PREVIOUS, year by year — no API key needed).
 * Dedupes by raId, and by date+city against manual/other-source entries.
 *
 * Usage: node scripts/import-ra-history.mjs [fromYear] [toYear]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RA_ARTIST_ID = '41146'
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
      events(type: PREVIOUS, limit: 100, year: $year) {
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

async function fetchYear(year) {
  const res = await fetch('https://ra.co/graphql', {
    method: 'POST',
    headers: RA_HEADERS,
    body: JSON.stringify({ operationName: 'GET_ARTIST_EVENTS', variables: { id: RA_ARTIST_ID, year }, query: QUERY }),
  })
  const data = await res.json()
  if (data.errors) throw new Error(JSON.stringify(data.errors).slice(0, 200))
  return data?.data?.artist?.events ?? []
}

const fromYear = Number(process.argv[2] ?? 2013)
const toYear = Number(process.argv[3] ?? new Date().getFullYear())

const dataPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data', 'shows.json')
const file = JSON.parse(readFileSync(dataPath, 'utf8'))
const byRaId = new Set(file.shows.filter((s) => s.raId).map((s) => s.raId))
const byDateCity = new Set(file.shows.map((s) => `${s.date}|${(s.city || '').toLowerCase()}`))

let added = 0
for (let year = fromYear; year <= toYear; year++) {
  let events
  try {
    events = await fetchYear(year)
  } catch (e) {
    console.warn(`${year}: ${e.message}`)
    continue
  }
  let yearAdded = 0
  for (const ev of events) {
    const raId = String(ev.id)
    const date = ev.startTime?.slice(0, 10)
    if (!date || byRaId.has(raId)) continue
    const city = ev.venue?.area?.name ?? ''
    const key = `${date}|${city.toLowerCase()}`
    if (byDateCity.has(key)) continue
    file.shows.push({
      id: `ra-${raId}`,
      raId,
      date,
      event: ev.title?.trim() || `Klangkuenstler @ ${ev.venue?.name ?? 'TBA'}`,
      venue: ev.venue?.name ?? 'TBA',
      city,
      country: ev.venue?.area?.country?.urlCode?.toUpperCase() ?? ev.venue?.area?.country?.name ?? '',
      status: 'confirmed',
      ticketUrl: ev.contentUrl ? `https://ra.co${ev.contentUrl}` : '',
      setRecorded: false,
      source: 'ra',
    })
    byRaId.add(raId)
    byDateCity.add(key)
    yearAdded++
    added++
  }
  console.log(`${year}: ${events.length} events, ${yearAdded} added${events.length === 100 ? ' (hit 100 limit — may be truncated)' : ''}`)
  await new Promise((r) => setTimeout(r, 700))
}

file.shows.sort((a, b) => b.date.localeCompare(a.date))
writeFileSync(dataPath, JSON.stringify(file, null, 2) + '\n')
console.log(`\nAdded ${added} historical shows — total ${file.shows.length}`)
