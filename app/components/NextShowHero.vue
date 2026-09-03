<script setup lang="ts">
import { formatShowDate, type Show } from '~/composables/useArchive'

const props = defineProps<{ show: Show }>()

const date = formatShowDate(props.show.date)
const countdown = ref('')

function updateCountdown() {
  const target = new Date(props.show.date + 'T00:00:00').getTime()
  const remaining = target - Date.now()
  if (remaining <= 0) {
    countdown.value = 'TONIGHT'
    return
  }
  const days = Math.floor(remaining / 86_400_000)
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000)
  const minutes = Math.floor((remaining % 3_600_000) / 60_000)
  countdown.value = `T−${String(days).padStart(2, '0')}D ${String(hours).padStart(2, '0')}H ${String(minutes).padStart(2, '0')}M`
}

let timer: ReturnType<typeof setInterval> | undefined

function startCountdown() {
  updateCountdown()
  timer = setInterval(updateCountdown, 60_000)
}

onMounted(() => { startCountdown() })
onBeforeUnmount(() => { clearInterval(timer) })
</script>

<template>
  <div class="glass next-hero">
    <div class="next-hero-date">
      <span class="next-hero-weekday mono">{{ date.weekday }}</span>
      <span class="next-hero-day display">{{ date.day }}</span>
      <span class="next-hero-month mono">{{ date.month }} {{ date.year }}</span>
    </div>

    <div class="next-hero-body">
      <p class="label label-lime">Next show</p>
      <p class="next-hero-event display">{{ show.event }}</p>
      <p class="next-hero-venue mono">{{ show.venue }} · {{ show.city }}, {{ show.country }}</p>
    </div>

    <div class="next-hero-side">
      <span class="next-hero-countdown mono">{{ countdown }}</span>
      <a
        v-if="show.ticketUrl"
        :href="show.ticketUrl"
        target="_blank"
        rel="noopener"
        class="btn next-hero-tickets"
        >Tickets</a
      >
    </div>
  </div>
</template>

<style scoped>
.next-hero {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 26px 30px;
  background:
    radial-gradient(80% 120% at 85% 0%, rgba(124, 238, 221, 0.08) 0%, transparent 60%),
    var(--panel);
}

.next-hero-date { display: flex; flex-direction: column; min-width: 74px; }
.next-hero-weekday { font-size: 10px; letter-spacing: 0.2em; color: var(--ink-4); }
.next-hero-day { font-size: 44px; color: var(--ink); line-height: 1.05; }
.next-hero-month { font-size: 10px; letter-spacing: 0.16em; color: var(--lime); text-transform: uppercase; margin-top: 3px; }

.next-hero-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 7px; }
.next-hero-event { font-size: 22px; color: var(--ink); }
.next-hero-venue { font-size: 10.5px; color: var(--ink-3); letter-spacing: 0.06em; text-transform: uppercase; }

.next-hero-side { display: flex; flex-direction: column; align-items: flex-end; gap: 14px; }
.next-hero-countdown {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--lime);
  text-shadow: 0 0 18px rgba(124, 238, 221, 0.45);
  min-height: 24px;
}
.next-hero-tickets { padding: 9px 18px; font-size: 11px; }

@media (max-width: 640px) {
  .next-hero { flex-wrap: wrap; gap: 16px 24px; padding: 20px 22px; }
  .next-hero-side { flex-direction: row; align-items: center; width: 100%; justify-content: space-between; }
}
</style>
