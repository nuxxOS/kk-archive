<script setup lang="ts">
import { formatDuration, formatShowDate } from '~/composables/useArchive'

const { shows, nextShow, latestSet, sortedSets, sortedIds, upcomingShows, stats } = useArchive()

const nextShowDate = nextShow ? formatShowDate(nextShow.date) : null
const recentIds = sortedIds.slice(0, 2)
</script>

<template>
  <div>
    <!-- ============ HERO ============ -->
    <section class="hero">
      <div class="hero-beams" aria-hidden="true"><i /><i /><i /></div>

      <div class="hero-inner">
        <div class="hero-main">
          <p class="label label-lime">Welcome to the unofficial</p>
          <h1 class="display hero-title">Klang<wbr />Kuenstler</h1>
          <p class="hero-tag display">The place for fans. By fans.</p>
          <p class="hero-sub">
            Everything about KlangKuenstler — sets, shows, IDs and the community. Collected,
            organized, obsessed over.
          </p>
          <div class="hero-actions">
            <NuxtLink to="/sets" class="btn">Explore sets →</NuxtLink>
            <NuxtLink to="/ids" class="btn btn-ghost">ID Hunter</NuxtLink>
          </div>
        </div>

        <NuxtLink v-if="nextShow && nextShowDate" to="/shows" class="glass is-link hero-next">
          <p class="label">Next show</p>
          <p class="hero-next-date mono">{{ nextShowDate.day }} {{ nextShowDate.month }} {{ nextShowDate.year }}</p>
          <p class="hero-next-event display">{{ nextShow.event }}</p>
          <p class="hero-next-venue mono">{{ nextShow.venue }}<br />{{ nextShow.city }}, {{ nextShow.country }}</p>
          <span class="hero-next-cta mono">View all shows →</span>
        </NuxtLink>
      </div>

      <div class="hero-tiles">
        <div class="glass hero-tile">
          <span class="hero-tile-value mono">{{ stats.sets }}</span>
          <span class="hero-tile-label">Sets tracked</span>
        </div>
        <div class="glass hero-tile">
          <span class="hero-tile-value mono">{{ stats.tracks }}</span>
          <span class="hero-tile-label">Tracks logged</span>
        </div>
        <div class="glass hero-tile">
          <span class="hero-tile-value mono">{{ stats.idsOpen }}</span>
          <span class="hero-tile-label">Unsolved IDs</span>
        </div>
        <div class="glass hero-tile">
          <span class="hero-tile-value mono">{{ stats.shows }}</span>
          <span class="hero-tile-label">Shows archived</span>
        </div>
      </div>
    </section>

    <div class="page">
      <!-- ============ SHOWS + LATEST SET ============ -->
      <div class="cols">
        <section class="glass panel">
          <div class="section-title">
            <h2>Upcoming shows</h2>
            <NuxtLink to="/shows" class="view-all">View all →</NuxtLink>
          </div>
          <ShowRow v-for="show in upcomingShows.slice(0, 5)" :key="show.id" :show="show" show-year />
        </section>

        <section v-if="latestSet" class="glass panel">
          <div class="section-title">
            <h2>Latest set analysis</h2>
            <NuxtLink :to="`/sets/${latestSet.slug}`" class="view-all">Explore →</NuxtLink>
          </div>
          <NuxtLink :to="`/sets/${latestSet.slug}`" class="latest">
            <EnergySpark :energy="latestSet.dna.energy" :height="110" />
            <p class="latest-title display">{{ latestSet.title }}</p>
            <div class="latest-meta mono">
              <span><b>{{ formatDuration(latestSet.durationSec) }}</b> duration</span>
              <span><b>{{ latestSet.dna.trackCount }}</b> tracks</span>
              <span><b>{{ latestSet.dna.transitionCount }}</b> transitions</span>
              <span><b>{{ latestSet.dna.unknownIdCount }}</b> unknown IDs</span>
            </div>
          </NuxtLink>
        </section>
      </div>

      <!-- ============ WORLD TEASER ============ -->
      <section>
        <div class="section-title">
          <h2>Everywhere he plays</h2>
          <NuxtLink to="/map" class="view-all">Explore the globe →</NuxtLink>
        </div>
        <NuxtLink to="/map" class="world-teaser">
          <ClientOnly>
            <TourGlobe :shows="shows" ambient :height="400" />
          </ClientOnly>
          <span class="world-teaser-cta btn">Open the world →</span>
        </NuxtLink>
      </section>

      <!-- ============ SET CATALOG ============ -->
      <section>
        <div class="section-title">
          <h2>Set catalog</h2>
          <NuxtLink to="/sets" class="view-all">All sets →</NuxtLink>
        </div>
        <div class="catalog">
          <SetCard v-for="set in sortedSets" :key="set.slug" :set="set" />
        </div>
      </section>

      <!-- ============ ID HUNTER ============ -->
      <section>
        <div class="section-title">
          <h2>ID Hunter</h2>
          <NuxtLink to="/ids" class="view-all">All IDs →</NuxtLink>
        </div>
        <div class="stack">
          <IdRow v-for="entry in recentIds" :key="entry.id" :entry="entry" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* ---------- hero ---------- */
.hero {
  position: relative;
  overflow: hidden;
  padding: 84px 48px 0;
  border-bottom: 1px solid var(--line);
  background:
    radial-gradient(70% 60% at 65% 0%, rgba(64, 190, 160, 0.12) 0%, transparent 60%),
    radial-gradient(100% 80% at 20% 110%, rgba(14, 48, 40, 0.6) 0%, transparent 70%);
}

/* stage light beams */
.hero-beams { position: absolute; inset: 0; pointer-events: none; }
.hero-beams i {
  position: absolute;
  top: -20%;
  height: 150%;
  width: 90px;
  background: linear-gradient(180deg, rgba(124, 238, 221, 0.06) 0%, transparent 75%);
  filter: blur(14px);
  transform: skewX(-14deg);
}
.hero-beams i:nth-child(1) { left: 46%; }
.hero-beams i:nth-child(2) { left: 62%; width: 60px; transform: skewX(-6deg); }
.hero-beams i:nth-child(3) { left: 78%; width: 120px; transform: skewX(-20deg); opacity: 0.7; }

.hero-inner {
  position: relative;
  display: flex;
  gap: 48px;
  align-items: flex-start;
  justify-content: space-between;
  max-width: 1200px;
}

.hero-main { max-width: 640px; }

.hero-title {
  font-size: clamp(34px, 6.2vw, 84px);
  color: var(--ink);
  margin: 18px 0 10px;
  text-shadow: 0 0 34px rgba(124, 238, 221, 0.35), 0 0 90px rgba(124, 238, 221, 0.18);
  overflow-wrap: anywhere;
}

@media (max-width: 860px) {
  .hero-title { font-size: clamp(30px, 9.5vw, 64px); }
}

.hero-tag { font-size: clamp(15px, 2vw, 20px); color: var(--lime); letter-spacing: 0.18em; }

.hero-sub { margin-top: 18px; max-width: 46ch; font-size: 14px; color: var(--ink-2); }

.hero-actions { display: flex; gap: 12px; margin-top: 28px; flex-wrap: wrap; }

.hero-next {
  flex-shrink: 0;
  width: 250px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hero-next-date { font-size: 12px; color: var(--lime); letter-spacing: 0.12em; }
.hero-next-event { font-size: 21px; color: var(--ink); }
.hero-next-venue { font-size: 10px; color: var(--ink-3); letter-spacing: 0.06em; line-height: 1.6; text-transform: uppercase; }
.hero-next-cta { margin-top: 10px; font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--lime); }

.hero-tiles {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  max-width: 860px;
  margin-top: 52px;
  padding-bottom: 44px;
}

.hero-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px 12px;
  text-align: center;
}

.hero-tile-value { font-size: 24px; font-weight: 700; color: var(--lime); }

.hero-tile-label {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--ink-3);
}

@media (max-width: 640px) {
  .hero-tiles { grid-template-columns: repeat(2, 1fr); }
}

/* ---------- body ---------- */
.page { padding: 48px 48px 0; display: flex; flex-direction: column; gap: 56px; max-width: 1200px; }

.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

.panel { padding: 24px 26px; }
.panel :deep(.show-row:last-child) { border-bottom: 0; }

.latest { display: flex; flex-direction: column; gap: 16px; }
.latest-title { font-size: 22px; color: var(--ink); }
.latest-meta { display: flex; flex-wrap: wrap; gap: 8px 20px; font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-4); }
.latest-meta b { color: var(--lime); font-size: 12px; margin-right: 5px; }

.world-teaser { position: relative; display: block; }
.world-teaser-cta {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
}

.catalog { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 18px; }

.stack { display: flex; flex-direction: column; gap: 12px; }

@media (max-width: 1080px) {
  .hero-next { display: none; }
}

@media (max-width: 860px) {
  .hero { padding: 56px 20px 0; }
  .page { padding: 36px 20px 0; }
  .cols { grid-template-columns: 1fr; }
}
</style>
