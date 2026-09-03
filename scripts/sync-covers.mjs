#!/usr/bin/env node
/**
 * Fetch release-group front covers from the Cover Art Archive (no key) into
 * public/covers/{id}.jpg and mark hasCover in releases.json.
 * Run after sync-releases.mjs: node scripts/sync-covers.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = join(root, 'app', 'data', 'releases.json')
const coversDir = join(root, 'public', 'covers')
mkdirSync(coversDir, { recursive: true })

const file = JSON.parse(readFileSync(dataPath, 'utf8'))
let fetched = 0
let missing = 0

for (const release of file.releases) {
  const target = join(coversDir, `${release.id}.jpg`)
  if (existsSync(target)) {
    release.hasCover = true
    continue
  }
  const res = await fetch(`https://coverartarchive.org/release-group/${release.id}/front-250`, {
    redirect: 'follow',
  })
  if (res.ok) {
    writeFileSync(target, Buffer.from(await res.arrayBuffer()))
    release.hasCover = true
    fetched++
  } else {
    release.hasCover = false
    missing++
  }
  await new Promise((r) => setTimeout(r, 600)) // stay polite to the archive
}

writeFileSync(dataPath, JSON.stringify(file, null, 2) + '\n')
console.log(`covers: ${fetched} fetched, ${missing} without artwork, total ${file.releases.length}`)
