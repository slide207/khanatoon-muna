// Word-by-word Indonesian captions for Khanatoon shorts.
// Reads voice/words.json (project root). Each entry: { w: spoken, d?: display, s, e } in seconds.
// Shows up to 3 words per line, the word being spoken in yellow, the rest white with a black outline.
import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import wordsData from "../../../voice/words.json";

type RawWord = {
  w?: string;
  d?: string;
  word?: string;
  s?: number;
  e?: number;
  start?: number;
  end?: number;
};
type Word = { text: string; start: number; end: number };
type Line = { words: Word[]; start: number; end: number };

const toWords = (raw: RawWord[]): Word[] =>
  raw
    .map((r) => {
      const text = (r.d ?? r.w ?? r.word ?? "").trim();
      const start = Number(r.s ?? r.start ?? NaN);
      const end = Number(r.e ?? r.end ?? NaN);
      return { text, start, end };
    })
    .filter((w) => w.text.length > 0 && Number.isFinite(w.start) && Number.isFinite(w.end) && w.end > w.start)
    .sort((a, b) => a.start - b.start);

/** Group into short lines: max 3 words, break on a pause > 0.32 s or sentence punctuation. */
const toLines = (words: Word[]): Line[] => {
  const lines: Line[] = [];
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    lines.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end });
    cur = [];
  };
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    cur.push(w);
    const next = words[i + 1];
    const gap = next ? next.start - w.end : Number.POSITIVE_INFINITY;
    const sentenceEnd = /[.!?…]$/.test(w.text);
    if (cur.length >= 3 || gap > 0.32 || sentenceEnd || !next) flush();
  }
  flush();
  return lines;
};

const OUTLINE =
  "0 3px 0 #000, 3px 0 0 #000, -3px 0 0 #000, 0 -3px 0 #000, 2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000, 0 5px 14px rgba(0,0,0,.55)";

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  const words = useMemo(() => toWords(wordsData as unknown as RawWord[]), []);
  const lines = useMemo(() => toLines(words), [words]);

  if (!lines.length) return null;
  if (t < lines[0].start - 0.08) return null;
  if (t > lines[lines.length - 1].end + 0.6) return null;

  let idx = 0;
  for (let i = 0; i < lines.length; i++) if (t >= lines[i].start - 0.04) idx = i;
  const line = lines[idx];

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 240 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "0 20px",
          maxWidth: "92%",
          textAlign: "center",
          fontFamily: '"Arial Black", "Arial Bold", Arial, sans-serif',
          fontWeight: 900,
          fontSize: 56,
          lineHeight: 1.08,
          letterSpacing: 0.5,
          textTransform: "none",
        }}
      >
        {line.words.map((w, i) => {
          const active = t >= w.start && t < w.end;
          return (
            <span
              key={`${w.start}-${i}`}
              style={{
                color: active ? "#FFD400" : "#FFFFFF",
                WebkitTextStroke: "2px #000",
                paintOrder: "stroke fill",
                textShadow: OUTLINE,
                transform: active ? "translateY(-2px)" : "none",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
