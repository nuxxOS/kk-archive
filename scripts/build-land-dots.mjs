#!/usr/bin/env node
/**
 * Precompute a dot-matrix landmass grid from countries.geojson → app/data/land-dots.json.
 * The globe renders these as a THREE.Points cloud (dotted-earth look, cheap & reliable).
 * Run once (or after swapping the geojson): node scripts/build-land-dots.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const geo = JSON.parse(readFileSync(join(root, 'public', 'data', 'countries.geojson'), 'utf8'))

// ray-casting point-in-ring
function inRing(lng, lat, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function inPolygon(lng, lat, coords) {
  if (!inRing(lng, lat, coords[0])) return false
  for (let h = 1; h < coords.length; h++) if (inRing(lng, lat, coords[h])) return false
  return true
}

// gather polygons with bboxes for fast rejection
const polys = []
for (const f of geo.features) {
  const g = f.geometry
  if (!g) continue
  const list = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : []
  for (const coords of list) {
    let minX = 180, maxX = -180, minY = 90, maxY = -90
    for (const [x, y] of coords[0]) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
    polys.push({ coords, minX, maxX, minY, maxY })
  }
}

const STEP = 1.1
const dots = []
for (let lat = -58; lat <= 78; lat += STEP) {
  // stagger alternate rows for a nicer matrix
  const offset = (Math.round(lat / STEP) % 2) * (STEP / 2)
  for (let lng = -180 + offset; lng <= 180; lng += STEP) {
    for (const p of polys) {
      if (lng < p.minX || lng > p.maxX || lat < p.minY || lat > p.maxY) continue
      if (inPolygon(lng, lat, p.coords)) {
        dots.push([Math.round(lat * 10) / 10, Math.round(lng * 10) / 10])
        break
      }
    }
  }
}

writeFileSync(join(root, 'app', 'data', 'land-dots.json'), JSON.stringify({ step: STEP, dots }))
console.log(`${dots.length} land dots (step ${STEP}°)`)
