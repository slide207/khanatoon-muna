# Voice

Put the narration here:

- `voice/orig.mp3` — the single TTS take.
- `voice.wav` — produced by `python scripts/prepare_voice.py`: pauses > 0.40 s removed, 1.15x, pitch preserved.
- `words.json` — `[{"w":"kata","d":"kata","s":0.12,"e":0.78}, ...]`, seconds, ascending, hand-fixed.
  `w` is the spoken form, `d` is the display form for captions (numbers and names).

Everything in the picture, captions, and mix is keyed to these word times.
The file must exist for `Captions.tsx` to compile; an empty array is valid while drafting.
