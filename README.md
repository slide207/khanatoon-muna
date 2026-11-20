# KhanatoonMuna

Khanatoon-style cartoon 3D short (55-70 s, 1080x1920 at 30 fps, final 1440x2560).
Scaffolded from the `cartoon-3d-short` skill.

## Setup

```
npm.cmd install
npm.cmd run typecheck
npm.cmd run dev
```

Set a temp folder on a large drive before rendering:

```
set REMOTION_TMP=D:\remotion-tmp
```

## Compositions

- `BridgeShort` — clean master, no captions.
- `BridgeShortCaptioned` — delivery version with word-by-word captions.

## Production order

1. `SCRIPT.md`: 120-160 words, facts + sources, 3 hooks, Untungnya/Sialnya last. Get approval.
2. TTS one take -> `voice/orig.mp3`.
3. `python scripts/prepare_voice.py voice/orig.mp3 voice/words_raw.json` -> `voice/voice.wav` + `voice/words.json`.
4. `src/videos/bridge/story.ts`: SHOTS, BEAT, CAMS, KICKS, DOF, FOREGROUND, TOTAL.
5. `build.ts` / `paint.ts`: set and textures.
6. `cast.ts` / `toon.ts`: roles, outfits, props in hand.
7. Rewrite `audio/timeline.py`, `audio/sfx.py`, `audio/music.py`, then `python audio/mix.py`.
8. Stills: `node scripts/stills.mjs out/look/x_ 0,130,283,444 0.5`.
9. Render parts: `node scripts/render-parts.mjs --comp=BridgeShortCaptioned --parts=5 --mux=audio/mix.wav --final=out/final.mp4`.
10. QA: `python scripts/bridge_shots.py src/videos/bridge/story.ts out/shots.json` and
    `python scripts/short_qa.py out/final.mp4 out/qa out/shots.json`.
11. First clean frame: `node scripts/stills.mjs out/first_ 0 1 --comp=BridgeShort`.

The full Khanatoon workflow, rules, look values and traps are in the skill's `SKILL.md`.
