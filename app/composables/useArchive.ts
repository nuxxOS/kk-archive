import showsData from '~/data/shows.json'
import idsData from '~/data/ids.json'
import setsData from '~/data/sets.json'

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
    energy: number[]
  }
  tracklist: { n: number; start: string; title: string; artist: string; status: string }[]
}

// static JSON — derive everything once at module load, no reactivity needed
const shows = showsData.shows as Show[]
const ids = idsData.ids as TrackedId[]
const sets = setsData.sets as SetEntry[]

const isSample = showsData._sample || idsData._sample || setsData._sample

export const today = new Date().toISOString().slice(0, 10)

const upcomingShows = shows.filter((s) => s.date >= today).sort((a, b) => a.date.localeCompare(b.date))
const pastShows = shows.filter((s) => s.date < today).sort((a, b) => b.date.localeCompare(a.date))
const nextShow = upcomingShows[0] ?? null

const sortedSets = [...sets].sort((a, b) => b.date.localeCompare(a.date))
const latestSet = sortedSets[0] ?? null

const sortedIds = [...ids].sort((a, b) => b.firstSpotted.localeCompare(a.firstSpotted))
const openIds = sortedIds.filter((i) => i.status === 'unknown' || i.status === 'guess')

const stats = {
  sets: sets.length,
  shows: shows.length,
  idsTracked: ids.length,
  idsOpen: openIds.length,
  tracks: sets.reduce((acc, s) => acc + s.dna.trackCount, 0),
}

export function useArchive() {
  return { shows, ids, sets, isSample, upcomingShows, pastShows, nextShow, sortedSets, latestSet, sortedIds, openIds, stats }
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function formatShowDate(date: string): { day: string; month: string; year: string } {
  const d = new Date(date + 'T00:00:00')
  return {
    day: String(d.getDate()).padStart(2, '0'),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    year: String(d.getFullYear()),
  }
}
