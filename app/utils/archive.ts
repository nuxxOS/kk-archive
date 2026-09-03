import showsData from '~/data/shows.json'
import idsData from '~/data/ids.json'
import setsData from '~/data/sets.json'
import releasesData from '~/data/releases.json'

export interface Show {
  id: string
  date: string
  event: string
  venue: string
  city: string
  country: string
  status: 'confirmed' | 'rumoured' | 'tba'
  ticketUrl: string
  setRecorded: boolean
  setSlug?: string
}

export interface TrackedId {
  id: string
  eventLabel: string
  showId: string
  timestamp: string
  clipUrl: string
  status: 'unknown' | 'guess' | 'confirmed' | 'released'
  guess: string
  confirmedTitle: string
  confirmedArtist: string
  releaseUrl: string
  firstSpotted: string
  note: string
}

export interface SetEntry {
  slug: string
  title: string
  venue: string
  city: string
  date: string
  durationSec: number
  sourceUrl: string
  sourcePlatform: string
  hasAnatomy: boolean
  dna: {
    avgBpm: number
    bpmMin: number
    bpmMax: number
    trackCount: number
    transitionCount: number
    longestBlendSec: number
    unknownIdCount: number
  }
  /** low-res energy curve for cards; full analysis lives in public/data/sets/{slug}.json */
  spark: number[]
  /** pinned sets lead the catalog and the home feature slot */
  pinned?: boolean
}

// static JSON — derive everything once at module load, no reactivity needed
const rawShows = showsData.shows as Show[]
// while sets are sample data, shows must not link into them
export const shows = setsData._sample
  ? rawShows.map((s) => (s.setSlug || s.setRecorded ? { ...s, setSlug: undefined, setRecorded: false } : s))
  : rawShows
export const ids = idsData.ids as TrackedId[]
export const sets = setsData.sets as SetEntry[]

// launch flags — ID Hunter is parked until real ID sourcing exists
export const FEATURES = { idHunter: false }

export const today = new Date().toISOString().slice(0, 10)

export const upcomingShows = shows.filter((s) => s.date >= today).sort((a, b) => a.date.localeCompare(b.date))
export const nextShow = upcomingShows[0] ?? null

export const sortedSets = [...sets].sort(
  (a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.date.localeCompare(a.date),
)

export const stats = {
  sets: sets.length,
  shows: shows.length,
  countries: new Set(shows.map((s) => s.country).filter(Boolean)).size,
  releases: releasesData.releases.length,
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatShowDate(date: string): { weekday: string; day: string; month: string; year: string } {
  const d = new Date(date + 'T00:00:00')
  return {
    weekday: d.toLocaleString('en', { weekday: 'short' }).slice(0, 2).toUpperCase(),
    day: String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    year: String(d.getFullYear()),
  }
}
