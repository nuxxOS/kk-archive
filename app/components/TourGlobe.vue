<script setup lang="ts">
import citiesData from '~/data/cities.json'
import { formatShowDate, type Show } from '~/utils/archive'

const props = withDefaults(
  defineProps<{
    shows: Show[]
    /** ambient = homepage teaser: auto-rotating, non-interactive */
    ambient?: boolean
    height?: number
  }>(),
  { ambient: false, height: 0 },
)

const container = ref<HTMLElement | null>(null)
const selected = ref<string | null>(null)
const cardVisible = ref(false)
const linePath = ref('')
const lineVisible = ref(true)
const entered = ref(false)
const filterMode = ref<'upcoming' | 'all' | number>('upcoming')
const years = [...new Set(props.shows.map((s) => Number(s.date.slice(0, 4))))].sort((a, b) => b - a)

interface CityPoint {
  city: string
  lat: number
  lng: number
  count: number
  upcoming: number
  next: string | null
}

const cities = citiesData.cities as Record<string, { lat: number; lng: number }>

const byCity = props.shows.reduce<Record<string, Show[]>>((acc, s) => {
  if (s.city && cities[s.city]) (acc[s.city] ??= []).push(s)
  return acc
}, {})

const points: CityPoint[] = Object.entries(byCity).map(([city, cityShows]) => {
  const upcoming = cityShows.filter((s) => s.date >= today).sort((a, b) => a.date.localeCompare(b.date))
  return {
    city,
    lat: cities[city]!.lat,
    lng: cities[city]!.lng,
    count: cityShows.length,
    upcoming: upcoming.length,
    next: upcoming[0]?.date ?? null,
  }
})

function filteredShows(): Show[] {
  const m = filterMode.value
  if (m === 'upcoming') return props.shows.filter((s) => s.date >= today)
  if (m === 'all') return props.shows
  return props.shows.filter((s) => s.date.slice(0, 4) === String(m))
}

// stable point identities: counts are mutated in place on filter change, so the
// label/ring layers (which diff by object identity) don't rebuild every tick
let currentVisible: CityPoint[] = []
function applyFilter() {
  const counts = new Map<string, number>()
  for (const s of filteredShows()) if (s.city && cities[s.city]) counts.set(s.city, (counts.get(s.city) ?? 0) + 1)
  for (const p of points) p.count = counts.get(p.city) ?? 0
  currentVisible = points.filter((p) => p.count > 0)
}
applyFilter()
const visiblePoints = () => currentVisible

// tour route arcs for the active filter (skipped when the route would be spaghetti)
function routeArcs() {
  if (filterMode.value === 'all') {
    // all-time routing is unreadable — show the upcoming route only
    return arcsFrom(props.shows.filter((s) => s.date >= today))
  }
  return arcsFrom(filteredShows())
}

function arcsFrom(shows: Show[]) {
  const stops = shows.filter((s) => s.city && cities[s.city]).sort((a, b) => a.date.localeCompare(b.date))
  if (stops.length > 60) return []
  const arcs: { startLat: number; startLng: number; endLat: number; endLng: number }[] = []
  for (let i = 0; i < stops.length - 1; i++) {
    const a = cities[stops[i]!.city]!
    const b = cities[stops[i + 1]!.city]!
    if (a === b || (a.lat === b.lat && a.lng === b.lng)) continue
    arcs.push({ startLat: a.lat, startLng: a.lng, endLat: b.lat, endLng: b.lng })
  }
  return arcs
}

const selectedShows = computed(() =>
  selected.value
    ? filteredShows()
        .filter((s) => s.city === selected.value)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 6)
    : [],
)

let globe: any = null
let raf = 0
let resumeTimer: ReturnType<typeof setTimeout> | null = null
let landMat: any = null
let starMat: any = null
let labelsShown = false
let spriteMap = new Map<string, any>()

function formatDate(d: string) {
  const f = formatShowDate(d)
  return `${f.day} ${f.month} ${f.year}`
}

// is a lat/lng on the camera-facing hemisphere?
function isFrontFacing(lat: number, lng: number) {
  const cam = globe.camera().position
  const p = globe.getCoords(lat, lng, 0.02)
  const pLen = Math.hypot(p.x, p.y, p.z)
  const cLen = Math.hypot(cam.x, cam.y, cam.z)
  return (p.x * cam.x + p.y * cam.y + p.z * cam.z) / (pLen * cLen) > 100 / cLen
}

/** the visible city dots: camera-facing glow sprites (always round, never "deep") */
function styleSprites() {
  for (const p of points) {
    const spr = spriteMap.get(p.city)
    if (!spr) continue
    const count = p.count
    const sel = p.city === selected.value
    spr.visible = count > 0
    if (!count) continue
    const base = 2.4 + Math.min(count, 6) * 0.55
    const scale = sel ? base * 1.55 : base
    spr.scale.set(scale, scale, 1)
    spr.material.color.set(sel ? 0xffffff : p.upcoming ? 0xc4ffef : 0x5fbfae)
    spr.material.opacity = sel ? 1 : p.upcoming ? 0.95 : 0.55
  }
}

function updateLine() {
  if (!globe || !selected.value || !container.value) {
    linePath.value = ''
    return
  }
  const point = points.find((p) => p.city === selected.value)
  if (!point) return
  const coords = globe.getScreenCoords(point.lat, point.lng, 0.02)
  const card = container.value.querySelector('.globe-card') as HTMLElement | null
  if (!card || !coords) return

  lineVisible.value = isFrontFacing(point.lat, point.lng)

  const rect = container.value.getBoundingClientRect()
  const cr = card.getBoundingClientRect()
  const x2 = cr.left - rect.left
  const y2 = cr.top - rect.top + 24
  linePath.value = `M ${coords.x} ${coords.y} L ${x2 - 28} ${y2} L ${x2} ${y2}`
}

let lastLabelTick = 0
function updateZoomView() {
  if (!globe || !container.value) return
  const dist = globe.camera().position.length()
  const close = dist < 210
  if (close !== labelsShown) {
    labelsShown = close
    if (landMat) landMat.opacity = close ? 0.26 : 0.45
    if (starMat) starMat.opacity = close ? 0.22 : 0.5
    if (!close) {
      globe.labelsData([])
      globe.ringsData(visiblePoints())
    }
  }
  if (!close) return

  // scanner mode: label only front-facing dots near the center of view, most-played first
  const now = performance.now()
  if (now - lastLabelTick < 250) return
  lastLabelTick = now
  const canvas = container.value.querySelector('.globe-canvas') as HTMLElement
  const w = canvas.clientWidth
  const h = canvas.clientHeight
  const candidates = visiblePoints()
    .map((p) => {
      if (!isFrontFacing(p.lat, p.lng)) return null
      const c = globe.getScreenCoords(p.lat, p.lng, 0.02)
      if (!c || c.x < w * 0.16 || c.x > w * 0.84 || c.y < h * 0.14 || c.y > h * 0.86) return null
      return { p, x: c.x, y: c.y }
    })
    .filter(Boolean) as { p: CityPoint; x: number; y: number }[]

  // collision rejection: biggest city wins; neighbors stay silent until zoom gives them room
  candidates.sort((a, b) => b.p.count - a.p.count)
  const placed: { x: number; y: number }[] = []
  const MIN_GAP = 78
  const inView = candidates
    .filter(({ x, y }) => {
      if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < MIN_GAP)) return false
      placed.push({ x, y })
      return true
    })
    .map(({ p }) => p)
    .slice(0, 9)
  globe.labelsData(inView)
  // in close-up, only the selected dot pulses — the rest stay quiet
  globe.ringsData(points.filter((p) => p.city === selected.value))
}

function select(d: CityPoint | null) {
  selected.value = d?.city ?? null
  cardVisible.value = !!d
  if (!globe) return
  styleSprites()
  if (!labelsShown) globe.ringsData(visiblePoints())
}

function setFilter(mode: 'upcoming' | 'all' | number) {
  filterMode.value = mode
  applyFilter()
  if (!globe) return
  if (selected.value && !currentVisible.some((p) => p.city === selected.value)) select(null)
  globe.pointsData(visiblePoints())
  globe.arcsData(routeArcs())
  if (!labelsShown) globe.ringsData(visiblePoints())
  lastLabelTick = 0
  styleSprites()
}

function pickYear(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  if (v) setFilter(Number(v))
}

function zoomBy(factor: number) {
  if (!globe) return
  const pov = globe.pointOfView()
  const altitude = Math.min(3.8, Math.max(0.2, pov.altitude * factor))
  globe.pointOfView({ ...pov, altitude }, 350)
}

onMounted(() => { initGlobe() })

async function initGlobe() {
  if (!container.value) return
  const { default: Globe } = await import('globe.gl')
  const THREE = await import('three')
  const { dots } = (await import('~/data/land-dots.json')).default as { dots: [number, number][] }

  const el = container.value.querySelector('.globe-canvas') as HTMLElement
  const width = container.value.clientWidth
  const height = props.height || Math.min(680, Math.max(460, width * 0.55))

  globe = new Globe(el, { animateIn: false })
    .backgroundColor('rgba(0,0,0,0)')
    .width(width)
    .height(height)
    .showAtmosphere(true)
    .atmosphereColor('#7ceedd')
    .atmosphereAltitude(0.13)
    // interaction layer only — visuals come from the glow sprites
    .pointsData(visiblePoints())
    .pointLat('lat')
    .pointLng('lng')
    .pointColor(() => 'rgba(124, 238, 221, 0.03)')
    .pointAltitude(() => 0.0008)
    .pointRadius((d: any) => 0.5 + Math.min(d.count, 6) * 0.09)
    // pulse rings
    .ringsData(visiblePoints())
    .ringLat('lat')
    .ringLng('lng')
    .ringColor((d: any) => (t: number) =>
      `rgba(124, 238, 221, ${Math.max(0, (d.city === selected.value ? 0.8 : 0.4) * (1 - t))})`,
    )
    .ringMaxRadius((d: any) => (d.city === selected.value ? 4.5 : 2.8))
    .ringPropagationSpeed(1.6)
    .ringRepeatPeriod(1400)
    // tour route arcs
    .arcsData(routeArcs())
    .arcColor(() => ['rgba(124,238,221,0.0)', '#7ceedd', 'rgba(124,238,221,0.0)'])
    .arcStroke(0.42)
    .arcDashLength(0.35)
    .arcDashGap(0.25)
    .arcDashAnimateTime(4200)
    .arcAltitudeAutoScale(0.38)
    // labels appear only in the close-up view (see updateZoomView)
    .labelsData([])
    .labelLat('lat')
    .labelLng('lng')
    .labelText((d: any) => d.city.toUpperCase())
    .labelSize(0.52)
    .labelDotRadius(0)
    .labelColor(() => 'rgba(124, 238, 221, 0.75)')
    .labelAltitude(0.012)
    .labelResolution(2)

  if (!props.ambient) {
    globe
      .pointLabel(
        (d: any) =>
          `<div class="gtip"><b>${d.city}</b><span>${d.count} show${d.count > 1 ? 's' : ''}${
            d.next ? ` · next ${formatDate(d.next)}` : ''
          }</span></div>`,
      )
      .onPointHover((d: any) => {
        el.style.cursor = d ? 'pointer' : 'grab'
      })
      .onPointClick((d: any) => {
        select(d)
        globe.controls().autoRotate = false
        globe.pointOfView({ lat: d.lat, lng: d.lng, altitude: 1.6 }, 900)
      })
      .onGlobeClick(() => select(null))
  }

  // dotted-matrix continents
  const positions = new Float32Array(dots.length * 3)
  dots.forEach(([lat, lng], i) => {
    const { x, y, z } = globe.getCoords(lat, lng, 0.005)
    positions[i * 3] = x
    positions[i * 3 + 1] = y
    positions[i * 3 + 2] = z
  })
  const landGeo = new THREE.BufferGeometry()
  landGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  landMat = new THREE.PointsMaterial({
    color: 0x7ceedd,
    size: 0.62,
    transparent: true,
    opacity: 0.45,
    sizeAttenuation: true,
  })
  globe.scene().add(new THREE.Points(landGeo, landMat))

  // city glow sprites — billboarded, always round
  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = glowCanvas.height = 128
  const g = glowCanvas.getContext('2d')!
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.22, 'rgba(214,255,245,0.95)')
  grad.addColorStop(0.5, 'rgba(124,238,221,0.38)')
  grad.addColorStop(1, 'rgba(124,238,221,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  const glowTex = new THREE.CanvasTexture(glowCanvas)

  spriteMap = new Map()
  for (const p of points) {
    const mat = new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false })
    const spr = new THREE.Sprite(mat)
    const pos = globe.getCoords(p.lat, p.lng, 0.012)
    spr.position.set(pos.x, pos.y, pos.z)
    spr.renderOrder = 2
    spriteMap.set(p.city, spr)
    globe.scene().add(spr)
  }
  styleSprites()

  // starfield — sparse, cold, far away
  const STARS = 1400
  const starPos = new Float32Array(STARS * 3)
  for (let i = 0; i < STARS; i++) {
    const r = 900 + Math.random() * 900
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    starPos[i * 3 + 2] = r * Math.cos(phi)
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  starMat = new THREE.PointsMaterial({
    color: 0xcdeee6,
    size: 1.15,
    transparent: true,
    opacity: 0.5,
    sizeAttenuation: false,
  })
  globe.scene().add(new THREE.Points(starGeo, starMat))

  // globe body: deep teal-black with a faint inner glow
  const mat = globe.globeMaterial()
  mat.color.set('#081310')
  mat.emissive.set('#041009')
  mat.emissiveIntensity = 0.6
  mat.shininess = 0.15

  // entry: drift in from deep space
  globe.pointOfView({ lat: 30, lng: -5, altitude: 3.6 }, 0)
  globe.pointOfView({ lat: 42, lng: 8, altitude: 2.1 }, 1800)

  const controls = globe.controls()
  controls.autoRotate = true
  controls.autoRotateSpeed = props.ambient ? 0.8 : 0.55
  controls.enableZoom = !props.ambient
  controls.enabled = !props.ambient
  controls.minDistance = 118
  controls.maxDistance = 480
  controls.zoomSpeed = 0.6

  if (!props.ambient) {
    controls.addEventListener('start', () => {
      controls.autoRotate = false
      if (resumeTimer) clearTimeout(resumeTimer)
    })
    controls.addEventListener('end', () => {
      if (resumeTimer) clearTimeout(resumeTimer)
      resumeTimer = setTimeout(() => (controls.autoRotate = true), 10_000)
    })
  }

  const loop = () => {
    updateLine()
    updateZoomView()
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)

  window.addEventListener('resize', resizeGlobe)
  requestAnimationFrame(() => (entered.value = true))
}

function resizeGlobe() {
  if (globe && container.value) globe.width(container.value.clientWidth)
}

function destroyGlobe() {
  cancelAnimationFrame(raf)
  if (resumeTimer) clearTimeout(resumeTimer)
  window.removeEventListener('resize', resizeGlobe)
  globe?._destructor?.()
}

onBeforeUnmount(() => { destroyGlobe() })
</script>

<template>
  <div ref="container" class="globe-wrap" :class="{ 'is-entered': entered, 'is-ambient': ambient }">
    <div class="globe-canvas" />

    <svg v-if="cardVisible && linePath" class="globe-line" :class="{ 'is-hidden': !lineVisible }" aria-hidden="true">
      <path :d="linePath" />
    </svg>

    <!-- filter chips -->
    <div v-if="!ambient" class="globe-filter mono">
      <button :class="{ 'is-active': filterMode === 'upcoming' }" @click="setFilter('upcoming')">Upcoming</button>
      <button :class="{ 'is-active': filterMode === 'all' }" @click="setFilter('all')">All time</button>
      <select
        class="globe-filter-year"
        :class="{ 'is-active': typeof filterMode === 'number' }"
        :value="typeof filterMode === 'number' ? filterMode : ''"
        @change="pickYear"
      >
        <option value="" disabled>Year</option>
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>

    <!-- zoom controls -->
    <div v-if="!ambient" class="globe-zoom">
      <button class="mono" aria-label="Zoom in" @click="zoomBy(0.62)">+</button>
      <button class="mono" aria-label="Zoom out" @click="zoomBy(1.6)">−</button>
    </div>

    <Transition name="card">
      <div v-if="cardVisible && selected" class="glass globe-card">
        <div class="globe-card-head">
          <p class="globe-card-city display">{{ selected }}</p>
          <button class="globe-card-close mono" aria-label="Close" @click="select(null)">✕</button>
        </div>
        <p class="label">{{ points.find((p) => p.city === selected)?.count }} shows tracked</p>
        <div class="globe-card-shows">
          <div v-for="s in selectedShows" :key="s.id" class="globe-card-show">
            <span class="mono globe-card-date">{{ formatDate(s.date) }}</span>
            <span class="globe-card-event">{{ s.event }}</span>
            <span class="mono globe-card-venue">{{ s.venue }}</span>
            <a
              v-if="s.ticketUrl && s.date >= today"
              :href="s.ticketUrl"
              target="_blank"
              rel="noopener"
              class="mono globe-card-tickets"
              >Tickets ↗</a
            >
          </div>
        </div>
      </div>
    </Transition>

    <p v-if="!ambient" class="globe-hint mono">Drag to rotate · scroll to zoom · tap a dot</p>
  </div>
</template>

<style scoped>
.globe-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid var(--line);
  opacity: 0;
  transform: scale(0.975);
  transition: opacity 1.1s ease, transform 1.4s cubic-bezier(0.2, 0.6, 0.2, 1);
  /* deep space: vignette + faint nebulas */
  background:
    radial-gradient(45% 45% at 68% 30%, rgba(124, 238, 221, 0.045) 0%, transparent 70%),
    radial-gradient(55% 55% at 22% 75%, rgba(60, 110, 130, 0.05) 0%, transparent 70%),
    radial-gradient(90% 90% at 50% 50%, #010403 0%, #000 100%);
}

.globe-wrap.is-entered { opacity: 1; transform: scale(1); }
.globe-wrap.is-ambient { pointer-events: none; }

@media (prefers-reduced-motion: reduce) {
  .globe-wrap { transition: none; opacity: 1; transform: none; }
}

.globe-canvas { display: flex; justify-content: center; }

/* hover tooltip injected by globe.gl */
:deep(.scene-tooltip) { pointer-events: none; }
:deep(.gtip) {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(4, 13, 11, 0.9);
  border: 1px solid rgba(124, 238, 221, 0.3);
  backdrop-filter: blur(4px);
}
:deep(.gtip b) {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #edf6f2;
}
:deep(.gtip span) {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9.5px;
  letter-spacing: 0.06em;
  color: #7ceedd;
}

.globe-line { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.globe-line path {
  fill: none;
  stroke: var(--lime);
  stroke-width: 1;
  opacity: 0.75;
  filter: drop-shadow(0 0 4px rgba(124, 238, 221, 0.6));
  transition: opacity 0.2s ease;
}
.globe-line.is-hidden path { opacity: 0; }

/* filter chips — top left */
.globe-filter {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  gap: 6px;
}
.globe-filter button {
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  background: rgba(4, 13, 11, 0.7);
  border: 1px solid var(--line-2);
  border-radius: 999px;
  padding: 7px 14px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: color 0.2s ease, border-color 0.2s ease;
}
.globe-filter button:hover { color: var(--ink); }
.globe-filter button.is-active {
  color: var(--lime);
  border-color: var(--lime-border);
  background: rgba(124, 238, 221, 0.12);
}

.globe-filter-year {
  font-family: var(--mono);
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  background: rgba(4, 13, 11, 0.7);
  border: 1px solid var(--line-2);
  border-radius: 999px;
  padding: 7px 12px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  appearance: none;
  -webkit-appearance: none;
}

.globe-filter-year.is-active {
  color: var(--lime);
  border-color: var(--lime-border);
  background: rgba(124, 238, 221, 0.12);
}

.globe-filter-year option {
  background: #0a1714;
  color: var(--ink);
}

/* zoom buttons — right side, vertically centered */
.globe-zoom {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.globe-zoom button {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--ink-2);
  background: rgba(4, 13, 11, 0.7);
  border: 1px solid var(--line-2);
  border-radius: 8px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: color 0.2s ease, border-color 0.2s ease;
}
.globe-zoom button:hover { color: var(--lime); border-color: var(--lime-border); }

.globe-card {
  position: absolute;
  top: 28px;
  right: 64px;
  width: min(310px, calc(100% - 110px));
  padding: 18px 20px;
  background: rgba(4, 13, 11, 0.88);
}

.globe-card-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 6px; }
.globe-card-city { font-size: 22px; color: var(--ink); }
.globe-card-close { background: none; border: 0; color: var(--ink-4); cursor: pointer; font-size: 12px; padding: 4px; }
.globe-card-close:hover { color: var(--ink); }

.globe-card-shows { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; max-height: 260px; overflow-y: auto; }
.globe-card-show { display: flex; flex-direction: column; gap: 2px; border-left: 2px solid var(--lime-border); padding-left: 10px; }
.globe-card-date { font-size: 10px; color: var(--lime); letter-spacing: 0.1em; }
.globe-card-event { font-size: 13px; font-weight: 600; }
.globe-card-venue { font-size: 10px; color: var(--ink-3); }
.globe-card-tickets { font-size: 10px; color: var(--lime); margin-top: 2px; }

.globe-hint {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ink-4);
  pointer-events: none;
}

@media (max-width: 640px) {
  .globe-card {
    top: auto;
    bottom: 12px;
    left: 12px;
    right: 60px;
    width: auto;
  }
  .globe-card-shows { max-height: 180px; }
}

.card-enter-active, .card-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.card-enter-from, .card-leave-to { opacity: 0; transform: translateY(6px); }
</style>
