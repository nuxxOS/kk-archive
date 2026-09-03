<script setup lang="ts">
import { FEATURES } from '~/composables/useArchive'

const { isSample, stats } = useArchive()

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/shows', label: 'Shows' },
  { to: '/map', label: 'World' },
  { to: '/sets', label: 'Sets' },
  { to: '/music', label: 'Music' },
  { to: '/stats', label: 'Stats' },
  { to: '/ids', label: 'ID Hunter', flag: 'idHunter' as const },
  { to: '/about', label: 'About' },
]
const nav = NAV_ITEMS.filter((item) => !item.flag || FEATURES[item.flag]).map((item, i) => ({
  ...item,
  glyph: String(i + 1).padStart(2, '0'),
}))

const menuOpen = ref(false)
const route = useRoute()
watch(() => route.path, () => (menuOpen.value = false))
</script>

<template>
  <div class="hub">
    <!-- sidebar (desktop) / topbar (mobile) -->
    <aside class="side" :class="{ 'is-open': menuOpen }">
      <NuxtLink to="/" class="side-brand">
        <img src="/logo.svg" alt="Burning world — KlangKuenstler Fan Hub" class="side-logo" />
        <span class="side-wordmark display">
          <span class="wordmark-line"><span class="wordmark-cap">K</span>lang</span>
          <span class="wordmark-line"><span class="wordmark-cap">K</span>uenstler</span>
        </span>
      </NuxtLink>

      <nav class="side-nav">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="side-link"
          active-class="is-active"
        >
          <span class="side-glyph mono">{{ item.glyph }}</span>
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="side-foot">
        <p class="label">Listen</p>
        <div class="side-listen mono">
          <a href="https://soundcloud.com" target="_blank" rel="noopener">SoundCloud</a>
          <a href="https://youtube.com" target="_blank" rel="noopener">YouTube</a>
          <a href="https://open.spotify.com" target="_blank" rel="noopener">Spotify</a>
        </div>
        <p class="side-disclaimer">
          Fan made. Not affiliated with KlangKuenstler or Outworld.
        </p>
      </div>
    </aside>

    <div class="hub-main">
      <div v-if="isSample" class="sample-banner mono">
        SAMPLE DATA — replace app/data/*.json with real research before launch
      </div>

      <header class="topbar">
        <NuxtLink to="/" class="topbar-brand display">KlangKuenstler</NuxtLink>
        <button class="topbar-burger mono" aria-label="Menu" @click="menuOpen = !menuOpen">
          {{ menuOpen ? '✕' : '☰' }}
        </button>
      </header>

      <main class="hub-content">
        <slot />
      </main>

      <footer class="foot">
        <div class="foot-pillars">
          <div class="foot-pillar">
            <p class="label label-lime">Fan made</p>
            <p>Independent project — not affiliated with the artist or his team.</p>
          </div>
          <div class="foot-pillar">
            <p class="label label-lime">For the community</p>
            <p>Made by fans, for fans. Everything collected in one place.</p>
          </div>
          <div class="foot-pillar">
            <p class="label label-lime">Respect the scene</p>
            <p>Support the artist — buy the music, go to the shows. No audio hosted; links point to official sources.</p>
          </div>
        </div>
        <div class="foot-base mono">
          <span>{{ stats.shows }} shows · {{ stats.countries }} countries · {{ stats.sets }} sets</span>
          <span>built by <a href="https://josipz.dev" target="_blank" rel="noopener">josipz.dev</a> — developer &amp; DJ</span>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.hub { display: flex; min-height: 100vh; }

/* ---------- sidebar ---------- */
.side {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 216px;
  display: flex;
  flex-direction: column;
  padding: 28px 20px 24px;
  background: rgba(6, 8, 7, 0.82);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  border-right: 1px solid var(--line);
  z-index: 30;
}

.side-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 40px; }
.side-logo {
  width: 56px;
  flex-shrink: 0;
  filter: drop-shadow(0 0 10px rgba(124, 238, 221, 0.55)) drop-shadow(0 0 26px rgba(124, 238, 221, 0.3));
}
.side-wordmark {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 56px;
  color: var(--ink);
  text-shadow: 0 0 16px rgba(124, 238, 221, 0.5), 0 0 40px rgba(124, 238, 221, 0.25);
}
.wordmark-line {
  display: flex;
  align-items: baseline;
  font-size: 12px;
  letter-spacing: 0.14em;
  line-height: 1;
}
.wordmark-cap {
  font-size: 27px;
  line-height: 0.78;
  letter-spacing: 0.02em;
  margin-right: 1px;
}

.side-nav { display: flex; flex-direction: column; gap: 2px; }

.side-link {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink-3);
  padding: 11px 12px;
  border-radius: 5px;
  border-left: 2px solid transparent;
  transition: color 0.2s ease, background 0.2s ease;
}

.side-link:hover { color: var(--ink); }

.side-link.is-active {
  color: var(--lime);
  background: var(--lime-bg);
  border-left-color: var(--lime);
}

.side-glyph { font-size: 9px; color: var(--ink-4); }
.side-link.is-active .side-glyph { color: var(--lime-soft); }

.side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 10px; }
.side-listen { display: flex; flex-direction: column; gap: 6px; font-size: 10px; }
.side-listen a { color: var(--ink-3); letter-spacing: 0.08em; text-transform: uppercase; }
.side-listen a:hover { color: var(--ink); }
.side-disclaimer { font-size: 10px; line-height: 1.5; color: var(--ink-4); margin-top: 8px; }

/* ---------- main column ---------- */
.hub-main { flex: 1; margin-left: 216px; min-width: 0; display: flex; flex-direction: column; }

.sample-banner {
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-align: center;
  padding: 6px 12px;
  color: var(--warn);
  background: var(--warn-bg);
  border-bottom: 1px solid var(--warn-border);
}

.topbar { display: none; }

.hub-content { flex: 1; }

/* ---------- footer ---------- */
.foot { border-top: 1px solid var(--line); margin-top: 56px; padding: 40px 48px 28px; }

.foot-pillars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; }
.foot-pillar p:last-child { margin-top: 10px; font-size: 12px; line-height: 1.6; color: var(--ink-3); }

.foot-base {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-top: 36px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink-4);
}

.foot-base a { color: var(--ink-3); }

/* ---------- mobile ---------- */
@media (max-width: 860px) {
  .side {
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    width: 260px;
  }
  .side.is-open { transform: translateX(0); }

  .hub-main { margin-left: 0; }

  .topbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    background: rgba(6, 8, 7, 0.85);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
  }

  .topbar-brand { font-size: 18px; color: var(--ink); }

  .topbar-burger {
    background: none;
    border: 1px solid var(--line-2);
    border-radius: 5px;
    color: var(--ink);
    font-size: 14px;
    padding: 6px 11px;
    cursor: pointer;
  }

  .foot { padding: 32px 20px 24px; }
  .foot-pillars { grid-template-columns: 1fr; gap: 20px; }
}
</style>
