// Frame-accurate render of an episode's clips: seeks the timeline per frame in headless Chrome,
// pipes JPEGs to ffmpeg, muxes the narration, and grabs a poster.
// Usage: node engine/tools/render.mjs <episode> [clip ...] [--workers 4] [--posters]
//   --posters regenerates only poster.jpg (no video render)
//   → episodes/<episode>/build/<clip>/clip.mp4 + poster.jpg
import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { launch, openClip, playerUrl, seek } from "./browser.mjs";
import { ROOT, serve } from "./serve.mjs";

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: { workers: { type: "string", default: "4" }, posters: { type: "boolean", default: false } },
});
const [ep, ...only] = positionals;
if (!ep) {
  console.error("usage: node engine/tools/render.mjs <episode> [clip ...] [--workers N]");
  process.exit(1);
}
const WORKERS = Number(opts.workers);

function run(cmd, args, { stdin = "ignore" } = {}) {
  const child = spawn(cmd, args, { stdio: [stdin, "ignore", "pipe"] });
  let stderr = "";
  child.stderr.on("data", (d) => (stderr = (stderr + d).slice(-4000)));
  const done = new Promise((ok, fail) =>
    child.on("close", (code) => (code === 0 ? ok() : fail(new Error(`${cmd} exited ${code}\n${stderr}`)))));
  return { child, done };
}

async function renderSegment(url, path, from, to, fps, onFrame) {
  const browser = await launch();
  const ff = run("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(fps), path], { stdin: "pipe" });
  try {
    const page = await openClip(browser, url);
    for (let f = from; f < to; f++) {
      await seek(page, f / fps);
      const jpg = await page.screenshot({ type: "jpeg", quality: 94, optimizeForSpeed: true });
      if (!ff.child.stdin.write(jpg)) await new Promise((ok) => ff.child.stdin.once("drain", ok));
      onFrame();
    }
  } finally {
    ff.child.stdin.end();
    await browser.close();
  }
  await ff.done;
}

// poster: the end of the second scene (first explanation fully on screen), without captions
async function renderPoster(url, dir, timing) {
  const at = timing.lines.length > 2 ? timing.lines[2].start - 0.8 : timing.duration / 2;
  const browser = await launch();
  try {
    const page = await openClip(browser, url);
    await page.addStyleTag({ content: "#captions { display: none !important; }" });
    await seek(page, at);
    await page.screenshot({ path: `${dir}/poster-full.png` });
  } finally {
    await browser.close();
  }
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", `${dir}/poster-full.png`, "-vf", "scale=1280:-1", "-q:v", "3", `${dir}/poster.jpg`]).done;
  await rm(`${dir}/poster-full.png`);
}

async function renderClip(port, clip) {
  const dir = `${ROOT}/episodes/${ep}/build/${clip.id}`;
  const timing = JSON.parse(await readFile(`${dir}/timing.json`, "utf8"));
  const url = playerUrl(port, ep, clip.id);
  if (opts.posters) {
    await renderPoster(url, dir, timing);
    console.log(`wrote ${dir}/poster.jpg`);
    return;
  }
  const total = Math.ceil(timing.duration * timing.fps);
  const per = Math.ceil(total / WORKERS);
  const segDir = `${dir}/segments`;
  await rm(segDir, { recursive: true, force: true });
  await mkdir(segDir, { recursive: true });

  let rendered = 0;
  const started = Date.now();
  const tick = () => {
    if (++rendered % 300 === 0 || rendered === total) {
      const rate = rendered / ((Date.now() - started) / 1000);
      console.log(`  clip ${clip.id}: ${rendered}/${total} frames · ${rate.toFixed(1)} fps`);
    }
  };
  const segments = Array.from({ length: WORKERS }, (_, i) => `${segDir}/seg-${i}.mp4`);
  await Promise.all(segments.map((path, i) =>
    renderSegment(url, path, i * per, Math.min(total, (i + 1) * per), timing.fps, tick)));

  await writeFile(`${segDir}/list.txt`, segments.map((s) => `file '${s}'`).join("\n"));
  const out = `${dir}/clip.mp4`;
  await run("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", `${segDir}/list.txt`,
    "-i", `${dir}/narration.wav`, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k",
    "-movflags", "+faststart", out]).done;
  await rm(segDir, { recursive: true, force: true });

  await renderPoster(url, dir, timing);
  console.log(`wrote ${out} (${timing.duration.toFixed(2)}s)`);
}

const episode = JSON.parse(await readFile(`${ROOT}/episodes/${ep}/episode.json`, "utf8"));
const clips = episode.clips.filter((c) => !only.length || only.includes(c.id));
if (only.length && clips.length !== only.length) throw new Error(`unknown clip id in: ${only.join(", ")}`);
const server = await serve();
try {
  for (const clip of clips) await renderClip(server.address().port, clip);
} finally {
  server.close();
}
