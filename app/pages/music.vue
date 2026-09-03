<script setup lang="ts">
import releasesData from '~/data/releases.json'

useHead({ title: 'Music — KK Fan Hub' })

export interface Release {
  id: string
  title: string
  date: string
  type: string
  secondaryTypes: string[]
  mbUrl: string
  streamUrl?: string
  label?: string
  hasCover?: boolean
}

const releases = releasesData.releases as Release[]

// the catalog's actual arc, newest era first
const ERAS = [
  { from: '2019', title: 'Outworld Era', sub: 'The hard techno rebirth — 2019 to now' },
  { from: '2016', title: 'Stil vor Talent Years', sub: 'Melodic & tech house — 2016 to 2018' },
  { from: '2012', title: 'The Beginnings', sub: 'House, swing hop & the first two albums — 2012 to 2015' },
]

const latest = releases[0]
const rest = releases.slice(1)
const eras = ERAS.map((era, i) => ({
  ...era,
  releases: rest.filter((r) => {
    const to = i === 0 ? '9999' : ERAS[i - 1]!.from
    return r.date >= era.from && r.date < to
  }),
})).filter((era) => era.releases.length)

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
        {{ stats.total }} releases, {{ stats.years }} — from swing hop beginnings to the Outworld
        era. Synced from MusicBrainz; stream links point to official sources.
      </p>
    </header>

    <a
      v-if="latest"
      :href="latest.streamUrl || latest.mbUrl"
      target="_blank"
      rel="noopener"
      class="glass is-link latest-release"
    >
      <img
        v-if="latest.hasCover"
        :src="`/covers/${latest.id}.jpg`"
        :alt="`${latest.title} cover art`"
        class="latest-release-art"
        width="250"
        height="250"
      />
      <div class="latest-release-body">
        <p class="label label-lime">Latest release</p>
        <p class="latest-release-title display">{{ latest.title }}</p>
        <p class="latest-release-meta mono">
          {{ latest.date }} · {{ latest.type }}<template v-if="latest.label"> · {{ latest.label }}</template>
        </p>
        <span class="latest-release-cta mono">{{ latest.streamUrl ? 'Stream' : 'Info' }} ↗</span>
      </div>
    </a>

    <section v-for="era in eras" :key="era.title" class="era-block">
      <div class="era-head">
        <h2 class="display era-title">{{ era.title }}</h2>
        <p class="era-sub mono">{{ era.sub }} · {{ era.releases.length }} releases</p>
      </div>
      <div class="era-grid">
        <ReleaseCard v-for="r in era.releases" :key="r.id" :release="r" />
      </div>
    </section>
  </div>
</template>

<style scoped>
.page { padding: 56px 48px 0; display: flex; flex-direction: column; gap: 44px; max-width: 1060px; }

.page-head { padding-bottom: 0; }
.page-title { font-size: clamp(36px, 6.5vw, 64px); color: var(--ink); margin: 14px 0 16px; }
.page-sub { max-width: 56ch; font-size: 13px; line-height: 1.6; color: var(--ink-3); }

.latest-release { display: flex; align-items: center; gap: 30px; padding: 24px 28px; }
.latest-release-art { width: 168px; height: 168px; object-fit: cover; border-radius: 8px; flex-shrink: 0; }
.latest-release-body { display: flex; flex-direction: column; gap: 9px; min-width: 0; }
.latest-release-title { font-size: clamp(24px, 4vw, 38px); color: var(--ink); }
.latest-release-meta { font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-3); }
.latest-release-cta { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--lime); margin-top: 6px; }

.era-block { display: flex; flex-direction: column; gap: 18px; }
.era-head { display: flex; align-items: baseline; gap: 18px; flex-wrap: wrap; border-bottom: 1px solid var(--line); padding-bottom: 12px; }
.era-title { font-size: 21px; color: var(--ink); }
.era-sub { font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-4); }

.era-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; }

@media (max-width: 640px) {
  .page { padding: 40px 20px 0; }
  .latest-release { flex-direction: column; align-items: flex-start; gap: 18px; }
  .era-grid { grid-template-columns: repeat(auto-fill, minmax(126px, 1fr)); }
}
</style>
