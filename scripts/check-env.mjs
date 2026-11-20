#!/usr/bin/env node
// Dependency check for the cartoon-3d-short skill.
// Usage: node scripts/check-env.mjs [projectDir]
// Prints PASS / WARN / FAIL for everything the pipeline needs. Exit code is 1 only if
// Node itself is too old; everything else is advisory so the agent can keep planning.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const project = path.resolve(process.argv[2] || process.cwd());
const results = [];

const add = (level, name, detail, fix) => results.push({ level, name, detail, fix });

function run(cmd, args, opts = {}) {
  try {
    // Node cannot spawn .cmd/.bat directly on Windows without a shell.
    const isCmd = process.platform === "win32" && /\.(cmd|bat)$/i.test(cmd);
    const file = isCmd ? process.env.ComSpec || "cmd.exe" : cmd;
    const argv = isCmd ? ["/d", "/s", "/c", cmd, ...args] : args;
    const out = execFileSync(file, argv, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30000,
      windowsHide: true,
      ...opts,
    });
    return { ok: true, out: (out || "").trim() };
  } catch (e) {
    return {
      ok: false,
      out: ((e.stdout || "") + (e.stderr || "")).trim(),
      code: e.status,
    };
  }
}

// ---------- Node ----------
const nodeMajor = Number(process.versions.node.split(".")[0]);
add(
  nodeMajor >= 20 ? "PASS" : "FAIL",
  "Node.js",
  process.version,
  "Install Node.js 20 or newer from https://nodejs.org",
);

// ---------- npm ----------
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const npm = run(npmCmd, ["--version"]);
add(
  npm.ok ? "PASS" : "FAIL",
  "npm",
  npm.ok ? npm.out.split("\n")[0] : "not runnable",
  process.platform === "win32"
    ? "If PowerShell blocks npm.ps1, call npm.cmd / npx.cmd instead."
    : "Install npm with Node.js.",
);

// ---------- Chrome / Chromium ----------
const chromeCandidates =
  process.platform === "win32"
    ? [
        "C:/Program Files/Google/Chrome/Application/chrome.exe",
        "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
        path.join(os.homedir(), "AppData/Local/Google/Chrome/Application/chrome.exe"),
        "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
      ]
    : process.platform === "darwin"
      ? [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ]
      : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];

const chrome = process.env.CHROME_PATH || process.env.REMOTION_BROWSER || chromeCandidates.find((p) => fs.existsSync(p));
add(
  chrome ? "PASS" : "WARN",
  "Chrome / Chromium",
  chrome || "not found (Remotion will download its own headless shell on first use)",
  "Install Chrome, or set CHROME_PATH. GPU stills are much faster with Chrome + ANGLE.",
);

// ---------- Python ----------
function pythonProbe() {
  const names = process.platform === "win32" ? ["python", "python3", "py"] : ["python3", "python"];
  for (const name of names) {
    const args = name === "py" ? ["-3", "--version"] : ["--version"];
    const r = run(name, args);
    if (r.ok && /^Python 3\./i.test(r.out)) return { name, version: r.out.split("\n")[0] };
  }
  return null;
}
const py = pythonProbe();
add(
  py ? "PASS" : "FAIL",
  "Python",
  py ? `${py.version} (${py.name})` : "not runnable (the Windows Store alias is not a real install)",
  "winget install Python.Python.3.12",
);

if (py) {
  const probe = run(py.name, [
    ...(py.name === "py" ? ["-3"] : []),
    "-c",
    "import numpy, scipy, PIL; print(numpy.__version__, scipy.__version__, PIL.__version__)",
  ]);
  add(
    probe.ok ? "PASS" : "FAIL",
    "Python packages",
    probe.ok ? `numpy ${probe.out.split(" ")[0]}, scipy ${probe.out.split(" ")[1]}, pillow ${probe.out.split(" ")[2]}` : "numpy / scipy / pillow missing",
    `${py.name} ${py.name === "py" ? "-3 " : ""}-m pip install numpy scipy pillow`,
  );
}

// ---------- ffmpeg ----------
const ff = run("ffmpeg", ["-version"]);
add(
  ff.ok ? "PASS" : "FAIL",
  "ffmpeg",
  ff.ok ? ff.out.split("\n")[0] : "not on PATH",
  "winget install Gyan.FFmpeg (then reopen the terminal)",
);

// ---------- machine (render speed) ----------
const cores = os.cpus().length;
const ramGB = os.totalmem() / 1024 ** 3;
const slow = ramGB < 6 || cores <= 2;
add(
  slow ? "WARN" : "PASS",
  "Render machine",
  `${cores} threads, ${ramGB.toFixed(1)} GB RAM` +
    (slow ? " -> expect 6-9 s/frame, one 60 s short takes ~4 h" : ""),
  "On a low-RAM laptop close Chrome and other apps, render with --concurrency=1, and let a full short run overnight. A GPU machine renders the same project ~10-50x faster.",
);

// ---------- disk ----------
try {
  const st = fs.statfsSync(project);
  const gb = (st.bavail * st.bsize) / 1024 ** 3;
  add(
    gb >= 60 ? "PASS" : gb >= 25 ? "WARN" : "FAIL",
    "Free disk",
    `${gb.toFixed(1)} GB free at ${project}`,
    "Set REMOTION_TMP to a drive with 60+ GB and clean old remotion-webpack-bundle-* folders.",
  );
} catch {
  add("WARN", "Free disk", "could not read", "Check free space on the working drive.");
}

// ---------- report ----------
const icon = { PASS: "PASS", WARN: "WARN", FAIL: "FAIL" };
const pad = (s, n) => String(s).padEnd(n);
console.log(`cartoon-3d-short environment check (${process.platform})\n`);
for (const r of results) {
  console.log(`${icon[r.level]}  ${pad(r.name, 18)} ${r.detail}`);
  if (r.level !== "PASS" && r.fix) console.log(`      -> ${r.fix}`);
}
const fails = results.filter((r) => r.level === "FAIL").length;
const warns = results.filter((r) => r.level === "WARN").length;
console.log(`\n${results.length - fails - warns} pass, ${warns} warn, ${fails} fail`);
if (fails) console.log("Fix the FAIL lines before the sound or QA steps. Stills can still be rendered if Chrome works.");
process.exit(nodeMajor >= 20 ? 0 : 1);
