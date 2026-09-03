<script setup lang="ts">
useHead({ title: 'World — KK Fan Hub' })

</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="label label-lime">World</p>
      <h1 class="display page-title">Everywhere he plays</h1>
      <p class="page-sub">
        Every tracked show on the globe. Brighter dots have upcoming dates — tap one for the details.
      </p>
    </header>

    <ClientOnly>
      <TourGlobe :shows="shows" />
      <template #fallback>
        <div class="glass globe-loading mono">LOADING GLOBE…</div>
      </template>
    </ClientOnly>
  </div>
</template>

<style scoped>
.page { padding: 56px 48px 0; display: flex; flex-direction: column; gap: 32px; max-width: 1100px; }

.page-head { padding-bottom: 8px; }
.page-title { font-size: clamp(36px, 6.5vw, 64px); color: var(--ink); margin: 14px 0 16px; }
.page-sub { max-width: 54ch; font-size: 13px; line-height: 1.6; color: var(--ink-3); }

.globe-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 480px;
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--ink-4);
}

@media (max-width: 800px) {
  .page { padding: 40px 20px 0; }
}
</style>
