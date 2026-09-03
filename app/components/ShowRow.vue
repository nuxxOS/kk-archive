<script setup lang="ts">
import { formatShowDate, type Show } from '~/composables/useArchive'

const props = defineProps<{ show: Show; showYear?: boolean }>()

const date = computed(() => formatShowDate(props.show.date))
</script>

<template>
  <div class="show-row">
    <div class="show-row-date">
      <span class="show-row-day display">{{ date.day }}</span>
      <span class="show-row-month mono">{{ date.month }}<template v-if="showYear"> '{{ date.year.slice(2) }}</template></span>
    </div>

    <div class="show-row-body">
      <p class="show-row-event">{{ show.event }}</p>
      <p class="show-row-venue mono">{{ show.venue }} · {{ show.city }}, {{ show.country }}</p>
    </div>

    <div class="show-row-side">
      <span class="badge" :class="`badge-${show.status}`">{{ show.status }}</span>
      <a
        v-if="show.ticketUrl"
        :href="show.ticketUrl"
        target="_blank"
        rel="noopener"
        class="show-row-link mono"
        >Tickets ↗</a
      >
      <NuxtLink v-if="show.setSlug" :to="`/sets/${show.setSlug}`" class="show-row-link mono"
        >Set →</NuxtLink
      >
    </div>
  </div>
</template>

<style scoped>
.show-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px 0;
  border-bottom: 1px solid var(--line);
}

.show-row-date { display: flex; flex-direction: column; min-width: 58px; }
.show-row-day { font-size: 26px; color: var(--ink); }
.show-row-month { font-size: 9px; letter-spacing: 0.16em; color: var(--lime); text-transform: uppercase; margin-top: 2px; }

.show-row-body { flex: 1; min-width: 0; }
.show-row-event { font-weight: 600; font-size: 14px; }
.show-row-venue { font-size: 10px; color: var(--ink-3); margin-top: 4px; letter-spacing: 0.04em; }

.show-row-side { display: flex; align-items: center; gap: 12px; }
.show-row-link { font-size: 10px; color: var(--lime); white-space: nowrap; letter-spacing: 0.08em; }

@media (max-width: 560px) {
  .show-row { gap: 14px; }
  .show-row-side { flex-direction: column; align-items: flex-end; gap: 6px; }
}
</style>
