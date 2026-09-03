#!/usr/bin/env python3
"""Analyze a recorded set into the site's JSON contract. See ANALYZER.md."""
import argparse
import json
from pathlib import Path

import numpy as np
import librosa

WINDOW_SEC = 10
HOP = 512

parser = argparse.ArgumentParser()
parser.add_argument("audio", help="path to WAV (mono 22050 preferred)")
parser.add_argument("--slug", required=True, help="set slug, e.g. boiler-room-teletech-2022")
args = parser.parse_args()

# ---------------------------------------------------------------- helpers

def window_mean(per_frame: np.ndarray, frames_per_sec: float) -> np.ndarray:
    """Average a per-frame series into WINDOW_SEC windows."""
    frames_per_window = int(round(frames_per_sec * WINDOW_SEC))
    n_windows = len(per_frame) // frames_per_window
    trimmed = per_frame[: n_windows * frames_per_window]
    return trimmed.reshape(n_windows, frames_per_window).mean(axis=1)


def window_median(per_frame: np.ndarray, frames_per_sec: float) -> np.ndarray:
    """Median per window — robust against breakdown-era junk estimates (BPM)."""
    frames_per_window = int(round(frames_per_sec * WINDOW_SEC))
    n_windows = len(per_frame) // frames_per_window
    trimmed = per_frame[: n_windows * frames_per_window]
    return np.median(trimmed.reshape(n_windows, frames_per_window), axis=1)

# ---------------------------------------------------------------- 1. load

print("loading audio…")
y, sr = librosa.load(args.audio, sr=22050, mono=True)
duration_sec = len(y) / sr

frames_per_sec = sr / HOP

# ---------------------------------------------------------------- 2. energy

print("energy…")
rms = librosa.feature.rms(y=y, hop_length=HOP)[0]
rms_win = window_mean(rms, frames_per_sec)
# perceptual scale: dB with a fixed 18dB window under the set's near-peak.
# percentile min-max on linear RMS slams breakdowns to fake zeros and pins
# 5% of windows to exactly 0/1; a fixed dB window keeps dips honest and
# makes energy comparable across sets.
db = 20 * np.log10(np.maximum(rms_win, 1e-6))
ref = np.percentile(db, 98)
floor = ref - 18
energy = np.clip((db - floor) / (ref - floor), 0, 1)

# ---------------------------------------------------------------- 3. bpm

print("tempo…")
onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=HOP)
tempo = librosa.feature.tempo(onset_envelope=onset_env, sr=sr, hop_length=HOP, aggregate=None)
# octave errors PER FRAME, before windowing — a window averaging 75 and 150 is garbage
while (tempo < 100).any():
    tempo = np.where(tempo < 100, tempo * 2, tempo)
while (tempo > 200).any():
    tempo = np.where(tempo > 200, tempo / 2, tempo)
bpm = window_median(tempo, frames_per_sec)

# ---------------------------------------------------------------- 3b. transitions (v1)

# novelty = timbre change between adjacent windows (MFCC distance); peaks = candidates
print("transitions…")
mfcc = librosa.feature.mfcc(y=y, sr=sr, hop_length=HOP, n_mfcc=13)
mfcc_win = np.stack([window_mean(m, frames_per_sec) for m in mfcc])
novelty = np.linalg.norm(np.diff(mfcc_win, axis=1), axis=0)
novelty = (novelty - novelty.min()) / max(novelty.max() - novelty.min(), 1e-9)
threshold = float(np.percentile(novelty, 90))
transition_windows = [
    i + 1
    for i in range(1, len(novelty) - 1)
    if novelty[i] >= threshold and novelty[i] >= novelty[i - 1] and novelty[i] >= novelty[i + 1]
]
transitions = [{"time": int(w * WINDOW_SEC), "type": "BLEND"} for w in transition_windows]

# ---------------------------------------------------------------- 4. emit

root = Path(__file__).resolve().parent.parent
out_path = root / "public" / "data" / "sets" / f"{args.slug}.json"

analysis = {
    "slug": args.slug,
    "durationSec": round(duration_sec),
    "energy": [round(float(e), 3) for e in energy],
    "bpm": [round(float(b), 1) for b in bpm],
    "transitions": transitions,
    "tracklist": [],  # stage 3 — 1001tracklists + ears
}
out_path.write_text(json.dumps(analysis, indent=1) + "\n")
print(f"wrote {out_path} ({len(analysis['energy'])} windows)")

index_entry = {
    "slug": args.slug,
    "title": "FILL ME",
    "venue": "FILL ME",
    "city": "FILL ME",
    "date": "YYYY-MM-DD",
    "durationSec": round(duration_sec),
    "sourceUrl": "FILL ME",
    "sourcePlatform": "SoundCloud",
    "hasAnatomy": True,
    "dna": {
        "avgBpm": round(float(np.mean(bpm)), 1),
        "bpmMin": round(float(np.min(bpm))),
        "bpmMax": round(float(np.max(bpm))),
        "trackCount": 0,
        "transitionCount": len(transitions),
        "longestBlendSec": 0,
        "unknownIdCount": 0,
    },
    "spark": [round(float(e), 3) for e in energy[:: max(1, len(energy) // 60)]],
}
print("\npaste into app/data/sets.json sets[] (fill the FILL MEs):")
print(json.dumps(index_entry, indent=1))
