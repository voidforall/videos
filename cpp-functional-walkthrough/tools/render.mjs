// Frame-accurate render: seeks the GSAP master timeline per frame in headless Chrome,
// pipes screenshots to ffmpeg, then muxes build/narration.wav.
// Usage: node tools/render.mjs [--workers 4] [--out renders/cpp-functional-walkthrough.mp4]
import { spawn } from "node:child_process";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { parseArgs } from "node:util";
import puppeteer from "puppeteer";
import { ROOT, serve } from "./serve.mjs";

const { values: opts } = parseArgs({
  options: {
    workers: { type: "string", default: "4" },
    out: { type: "string", default: "renders/cpp-functional-walkthrough.mp4" },
  },
});
const WORKERS = Number(opts.workers);
const OUT = `${ROOT}/${opts.out}`;
const SEG_DIR = `${ROOT}/build/segments`;

function run(cmd, args, { stdin = "ignore" } = {}) {
  const child = spawn(cmd, args, { stdio: [stdin, "ignore", "pipe"] });
  let stderr = "";
  child.stderr.on("data", (d) => (stderr = (stderr + d).slice(-4000)));
  const done = new Promise((ok, fail) =>
    child.on("close", (code) => (code === 0 ? ok() : fail(new Error(`${cmd} exited ${code}\n${stderr}`)))),
  );
  return { child, done };
}

async function openPage(browser, url) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => window.__ready);
  if (errors.length) throw new Error(`page errors:\n${errors.join("\n")}`);
  return page;
}

async function renderSegment(url, index, from, to, fps, onFrame) {
  const browser = await puppeteer.launch({ defaultViewport: { width: 1920, height: 1080 } });
  const path = `${SEG_DIR}/seg-${String(index).padStart(2, "0")}.mp4`;
  const ff = run("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
    "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(fps), path], { stdin: "pipe" });
  try {
    const page = await openPage(browser, url);
    for (let f = from; f < to; f++) {
      await page.evaluate((t) => window.__seek(t), f / fps);
      const jpg = await page.screenshot({ type: "jpeg", quality: 94, optimizeForSpeed: true });
      if (!ff.child.stdin.write(jpg)) await new Promise((ok) => ff.child.stdin.once("drain", ok));
      onFrame();
    }
  } finally {
    ff.child.stdin.end();
    await browser.close();
  }
  await ff.done;
  return path;
}

async function main() {
  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/?render`;
  try {
    const probe = await puppeteer.launch();
    const page = await openPage(probe, url);
    const { duration, fps } = await page.evaluate(() => ({ duration: window.__duration, fps: window.TIMING.fps }));
    await probe.close();

    const total = Math.ceil(duration * fps);
    const per = Math.ceil(total / WORKERS);
    await rm(SEG_DIR, { recursive: true, force: true });
    await mkdir(SEG_DIR, { recursive: true });
    let rendered = 0;
    const started = Date.now();
    const tick = () => {
      rendered++;
      if (rendered % 150 === 0 || rendered === total) {
        const rate = rendered / ((Date.now() - started) / 1000);
        process.stdout.write(`frames ${rendered}/${total} · ${rate.toFixed(1)} fps · eta ${Math.round((total - rendered) / rate)}s\n`);
      }
    };
    const segments = await Promise.all(Array.from({ length: WORKERS }, (_, i) =>
      renderSegment(url, i, i * per, Math.min(total, (i + 1) * per), fps, tick)));

    const list = `${SEG_DIR}/list.txt`;
    await writeFile(list, segments.map((s) => `file '${s}'`).join("\n"));
    await mkdir(OUT.slice(0, OUT.lastIndexOf("/")), { recursive: true });
    await run("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-i", `${ROOT}/build/narration.wav`,
      "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", OUT]).done;
    console.log(`wrote ${OUT} (${duration.toFixed(2)}s, ${total} frames)`);
  } finally {
    server.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
