// Capture still frames for review: node tools/snap.mjs <seconds...>  → build/snaps/t-<s>.png
import { mkdir } from "node:fs/promises";
import puppeteer from "puppeteer";
import { ROOT, serve } from "./serve.mjs";

const times = process.argv.slice(2).map(Number);
if (!times.length || times.some(Number.isNaN)) {
  console.error("usage: node tools/snap.mjs <seconds...>");
  process.exit(1);
}
const server = await serve();
const browser = await puppeteer.launch({ defaultViewport: { width: 1920, height: 1080 } });
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  page.on("console", (m) => !["log", "warn"].includes(m.type()) && !m.text().includes("404") && console.error(`console.${m.type()}:`, m.text()));
  await page.goto(`http://127.0.0.1:${server.address().port}/?render&draft`, { waitUntil: "load" });
  await page.evaluate(() => window.__ready);
  await mkdir(`${ROOT}/build/snaps`, { recursive: true });
  for (const t of times) {
    await page.evaluate((s) => window.__seek(s), t);
    const path = `${ROOT}/build/snaps/t-${t.toFixed(2)}.png`;
    await page.screenshot({ path });
    console.log(path);
  }
} finally {
  await browser.close();
  server.close();
}
