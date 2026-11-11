import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = __dirname;
const base = 'http://127.0.0.1:8765/playground/index.html';

const widths = [360, 375, 390, 768, 1280, 1920];

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];

for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: w < 640 ? 844 : 900 } });
  page.on('pageerror', (e) => errors.push(`${w}: ${e.message}`));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`${w}: ${msg.text()}`); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(w < 900 ? 900 : 1200);
  await page.screenshot({ path: path.join(out, `viewport-${w}.png`), fullPage: true });
  await page.close();
}

const hoverPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await hoverPage.goto(base, { waitUntil: 'networkidle' });
await hoverPage.waitForTimeout(800);
const card3 = hoverPage.locator('.card-life');
await card3.hover();
await hoverPage.waitForTimeout(400);
await hoverPage.screenshot({ path: path.join(out, 'hover-card3-g1.png'), fullPage: false });
await card3.dispatchEvent('mouseout');
await hoverPage.waitForTimeout(200);
await hoverPage.screenshot({ path: path.join(out, 'hover-card3-g0.png'), fullPage: false });
await hoverPage.close();

const rm = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await rm.emulateMedia({ reducedMotion: 'reduce' });
await rm.goto(base, { waitUntil: 'networkidle' });
await rm.waitForTimeout(300);
await rm.screenshot({ path: path.join(out, 'reduced-motion-1280.png'), fullPage: true });
await rm.close();

await browser.close();
console.log(JSON.stringify({ errors: [...new Set(errors)] }, null, 2));
