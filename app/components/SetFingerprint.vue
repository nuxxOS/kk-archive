<script setup lang="ts">
import type { SetAnalysis } from '~/components/SetAnatomy.vue'

const props = defineProps<{ analysis: SetAnalysis }>()

const container = ref<HTMLElement | null>(null)
const view = ref<'flat' | 'coil'>('coil')

const TURNS = 9
const TWEEN_MS = 2100
const INTRO_DELAY_MS = 450

let renderer: any = null
let raf = 0
let dragging = false
let lastX = 0
let baseRot = 0.9
let u = 0
let uFrom = 0
let uTarget = 1
let tweenStart = 0

function setView(next: 'flat' | 'coil') {
  if (view.value === next) return
  view.value = next
  uFrom = u
  uTarget = next === 'coil' ? 1 : 0
  tweenStart = performance.now()
  if (next === 'coil') baseRot = 0.9
}

async function initFingerprint() {
  if (!container.value) return
  const THREE = await import('three')
  const el = container.value
  const size = el.clientWidth

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
  renderer.setSize(size, size)
  el.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20)
  camera.position.z = 3.1

  const group = new THREE.Group()
  scene.add(group)

  const { transitions, durationSec, tracklist } = props.analysis
  // display smoothing: raw 10s RMS swings too hard to read as a silhouette
  const SMOOTH_WINDOW = 3
  const raw = props.analysis.energy.map((_, i, arr) => {
    const from = Math.max(0, i - SMOOTH_WINDOW)
    const to = Math.min(arr.length, i + SMOOTH_WINDOW + 1)
    return arr.slice(from, to).reduce((sum, v) => sum + v, 0) / (to - from)
  })
  // low-res analyses draw as polygons — resample so every coil turn stays round
  const MIN_POINTS = 540
  const n = Math.max(raw.length, MIN_POINTS)
  const energy: number[] = Array.from({ length: n }, (_, i) => {
    const t = (i / (n - 1)) * (raw.length - 1)
    const lo = Math.floor(t)
    const hi = Math.min(lo + 1, raw.length - 1)
    return raw[lo]! + (raw[hi]! - raw[lo]!) * (t - lo)
  })
  const step = durationSec / (n - 1)
  const isNearTransition = (sec: number) => transitions.some((tr) => Math.abs(tr.time - sec) < step)

  const flatPos = new Float32Array(n * 3)
  const coilPos = new Float32Array(n * 3)
  const colors = new Float32Array(n * 3)
  const teal = new THREE.Color('#7ceedd')
  const bright = new THREE.Color('#dcfff6')

  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const e = energy[i]!
    flatPos[i * 3] = (t - 0.5) * 1.72
    flatPos[i * 3 + 1] = (e - 0.5) * 0.85
    flatPos[i * 3 + 2] = 0

    const spike = isNearTransition(i * step) ? 0.22 : 0
    const r = 0.34 + e * 0.5 + spike
    const a = t * TURNS * Math.PI * 2
    coilPos[i * 3] = Math.cos(a) * r
    coilPos[i * 3 + 1] = (0.5 - t) * 1.55
    coilPos[i * 3 + 2] = Math.sin(a) * r

    const c = teal.clone().lerp(bright, e * 0.8)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(flatPos.slice(), 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  group.add(new THREE.Line(geometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 })))

  // glow beads along the strand, same visual language as the globe's city sprites
  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = glowCanvas.height = 64
  const g = glowCanvas.getContext('2d')!
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.4, 'rgba(124,238,221,0.5)')
  grad.addColorStop(1, 'rgba(124,238,221,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 64, 64)
  const glowTex = new THREE.CanvasTexture(glowCanvas)

  group.add(
    new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        map: glowTex,
        vertexColors: true,
        size: 0.045,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  )

  // amber markers on unidentified tracks
  const toSeconds = (start: string) => {
    const p = start.split(':').map(Number)
    return p.length === 3 ? p[0]! * 3600 + p[1]! * 60 + p[2]! : p[0]! * 60 + (p[1] ?? 0)
  }
  const idIndices = tracklist.filter((t) => t.status === 'unknown').map((t) => Math.min(n - 1, Math.round(toSeconds(t.start) / step)))
  if (idIndices.length) {
    const idFlat = new Float32Array(idIndices.length * 3)
    const idGeometry = new THREE.BufferGeometry()
    idGeometry.setAttribute('position', new THREE.BufferAttribute(idFlat, 3))
    const idPoints = new THREE.Points(
      idGeometry,
      new THREE.PointsMaterial({ map: glowTex, color: 0xf2b04e, size: 0.11, transparent: true, depthWrite: false }),
    )
    group.add(idPoints)

    idPoints.userData.sync = () => {
      const pos = geometry.getAttribute('position')
      idIndices.forEach((src, k) => {
        idFlat[k * 3] = pos.getX(src)
        idFlat[k * 3 + 1] = pos.getY(src)
        idFlat[k * 3 + 2] = pos.getZ(src)
      })
      idGeometry.getAttribute('position').needsUpdate = true
    }
  }

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  tweenStart = performance.now() + INTRO_DELAY_MS
  const easeInOut = (x: number) => x * x * (3 - 2 * x)

  const renderLoop = () => {
    const progress = Math.max(0, Math.min(1, (performance.now() - tweenStart) / TWEEN_MS))
    u = reduceMotion ? uTarget : uFrom + (uTarget - uFrom) * easeInOut(progress)

    const pos = geometry.getAttribute('position')
    for (let i = 0; i < n; i++) {
      pos.setXYZ(
        i,
        flatPos[i * 3]! + (coilPos[i * 3]! - flatPos[i * 3]!) * u,
        flatPos[i * 3 + 1]! + (coilPos[i * 3 + 1]! - flatPos[i * 3 + 1]!) * u,
        flatPos[i * 3 + 2]! + (coilPos[i * 3 + 2]! - flatPos[i * 3 + 2]!) * u,
      )
    }
    pos.needsUpdate = true
    group.children.forEach((child: any) => child.userData.sync?.())

    if (!dragging && !reduceMotion && uTarget === 1 && u >= 1) baseRot += 0.0038
    group.rotation.y = baseRot * u
    group.rotation.x = 0.42 * u

    renderer.render(scene, camera)
    raf = requestAnimationFrame(renderLoop)
  }
  raf = requestAnimationFrame(renderLoop)
}

function rotateByDrag(ev: PointerEvent) {
  if (!dragging) return
  baseRot += (ev.clientX - lastX) * 0.008
  lastX = ev.clientX
}

function destroyFingerprint() {
  cancelAnimationFrame(raf)
  renderer?.dispose?.()
  renderer?.domElement?.remove()
}

onMounted(() => { initFingerprint() })
onBeforeUnmount(() => { destroyFingerprint() })
</script>

<template>
  <div class="fingerprint">
    <div class="fingerprint-views" role="group" aria-label="Fingerprint view">
      <button type="button" :class="{ 'is-active': view === 'flat' }" @click="setView('flat')">Flat curve</button>
      <button type="button" :class="{ 'is-active': view === 'coil' }" @click="setView('coil')">Coil</button>
    </div>
    <div
      ref="container"
      class="fingerprint-stage"
      @pointerdown="dragging = true; lastX = $event.clientX"
      @pointerup="dragging = false"
      @pointerleave="dragging = false"
      @pointermove="rotateByDrag"
    />
    <p class="fingerprint-legend mono">
      the set, coiled — <b>radius = energy</b> · <b>spikes = transitions</b> · <i>amber = unidentified</i>
    </p>
  </div>
</template>

<style scoped>
.fingerprint { display: flex; flex-direction: column; gap: 4px; position: relative; }

.fingerprint-views { position: absolute; top: 0; right: 0; z-index: 2; display: flex; gap: 6px; }
.fingerprint-views button {
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  background: rgba(3, 9, 7, 0.6);
  border: 1px solid var(--line-2);
  border-radius: 999px;
  padding: 6px 12px;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}
.fingerprint-views button:hover { color: var(--ink); }
.fingerprint-views button:focus-visible { outline: 1px solid var(--lime); outline-offset: 2px; }
.fingerprint-views button.is-active { color: var(--lime); border-color: var(--lime-border); background: var(--lime-bg); }

.fingerprint-stage { width: 100%; aspect-ratio: 1; cursor: grab; touch-action: none; }
.fingerprint-stage:active { cursor: grabbing; }

.fingerprint-legend { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-4); text-align: center; }
.fingerprint-legend b { color: var(--lime-soft); font-weight: 400; }
.fingerprint-legend i { color: var(--warn); font-style: normal; }
</style>
