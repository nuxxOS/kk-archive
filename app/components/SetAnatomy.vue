<script setup lang="ts">
export interface SetAnalysis {
  slug: string
  durationSec: number
  energy: number[]
  bpm: number[]
  transitions: { time: number; type: string }[]
  tracklist: { n: number; start: string; title: string; artist: string; status: string }[]
}

const props = defineProps<{ analysis: SetAnalysis }>()

const W = 1020
const H = 300
const PAD_L = 44
const PAD_R = 14
const TOP = 30
const CHART_H = 180
const RIBBON_Y = TOP + CHART_H + 24

const duration = props.analysis.durationSec

// light display smoothing — the JSON stays raw, the chart stays readable
function smooth(values: number[], radius: number): number[] {
  return values.map((_, i, arr) => {
    const from = Math.max(0, i - radius)
    const to = Math.min(arr.length, i + radius + 1)
    return arr.slice(from, to).reduce((sum, v) => sum + v, 0) / (to - from)
  })
}
const energy = smooth(props.analysis.energy, 1)
const bpm = smooth(props.analysis.bpm, 2)
const n = energy.length

const X = (sec: number) => PAD_L + (sec / duration) * (W - PAD_L - PAD_R)
const Y = (e: number) => TOP + CHART_H - e * CHART_H
const step = duration / (n - 1)

const bpmLo = Math.min(...bpm)
const bpmRange = Math.max(Math.max(...bpm) - bpmLo, 1)

const energyLine = energy.map((e, i) => `${i ? 'L' : 'M'}${X(i * step).toFixed(1)} ${Y(e).toFixed(1)}`).join('')
const energyArea = `${energyLine}L${X(duration).toFixed(1)} ${Y(0)}L${X(0).toFixed(1)} ${Y(0)}Z`
const bpmLine = bpm
  .map((b, i) => `${i ? 'L' : 'M'}${X(i * step).toFixed(1)} ${(TOP + CHART_H - ((b - bpmLo) / bpmRange) * CHART_H).toFixed(1)}`)
  .join('')

function toSeconds(start: string): number {
  const parts = start.split(':').map(Number)
  if (parts.length === 3) return parts[0]! * 3600 + parts[1]! * 60 + parts[2]!
  return parts[0]! * 60 + (parts[1] ?? 0)
}

const segments = props.analysis.tracklist.map((t, i) => {
  const from = toSeconds(t.start)
  const next = props.analysis.tracklist[i + 1]
  const to = next ? toSeconds(next.start) : duration
  return { key: t.n, x: X(from), w: Math.max(X(to) - X(from) - 1.5, 1), isUnknown: t.status === 'unknown' }
})

const fmt = (sec: number) => {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const axisTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ x: X(f * duration), label: fmt(f * duration) }))

const hoverX = ref<number | null>(null)
const hovered = computed(() => {
  if (hoverX.value === null) return null
  const sec = ((hoverX.value - PAD_L) / (W - PAD_L - PAD_R)) * duration
  const i = Math.max(0, Math.min(n - 1, Math.round(sec / step)))
  let trackNo = 1
  for (let k = 0; k < props.analysis.tracklist.length; k++) {
    if (sec >= toSeconds(props.analysis.tracklist[k]!.start)) trackNo = k + 1
  }
  return { sec, energy: energy[i]!, bpm: bpm[i]!, trackNo }
})

function readAnatomy(ev: PointerEvent) {
  const rect = (ev.currentTarget as SVGElement).getBoundingClientRect()
  const px = ((ev.clientX - rect.left) / rect.width) * W
  hoverX.value = px < PAD_L || px > W - PAD_R ? null : px
}
</script>

<template>
  <div class="anatomy-wrap">
    <svg
      class="anatomy-chart"
      :viewBox="`0 0 ${W} ${H}`"
      role="img"
      aria-label="Set energy, BPM and track segments over time"
      @pointermove="readAnatomy"
      @pointerleave="hoverX = null"
    >
      <defs>
        <linearGradient id="anatomy-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgba(124, 238, 221, 0.45)" />
          <stop offset="1" stop-color="rgba(124, 238, 221, 0.03)" />
        </linearGradient>
      </defs>

      <line v-for="f in [0.25, 0.5, 0.75]" :key="f" :x1="PAD_L" :y1="Y(f)" :x2="W - PAD_R" :y2="Y(f)" stroke="rgba(170, 240, 220, 0.06)" />
      <text :x="PAD_L - 8" :y="Y(1) + 4" class="anatomy-axis" text-anchor="end">1.0</text>
      <text :x="PAD_L - 8" :y="Y(0.5) + 4" class="anatomy-axis" text-anchor="end">0.5</text>

      <line
        v-for="tr in analysis.transitions"
        :key="tr.time"
        :x1="X(tr.time)"
        :y1="TOP"
        :x2="X(tr.time)"
        :y2="TOP + CHART_H"
        stroke="rgba(124, 238, 221, 0.3)"
        stroke-dasharray="2 4"
      />

      <path :d="energyArea" fill="url(#anatomy-fill)" />
      <path :d="energyLine" fill="none" stroke="var(--lime)" stroke-width="1.6" />
      <path :d="bpmLine" fill="none" stroke="rgba(237, 246, 242, 0.35)" stroke-width="1" stroke-dasharray="1 4" />

      <g>
        <rect
          v-for="seg in segments"
          :key="seg.key"
          :x="seg.x"
          :y="RIBBON_Y"
          :width="seg.w"
          height="11"
          rx="2"
          :fill="seg.isUnknown ? 'rgba(242, 176, 78, 0.5)' : `rgba(124, 238, 221, ${seg.key % 2 ? 0.32 : 0.16})`"
        />
      </g>
      <text :x="PAD_L" :y="RIBBON_Y + 24" class="anatomy-ribbon-label">TRACK SEGMENTS — AMBER = UNIDENTIFIED</text>

      <text v-for="t in axisTicks" :key="t.x" :x="t.x" :y="H - 4" class="anatomy-axis" text-anchor="middle">{{ t.label }}</text>

      <g v-if="hovered && hoverX !== null">
        <line :x1="hoverX" :y1="TOP - 6" :x2="hoverX" :y2="TOP + CHART_H" stroke="rgba(237, 246, 242, 0.45)" />
        <circle :cx="hoverX" :cy="Y(hovered.energy)" r="3.5" fill="var(--ground)" stroke="var(--lime)" stroke-width="2" />
        <text :x="hoverX" :y="TOP - 12" class="anatomy-readout" :text-anchor="hoverX > W - 240 ? 'end' : hoverX < 240 ? 'start' : 'middle'">
          {{ fmt(hovered.sec) }} · energy {{ hovered.energy.toFixed(2) }} · {{ hovered.bpm.toFixed(1) }} BPM · track {{ String(hovered.trackNo).padStart(2, '0') }}
        </text>
      </g>
    </svg>
    <p class="anatomy-legend mono">energy — solid · BPM — dotted · transitions — dashed verticals</p>
  </div>
</template>

<style scoped>
.anatomy-wrap { display: flex; flex-direction: column; gap: 8px; }
.anatomy-chart { display: block; width: 100%; height: auto; cursor: crosshair; }
.anatomy-axis { font-family: var(--mono); font-size: 9px; letter-spacing: 0.08em; fill: var(--ink-4); }
.anatomy-ribbon-label { font-family: var(--mono); font-size: 8px; letter-spacing: 0.16em; fill: var(--ink-4); }
.anatomy-readout { font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; fill: var(--lime); }
.anatomy-legend { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-4); text-align: right; }
</style>
