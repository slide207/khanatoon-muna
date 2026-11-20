// Timeline of "Tangan di Antara Ayam" (Liang Metanduno, Pulau Muna)
// 9 shots timed to voice/words.json (audio duration: 35.28s, 1059 frames @ 30 fps).
export const FPS = 30;
export const TOTAL = 1059;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

export const D0 = 6.0;
export const HALF = 27;
export const FILES = [-1.65, -0.55, 0.55, 1.65];
export const ROW_GAP = 1.3;
export const COUNT = 74;
export const PARK: V3 = [70, D0, -75];
export const ANCHOR: V3 = [-2.7, D0 + 0.62, -37];
export const SNAP = 34.62, DROP0 = 36.35, DROP1 = 36.95, DROP_H = 6.6;

export const front = (tau: number) => 26 - 1.6 * (tau - 4.4);
export const marchPhase = (tau: number) => ((tau % 1) + 1) % 1;
export const stomp = (tau: number) => 1.0;
export const shapeZ = (z: number) => 0;
export const dropW = (z: number) => 0;
export const dropU = (tau: number) => 0;
export type BridgeState = { bounce: number; drop: number; snap: number; collapsed: boolean };
export const deckY = (z: number, b: BridgeState) => D0;
export const snapEnd = (snap: number): V3 => [ANCHOR[0], ANCHOR[1], ANCHOR[2]];
export const bridgeState = (id: number, t: number): BridgeState => ({ bounce: 0, drop: 0, snap: 0, collapsed: false });

export type Light = "day" | "golden";
export type Crowd = "march" | "fall" | "water" | "bank" | "tourists" | "none";
export type ShotDef = { id: number; a: number; b: number; light: Light; crowd: Crowd; tau: (t: number) => number; towns?: boolean };

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 75, light: "day", crowd: "none", tau: (t) => t, towns: false },       // Drone over water to karst cliff/cave
  { id: 2, a: 75, b: 210, light: "golden", crowd: "none", tau: (t) => t, towns: false },   // Inside cave: Max shining light on rooster & horse
  { id: 3, a: 210, b: 348, light: "golden", crowd: "none", tau: (t) => t, towns: false },  // Tracking wall: focus moves to faint red patch
  { id: 4, a: 348, b: 426, light: "golden", crowd: "none", tau: (t) => t, towns: false },  // Push in: hand stencil outline glows at "tangan"
  { id: 5, a: 426, b: 588, light: "golden", crowd: "none", tau: (t) => t, towns: false },  // Flashback in firelight: hand pressed, pigment mist sprayed
  { id: 6, a: 588, b: 702, light: "day", crowd: "none", tau: (t) => t, towns: false },     // Calcite crust time-lapse, scientist Max scrapes sample
  { id: 7, a: 702, b: 888, light: "day", crowd: "none", tau: (t) => t, towns: false },     // Cross-section diagram: laser dating 67.800 years
  { id: 8, a: 888, b: 966, light: "golden", crowd: "none", tau: (t) => t, towns: false },  // Dramatic orbit of the oldest cave art
  { id: 9, a: 966, b: TOTAL, light: "golden", crowd: "none", tau: (t) => t, towns: false },// Max flashes camera at rooster, ignoring stencil
];

export const XFADE: Record<number, number> = { 2: 6, 5: 6, 6: 6, 7: 6, 8: 6, 9: 6 };
export const FLASH_AT = 1000; // Camera flash in shot 9

export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];

export const layersAt = (f: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && f >= s.a - x / 2 && f < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (f - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(f).id, alpha: 1 }];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };

export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3,
  look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k,
  roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });

const run = (keys: Key[], f: number) => {
  let cur = full(keys[0].s(f));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (f < k.f) break;
    cur = k.cut ? full(k.s(f)) : mix(cur, full(k.s(f)), glide((f - k.f) / (k.dur ?? 24)));
  }
  return cur;
};

const pushK = (f: number, f0: number, rate: number) => Math.exp(-rate * Math.max(0, f - f0));
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });

// Shot 1: Drone approach over water towards karst cliff & dark cave mouth
const S1 = (f: number) => dolly([0, 15, -45], [0, 8, 10], pushK(f, 0, 0.003), { fov: 44 });

// Shot 2: Cave interior: Max looking at rooster & horse paintings
const S2 = (f: number) => dolly([1.8, 2.2, -6.5], [0.5, 2.0, 0], pushK(f, 75, 0.002), { fov: 38 });

// Shot 3: Tracking across wall to faint red smudge
const S3 = (f: number) => {
  const u = glide((f - 210) / 120);
  return dolly([0.8 - 1.2 * u, 2.0, -4.5], [-0.5 * u, 2.0, 0], pushK(f, 210, 0.002), { fov: 36 });
};

// Shot 4: Pushing in on red patch, hand stencil outline lights up
const S4 = (f: number) => dolly([0, 2.0, -3.2], [0, 2.0, 0], pushK(f, 348, 0.004), { fov: 32 });

// Shot 5: Flashback in firelight: hand pressed, pigment mist sprayed
const S5 = (f: number) => dolly([-0.4, 1.9, -2.8], [0, 2.0, 0], pushK(f, 426, 0.002), { fov: 34, roll: 0.02 });

// Shot 6: Calcite crystal time-lapse, scientist Max scrapes sample
const S6 = (f: number) => dolly([0.8, 2.1, -3.0], [0, 2.0, 0], pushK(f, 588, 0.0025), { fov: 35 });

// Shot 7: Cross-section diagram: rock layer, pigment, calcite, laser beam
const S7 = (f: number) => dolly([0, 2.0, -4.0], [0, 2.0, 0], pushK(f, 702, 0.0015), { fov: 38 });

// Shot 8: Dramatic orbit of the oldest cave art
const S8 = (f: number) => {
  const ang = 0.3 * Math.sin((f - 888) * 0.04);
  return { pos: [3.2 * Math.sin(ang), 2.0, -3.2 * Math.cos(ang)] as V3, look: [0, 2.0, 0] as V3, fov: 34, roll: 0 };
};

// Shot 9: Max flashes camera at rooster, ignoring stencil
const S9 = (f: number) => dolly([1.6, 2.1, -5.2], [0.8, 2.0, 0], pushK(f, 966, 0.002), { fov: 38 });

const CAMS: Record<number, Key[]> = {
  1: [{ f: 0, s: S1 }],
  2: [{ f: 75, s: S2 }],
  3: [{ f: 210, s: S3 }],
  4: [{ f: 348, s: S4 }],
  5: [{ f: 426, s: S5 }],
  6: [{ f: 588, s: S6 }],
  7: [{ f: 702, s: S7 }],
  8: [{ f: 888, s: S8 }],
  9: [{ f: 966, s: S9 }],
};

export const camAt = (id: number, f: number): Cam => run(CAMS[id] ?? CAMS[1], f);

export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 75, cInf: 10, focus: () => [0.5, 2.0, 0] },
  { f: 210, cInf: 12, focus: () => [0, 2.0, 0] },
  { f: 348, cInf: 14, focus: () => [0, 2.0, 0] },
  { f: 426, cInf: 10, focus: () => [0, 2.0, 0] },
  { f: 588, cInf: 12, focus: () => [0, 2.0, 0] },
  { f: 702, cInf: 0 },
  { f: 888, cInf: 14, focus: () => [0, 2.0, 0] },
  { f: 966, cInf: 8, focus: () => [0.8, 2.0, 0] },
];

export const dofAt = (f: number) => {
  let i = 0; while (i + 1 < DOF.length && f >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (f - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};

export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [];
