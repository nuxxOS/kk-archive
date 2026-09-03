<script setup lang="ts">
useHead({ title: 'About — KK Fan Hub' })
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="label label-lime">About</p>
      <h1 class="display page-title">Fan made.<br />Archive grade.</h1>
    </header>

    <section class="grid">
      <div class="glass card">
        <p class="label label-lime">What</p>
        <p>
          An unofficial hub for KlangKuenstler fans — every show we can verify, every publicly
          recorded set, and a running log of unreleased IDs spotted live, tracked until they get
          names and release dates.
        </p>
      </div>

      <div class="glass card">
        <p class="label label-lime">How</p>
        <p>
          Shows are compiled from public announcements. Recorded sets are analyzed with a custom
          audio pipeline (Python + librosa) that extracts energy, tempo and transition candidates —
          then everything is reviewed and classified by ear. Track IDs are marked by confidence:
          confirmed, community guess, or honestly unknown.
        </p>
      </div>

      <div class="glass card">
        <p class="label label-lime">Why</p>
        <p>
          Because this music deserves the same care as the archives built around older scenes — and
          because "anyone got the ID at 47:32?" deserves a permanent answer.
        </p>
      </div>

      <div class="glass card">
        <p class="label label-lime">Who</p>
        <p>
          Built and maintained by
          <a href="https://josipz.dev" target="_blank" rel="noopener" class="link">Josip Žalac</a>
          — developer &amp; DJ.
        </p>
      </div>
    </section>

    <section class="glass card disclaimer">
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
.page { padding: 56px 48px 0; display: flex; flex-direction: column; gap: 32px; max-width: 980px; }

.page-head { padding-bottom: 8px; }
.page-title { font-size: clamp(40px, 7vw, 76px); color: var(--ink); margin-top: 14px; }

.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }

.card { padding: 22px 24px; display: flex; flex-direction: column; gap: 12px; font-size: 13.5px; line-height: 1.65; color: var(--ink-2); }

.link { color: var(--lime); }

.disclaimer-text { margin-top: 4px; font-size: 12px; line-height: 1.7; color: var(--ink-3); }

@media (max-width: 860px) {
  .page { padding: 40px 20px 0; }
}
</style>
