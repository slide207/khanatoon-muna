#!/usr/bin/env python3
"""Prepare Khanatoon narration: remove long pauses, speed up 1.15x, retime words.

Usage:
  python scripts/prepare_voice.py voice/orig.mp3 voice/words_raw.json
  python scripts/prepare_voice.py voice/orig.mp3 voice/words_raw.json --speed 1.15 --max-gap 0.40

Input:
  - orig.mp3 / orig.wav / any audio ffmpeg can read
  - words_raw.json: [{"w": "...", "s": 0.0, "e": 0.4}, ...] (seconds)
    Also accepts {"word"|"text", "start", "end"} and an object {"words": [...]}.

Output:
  - voice/voice.wav  (48 kHz mono, 24-bit), pauses > max_gap shortened, tempo x speed
  - voice/words.json (normalized {w, d?, s, e}, times in the new audio)

Requires: Python 3.10+, numpy, ffmpeg on PATH.
"""
import argparse
import json
import math
import os
import subprocess
import sys
import tempfile
import wave

import numpy as np

SR = 48000
FRAME_S = 0.010  # 10 ms energy frames


def decode(path):
    cmd = [
        "ffmpeg", "-v", "error", "-i", path,
        "-f", "f32le", "-acodec", "pcm_f32le", "-ac", "1", "-ar", str(SR), "pipe:1",
    ]
    p = subprocess.run(cmd, capture_output=True)
    if p.returncode != 0:
        sys.exit("ffmpeg decode failed:\n" + p.stderr.decode("utf-8", "replace"))
    return np.frombuffer(p.stdout, dtype=np.float32).copy()


def merge(intervals, limit):
    out = []
    for a, b in sorted(intervals):
        a, b = max(0.0, a), min(limit, b)
        if b <= a:
            continue
        if out and a <= out[-1][1] + 0.005:
            out[-1] = (out[-1][0], max(out[-1][1], b))
        else:
            out.append((a, b))
    return out


def find_removals(x, max_gap, keep_gap, threshold_db):
    dur = len(x) / SR
    n = len(x) // int(FRAME_S * SR)
    rms = np.sqrt(np.mean(x[: n * int(FRAME_S * SR)].reshape(n, -1) ** 2, axis=1) + 1e-18)
    db = 20 * np.log10(rms + 1e-9)
    voiced = db > threshold_db

    # Small hangover so a breath inside a word is not treated as a pause boundary.
    for _ in range(2):
        voiced[1:] |= voiced[:-1]
        voiced[:-1] |= voiced[1:]

    rem = []
    ft = FRAME_S
    i = 0
    while i < n:
        if voiced[i]:
            i += 1
            continue
        j = i
        while j < n and not voiced[j]:
            j += 1
        a, b = i * ft, j * ft
        if b - a > max_gap:
            pad = keep_gap / 2.0
            rem.append((a + pad, b - pad))
        i = j

    # Trim long leading/trailing silence.
    if voiced.any():
        first = int(np.argmax(voiced))
        last = n - 1 - int(np.argmax(voiced[::-1]))
        if first * ft > 0.10:
            rem.append((0.0, first * ft - 0.06))
        if (last + 1) * ft < dur - 0.12:
            rem.append(((last + 1) * ft + 0.08, dur))

    return merge(rem, dur), dur


def cut_audio(x, removals, dur):
    keep = []
    pos = 0.0
    for a, b in removals:
        if a > pos:
            keep.append((pos, a))
        pos = max(pos, b)
    if pos < dur:
        keep.append((pos, dur))
    chunks = [x[int(round(a * SR)): int(round(b * SR))] for a, b in keep]
    return np.concatenate(chunks) if chunks else np.zeros(0, np.float32)


def write_wav16(path, x):
    y = np.clip(x, -1.0, 1.0)
    pcm = (y * 32767.0).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def removed_before(t, removals):
    total = 0.0
    for a, b in removals:
        if t <= a:
            break
        total += min(t, b) - a
    return max(0.0, total)


def load_words(path):
    data = json.load(open(path, encoding="utf-8"))
    if isinstance(data, dict):
        data = data.get("words", [])
    out = []
    for r in data:
        w = (r.get("w") or r.get("word") or r.get("text") or "").strip()
        d = (r.get("d") or "").strip()
        s = r.get("s", r.get("start"))
        e = r.get("e", r.get("end"))
        if not w or s is None or e is None:
            continue
        out.append({"w": w, "d": d, "s": float(s), "e": float(e)})
    out.sort(key=lambda r: r["s"])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio", help="voice/orig.mp3")
    ap.add_argument("words", help="raw word timings JSON")
    ap.add_argument("--out", default="voice", help="output folder (default: voice)")
    ap.add_argument("--speed", type=float, default=1.15)
    ap.add_argument("--max-gap", type=float, default=0.40, help="cut pauses longer than this (s)")
    ap.add_argument("--keep-gap", type=float, default=0.12, help="silence kept in a cut pause (s)")
    ap.add_argument("--threshold-db", type=float, default=-40.0)
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    x = decode(args.audio)
    removals, dur = find_removals(x, args.max_gap, args.keep_gap, args.threshold_db)
    cut = cut_audio(x, removals, dur)

    tmp = os.path.join(tempfile.gettempdir(), "khanatoon_cut.wav")
    write_wav16(tmp, cut)

    out_wav = os.path.join(args.out, "voice.wav")
    cmd = [
        "ffmpeg", "-y", "-v", "error", "-i", tmp,
        "-filter:a", f"atempo={args.speed:.4f}",
        "-ar", str(SR), "-ac", "1", "-c:a", "pcm_s24le", out_wav,
    ]
    p = subprocess.run(cmd, capture_output=True)
    if p.returncode != 0:
        sys.exit("ffmpeg encode failed:\n" + p.stderr.decode("utf-8", "replace"))
    try:
        os.remove(tmp)
    except OSError:
        pass

    with wave.open(out_wav, "rb") as w:
        final_dur = w.getnframes() / w.getframerate()

    words = load_words(args.words)
    new_words = []
    for r in words:
        s = (r["s"] - removed_before(r["s"], removals)) / args.speed
        e = (r["e"] - removed_before(r["e"], removals)) / args.speed
        s = min(max(0.0, s), final_dur)
        e = min(max(s + 0.02, e), final_dur)
        item = {"w": r["w"], "s": round(s, 3), "e": round(e, 3)}
        if r["d"] and r["d"] != r["w"]:
            item["d"] = r["d"]
        new_words.append(item)

    out_json = os.path.join(args.out, "words.json")
    json.dump(new_words, open(out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    removed = dur - (dur - sum(b - a for a, b in removals))
    print(f"input      {dur:.3f} s")
    print(f"removed    {removed:.3f} s of silence ({len(removals)} cuts)")
    print(f"speed      {args.speed:.2f}x")
    print(f"output     {final_dur:.3f} s -> {out_wav}")
    print(f"words      {len(new_words)} -> {out_json}")
    if final_dur > 0:
        wps = len(new_words) / final_dur
        print(f"pace       {wps:.2f} words/s (target ~2.4)")
        if not 2.2 <= wps <= 2.8:
            print("WARN       pace is outside 2.2-2.8 words/s; adjust the script length or speed.")
    if new_words and abs(new_words[-1]["e"] - final_dur) > 0.6:
        print("WARN       last word is more than 0.6 s from the audio end; check the timings.")


if __name__ == "__main__":
    main()
