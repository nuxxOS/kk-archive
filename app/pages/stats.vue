<script setup lang="ts">
useHead({ title: 'Stats — KK Fan Hub' })


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
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="label label-lime">Stats</p>
      <h1 class="display page-title">The numbers</h1>
      <p class="page-sub">
        Computed from {{ shows.length }} tracked shows. Grows as the archive does — the historical
        import will multiply these.
      </p>
    </header>

    <div class="grid">
      <section class="glass panel">
        <div class="section-title"><h2>Shows per year</h2></div>
        <div v-for="[year, n] in perYear" :key="year" class="bar-row">
          <span class="bar-row-label mono">{{ year }}</span>
          <span class="bar-row-track"><i :style="{ width: pct(n, perYear) }" /></span>
          <span class="bar-row-n mono">{{ n }}</span>
        </div>
      </section>

      <section class="glass panel">
        <div class="section-title"><h2>Countries</h2></div>
        <div v-for="[c, n] in perCountry" :key="c" class="bar-row">
          <span class="bar-row-label mono">{{ c }}</span>
          <span class="bar-row-track"><i :style="{ width: pct(n, perCountry) }" /></span>
          <span class="bar-row-n mono">{{ n }}</span>
        </div>
      </section>

      <section class="glass panel">
        <div class="section-title"><h2>Season shape</h2></div>
        <div class="months">
          <div v-for="[m, n] in perMonth" :key="m" class="months-col">
            <span class="months-bar"><i :style="{ height: pct(n, perMonth) }" /></span>
            <span class="months-label mono">{{ m }}</span>
          </div>
        </div>
      </section>

      <section class="glass panel">
        <div class="section-title"><h2>Most played</h2></div>
        <p class="label" style="margin-bottom: 10px">Cities</p>
        <div v-for="[c, n] in topCities" :key="c" class="rank-row">
          <span>{{ c }}</span>
          <span class="mono rank-row-n">{{ n }}×</span>
        </div>
        <p class="label" style="margin: 18px 0 10px">Venues</p>
        <div v-for="[v, n] in topVenues" :key="v" class="rank-row">
          <span>{{ v }}</span>
          <span class="mono rank-row-n">{{ n }}×</span>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 56px 48px 0; display: flex; flex-direction: column; gap: 32px; max-width: 1100px; }

.page-head { padding-bottom: 8px; }
.page-title { font-size: clamp(36px, 6.5vw, 64px); color: var(--ink); margin: 14px 0 16px; }
.page-sub { max-width: 54ch; font-size: 13px; line-height: 1.6; color: var(--ink-3); }

.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
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
