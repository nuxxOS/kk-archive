<script setup lang="ts">
useHead({ title: 'About — KlangKuenstler Hub' })

const firstYear = shows.at(-1)?.date.slice(0, 4) ?? '2012'

const FACTS = [
  { value: stats.shows, label: 'shows verified' },
  { value: stats.countries, label: 'countries' },
  { value: 41, label: 'releases' },
  { value: `${firstYear}→`, label: 'years covered' },
]

const MANIFESTO = [
  {
    n: '01',
    title: 'What',
    text: 'An unofficial archive for KlangKuenstler fans — every show we can verify, every publicly recorded set, the full discography. One place, kept current, kept accurate.',
  },
  {
    n: '02',
    title: 'How',
    text: 'Shows are compiled from public announcements and cross-checked across sources; duplicates are hunted down by hand. Recorded sets get a custom audio pipeline (Python + librosa) that extracts energy, tempo and transitions — then everything is reviewed and classified by ear. Nothing is published as fact that we can\'t back.',
  },
  {
    n: '03',
    title: 'Why',
    text: 'Because this music deserves the same care as the archives built around older scenes — and because nights this good should not be lost to memory.',
  },
  {
    n: '04',
    title: 'Who',
    text: 'Someone in the crowd, with a hard drive and a habit of writing things down. Identity irrelevant — the archive speaks for itself.',
  },
]

const SOURCES = [
  { name: 'Resident Advisor', role: 'show history + upcoming' },
  { name: 'Songkick', role: 'gigography cross-check' },
  { name: 'MusicBrainz', role: 'discography' },
  { name: 'Cover Art Archive', role: 'release artwork' },
  { name: 'Open-Meteo', role: 'city geocoding' },
  { name: 'Public platform pages', role: 'audience numbers' },
]
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="label label-lime">About</p>
      <h1 class="display page-title">Fan made.<br />Archive grade.</h1>
    </header>

    <div class="facts mono">
      <div v-for="f in FACTS" :key="f.label" class="facts-item">
        <span class="facts-value">{{ f.value }}</span>
        <span class="facts-label">{{ f.label }}</span>
      </div>
    </div>

    <section class="manifesto">
      <article v-for="m in MANIFESTO" :key="m.n" class="manifesto-row">
        <span class="manifesto-num mono">{{ m.n }}</span>
        <div class="manifesto-body">
          <h2 class="display manifesto-title">{{ m.title }}</h2>
          <p class="manifesto-text">{{ m.text }}</p>
        </div>
      </article>
    </section>

    <section class="glass method">
      <div class="section-title">
        <h2>The method</h2>
        <span class="view-all mono">open data, credited</span>
      </div>
      <p class="method-lede">
        Everything on this site is built from public sources, synced by scripts, and reviewed
        before it ships. No scraping behind logins, no leaks, no audio hosted.
      </p>
      <div class="method-grid">
        <div v-for="s in SOURCES" :key="s.name" class="method-source">
          <span class="method-name mono">{{ s.name }}</span>
          <span class="method-role">{{ s.role }}</span>
        </div>
      </div>
    </section>

    <section class="glass disclaimer">
      <p class="label">Disclaimer</p>
      <p class="disclaimer-text">
        This is an unofficial, independent fan project. It is not affiliated with, endorsed by, or
        connected to KlangKuenstler, Outworld, or their teams and partners. All recordings, artwork,
        names and trademarks belong to their respective owners. No audio is hosted here — every
        listen link points to official sources. Support the artist: buy the music, go to the shows.
      </p>
    </section>
  </div>
</template>

<style scoped>
.page { padding: 56px 48px 0; display: flex; flex-direction: column; gap: 44px; max-width: 880px; }

.page-head { padding-bottom: 0; }
.page-title { font-size: clamp(40px, 7vw, 76px); color: var(--ink); margin-top: 14px; }

.facts { display: flex; gap: 40px; flex-wrap: wrap; padding: 18px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
.facts-item { display: flex; flex-direction: column; gap: 3px; }
.facts-value { font-size: 24px; font-weight: 700; color: var(--lime); font-variant-numeric: tabular-nums; }
.facts-label { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-3); }

.manifesto { display: flex; flex-direction: column; }

.manifesto-row {
  display: flex;
  gap: 28px;
  padding: 28px 0;
  border-bottom: 1px solid var(--line);
}
.manifesto-row:last-child { border-bottom: 0; }

.manifesto-num { font-size: 12px; font-weight: 700; letter-spacing: 0.2em; color: var(--ink-4); padding-top: 5px; min-width: 34px; }
.manifesto-body { display: flex; flex-direction: column; gap: 10px; }
.manifesto-title { font-size: 19px; color: var(--ink); }
.manifesto-text { max-width: 62ch; font-size: 13.5px; line-height: 1.7; color: var(--ink-2); }

.method { padding: 26px 28px; }
.method-lede { max-width: 62ch; font-size: 13px; line-height: 1.65; color: var(--ink-3); margin-bottom: 22px; }
.method-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px 24px; }
.method-source { display: flex; flex-direction: column; gap: 3px; padding: 12px 14px; background: rgba(3, 9, 7, 0.5); border: 1px solid var(--line); border-radius: 8px; }
.method-name { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--lime); }
.method-role { font-size: 11px; color: var(--ink-3); }

.disclaimer { padding: 24px 28px; }
.disclaimer-text { margin-top: 10px; font-size: 12px; line-height: 1.7; color: var(--ink-3); }

@media (max-width: 720px) {
  .page { padding: 40px 20px 0; }
  .facts { gap: 26px; }
  .method-grid { grid-template-columns: 1fr 1fr; }
  .manifesto-row { gap: 16px; }
}
</style>
