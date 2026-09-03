<script setup lang="ts">
const { sortedSets } = useArchive()

useHead({ title: 'Sets — KK Fan Hub' })
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="label label-lime">Sets</p>
      <h1 class="display page-title">The recorded record</h1>
      <p class="page-sub">
        Every publicly recorded set, each with its DNA — duration, BPM journey, track count and the
        IDs still missing. Deep visual analyses land here as they're finished.
      </p>
    </header>

    <div class="catalog">
      <SetCard v-for="set in sortedSets" :key="set.slug" :set="set" />
    </div>
  </div>
</template>

<style scoped>
.page { padding: 56px 48px 0; display: flex; flex-direction: column; gap: 32px; max-width: 1100px; }

.page-head { padding-bottom: 8px; }
.page-title { font-size: clamp(36px, 6.5vw, 64px); color: var(--ink); margin: 14px 0 16px; }
.page-sub { max-width: 54ch; font-size: 13px; line-height: 1.6; color: var(--ink-3); }

.catalog { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 18px; }

@media (max-width: 860px) {
  .page { padding: 40px 20px 0; }
}
</style>
