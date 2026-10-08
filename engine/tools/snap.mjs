// Still frames for review.
// Usage: node engine/tools/snap.mjs <episode> <clip> <seconds...>   (use "scenes" to grab each scene's end)
//   → episodes/<episode>/build/<clip>/snaps/t-<s>.png
import { mkdir, readFile } from "node:fs/promises";
import { launch, openClip, playerUrl, seek } from "./browser.mjs";
import { ROOT, serve } from "./serve.mjs";

const [ep, clip, ...rest] = process.argv.slice(2);
if (!ep || !clip || !rest.length) {
  console.error("usage: node engine/tools/snap.mjs <episode> <clip> <seconds...|scenes>");
  process.exit(1);
}
const dir = `${ROOT}/episodes/${ep}/build/${clip}`;

async function sceneEnds() {
  const { lines, duration } = JSON.parse(await readFile(`${dir}/timing.json`, "utf8"));
  return lines.map((l, i) => (i + 1 < lines.length ? lines[i + 1].start - 0.7 : duration - 0.1));
}

const times = rest[0] === "scenes" ? await sceneEnds() : rest.map(Number);
if (times.some(Number.isNaN)) throw new Error(`bad times: ${rest.join(" ")}`);

const server = await serve();
const browser = await launch();
try {
  const page = await openClip(browser, playerUrl(server.address().port, ep, clip));
  await mkdir(`${dir}/snaps`, { recursive: true });
  for (const t of times) {
    await seek(page, t);
    const path = `${dir}/snaps/t-${t.toFixed(2)}.png`;
    await page.screenshot({ path });
    console.log(path);
  }
} finally {
  await browser.close();
  server.close();
}
