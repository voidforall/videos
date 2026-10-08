// Shared headless-Chrome helpers for snap and render.
import puppeteer from "puppeteer";

export const playerUrl = (port, ep, clip) => `http://127.0.0.1:${port}/engine/player.html?ep=${ep}&clip=${clip}&render`;

export async function launch() {
  return puppeteer.launch({ defaultViewport: { width: 1920, height: 1080 } });
}

// Opens the player, waits until the timeline is built, and fails on any page error.
export async function openClip(browser, url) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()}`));
  await page.goto(url, { waitUntil: "load" });
  try {
    await page.evaluate(() => window.__ready);
  } catch (e) {
    errors.push(e.message);
  }
  if (errors.length) throw new Error(`player errors (${url}):\n${errors.join("\n")}`);
  return page;
}

export async function seek(page, t) {
  await page.evaluate((s) => window.__seek(s), t);
}
