<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    energy: number[]
    height?: number
  }>(),
  { height: 64 },
)

const W = 400
// deterministic pseudo-noise — keeps SSR and client renders identical
const noise = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

function bars(amp: number, jitterAmt: number, phase: number, count: number) {
  const src = props.energy
  const n = src.length
  if (n < 2) return ''
  const H = props.height
  const segs: string[] = []
  for (let i = 0; i < count; i++) {
    const t = (i / (count - 1)) * (n - 1)
    const lo = Math.floor(t)
    const hi = Math.min(lo + 1, n - 1)
    const base = (src[lo]! + (src[hi]! - src[lo]!) * (t - lo)) * amp
    const j = 1 + (noise(i + phase) - 0.5) * jitterAmt
    const v = Math.max(0.02, Math.min(1, base * j))
    const x = ((i / (count - 1)) * W).toFixed(1)
    segs.push(`M${x} ${H} V${(H - v * H).toFixed(1)}`)
  }
  return segs.join('')
}

const BAR_COUNT = 220
const backPath = computed(() => bars(0.62, 0.5, 900, BAR_COUNT))
const frontPath = computed(() => bars(1, 0.34, 0, BAR_COUNT))

const uid = useId()
</script>

<template>
  <svg
    class="spark"
    :viewBox="`0 0 ${W} ${height}`"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <defs>
      <linearGradient
        :id="`g-${uid}`"
        x1="0"
        y1="0"
        :x2="0"
        :y2="height"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stop-color="#dcfff6" />
        <stop offset="45%" stop-color="#7ceedd" />
        <stop offset="100%" stop-color="rgba(124,238,221,0.08)" />
      </linearGradient>
      <filter :id="`b-${uid}`" x="-5%" y="-40%" width="110%" height="180%">
        <feGaussianBlur stdDeviation="2.6" />
      </filter>
    </defs>

    <!-- low-end ghost layer -->
    <path :d="backPath" stroke="rgba(150, 185, 175, 0.30)" stroke-width="1.3" fill="none" />
    <!-- glow -->
    <path
      :d="frontPath"
      :stroke="`url(#g-${uid})`"
      stroke-width="2.4"
      fill="none"
      opacity="0.5"
      :filter="`url(#b-${uid})`"
    />
    <!-- main energy -->
    <path :d="frontPath" :stroke="`url(#g-${uid})`" stroke-width="1.1" fill="none" opacity="0.95" />
  </svg>
</template>

<style scoped>
.spark {
  display: block;
  width: 100%;
}
</style>
