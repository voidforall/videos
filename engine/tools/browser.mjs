// Shared headless-Chrome helpers for snap and render.
import puppeteer from "puppeteer";

const READY_TIMEOUT_MS = 30000;

export const playerUrl = (port, ep, clip) => `http://127.0.0.1:${port}/engine/player.html?ep=${ep}&clip=${clip}&render`;

// chrome-headless-shell: built for capture, independent of the OS display compositor
export async function launch() {
  return puppeteer.launch({ headless: "shell", defaultViewport: { width: 1920, height: 1080 }, protocolTimeout: 60000 });
}

// Opens the player, waits until the timeline is built, and fails on any page error.
export async function openClip(browser, url) {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) => errors.push(`request failed: ${r.url()}`));
  await page.goto(url, { waitUntil: "load", timeout: READY_TIMEOUT_MS });
  try {
    await Promise.race([
      page.evaluate(() => window.__ready),
      new Promise((_, fail) => setTimeout(() => fail(new Error(`player not ready after ${READY_TIMEOUT_MS / 1000}s`)), READY_TIMEOUT_MS)),
    ]);
  } catch (e) {
    errors.push(e.message);
  }
  if (errors.length) throw new Error(`player errors (${url}):\n${errors.join("\n")}`);
  return page;
}

export async function seek(page, t) {
  await page.evaluate((s) => window.__seek(s), t);
}
