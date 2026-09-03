<script setup lang="ts">
import type { Release } from '~/pages/music.vue'

defineProps<{ release: Release }>()
</script>

<template>
  <a
    :href="release.streamUrl || release.mbUrl"
    target="_blank"
    rel="noopener"
    class="glass is-link release-card"
  >
    <img
      v-if="release.hasCover"
      :src="`/covers/${release.id}.jpg`"
      :alt="`${release.title} cover art`"
      class="release-card-art"
      loading="lazy"
      width="250"
      height="250"
    />
    <div v-else class="release-card-art release-card-fallback display">{{ release.title.slice(0, 1) }}</div>

    <div class="release-card-body">
      <p class="release-card-title">{{ release.title }}</p>
      <p class="release-card-meta mono">
        {{ release.date.slice(0, 4) }} · {{ release.type }}<template v-if="release.label"> · {{ release.label }}</template>
      </p>
    </div>
  </a>
</template>

<style scoped>
.release-card { display: flex; flex-direction: column; overflow: hidden; }

.release-card-art {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
  filter: saturate(0.92);
  transition: filter 0.25s ease;
}
.release-card:hover .release-card-art { filter: saturate(1.05); }

.release-card-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  color: var(--ink-4);
  background:
    radial-gradient(70% 70% at 50% 30%, rgba(64, 190, 160, 0.12) 0%, transparent 70%),
    #081512;
}

.release-card-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 4px; }
.release-card-title { font-size: 12.5px; font-weight: 600; line-height: 1.35; }
.release-card-meta { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-4); }
</style>
