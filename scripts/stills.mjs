#!/usr/bin/env node
// Render cheap stills from the project's Remotion composition.
// Usage:
//   node scripts/stills.mjs <outPrefix> <frame,frame,...> [scale] [--comp=BridgeShort]
//     [--entry=src/index.ts] [--props='{"post":{"dpr":0.5}}'] [--quality=88]
//
// Examples:
//   node scripts/stills.mjs out/look/x_ 0,130,283,444 0.5
//   BRIDGE_ENTRY=src/sandboxes/world/index.tsx node scripts/stills.mjs out/world/x_ 130,987 0.5
//
// Set REMOTION_TMP to a folder on a large drive. Each bundle copies public/ into it.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

if (process.env.REMOTION_TMP) {
  fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true });
  process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP;
}

const { bundle } = await import("@remotion/bundler");
const { renderStill, selectComposition } = await import("@remotion/renderer");

const argv = process.argv.slice(2);
const positional = argv.filter((a) => !a.startsWith("--"));
const flag = (name, fallback = "") => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const [prefix, framesArg, scaleArg = "0.5"] = positional;
if (!prefix || !framesArg) {
  console.error("Usage: node scripts/stills.mjs <outPrefix> <frame,frame,...> [scale] [--comp=ID] [--entry=path]");
  process.exit(2);
}
const frames = framesArg.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
if (!frames.length) {
  console.error("No valid frames given.");
  process.exit(2);
}
const scale = Number(scaleArg);
const comp = flag("comp", process.env.REMOTION_COMP || "BridgeShort");
const entry = path.resolve(flag("entry", process.env.BRIDGE_ENTRY || "src/index.ts"));
const quality = Number(flag("quality", process.env.STILL_QUALITY || "88"));
const propsRaw = flag("props", process.env.REMOTION_PROPS || "");
const inputProps = propsRaw ? JSON.parse(propsRaw) : {};

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
const chromiumOptions = {
  // "angle" uses the real GPU on Windows; "swangle" is software. See render-parts.mjs.
  gl: flag("gl", process.env.REMOTION_GL || (process.platform === "win32" ? "angle" : "swangle")),
};

console.log(`entry   ${entry}`);
console.log(`comp    ${comp}`);
console.log(`frames  ${frames.join(", ")} @ scale ${scale}`);
console.log(`chrome  ${browserExecutable || "(Remotion headless shell)"}`);

const t0 = Date.now();
const serveUrl = await bundle({
  entryPoint: entry,
  publicDir: fs.existsSync(path.resolve("public")) ? path.resolve("public") : null,
});
console.log(`bundled in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

const composition = await selectComposition({
  serveUrl,
  id: comp,
  inputProps,
  browserExecutable,
  chromiumOptions,
  timeoutInMilliseconds: 240000,
});
console.log(`composition ${composition.width}x${composition.height} @ ${composition.fps} fps, ${composition.durationInFrames} frames`);

const onBrowserLog = (l) => {
  if (l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, String(l.text).slice(0, 300));
};

fs.mkdirSync(path.dirname(path.resolve(`${prefix}0.jpg`)), { recursive: true });
for (const f of frames) {
  const t = Date.now();
  await renderStill({
    composition,
    serveUrl,
    frame: f,
    output: `${prefix}${f}.jpg`,
    imageFormat: "jpeg",
    jpegQuality: quality,
    scale,
    inputProps,
    browserExecutable,
    chromiumOptions,
    timeoutInMilliseconds: 240000,
    onBrowserLog,
  });
  console.log(`still ${f} -> ${prefix}${f}.jpg (${((Date.now() - t) / 1000).toFixed(1)}s)`);
}
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
