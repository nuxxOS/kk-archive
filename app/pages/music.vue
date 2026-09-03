<script setup lang="ts">
import releasesData from '~/data/releases.json'

useHead({ title: 'Music — KK Fan Hub' })

interface Release {
  id: string
  title: string
  date: string
  type: string
  secondaryTypes: string[]
  mbUrl: string
  streamUrl?: string
  label?: string
}

const releases = releasesData.releases as Release[]

const groups: Record<string, Release[]> = {}
for (const r of releases) (groups[r.date.slice(0, 4)] ??= []).push(r)
const byYear = Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))

const stats = {
  total: releases.length,
  years: `${releases.at(-1)?.date.slice(0, 4)}–${releases[0]?.date.slice(0, 4)}`,
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="label label-lime">Music</p>
      <h1 class="display page-title">The discography</h1>
      <p class="page-sub">
        {{ stats.total }} releases, {{ stats.years }}. Synced from MusicBrainz — stream links point
        to official sources.
      </p>
    </header>

    <section v-for="[year, items] in byYear" :key="year" class="year">
      <p class="year-label display">{{ year }}</p>
      <div class="glass year-panel">
        <div v-for="r in items" :key="r.id" class="release">
          <div class="release-main">
            <p class="release-title">{{ r.title }}</p>
            <p class="release-meta mono">
              {{ r.date }}<template v-if="r.label"> · {{ r.label }}</template>
            </p>
          </div>
          <span class="badge" :class="{ 'badge-confirmed': r.type === 'album' }">{{ r.type }}</span>
          <a
            :href="r.streamUrl || r.mbUrl"
            target="_blank"
            rel="noopener"
            class="release-link mono"
            >{{ r.streamUrl ? 'Stream' : 'Info' }} ↗</a
          >
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page { padding: 56px 48px 0; display: flex; flex-direction: column; gap: 36px; max-width: 900px; }

.page-head { padding-bottom: 8px; }
.page-title { font-size: clamp(36px, 6.5vw, 64px); color: var(--ink); margin: 14px 0 16px; }
.page-sub { max-width: 54ch; font-size: 13px; line-height: 1.6; color: var(--ink-3); }

.year { display: flex; gap: 24px; align-items: flex-start; }
.year-label { font-size: 20px; color: var(--lime); min-width: 64px; padding-top: 22px; }
.year-panel { flex: 1; padding: 8px 24px; }

.release {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}
.release:last-child { border-bottom: 0; }

.release-main { flex: 1; min-width: 0; }
.release-title { font-size: 14.5px; font-weight: 600; }
.release-meta { font-size: 10px; color: var(--ink-4); margin-top: 4px; letter-spacing: 0.06em; }
.release-link { font-size: 10px; color: var(--lime); letter-spacing: 0.08em; white-space: nowrap; }

@media (max-width: 640px) {
  .page { padding: 40px 20px 0; }
  .year { flex-direction: column; gap: 8px; }
  .year-label { padding-top: 0; }
}
</style>
