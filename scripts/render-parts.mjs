#!/usr/bin/env node
// Render a long short in parts, then concat, upscale to 1440x2560 and mux the mix.
//
// Usage:
//   node scripts/render-parts.mjs [--comp=BridgeShortCaptioned] [--parts=5]
//     [--out=out/parts] [--crf=16] [--entry=src/index.ts]
//     [--scale=0.5] [--concurrency=1] [--timeout=300000]
//     [--only=N]
//     [--mux=audio/mix.wav] [--final=out/final.mp4]
//
// --only=N renders just that one part and exits. Use it for one job per part in CI
// (GitHub Actions matrix), then concat the downloaded parts with ffmpeg.
//
// Parts that already exist are skipped, so a failed run can resume.
// Without --mux/--final it only renders parts and writes out/parts/list.txt.
// Set REMOTION_TMP to a folder on a large drive.
//
// Why concurrency 1 by default: each extra tab re-renders the whole three.js scene on a
// CPU/software GL machine. On a 2-core / 4 GB laptop 4 tabs made every frame ~5x slower and
// tripped Remotion's 30 s delayRender timeout. One tab at a time is faster and stable.
// Raise it only if the machine has a real GPU and >= 8 GB RAM.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

if (process.env.REMOTION_TMP) {
  fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true });
  process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP;
}

const { bundle } = await import("@remotion/bundler");
const { renderMedia, selectComposition } = await import("@remotion/renderer");

const argv = process.argv.slice(2);
const flag = (name, fallback = "") => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const comp = flag("comp", process.env.REMOTION_COMP || "BridgeShortCaptioned");
const entry = path.resolve(flag("entry", "src/index.ts"));
const parts = Math.max(1, Number(flag("parts", "5")));
const outDir = path.resolve(flag("out", "out/parts"));
const crf = Number(flag("crf", "16"));
const mux = flag("mux", "");
const finalFlag = flag("final", mux ? "out/final.mp4" : "");
const finalPath = finalFlag ? path.resolve(finalFlag) : "";
const scale = Number(flag("scale", "1"));
const concurrency = Number(flag("concurrency", process.env.REMOTION_CONCURRENCY || "1"));
const timeout = Number(flag("timeout", "300000"));
// GL backend: on Windows "angle" runs the scene on the real GPU (measured 3.4x faster than
// the software "swangle" default on an Intel HD laptop). Override with --gl=... if it fails.
const gl = flag("gl", process.env.REMOTION_GL || (process.platform === "win32" ? "angle" : "swangle"));

const chromeCandidates =
  process.platform === "win32"
    ? [
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
        "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
        path.join(os.homedir(), "AppData/Local/Google/Chrome/Application/chrome.exe"),
      ]
    : process.platform === "darwin"
      ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
      : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];
const browserExecutable = process.env.CHROME_PATH || process.env.REMOTION_BROWSER || chromeCandidates.find((p) => fs.existsSync(p));
const chromiumOptions = { gl };

fs.mkdirSync(outDir, { recursive: true });
console.log(`entry  ${entry}`);
console.log(`comp   ${comp}`);
console.log(`parts  ${parts}`);
console.log(`scale  ${scale}, concurrency ${concurrency}, gl ${gl}, frame timeout ${timeout / 1000}s`);
console.log(`chrome ${browserExecutable || "(Remotion headless shell)"}`);

const t0 = Date.now();
const serveUrl = await bundle({
  entryPoint: entry,
  publicDir: fs.existsSync(path.resolve("public")) ? path.resolve("public") : null,
});
console.log(`bundled in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

const composition = await selectComposition({ serveUrl, id: comp, browserExecutable, chromiumOptions, timeoutInMilliseconds: timeout });
const total = composition.durationInFrames;
console.log(`composition ${composition.width}x${composition.height}, ${total} frames`);

const files = [];
const partTimes = [];
const only = flag("only", "");
const indices = only === "" ? [...Array(parts).keys()] : [Number(only)].filter((n) => Number.isInteger(n) && n >= 0 && n < parts);
if (!indices.length) {
  console.error(`--only must be an integer between 0 and ${parts - 1}`);
  process.exit(2);
}
for (const i of indices) {
  const start = Math.floor((i * total) / parts);
  const end = Math.floor(((i + 1) * total) / parts) - 1;
  const file = path.join(outDir, `part_${String(i).padStart(2, "0")}.mp4`);
  files.push(file);
  if (fs.existsSync(file) && fs.statSync(file).size > 1000) {
    console.log(`part ${i} exists, skipping (${start}-${end})`);
    continue;
  }
  const eta = partTimes.length
    ? ` | est. ${Math.round((partTimes.reduce((a, b) => a + b, 0) / partTimes.length) * (parts - i) / 60)} min left`
    : "";
  console.log(`part ${i}: frames ${start}-${end}${eta}`);
  const t = Date.now();
  let lastLogged = 0;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf,
    scale,
    concurrency,
    frameRange: [start, end],
    outputLocation: file,
    browserExecutable,
    chromiumOptions,
    timeoutInMilliseconds: timeout,
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100);
      if (pct >= lastLogged + 10) {
        lastLogged = pct - (pct % 10);
        process.stdout.write(`\r  ${lastLogged}%  ${Math.round((Date.now() - t) / 1000)}s   `);
      }
    },
  });
  process.stdout.write("\r");
  partTimes.push((Date.now() - t) / 1000);
  const perFrame = partTimes[partTimes.length - 1] / Math.max(1, end - start + 1);
  console.log(`  done in ${partTimes[partTimes.length - 1].toFixed(1)}s (${perFrame.toFixed(1)}s/frame) -> ${file}`);
}

if (only !== "") {
  console.log(`\n--only=${only} given: finished that part, no concat/mux.`);
  process.exit(0);
}

const list = path.join(outDir, "list.txt");
fs.writeFileSync(
  list,
  files.map((f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n") + "\n",
  "utf8",
);
console.log(`list  ${list}`);

if (!finalPath) {
  console.log("\nNo --final/--mux given. To finish manually:");
  console.log(`  ffmpeg -y -f concat -safe 0 -i "${list}" -i audio/mix.wav -map 0:v:0 -map 1:a:0 -vf scale=1440:2560:flags=lanczos -c:v libx264 -crf 16 -preset veryfast -c:a aac -b:a 256k -shortest out/final.mp4`);
  process.exit(0);
}

const ff = ["-y", "-f", "concat", "-safe", "0", "-i", list];
if (mux) ff.push("-i", path.resolve(mux));
ff.push("-map", "0:v:0");
if (mux) ff.push("-map", "1:a:0");
ff.push("-vf", "scale=1440:2560:flags=lanczos", "-c:v", "libx264", "-crf", String(crf), "-preset", "veryfast");
if (mux) ff.push("-c:a", "aac", "-b:a", "256k", "-shortest");
ff.push(finalPath);

const hasFfmpeg = () => {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
if (!hasFfmpeg()) {
  console.error("\nffmpeg tidak ada di PATH. Part sudah selesai; jalankan langkah ini di mesin yang ada ffmpeg:");
  console.error(`  ffmpeg ${ff.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ")}`);
  process.exit(2);
}

console.log(`\nfinishing -> ${finalPath}`);
execFileSync("ffmpeg", ff, { stdio: "inherit" });
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
