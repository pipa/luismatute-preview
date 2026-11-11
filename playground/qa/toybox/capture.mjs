import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = __dirname;
const base = 'http://127.0.0.1:8765/playground/index.html';
const widths = [360, 375, 390, 768, 1280, 1920];

async function assertViewport(page, vw) {
  return page.evaluate((viewportWidth) => {
    function intersect(a, b) {
      return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
    }
    const fail = [];
    const innerW = window.innerWidth;
    const innerH = window.innerHeight;
    const docW = document.documentElement.scrollWidth;
    if (docW > innerW) {
      fail.push({ kind: 'page-overflow', scrollWidth: docW, innerWidth: innerW });
    }

    const visibleBadges = [...document.querySelectorAll('.badge-star')].filter((el) => {
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.99;
    });
    if (visibleBadges.length !== 1) {
      fail.push({ kind: 'badge-visibility-count', count: visibleBadges.length });
    }
    const badge = visibleBadges[0];
    if (badge) {
      const b = badge.getBoundingClientRect();
      if (b.width < 1 || b.height < 1) {
        fail.push({ kind: 'badge-zero-rect', width: b.width, height: b.height });
      }
      if (b.left < -1 || b.right > innerW + 1 || b.top < -1 || b.bottom > innerH + 1) {
        fail.push({
          kind: 'badge-outside-viewport',
          rect: { left: b.left, right: b.right, top: b.top, bottom: b.bottom },
          viewport: { innerW, innerH },
        });
      }
      const ribbon = document.querySelector('.ribbon');
      if (ribbon && ribbon.firstChild) {
        const range = document.createRange();
        range.selectNodeContents(ribbon);
        const textR = range.getBoundingClientRect();
        if (intersect(b, textR)) {
          fail.push({ kind: 'badge-on-ribbon-text', decor: 'badge-star', zone: 'ribbon-text' });
        }
      }
    }

    const zones = [];
    document.querySelectorAll('.title span:not(.title-break)').forEach((el, i) => {
      zones.push({ name: `h1-letter-${i}`, r: el.getBoundingClientRect() });
    });
    const lede = document.querySelector('.lede');
    if (lede) zones.push({ name: 'lede', r: lede.getBoundingClientRect() });
    const topbar = document.querySelector('.topbar');
    if (topbar) zones.push({ name: 'topbar', r: topbar.getBoundingClientRect() });
    document.querySelectorAll('.toy-card').forEach((el, i) => {
      zones.push({ name: `card-${i + 1}`, r: el.getBoundingClientRect() });
    });

    const decor = [
      ...document.querySelectorAll('.stk'),
      ...visibleBadges,
    ];
    for (const el of decor) {
      const d = el.getBoundingClientRect();
      const label = el.classList.contains('badge-star')
        ? 'badge-star'
        : [...el.classList].find((c) => c.startsWith('stk-')) || 'sticker';
      for (const z of zones) {
        if (intersect(d, z.r)) {
          fail.push({ kind: 'overlap', decor: label, zone: z.name });
        }
      }
    }

    const toggle = document.querySelector('.marquee-toggle');
    const viewport = document.querySelector('.marquee-viewport');
    if (toggle && viewport) {
      const vr = viewport.getBoundingClientRect();
      const br = toggle.getBoundingClientRect();
      if (intersect(vr, br)) {
        fail.push({ kind: 'marquee-toggle-on-text', decor: 'marquee-toggle', zone: 'marquee-viewport' });
      }
    }

    const band = document.querySelector('.marquee-wrap');
    if (band) {
      const br = band.getBoundingClientRect();
      if (Math.abs(br.width - innerW) > 2) {
        fail.push({ kind: 'marquee-not-full-bleed', bandWidth: br.width, innerWidth: innerW });
      }
    }

    return fail;
  }, vw);
}

await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const consoleErrors = [];
const allFailures = [];

for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: w < 640 ? 844 : 900 } });
  page.on('pageerror', (e) => consoleErrors.push(`${w}: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`${w}: ${msg.text()}`);
  });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(w < 900 ? 1000 : 1200);
  const fails = await assertViewport(page, w);
  if (fails.length) allFailures.push({ width: w, fails });
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

if (consoleErrors.length) {
  console.error('Console errors:', [...new Set(consoleErrors)]);
}

if (allFailures.length) {
  console.error('ASSERTION FAILURES:\n' + JSON.stringify(allFailures, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ pass: true, widths, consoleErrors: [...new Set(consoleErrors)] }, null, 2));
