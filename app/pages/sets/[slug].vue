<script setup lang="ts">
import { FEATURES, formatDuration } from '~/composables/useArchive'

const route = useRoute()
const { sets, ids } = useArchive()

const set = computed(() => sets.find((s) => s.slug === route.params.slug))

if (!set.value) {
  throw createError({ statusCode: 404, statusMessage: 'Set not found' })
}

useHead({ title: `${set.value.title} — KK Fan Hub` })

const relatedIds = computed(() =>
  ids.filter((i) => i.eventLabel === set.value?.title || i.showId.includes(set.value?.slug ?? '')),
)

const dnaStats = computed(() => {
  const d = set.value!.dna
  return [
    { label: 'Avg BPM', value: d.avgBpm.toFixed(1) },
    { label: 'BPM Range', value: `${d.bpmMin.toFixed(0)}–${d.bpmMax.toFixed(0)}` },
    { label: 'Tracks', value: String(d.trackCount) },
    { label: 'Transitions', value: String(d.transitionCount) },
    { label: 'Longest Blend', value: `${d.longestBlendSec}s` },
    { label: 'Unknown IDs', value: String(d.unknownIdCount) },
  ]
})
</script>

<template>
  <div v-if="set" class="page">
    <header class="page-head">
      <p class="label label-lime">{{ set.date }} · {{ set.venue }} · {{ set.city }}</p>
      <h1 class="display page-title">{{ set.title }}</h1>
      <div class="page-actions">
        <a :href="set.sourceUrl" target="_blank" rel="noopener" class="btn"
          ><span aria-hidden="true">▶</span> Listen on {{ set.sourcePlatform }}</a
        >
        <span class="mono page-duration">{{ formatDuration(set.durationSec) }}</span>
      </div>
    </header>

    <!-- SET DNA -->
    <section class="glass panel dna">
      <div class="section-title"><h2>Set DNA</h2></div>
      <EnergySpark :energy="set.dna.energy" :height="120" />
      <div class="dna-grid">
        <div v-for="stat in dnaStats" :key="stat.label" class="dna-stat">
          <span class="dna-value mono">{{ stat.value }}</span>
          <span class="label">{{ stat.label }}</span>
        </div>
      </div>
    </section>

    <!-- ANATOMY PLACEHOLDER -->
    <section class="glass panel anatomy">
      <div class="section-title"><h2>Anatomy of a Set</h2></div>
      <p class="mono anatomy-status">ANALYSIS IN PROGRESS</p>
      <p class="anatomy-text">
        This set is queued for a full breakdown — energy journey, every transition mapped and
        classified, moment annotations. Extracted from the recording, verified by ear.
      </p>
    </section>

    <!-- TRACKLIST -->
    <section class="glass panel">
      <div class="section-title">
        <h2>Tracklist</h2>
        <span class="view-all mono">{{ set.tracklist.length }} entries logged</span>
      </div>
      <div v-for="t in set.tracklist" :key="t.n" class="track">
        <span class="mono track-n">{{ String(t.n).padStart(2, '0') }}</span>
        <span class="mono track-start">{{ t.start }}</span>
        <span class="track-name" :class="{ 'is-unknown': t.status === 'unknown' }">
          {{ t.artist }} — {{ t.title }}
        </span>
        <span class="badge" :class="`badge-${t.status}`">{{ t.status }}</span>
      </div>
    </section>

    <!-- RELATED IDS -->
    <section v-if="FEATURES.idHunter && relatedIds.length">
      <div class="section-title">
        <h2 class="display" style="font-size: 22px">IDs from this set</h2>
        <NuxtLink to="/ids" class="view-all">All IDs →</NuxtLink>
      </div>
      <div class="stack">
        <IdRow v-for="entry in relatedIds" :key="entry.id" :entry="entry" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.page { padding: 56px 48px 0; display: flex; flex-direction: column; gap: 28px; max-width: 980px; }

.page-head { padding-bottom: 16px; }
.page-title { font-size: clamp(34px, 6vw, 64px); color: var(--ink); margin: 14px 0 22px; }
.page-actions { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.page-duration { font-size: 12px; color: var(--ink-3); }

.panel { padding: 24px 26px; }

.dna { display: flex; flex-direction: column; gap: 22px; }
.dna-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 18px; }
.dna-stat { display: flex; flex-direction: column; gap: 5px; }
.dna-value { font-size: 22px; font-weight: 700; color: var(--lime); }

.anatomy { border-style: dashed; }
.anatomy-status { font-size: 10px; letter-spacing: 0.18em; color: var(--warn); }
.anatomy-text { margin-top: 10px; max-width: 52ch; font-size: 13px; line-height: 1.6; color: var(--ink-3); }

.track {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 13px 0;
  border-bottom: 1px solid var(--line);
}
.track:last-child { border-bottom: 0; }

.track-n { font-size: 10px; color: var(--ink-4); }
.track-start { font-size: 11px; color: var(--lime); min-width: 46px; }
.track-name { flex: 1; font-size: 13.5px; font-weight: 600; }
.track-name.is-unknown { color: var(--ink-4); font-weight: 400; }

.stack { display: flex; flex-direction: column; gap: 12px; }

@media (max-width: 860px) {
  .page { padding: 40px 20px 0; }
  .track { flex-wrap: wrap; gap: 8px 12px; }
  .track-name { flex-basis: 100%; order: 3; }
}
</style>
