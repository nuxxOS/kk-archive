# KK Fan Hub

Unofficial KlangKuenstler fan hub — shows, tour globe, discography, stats, analyzed sets w/ Set DNA. ID Hunter parked behind a flag.
Theme matched to outworld-stadium.com (deep teal-black `#040d0b`, pale mint `#7ceedd`, glass, spaced grotesk).

## Run

```bash
pnpm install    # pnpm only — npm 10.9.2 hits an arborist bug on this machine
pnpm dev        # dev server (3000/3002 often taken locally — PORT=3010 works)
pnpm generate   # static build for Vercel
pnpm sync       # RA + Songkick + promoter watchlist → shows.json → .ics → Telegram post
```

## Current state (2026-09-03)

**REAL data:** 693 shows 2012→2027 (RA history + Songkick gigography + manual), 41 releases
(MusicBrainz), 131+ geocoded cities. **SAMPLE data remaining:** sets.json + ids.json (the yellow
banner stays until those are real or hidden).

Pages: Home (hero, tiles, ambient globe teaser) · /shows (upcoming + collapsible year archive,
.ics subscribe) · /map (tour globe: glow sprites, pulse rings, route arcs, scanner labels,
Upcoming/All-time/Year filter, zoom buttons) · /music · /stats · /sets · /ids · /about.

## Scripts

- `scripts/sync-shows.mjs` — recurring sync: RA GraphQL (upcoming) + Songkick calendar + promoter
  watchlist (generic JSON-LD via headless Chrome). Cross-source dedupe by date. Idempotent.
- `scripts/import-ra-history.mjs` — one-shot RA full history (`type: PREVIOUS` per year, no key!)
- `scripts/import-songkick-history.mjs` — one-shot Songkick gigography (headless Chrome, paginated)
- `scripts/geocode-cities.mjs` — Open-Meteo geocoding for new cities → cities.json
- `scripts/build-land-dots.mjs` — dot-matrix landmass for the globe (globe.gl polygon layers
  silently fail here — points/sprites only, and keep object identities STABLE or labels flicker)
- `scripts/sync-releases.mjs` — MusicBrainz discography (retries 503s)
- `scripts/sync-covers.mjs` — Cover Art Archive front covers → public/covers/{id}.jpg + hasCover
  flag (run after sync-releases; all 41 have art as of 2026-09-03)
- `scripts/snapshot-social.mjs` — daily audience snapshot into app/data/social.json, NO API keys:
  Spotify monthly listeners (og:description via curl DEFAULT UA — browser UAs get an empty JS
  shell), SoundCloud followers (page JSON, exact), Deezer fans (open API, exact), YouTube subs
  (page JSON, hl=en, rounded). Idempotent per date; failures carry the last known value forward.
  In the `pnpm sync` chain. /stats renders tiles + sparklines once ≥2 snapshots exist.
  Future: backfill-social-wayback.mjs (Wayback CDX historical counts) for instant history.
- `scripts/build-ics.mjs` — public/klangkuenstler-tour.ics
- `scripts/post-new-shows.mjs` — Telegram channel poster (needs TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID)
- `scripts/import-setlistfm.mjs` — optional now (RA history made it mostly redundant)

## Sets — analysis data contract (librosa pipeline TARGET)

The page machinery is DONE (2026-09-03) and runs on this contract — the Python pipeline just
has to emit these two things per analyzed set:

1. `public/data/sets/{slug}.json` — the heavy payload, fetched client-side by the set page:
   `{ slug, durationSec, energy: number[] (RMS per ~10s window, 0..1 normalized),
      bpm: number[] (same sampling), transitions: [{ time: seconds, type: BLEND|CUT|LOOP }],
      tracklist: [{ n, start: "H:MM:SS", title, artist, status: confirmed|guess|unknown }] }`
2. An entry appended to `app/data/sets.json` (light index): meta + `dna` summary numbers +
   `spark` (the energy array, used by catalog cards).

Components: `SetFingerprint.vue` (Three.js coil, flat/coil toggle, unroll intro, drag rotate;
resamples energy to ≥540 pts so low-res input stays round; three resolves via globe.gl's dep)
and `SetAnatomy.vue` (SVG energy/BPM/transitions/segments chart with hover readout).
Headless-Chrome screenshots of WebGL need `--use-angle=swiftshader --enable-unsafe-swiftshader`
(plain `--disable-gpu` kills the context).

**REAL SETS LIVE (2026-09-03), samples deleted.** Four analyzed via analyzer/analyze.py
(venv + librosa; audio gitignored): Outworld Secret Rave Berlin 2024 (PINNED, official SC),
Boiler Room × Teletech 2022, HÖR Berlin 2020-12-25, Unreal × Open Air Leipzig 2023-07-22
(linked to show ra-1682666). Analyzer lessons baked in: energy = dB scale w/ fixed 18dB window
under p98 (linear percentile min-max slams fake zeros); BPM = per-frame octave fix BEFORE
windowing, median aggregation; dna range = p5–p95. Tracklists imported from community data
(1001tracklists via set79.com — fetchable, no Cloudflare) with confirmed/guess/unknown statuses;
10 unknown IDs across sets = ID Hunter's future inventory. Ear-verification pass pending
(check: secret rave dip @55:10, peak @10:00). Set `pinned: true` in sets.json to feature.

## Data notes

- shows.json: `source` field = ra | songkick | bsh-events | outworld-stadium | (absent = manual).
  Manual entries are never touched by syncs. ~80 old entries have RA region-areas as "city"
  (UK North/South, German Bundesländer) — fine in lists, excluded from stats ranking & globe.
- Hygiene pass 2026-09-03: countries normalized to RA-style 2-letter codes (Songkick full
  names mapped, RA's TK→TR, livestream '00'→''; GE = Georgia, correct). 22 cross-source
  duplicates removed (same gig, different city/venue naming — e.g. Lyon/Villeurbanne
  Transbordeur, Cologne/Düren Badesee, LA/Long Beach Queen Mary); 693→671 shows.
  Pre-hygiene backup: app/data/shows.json.bak. sync-shows.mjs now normalizes countries
  at import (normalizeCountry), so future syncs stay clean.
- Ambiguous same-date RA pairs KEPT (double bookings are common; delete only with evidence):
  2023-11-17 LA Dreamstate + NYC Time Warp, 2024-05-17 Montreal + EDC Las Vegas,
  2020-09-12 Geneva + Paris, 2026-05-15 Washington DC Echostage + Las Vegas (upcoming —
  verify when closer).
- Budapest + London same night (2025-11-14) is CONFIRMED correct (he was in Budapest; KK's
  plane was delayed). Don't "fix" it.
- promoters.json = direct-source watchlist; Entrio/Bandsintown are Cloudflare dead ends (manual
  browser checks only).

## Product vision (2026-09-03)

The full product = archive (done) + **Sets**: real recorded-set research, librosa analysis
pipeline, Set DNA / Anatomy visuals integrated into set pages + **ID Hunter** revived as a
slow watchlist (unreleased tracks tracked until release) + **Telegram/WhatsApp** group links
per show + **live chat much later**, only once traffic proves demand (the chat-liquidity
lesson from v0 stands). Order matters: launch basics → sets → IDs → integrations → chat.

## Next session

1. **Logo** — exploration widened 2026-09-03: beyond "Die Welt Brennt", added Outworld/space ×
   track-theme concepts I–M to /logo-lab.html (Null Planet, Man on the Moon, Sonne Geht Auf,
   Phoenix Comet, Orbit Butterfly), each with a gen-AI prompt inline. Pick direction → generate
   → integrate as sidebar mark + favicon + OG. Fallback: wordmark-only identity.
2. Telegram bot token + channel (@BotFather, 5 min) → `pnpm sync` goes live-posting.
3. OG share image (site-wide card, then per-show).
4. ~~Data hygiene~~ DONE 2026-09-03 (see Data notes) — only the listed ambiguous same-date
   pairs remain open, plus the 2026-05-15 DC/Vegas pair to verify closer to the date.
5. Launch decisions (updated 2026-09-03): neutral domain (nothing containing
   "outworld"/"klangkuenstler"), Vercel deploy, analytics. LAUNCH SHAPE DECIDED: Sets SHIPS
   with launch (real librosa-analyzed sets — concept approved, see the Set Anatomy artifact:
   fingerprint coil w/ flat/coil toggle + SVG anatomy + pipeline; build next). ID Hunter
   PARKED: hidden behind FEATURES.idHunter=false in utils/archive.ts (nav auto-renumbers, home
   section/tile/CTA swapped, set-page related-IDs gated; /ids stays routable, unlinked).
   /music reworked: cover-art grid + era grouping (Beginnings / SvT / Outworld) +
   latest-release hero.
6. Later: German i18n; promoter watchlist probes (Rotterdam Rave, Awakenings, Verknipt).
