<script setup lang="ts">

const pastShows = shows.filter((s) => s.date < today).sort((a, b) => b.date.localeCompare(a.date))
const laterShows = upcomingShows.slice(1)

const UPCOMING_PREVIEW_COUNT = 6
const isUpcomingExpanded = ref(false)
const visibleUpcoming = computed(() =>
  isUpcomingExpanded.value ? laterShows : laterShows.slice(0, UPCOMING_PREVIEW_COUNT),
)
const hiddenUpcomingCount = laterShows.length - UPCOMING_PREVIEW_COUNT

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

// timeline: bars oldest → newest, heights relative to the busiest year
const yearBars = [...pastByYear].reverse()
const maxYearCount = Math.max(...yearBars.map((g) => g.shows.length))

async function jumpToYear(year: string) {
  if (!openYears.value.has(year)) {
    openYears.value = new Set(openYears.value).add(year)
  }
  await nextTick()
  document.getElementById(`year-${year}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

    <NextShowHero v-if="nextShow" :show="nextShow" />

    <section class="glass panel">
      <div class="section-title">
        <h2>Upcoming</h2>
        <NuxtLink to="/map" class="view-all">View on the globe →</NuxtLink>
      </div>
      <template v-if="laterShows.length">
        <ShowRow v-for="show in visibleUpcoming" :key="show.id" :show="show" show-year />
        <button
          v-if="hiddenUpcomingCount > 0"
          class="upcoming-toggle mono"
          @click="isUpcomingExpanded = !isUpcomingExpanded"
        >
          {{ isUpcomingExpanded ? '− Collapse' : `+ Show all ${laterShows.length} upcoming` }}
        </button>
      </template>
      <p v-else class="empty mono">No further confirmed dates right now.</p>
    </section>

    <section class="archive">
      <div class="section-title">
        <h2>Archive</h2>
        <span class="view-all mono">{{ pastShows.length }} shows</span>
      </div>

      <div class="timeline">
        <button
          v-for="g in yearBars"
          :key="g.year"
          class="timeline-year"
          :class="{ 'is-open': openYears.has(g.year) }"
          :title="`${g.year} — ${g.shows.length} shows`"
          @click="jumpToYear(g.year)"
        >
          <span class="timeline-bar"><i :style="{ height: `${(g.shows.length / maxYearCount) * 100}%` }" /></span>
          <span class="timeline-label mono">'{{ g.year.slice(2) }}</span>
        </button>
      </div>

      <div v-for="g in pastByYear" :id="`year-${g.year}`" :key="g.year" class="glass year" :class="{ 'is-open': openYears.has(g.year) }">
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

.upcoming-toggle {
  width: 100%;
  padding: 14px 0 4px;
  background: none;
  border: 0;
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--lime);
  text-align: center;
  transition: opacity 0.2s ease;
}
.upcoming-toggle:hover { opacity: 0.75; }

.archive { display: flex; flex-direction: column; gap: 12px; }

.timeline {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 86px;
  padding: 0 4px 4px;
  margin-bottom: 8px;
}

.timeline-year {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 7px;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}

.timeline-bar {
  flex: 1;
  display: flex;
  align-items: flex-end;
  background: rgba(190, 255, 235, 0.04);
  border-radius: 3px;
  overflow: hidden;
}

.timeline-bar i {
  display: block;
  width: 100%;
  background: linear-gradient(180deg, rgba(124, 238, 221, 0.55), rgba(124, 238, 221, 0.16));
  border-radius: 3px 3px 0 0;
  transition: background 0.2s ease;
}

.timeline-year:hover .timeline-bar i { background: var(--lime); }
.timeline-year.is-open .timeline-bar i {
  background: linear-gradient(180deg, var(--lime), rgba(124, 238, 221, 0.45));
  box-shadow: 0 0 12px rgba(124, 238, 221, 0.35);
}

.timeline-label {
  font-size: 8.5px;
  letter-spacing: 0.08em;
  color: var(--ink-4);
  text-align: center;
}
.timeline-year.is-open .timeline-label { color: var(--lime); }

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
