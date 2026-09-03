<script setup lang="ts">
import { formatDuration, type SetEntry } from '~/composables/useArchive'

defineProps<{ set: SetEntry }>()
</script>

<template>
  <NuxtLink :to="`/sets/${set.slug}`" class="glass is-link set-card">
    <!-- atmospheric thumb placeholder until real photography exists -->
    <div class="set-card-thumb">
      <EnergySpark :energy="set.dna.energy" :height="52" />
    </div>

    <div class="set-card-body">
      <p class="set-card-title display">{{ set.title }}</p>
      <p class="set-card-venue mono">{{ set.venue }} · {{ set.city }}</p>
      <div class="set-card-meta mono">
        <span>{{ formatDuration(set.durationSec) }}</span>
        <span>{{ set.dna.trackCount }} tracks</span>
        <span>{{ set.dna.unknownIdCount }} IDs</span>
      </div>
    </div>
  </NuxtLink>
</template>

<style scoped>
.set-card { display: flex; flex-direction: column; overflow: hidden; }

.set-card-thumb {
  padding: 26px 16px 0;
  background:
    radial-gradient(80% 90% at 50% 0%, rgba(64, 190, 160, 0.1) 0%, transparent 70%),
    linear-gradient(180deg, #0b1a16 0%, transparent 100%);
}

.set-card-body { padding: 16px 18px 18px; display: flex; flex-direction: column; gap: 6px; }

.set-card-title { font-size: 17px; color: var(--ink); letter-spacing: 0.02em; }
.set-card-venue { font-size: 9.5px; color: var(--ink-3); letter-spacing: 0.08em; text-transform: uppercase; }

.set-card-meta { display: flex; gap: 14px; margin-top: 8px; font-size: 10px; color: var(--ink-4); }
.set-card-meta span:first-child { color: var(--lime); }
</style>
