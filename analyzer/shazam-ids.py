#!/usr/bin/env python3
"""Probe every unknown-ID segment in the analyzed sets against Shazam.

For each tracklist row with status "unknown", cut three 12s probes from the
segment (avoiding the blend zones at both ends) and ask Shazam. Mixed audio
kills recognition often — a hit on ANY probe counts. No matches on a truly
unreleased track is the expected outcome, not a failure.

Run: venv-shazam/bin/python shazam-ids.py
Requires per-set audio in audio/{key}.wav (see AUDIO map below).
"""
import asyncio
import json
import subprocess
import tempfile
from pathlib import Path

from shazamio import Shazam

ROOT = Path(__file__).resolve().parent.parent
AUDIO = {
    "outworld-secret-rave-berlin": "berlin-secret-rave.wav",
    "boiler-room-teletech-2022": "teletech-2022.wav",
    "hoer-berlin-2020": "hoer-berlin-2020.wav",
    "unreal-open-air-leipzig": "unreal-leipzig.wav",
}
PROBE_SEC = 12


def to_seconds(start: str) -> int:
    parts = [int(p) for p in start.split(":")]
    return parts[0] * 3600 + parts[1] * 60 + parts[2] if len(parts) == 3 else parts[0] * 60 + parts[1]


def cut_probe(wav: Path, at_sec: int, out: Path) -> None:
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(at_sec),
         "-t", str(PROBE_SEC), "-i", str(wav), "-ac", "1", "-ar", "44100", str(out)],
        check=True,
    )


async def main() -> None:
    shazam = Shazam()
    for slug, wav_name in AUDIO.items():
        analysis = json.loads((ROOT / "public" / "data" / "sets" / f"{slug}.json").read_text())
        tracklist = analysis["tracklist"]
        wav = ROOT / "analyzer" / "audio" / wav_name
        if not wav.exists():
            print(f"{slug}: audio missing, skipping")
            continue

        for i, row in enumerate(tracklist):
            if row["status"] != "unknown":
                continue
            seg_start = to_seconds(row["start"])
            seg_end = to_seconds(tracklist[i + 1]["start"]) if i + 1 < len(tracklist) else analysis["durationSec"]
            seg_len = seg_end - seg_start
            # probe the middle of the segment, away from the blends at the edges
            offsets = sorted({seg_start + max(20, int(seg_len * f)) for f in (0.35, 0.55, 0.75)})

            print(f"\n{slug} · unknown at {row['start']} (segment {seg_len}s)")
            for at in offsets:
                if at >= seg_end - PROBE_SEC:
                    continue
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                    probe = Path(tmp.name)
                cut_probe(wav, at, probe)
                try:
                    result = await shazam.recognize(str(probe))
                finally:
                    probe.unlink(missing_ok=True)
                track = result.get("track")
                if track:
                    print(f"  probe @{at}s  MATCH: {track.get('subtitle')} — {track.get('title')}")
                else:
                    print(f"  probe @{at}s  no match")
                await asyncio.sleep(2)  # be polite


asyncio.run(main())
