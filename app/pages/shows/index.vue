<script setup lang="ts">
const { upcomingShows, pastShows } = useArchive()

useHead({ title: 'Shows — KK Fan Hub' })

const groups: Record<string, typeof pastShows> = {}
for (const show of pastShows) {
  const year = show.date.slice(0, 4)
  ;(groups[year] ??= []).push(show)
}
const pastByYear = Object.entries(groups)
  .sort((a, b) => b[0].localeCompare(a[0]))
  .map(([year, shows]) => ({
    year,
    shows,
    countries: new Set(shows.map((s) => s.country).filter(Boolean)).size,
  }))

// most recent past year starts open; the deep archive starts collapsed
const openYears = ref(new Set<string>([pastByYear[0]?.year ?? '']))

function toggleYear(year: string) {
  const next = new Set(openYears.value)
  if (next.has(year)) {
    next.delete(year)
  } else {
    next.add(year)
  }
  openYears.value = next
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="label label-lime">Shows</p>
      <h1 class="display page-title">Every date</h1>
      <p class="page-sub">
        Upcoming appearances and the historical record — back to the beginning.
      </p>
      <div class="page-actions">
        <a href="/klangkuenstler-tour.ics" class="btn">Subscribe — tour calendar</a>
        <span class="page-hint mono">.ics — auto-updates in your calendar app</span>
      </div>
    </header>

    <section class="glass panel">
      <div class="section-title"><h2>Upcoming</h2></div>
      <template v-if="upcomingShows.length">
        <ShowRow v-for="show in upcomingShows" :key="show.id" :show="show" show-year />
      </template>
      <p v-else class="empty mono">No confirmed upcoming dates right now.</p>
    </section>

    <section class="archive">
      <div class="section-title">
        <h2>Archive</h2>
        <span class="view-all mono">{{ pastShows.length }} shows</span>
      </div>

      <div v-for="g in pastByYear" :key="g.year" class="glass year" :class="{ 'is-open': openYears.has(g.year) }">
        <button class="year-head" @click="toggleYear(g.year)">
          <span class="year-label display">{{ g.year }}</span>
          <span class="year-meta mono">{{ g.shows.length }} shows · {{ g.countries }} countries</span>
          <span class="year-chevron mono">{{ openYears.has(g.year) ? '−' : '+' }}</span>
        </button>
        <div v-if="openYears.has(g.year)" class="year-body">
          <ShowRow v-for="show in g.shows" :key="show.id" :show="show" />
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page { padding: 56px 48px 0; display: flex; flex-direction: column; gap: 36px; max-width: 900px; }

.page-head { padding-bottom: 12px; }
.page-title { font-size: clamp(40px, 7vw, 72px); color: var(--ink); margin: 14px 0 14px; }
.page-sub { font-size: 13px; color: var(--ink-3); }

.page-actions { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 22px; }
.page-hint { font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-4); }

.panel { padding: 24px 26px; }
.panel :deep(.show-row:last-child) { border-bottom: 0; }

.archive { display: flex; flex-direction: column; gap: 12px; }

.year { overflow: hidden; }

.year-head {
  display: flex;
  align-items: baseline;
  gap: 18px;
  width: 100%;
  padding: 18px 24px;
  background: none;
  border: 0;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease;
}

.year-head:hover { background: rgba(190, 255, 235, 0.03); }

.year-label { font-size: 22px; color: var(--ink); }
.year.is-open .year-label { color: var(--lime); }

.year-meta {
  flex: 1;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-4);
}

.year-chevron { font-size: 14px; color: var(--ink-3); }

.year-body { padding: 0 24px 12px; border-top: 1px solid var(--line); }
.year-body :deep(.show-row:last-child) { border-bottom: 0; }

.empty { font-size: 11px; color: var(--ink-4); }

@media (max-width: 860px) {
  .page { padding: 40px 20px 0; }
  .year-head { padding: 16px 18px; }
  .year-body { padding: 0 18px 10px; }
}
</style>
