#!/usr/bin/env node
/**
 * Sync KlangKuenstler discography from MusicBrainz (open API, no key) into
 * app/data/releases.json. Run occasionally: node scripts/sync-releases.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const MBID = 'dc60d275-d4d1-4bf2-b32c-4aa2332d7459' // Klangkuenstler
const HEADERS = { 'User-Agent': 'kk-fanhub/0.1 (unofficial fan archive)', Accept: 'application/json' }

async function fetchPage(offset) {
  const url = `https://musicbrainz.org/ws/2/release-group?artist=${MBID}&limit=100&offset=${offset}&fmt=json`
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, { headers: HEADERS })
    if (res.ok) return res.json()
    if (res.status === 503 || res.status === 429) {
      await new Promise((r) => setTimeout(r, attempt * 3000))
      continue
    }
    throw new Error(`MusicBrainz ${res.status}: ${await res.text()}`)
  }
  throw new Error('MusicBrainz: still busy after 5 retries')
}

const groups = []
for (let offset = 0; ; offset += 100) {
  const data = await fetchPage(offset)
  groups.push(...(data['release-groups'] ?? []))
  if (offset + 100 >= data['release-group-count']) break
  await new Promise((r) => setTimeout(r, 1100)) // MB rate limit: 1 req/s
}

const releases = groups
  .filter((g) => g['first-release-date'])
  .map((g) => ({
    id: g.id,
    title: g.title,
    date: g['first-release-date'],
    type: (g['primary-type'] ?? 'Other').toLowerCase(),
    secondaryTypes: (g['secondary-types'] ?? []).map((t) => t.toLowerCase()),
    mbUrl: `https://musicbrainz.org/release-group/${g.id}`,
  }))
  .sort((a, b) => b.date.localeCompare(a.date))

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outPath = join(root, 'app', 'data', 'releases.json')
const prev = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : { releases: [] }

// preserve manual enrichments (streamUrl, label, note) keyed by id
const enrich = new Map(prev.releases.map((r) => [r.id, r]))
for (const r of releases) {
  const old = enrich.get(r.id)
  if (old) Object.assign(r, { streamUrl: old.streamUrl, label: old.label, note: old.note })
}

writeFileSync(
  outPath,
  JSON.stringify(
    { _note: 'Synced from MusicBrainz via scripts/sync-releases.mjs. streamUrl/label/note are manual enrichments, preserved across syncs.', releases },
    null,
    2,
  ) + '\n',
)
console.log(`Wrote ${releases.length} release groups to app/data/releases.json`)
