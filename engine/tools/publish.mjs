// Publish an episode's rendered clips to a GitHub Release and record them in docs/catalog.json.
// MP4s and posters live only on the release (tag ep-<slug>); git keeps the source and the catalog.
// Usage: node engine/tools/publish.mjs <episode>
import { execFile } from "node:child_process";
import { copyFile, mkdir, readFile, rm, writeFile, access } from "node:fs/promises";
import { promisify } from "node:util";
import { ROOT } from "./serve.mjs";

const exec = promisify(execFile);
const gh = async (...args) => (await exec("gh", args, { maxBuffer: 1 << 24 })).stdout.trim();

const slug = process.argv[2];
if (!slug) {
  console.error("usage: node engine/tools/publish.mjs <episode>");
  process.exit(1);
}
const epDir = `${ROOT}/episodes/${slug}`;
const episode = JSON.parse(await readFile(`${epDir}/episode.json`, "utf8"));
const tag = `ep-${slug}`;
const repo = await gh("repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner");
const assetUrl = (name) => `https://github.com/${repo}/releases/download/${tag}/${name}`;

// stage uniquely named copies (release assets are flat, named by file basename)
const stage = `${epDir}/build/publish`;
await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
const clips = [];
for (const clip of episode.clips) {
  const dir = `${epDir}/build/${clip.id}`;
  for (const f of ["clip.mp4", "poster.jpg", "timing.json"]) {
    await access(`${dir}/${f}`).catch(() => {
      throw new Error(`${dir}/${f} missing — run build and render first`);
    });
  }
  const video = `${slug}-${clip.id}.mp4`;
  const poster = `${slug}-${clip.id}.jpg`;
  await copyFile(`${dir}/clip.mp4`, `${stage}/${video}`);
  await copyFile(`${dir}/poster.jpg`, `${stage}/${poster}`);
  const { duration } = JSON.parse(await readFile(`${dir}/timing.json`, "utf8"));
  clips.push({ id: clip.id, title: clip.title, question: clip.question, duration: Math.floor(duration), video: assetUrl(video), poster: assetUrl(poster) });
}

const exists = await gh("release", "view", tag, "--json", "tagName", "-q", ".tagName").catch(() => "");
if (!exists) {
  await gh("release", "create", tag, "--target", "main", "--title", `Episode · ${episode.title}`,
    "--notes", `${episode.summary}\n\nSource notes: ${episode.source}`);
  console.log(`created release ${tag}`);
}
const files = clips.flatMap((c) => [`${stage}/${slug}-${c.id}.mp4`, `${stage}/${slug}-${c.id}.jpg`]);
await gh("release", "upload", tag, ...files, "--clobber");
console.log(`uploaded ${files.length} assets to ${tag}`);

const catalogPath = `${ROOT}/docs/catalog.json`;
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const entry = { slug, title: episode.title, kicker: episode.kicker, summary: episode.summary, source: episode.source, clips };
const index = catalog.episodes.findIndex((e) => e.slug === slug);
const episodes = index >= 0 ? catalog.episodes.map((e, i) => (i === index ? entry : e)) : [entry, ...catalog.episodes];
await writeFile(catalogPath, `${JSON.stringify({ ...catalog, episodes }, null, 2)}\n`);
await rm(stage, { recursive: true, force: true });
console.log(`updated docs/catalog.json (${clips.length} clips)`);
