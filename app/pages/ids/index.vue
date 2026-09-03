<script setup lang="ts">

useHead({ title: 'ID Hunter — KK Fan Hub' })

const sortedIds = [...ids].sort((a, b) => b.firstSpotted.localeCompare(a.firstSpotted))

const FILTERS = ['all', 'unknown', 'guess', 'confirmed', 'released'] as const
const filter = ref<(typeof FILTERS)[number]>('all')

const filtered = computed(() =>
  filter.value === 'all' ? sortedIds : sortedIds.filter((i) => i.status === filter.value),
)

const counts: Record<string, number> = { all: sortedIds.length }
for (const f of FILTERS.slice(1)) counts[f] = sortedIds.filter((i) => i.status === f).length
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="label label-lime">ID Hunter</p>
      <h1 class="display page-title">What was<br />that track</h1>
      <p class="page-sub">
        Unreleased and unidentified tracks spotted live, tracked from fan clips until they get names
        — and release dates.
      </p>
    </header>

    <div class="filters mono">
      <button
        v-for="f in FILTERS"
        :key="f"
        class="filters-btn"
        :class="{ 'is-active': filter === f }"
        @click="filter = f"
      >
        {{ f }} <span class="filters-count">{{ counts[f] }}</span>
      </button>
    </div>

    <div class="stack">
      <IdRow v-for="entry in filtered" :key="entry.id" :entry="entry" />
      <p v-if="!filtered.length" class="empty mono">Nothing here yet.</p>
    </div>
  </div>
</template>

<style scoped>
.page { padding: 56px 48px 0; display: flex; flex-direction: column; gap: 28px; max-width: 900px; }

.page-head { padding-bottom: 10px; }
.page-title { font-size: clamp(36px, 6.5vw, 64px); color: var(--ink); margin: 14px 0 16px; }
.page-sub { max-width: 54ch; font-size: 13px; line-height: 1.6; color: var(--ink-3); }

.filters { display: flex; flex-wrap: wrap; gap: 8px; }

.filters-btn {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-3);
  background: none;
  border: 1px solid var(--line-2);
  border-radius: 4px;
  padding: 8px 13px;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.filters-btn:hover { color: var(--ink); }

.filters-btn.is-active {
  color: var(--lime);
  border-color: var(--lime-border);
  background: var(--lime-bg);
}

.filters-count { color: var(--ink-4); margin-left: 4px; }

.stack { display: flex; flex-direction: column; gap: 12px; }
.empty { font-size: 11px; color: var(--ink-4); }

@media (max-width: 860px) {
  .page { padding: 40px 20px 0; }
}
</style>
