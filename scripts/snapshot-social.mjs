#!/usr/bin/env node
/**
 * Snapshot public audience numbers (no API keys) into app/data/social.json.
 * One row per day, idempotent — rerunning today overwrites today's row.
 * Run daily via `pnpm sync`. Sources: Spotify og:description (rounded),
 * SoundCloud page JSON (exact), Deezer API (exact), YouTube page JSON (rounded).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

/** "932.1K" / "1.2M" / "145K" / "38553" → integer */
function parseCompact(text) {
  const m = String(text).replaceAll(',', '').match(/([\d.]+)\s*([KM])?/i)
  if (!m) return null
  const mult = { K: 1e3, M: 1e6 }[m[2]?.toUpperCase()] ?? 1
  return Math.round(Number(m[1]) * mult)
}

async function fetchText(url, extraHeaders = {}) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en', ...extraHeaders } })
  if (!res.ok) throw new Error(`${url} -> ${res.status}`)
  return res.text()
}

const SOURCES = {
  spotifyMonthlyListeners: async () => {
    // Spotify serves SSR meta tags only to plain clients (curl default UA);
    // node fetch and browser UAs get an empty JS shell
    const html = execFileSync('curl', ['-s', 'https://open.spotify.com/artist/6H77vD9YyhyxHBTkRpbMBk'], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    })
    const m = html.match(/og:description" content="Artist · ([\d.,KM]+) monthly listeners/)
    return m ? parseCompact(m[1]) : null
  },
  soundcloudFollowers: async () => {
    const html = await fetchText('https://soundcloud.com/klangkuenstler')
    const m = html.match(/"followers_count":(\d+)/)
    return m ? Number(m[1]) : null
  },
  deezerFans: async () => {
    const res = await fetch('https://api.deezer.com/artist/3561421')
    const data = await res.json()
    return data.nb_fan ?? null
  },
  youtubeSubscribers: async () => {
    const html = await fetchText('https://www.youtube.com/channel/UCVhGY5dI7gD1uArjjkuNr_w/about?hl=en', {
      Cookie: 'CONSENT=YES+1',
    })
    const m = html.match(/"subscriberCountText":"([\d.,KM]+) subscribers"/)
    return m ? parseCompact(m[1]) : null
  },
}

const snapshot = { date: new Date().toISOString().slice(0, 10) }
for (const [key, fetcher] of Object.entries(SOURCES)) {
  try {
    snapshot[key] = await fetcher()
    console.log(`${key}: ${snapshot[key]}`)
  } catch (e) {
    snapshot[key] = null
    console.warn(`${key}: FAILED (${e.message?.slice(0, 100)})`)
  }
}

const dataPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'app', 'data', 'social.json')
const file = existsSync(dataPath) ? JSON.parse(readFileSync(dataPath, 'utf8')) : { snapshots: [] }

// carry forward the last known value when a source fails, so charts never dip to null
const last = file.snapshots.at(-1)
for (const key of Object.keys(SOURCES)) {
  if (snapshot[key] === null && last) snapshot[key] = last[key] ?? null
}

file.snapshots = file.snapshots.filter((s) => s.date !== snapshot.date)
file.snapshots.push(snapshot)
file.snapshots.sort((a, b) => a.date.localeCompare(b.date))

writeFileSync(dataPath, JSON.stringify(file, null, 2) + '\n')
console.log(`social.json: ${file.snapshots.length} snapshots`)
