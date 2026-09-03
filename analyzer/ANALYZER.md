# Set Analyzer — worksheet

Your build. The site contract is in README.md ("Sets — analysis data contract").
The skeleton `analyze.py` has all the boring parts done — argparse, windowing helper,
JSON writing. Your work is the four `TODO(you)` blocks: the actual signal processing.

Run: `venv/bin/python analyze.py audio/teletech-2022.wav --slug boiler-room-teletech-2022`

## Stage 1 — energy + BPM (today's goal)

### 1. Load
`librosa.load(path, sr=22050, mono=True)` → `(y, sr)`. One hour ≈ 80M samples, ~600MB RAM — fine.
`duration = len(y) / sr`.

### 2. Energy
- `librosa.feature.rms(y=y, hop_length=512)` → one value per frame (~43 frames/sec).
- Average frames into 10-second windows (helper `window_mean` is provided).
- Normalize to 0..1 — but NOT raw min-max: one silent second at the start would stretch
  the whole scale. Clip to the 5th/95th percentile first (`np.percentile`), then min-max.
- Check: `len(energy) ≈ duration / 10` (~362 for this set).

### 3. BPM
- Onset envelope first: `librosa.onset.onset_strength(y=y, sr=sr, hop_length=512)`.
- Per-frame tempo: `librosa.feature.tempo(onset_envelope=..., sr=sr, hop_length=512, aggregate=None)`.
- Average into the same 10s windows.
- THE hard-techno gotcha: octave errors. The tracker will sometimes report 75 when the
  floor says 150. Fix: while a value is below 100, double it; while above 200, halve it.
  (This set should live around 145–155.)

### 4. Emit + verify on the site
The skeleton writes `public/data/sets/{slug}.json` (transitions/tracklist empty for now)
and prints the index entry for `app/data/sets.json`. Paste the entry, open
`/sets/boiler-room-teletech-2022`, and sanity-check by ear: scrub the recording at the
energy curve's biggest peak and its deepest dip — do they sound like what the chart claims?
That listen-test is the review step; numbers that pass it are numbers we publish.

## Stage 2 — transitions (next session)

Novelty-based: MFCC or spectral-contrast change between adjacent windows, peak-picked
(`librosa.util.peak_pick`). Classify later (BLEND vs CUT by how fast energy hands over).
The page renders an empty `transitions: []` fine, so Stage 1 ships alone.

## Stage 3 — tracklist (human work)

1001tracklists + your ears. `status: unknown` rows are what will feed ID Hunter later.

## Notes

- Audio stays in `analyzer/audio/` (gitignored). Only derived JSON ships.
- deps: librosa 1.0 reads WAV only (libsndfile) — convert m4a first:
  `ffmpeg -i in.m4a -ac 1 -ar 22050 out.wav`
