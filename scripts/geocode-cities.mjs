#!/usr/bin/env node
/**
 * Geocode every city in shows.json → app/data/cities.json (lat/lng lookup for the globe).
 * Uses Open-Meteo's free geocoding API (no key). Only fetches cities not already cached.
 * Run after any show sync that adds new cities: node scripts/geocode-cities.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const { shows } = JSON.parse(readFileSync(join(root, 'app', 'data', 'shows.json'), 'utf8'))
const outPath = join(root, 'app', 'data', 'cities.json')
const cache = existsSync(outPath) ? JSON.parse(readFileSync(outPath, 'utf8')) : { cities: {} }

const wanted = [...new Set(shows.map((s) => s.city).filter(Boolean))]
const missing = wanted.filter((c) => !cache.cities[c])
console.log(`${wanted.length} cities, ${missing.length} to geocode`)

for (const city of missing) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  try {
    const res = await fetch(url)
    const data = await res.json()
    const hit = data.results?.[0]
    if (hit) {
      cache.cities[city] = { lat: hit.latitude, lng: hit.longitude, country: hit.country_code ?? '' }
      console.log(`  ${city} → ${hit.latitude.toFixed(2)}, ${hit.longitude.toFixed(2)}`)
    } else {
      console.warn(`  ${city}: no result — add manually to cities.json`)
    }
  } catch (e) {
    console.warn(`  ${city}: ${e.message}`)
  }
  await new Promise((r) => setTimeout(r, 350))
}

writeFileSync(outPath, JSON.stringify(cache, null, 2) + '\n')
console.log(`cities.json: ${Object.keys(cache.cities).length} entries`)
