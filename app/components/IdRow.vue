<script setup lang="ts">
import type { TrackedId } from '~/composables/useArchive'

const props = defineProps<{ entry: TrackedId }>()

const isResolved = computed(() => props.entry.status === 'confirmed' || props.entry.status === 'released')
</script>

<template>
  <div class="glass id-row">
    <div class="id-row-head">
      <p class="mono id-row-where">
        <span class="id-row-ts">{{ entry.timestamp }}</span>
        {{ entry.eventLabel }}
      </p>
      <span class="badge" :class="`badge-${entry.status}`">{{ entry.status }}</span>
    </div>

    <p v-if="isResolved" class="id-row-resolved">
      {{ entry.confirmedArtist }} — {{ entry.confirmedTitle }}
    </p>
    <p v-else-if="entry.status === 'guess'" class="id-row-guess">{{ entry.guess }}</p>
    <p v-else class="id-row-resolved id-row-resolved-unknown">ID — unidentified</p>

    <p v-if="entry.note" class="id-row-note">{{ entry.note }}</p>

    <div class="id-row-links mono">
      <span class="label">Spotted {{ entry.firstSpotted }}</span>
      <span class="id-row-spacer" />
      <a v-if="entry.clipUrl" :href="entry.clipUrl" target="_blank" rel="noopener">Clip ↗</a>
      <a v-if="entry.releaseUrl" :href="entry.releaseUrl" target="_blank" rel="noopener">Release ↗</a>
    </div>
  </div>
</template>

<style scoped>
.id-row { padding: 18px 20px; display: flex; flex-direction: column; gap: 10px; }

.id-row-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.id-row-where { font-size: 11px; color: var(--ink-3); letter-spacing: 0.04em; }
.id-row-ts { color: var(--lime); font-weight: 700; margin-right: 10px; }

.id-row-resolved { font-size: 15px; font-weight: 700; }
.id-row-resolved-unknown { color: var(--ink-4); }
.id-row-guess { font-size: 14px; font-weight: 600; color: var(--warn); }

.id-row-note { font-size: 12.5px; line-height: 1.55; color: var(--ink-3); }

.id-row-links { display: flex; align-items: center; gap: 16px; font-size: 10px; }
.id-row-links a { color: var(--lime); letter-spacing: 0.08em; }
.id-row-spacer { flex: 1; }
</style>
