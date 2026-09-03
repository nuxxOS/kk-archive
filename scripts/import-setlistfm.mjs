#!/usr/bin/env node
/**
 * One-shot import of KlangKuenstler's full historical gigography from setlist.fm.
 * Free API key: https://api.setlist.fm/docs/1.0/index.html (account → API key).
 *
 * Usage: SETLISTFM_API_KEY=xxx node scripts/import-setlistfm.mjs
 *
 * Adds past shows with source 'setlistfm'; dedupes by date against everything
 * already in shows.json. Never touches existing entries.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const key = process.env.SETLISTFM_API_KEY
if (!key) {
  console.log('setlist.fm: SETLISTFM_API_KEY not set, skipping')
  process.exit(0)
}

const HEADERS = { 'x-api-key': key, Accept: 'application/json', 'User-Agent': 'kk-fanhub/0.1' }
const API = 'https://api.setlist.fm/rest/1.0'

async function get(path) {
  const res = await fetch(`${API}${path}`, { headers: HEADERS })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`setlist.fm ${res.status}: ${await res.text()}`)
  return res.json()
}

// 1. find artist mbid
const search = await get(`/search/artists?artistName=klangkuenstler&sort=relevance`)
const artist = search?.artist?.find((a) => /klangk/i.test(a.name))
if (!artist) {
  console.error('setlist.fm: artist not found')
  process.exit(1)
}
console.log(`Artist: ${artist.name} (${artist.mbid})`)

// 2. paginate all setlists
const all = []
for (let page = 1; page <= 40; page++) {
  const data = await get(`/artist/${artist.mbid}/setlists?p=${page}`)
  if (!data?.setlist?.length) break
  all.push(...data.setlist)
  if (page * data.itemsPerPage >= data.total) break
  await new Promise((r) => setTimeout(r, 600)) // rate limit
}
console.log(`Fetched ${all.length} setlists`)

// 3. merge
const dataPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data', 'shows.json')
const file = JSON.parse(readFileSync(dataPath, 'utf8'))
const takenDates = new Set(file.shows.map((s) => s.date))

let added = 0
for (const sl of all) {
  // eventDate is dd-MM-yyyy
  const [d, m, y] = sl.eventDate.split('-')
  const date = `${y}-${m}-${d}`
  if (takenDates.has(date)) continue
  file.shows.push({
    id: `slfm-${sl.id}`,
    date,
    event: sl.tour?.name || sl.venue?.name || 'Show',
    venue: sl.venue?.name ?? 'TBA',
    city: sl.venue?.city?.name ?? '',
    country: sl.venue?.city?.country?.code ?? '',
    status: 'confirmed',
    ticketUrl: '',
    setRecorded: false,
    source: 'setlistfm',
    setlistUrl: sl.url,
  })
  takenDates.add(date)
  added++
}

file.shows.sort((a, b) => b.date.localeCompare(a.date))
writeFileSync(dataPath, JSON.stringify(file, null, 2) + '\n')
console.log(`Added ${added} historical shows — total ${file.shows.length}`)
