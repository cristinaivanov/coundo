// Usage: node tools/build-similar-flags.mjs <playwright module path> - ranks, for every flag, the flags that look most like it.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { ALL_CODES } from '../data/countries.js';

const { default: playwright } = await import(pathToFileURL(process.argv[2]));
const KEEP = 8;
const svgs = Object.fromEntries(ALL_CODES.map(code => [code, fs.readFileSync(new URL(`../flags/${code}.svg`, import.meta.url)).toString('base64')]));

const browser = await playwright.webkit.launch();
const page = await browser.newPage();
const ranked = await page.evaluate(async ({ flags, keep }) => {
  const [W, H] = [36, 24];
  const toLab = (r, g, b) => {
    const [lr, lg, lb] = [r, g, b].map(v => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
    const [x, y, z] = [(0.4124 * lr + 0.3576 * lg + 0.1805 * lb) / 0.9505, 0.2126 * lr + 0.7152 * lg + 0.0722 * lb, (0.0193 * lr + 0.1192 * lg + 0.9505 * lb) / 1.089]
      .map(t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116));
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  };
  const features = {};
  for (const [code, data] of Object.entries(flags)) {
    const img = new Image();
    img.src = `data:image/svg+xml;base64,${data}`;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    const { data: px } = ctx.getImageData(0, 0, W, H);
    const lab = Array.from({ length: W * H }, (_, i) => toLab(px[i * 4], px[i * 4 + 1], px[i * 4 + 2]));
    const histogram = {};
    for (const [l, a, b] of lab) {
      const chroma = Math.hypot(a, b);
      const key = chroma < 18 ? (l > 80 ? 'white' : l < 30 ? 'black' : 'gray') : `h${Math.round(((Math.atan2(b, a) * 180) / Math.PI + 360) / 36) % 10}${l > 55 ? '+' : '-'}`;
      histogram[key] = (histogram[key] ?? 0) + 1 / lab.length;
    }
    features[code] = { lab, histogram };
  }
  const gap = (p, q) => Math.min(60, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])) / 60;
  const distance = (a, b) => {
    const layout = a.lab.reduce((sum, p, i) => sum + gap(p, b.lab[i]), 0) / a.lab.length;
    const keys = new Set([...Object.keys(a.histogram), ...Object.keys(b.histogram)]);
    const colors = [...keys].reduce((sum, k) => sum + Math.abs((a.histogram[k] ?? 0) - (b.histogram[k] ?? 0)), 0) / 2;
    return layout * 0.65 + colors * 0.35;
  };
  return Object.fromEntries(Object.keys(features).map(code => [code, Object.keys(features)
    .filter(other => other !== code)
    .map(other => [other, distance(features[code], features[other])])
    .sort((x, y) => x[1] - y[1])
    .slice(0, keep)]));
}, { flags: svgs, keep: KEEP });
await browser.close();

const list = Object.fromEntries(Object.entries(ranked).map(([code, near]) => [code, near.map(([other]) => other)]));
fs.writeFileSync(new URL('../data/similar-flags.js', import.meta.url), `export const LOOKALIKES = ${JSON.stringify(list)};\n`);
const closest = Object.entries(ranked).map(([code, near]) => [code, near[0][0], Number(near[0][1].toFixed(3))]).sort((a, b) => a[2] - b[2]);
console.log('closest pairs', JSON.stringify(closest.slice(0, 24)));
console.log('least alike', JSON.stringify(closest.slice(-10)));
