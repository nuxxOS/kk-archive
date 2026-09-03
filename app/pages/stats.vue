<script setup lang="ts">
import socialData from '~/data/social.json'

useHead({ title: 'Stats — KlangKuenstler Hub' })

// ---- audience (social.json is only consumed here) ----
type Snapshot = { date: string } & Record<string, number | string | null>
const snapshots = socialData.snapshots as Snapshot[]
const latestSnapshot = snapshots.at(-1)

const PLATFORMS = [
  { key: 'spotifyMonthlyListeners', name: 'Spotify', metric: 'monthly listeners', approx: true, url: 'https://open.spotify.com/artist/6H77vD9YyhyxHBTkRpbMBk' },
  { key: 'soundcloudFollowers', name: 'SoundCloud', metric: 'followers', approx: false, url: 'https://soundcloud.com/klangkuenstler' },
  { key: 'youtubeSubscribers', name: 'YouTube', metric: 'subscribers', approx: true, url: 'https://www.youtube.com/channel/UCVhGY5dI7gD1uArjjkuNr_w' },
  { key: 'deezerFans', name: 'Deezer', metric: 'fans', approx: false, url: 'https://www.deezer.com/artist/3561421' },
]

const compact = (n: number) =>
  new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

function sparkPath(key: string): string {
  const values = snapshots.map((s) => s[key]).filter((v): v is number => typeof v === 'number')
  if (values.length < 2) return ''
  const min = Math.min(...values)
  const range = Math.max(Math.max(...values) - min, 1)
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100
      const y = 26 - ((v - min) / range) * 22
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join('')
}

const audience = PLATFORMS.map((p) => ({
  ...p,
  value: latestSnapshot?.[p.key] as number | null,
  spark: sparkPath(p.key),
})).filter((p) => p.value !== null && p.value !== undefined)

const trackedSince = snapshots[0]?.date ?? ''

// ---- touring ----
function tally<T>(items: T[], key: (t: T) => string) {
  const m = new Map<string, number>()
  for (const it of items) {
    const k = key(it)
    if (k) m.set(k, (m.get(k) ?? 0) + 1)
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

const perYear = tally(shows, (s) => s.date.slice(0, 4)).sort((a, b) => a[0].localeCompare(b[0]))
const perCountry = tally(shows, (s) => s.country).slice(0, 10)
const REGIONS = new Set(['North', 'South', 'East', 'West', 'Midlands', 'Bavaria', 'North Rhine-Westphalia', 'Baden-Württemberg', 'Mecklenburg-Vorpommern', 'Rhineland-Palatinate', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Saarland', 'Hesse', 'Saxony', 'Thuringia', 'Brandenburg', 'Lower Saxony', 'All'])
const topCities = tally(shows, (s) => s.city).filter(([c]) => !REGIONS.has(c)).slice(0, 8)
const topVenues = tally(shows, (s) => s.venue).filter(([v]) => v !== 'TBA').slice(0, 8)

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthTally = new Map<number, number>()
for (const s of shows) {
  const m = Number(s.date.slice(5, 7)) - 1
  monthTally.set(m, (monthTally.get(m) ?? 0) + 1)
}
const perMonth = MONTH_NAMES.map((n, i) => [n, monthTally.get(i) ?? 0] as [string, number])

const max = (rows: [string, number][]) => Math.max(...rows.map(([, n]) => n), 1)
const pct = (n: number, rows: [string, number][]) => `${Math.round((n / max(rows)) * 100)}%`

const peakMonth = perMonth.reduce((a, b) => (b[1] > a[1] ? b : a))
const countryShare = (n: number) => `${Math.round((n / shows.length) * 100)}%`

// ---- career curve (announced-only future years distort the arc — cut past next year) ----
const currentYear = today.slice(0, 4)
const careerYears = perYear.filter(([y]) => y <= currentYear).map(([y, n]) => ({ year: y, n }))
const careerMax = Math.max(...careerYears.map((d) => d.n))

const CW = 1000
const CH = 240
const C_PAD = { l: 34, r: 18, t: 34, b: 54 }
const cx = (i: number) => C_PAD.l + (i / (careerYears.length - 1)) * (CW - C_PAD.l - C_PAD.r)
const cy = (n: number) => C_PAD.t + (1 - n / careerMax) * (CH - C_PAD.t - C_PAD.b)

const careerLine = careerYears.map((d, i) => `${i ? 'L' : 'M'}${cx(i).toFixed(1)} ${cy(d.n).toFixed(1)}`).join('')
const careerArea = `${careerLine}L${cx(careerYears.length - 1).toFixed(1)} ${cy(0)}L${cx(0).toFixed(1)} ${cy(0)}Z`

// era ribbon segments along the bottom, matched to /music's era story
const CAREER_ERAS = [
  { from: '2012', to: '2015', name: 'BEGINNINGS' },
  { from: '2016', to: '2018', name: 'SVT YEARS' },
  { from: '2019', to: '2021', name: 'OUTWORLD · COVID' },
  { from: '2022', to: currentYear, name: 'PEAK & ARENAS' },
]
const yearIndex = (y: string) => careerYears.findIndex((d) => d.year === y)
const eraSegments = CAREER_ERAS.map((e) => ({
  name: e.name,
  x: cx(yearIndex(e.from)),
  w: cx(yearIndex(e.to)) - cx(yearIndex(e.from)),
})).filter((e) => e.w > 0)

const CAREER_NOTES = [
  { year: '2020', text: 'covid', dy: -14 },
  { year: '2023', text: `peak — ${careerYears.find((d) => d.year === '2023')?.n} shows`, dy: -12 },
]
const careerNotes = CAREER_NOTES.map((n) => {
  const i = yearIndex(n.year)
  return i < 0 ? null : { ...n, x: cx(i), y: cy(careerYears[i]!.n) }
}).filter((n) => n !== null)

// hover readout
const hoverIndex = ref<number | null>(null)
function readCareer(ev: PointerEvent) {
  const rect = (ev.currentTarget as SVGElement).getBoundingClientRect()
  const px = ((ev.clientX - rect.left) / rect.width) * CW
  const i = Math.round(((px - C_PAD.l) / (CW - C_PAD.l - C_PAD.r)) * (careerYears.length - 1))
  hoverIndex.value = Math.max(0, Math.min(careerYears.length - 1, i))
}
const hovered = computed(() => (hoverIndex.value === null ? null : careerYears[hoverIndex.value] ?? null))
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="label label-lime">Stats</p>
      <h1 class="display page-title">The numbers</h1>
      <p class="page-sub">
        The audience across platforms, and {{ shows.length }} tracked shows broken down. All
        public numbers — snapshotted daily, growth curves build as the archive ages.
      </p>
    </header>

    <section class="audience">
      <div class="section-title">
        <h2>Audience</h2>
        <span class="view-all mono">tracked since {{ trackedSince }}</span>
      </div>
      <div class="audience-grid">
        <a
          v-for="p in audience"
          :key="p.key"
          :href="p.url"
          target="_blank"
          rel="noopener"
          class="glass is-link audience-tile"
        >
          <span class="audience-platform mono">{{ p.name }} ↗</span>
          <span class="audience-value mono">{{ p.approx ? '~' : '' }}{{ compact(p.value!) }}</span>
          <span class="audience-metric">{{ p.metric }}</span>
          <svg v-if="p.spark" class="audience-spark" viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
            <path :d="p.spark" fill="none" stroke="var(--lime)" stroke-width="1.6" opacity="0.8" />
          </svg>
        </a>
      </div>
    </section>

    <div class="section-title touring-title"><h2>Touring</h2></div>

    <!-- career curve -->
    <section class="glass panel career">
      <div class="section-title">
        <h2>The career curve</h2>
        <span class="view-all mono">shows per year · '{{ currentYear.slice(2) }} in progress</span>
      </div>
      <svg
        class="career-chart"
        :viewBox="`0 0 ${CW} ${CH}`"
        role="img"
        aria-label="Shows per year, 2012 to now"
        @pointermove="readCareer"
        @pointerleave="hoverIndex = null"
      >
        <defs>
          <linearGradient id="career-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="rgba(124, 238, 221, 0.42)" />
            <stop offset="1" stop-color="rgba(124, 238, 221, 0.02)" />
          </linearGradient>
        </defs>

        <path :d="careerArea" fill="url(#career-fill)" />
        <path :d="careerLine" fill="none" stroke="var(--lime)" stroke-width="1.8" />

        <g v-for="n in careerNotes" :key="n.text">
          <circle :cx="n.x" :cy="n.y" r="3" fill="var(--lime)" />
          <line :x1="n.x" :y1="n.y - 5" :x2="n.x" :y2="n.y + n.dy + 4" stroke="rgba(237, 246, 242, 0.3)" />
          <text :x="n.x" :y="n.y + n.dy" class="career-note" text-anchor="middle">{{ n.text }}</text>
        </g>

        <!-- era ribbon -->
        <g v-for="(e, i) in eraSegments" :key="e.name">
          <rect :x="e.x" :y="CH - 30" :width="e.w - 2" height="10" rx="2" :fill="`rgba(124, 238, 221, ${i % 2 ? 0.26 : 0.14})`" />
          <text :x="e.x + 2" :y="CH - 6" class="career-era">{{ e.name }}</text>
        </g>

        <!-- year ticks: first, last, and the peak -->
        <text v-for="d in [careerYears[0], careerYears.at(-1)]" :key="d!.year" :x="cx(yearIndex(d!.year))" :y="C_PAD.t - 16" class="career-tick" text-anchor="middle">{{ d!.year }}</text>

        <!-- hover crosshair + readout -->
        <g v-if="hovered && hoverIndex !== null">
          <line :x1="cx(hoverIndex)" :y1="C_PAD.t - 10" :x2="cx(hoverIndex)" :y2="cy(0)" stroke="rgba(237, 246, 242, 0.4)" />
          <circle :cx="cx(hoverIndex)" :cy="cy(hovered.n)" r="4" fill="var(--ground)" stroke="var(--lime)" stroke-width="2" />
          <text :x="cx(hoverIndex)" :y="C_PAD.t - 16" class="career-readout" :text-anchor="hoverIndex > careerYears.length - 4 ? 'end' : hoverIndex < 3 ? 'start' : 'middle'">{{ hovered.year }} — {{ hovered.n }} shows</text>
        </g>
      </svg>
    </section>

    <div class="grid">
      <section class="glass panel">
        <div class="section-title">
          <h2>Countries</h2>
          <span class="view-all mono">top 10 of {{ stats.countries }}</span>
        </div>
        <div v-for="[c, n] in perCountry" :key="c" class="bar-row" :title="`${n} shows · ${countryShare(n)} of all`">
          <span class="bar-row-label mono">{{ c }}</span>
          <span class="bar-row-track"><i :style="{ width: pct(n, perCountry) }" /></span>
          <span class="bar-row-n mono">{{ n }}</span>
        </div>
      </section>

      <section class="glass panel">
        <div class="section-title">
          <h2>Season shape</h2>
          <span class="view-all mono">busiest: {{ peakMonth[0] }} — {{ peakMonth[1] }} shows</span>
        </div>
        <div class="months">
          <div v-for="[m, n] in perMonth" :key="m" class="months-col" :title="`${m}: ${n} shows`">
            <span v-if="m === peakMonth[0]" class="months-peak mono">{{ n }}</span>
            <span class="months-bar"><i :style="{ height: pct(n, perMonth) }" /></span>
            <span class="months-label mono" :class="{ 'is-peak': m === peakMonth[0] }">{{ m }}</span>
          </div>
        </div>
      </section>
    </div>

    <section class="glass panel">
      <div class="section-title"><h2>Most played</h2></div>
      <div class="ranks">
        <div>
          <p class="label" style="margin-bottom: 10px">Cities</p>
          <div v-for="[c, n] in topCities" :key="c" class="rank-row">
            <span>{{ c }}</span>
            <span class="mono rank-row-n">{{ n }}×</span>
          </div>
        </div>
        <div>
          <p class="label" style="margin-bottom: 10px">Venues</p>
          <div v-for="[v, n] in topVenues" :key="v" class="rank-row">
            <span>{{ v }}</span>
            <span class="mono rank-row-n">{{ n }}×</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page { padding: 56px 48px 0; display: flex; flex-direction: column; gap: 32px; max-width: 1100px; }

.page-head { padding-bottom: 8px; }
.page-title { font-size: clamp(36px, 6.5vw, 64px); color: var(--ink); margin: 14px 0 16px; }
.page-sub { max-width: 54ch; font-size: 13px; line-height: 1.6; color: var(--ink-3); }

.audience { display: flex; flex-direction: column; }

.audience-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }

.audience-tile {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 22px 16px;
}

.audience-platform { font-size: 9px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--lime); }
.audience-value { font-size: 30px; font-weight: 700; color: var(--ink); font-variant-numeric: tabular-nums; margin-top: 4px; }
.audience-metric { font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink-3); }
.audience-spark { width: 100%; height: 28px; margin-top: 10px; }

.touring-title { margin-bottom: -14px; }

.career-chart { display: block; width: 100%; height: auto; cursor: crosshair; }
.career-note { font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; fill: var(--ink-2); }
.career-era { font-family: var(--mono); font-size: 8px; letter-spacing: 0.14em; fill: var(--ink-4); }
.career-tick { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; fill: var(--ink-4); }
.career-readout { font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: 0.08em; fill: var(--lime); }

.months-peak { font-size: 9px; color: var(--lime); text-align: center; margin-bottom: 4px; }
.months-label.is-peak { color: var(--lime); }

.ranks { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
@media (max-width: 640px) { .ranks { grid-template-columns: 1fr; } }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

@media (max-width: 900px) {
  .audience-grid { grid-template-columns: repeat(2, 1fr); }
}
.panel { padding: 24px 26px; }

.bar-row { display: flex; align-items: center; gap: 12px; padding: 6px 0; }
.bar-row-label { min-width: 44px; font-size: 11px; color: var(--ink-3); }
.bar-row-track { flex: 1; height: 10px; background: rgba(190, 255, 235, 0.05); border-radius: 5px; overflow: hidden; }
.bar-row-track i { display: block; height: 100%; background: linear-gradient(90deg, rgba(124, 238, 221, 0.4), var(--lime)); border-radius: 5px; }
.bar-row-n { min-width: 26px; text-align: right; font-size: 11px; color: var(--lime); }

.months { display: flex; gap: 8px; align-items: flex-end; height: 140px; padding-top: 10px; }
.months-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; height: 100%; }
.months-bar { flex: 1; width: 100%; display: flex; align-items: flex-end; background: rgba(190, 255, 235, 0.04); border-radius: 4px; overflow: hidden; }
.months-bar i { display: block; width: 100%; background: linear-gradient(180deg, var(--lime), rgba(124, 238, 221, 0.25)); border-radius: 4px 4px 0 0; }
.months-label { font-size: 8px; letter-spacing: 0.06em; color: var(--ink-4); text-transform: uppercase; }

.rank-row { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; font-size: 13px; border-bottom: 1px solid var(--line); }
.rank-row:last-child { border-bottom: 0; }
.rank-row-n { color: var(--lime); font-size: 11px; }

@media (max-width: 800px) {
  .page { padding: 40px 20px 0; }
  .grid { grid-template-columns: 1fr; }
}
</style>
