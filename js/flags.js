import { FLAG_RATIOS } from '../data/flag-ratios.js';
import { h } from './util.js';

const MAX_GROUP_WAIT_MS = 6000;

// Holding on to the images keeps them decoded in memory until they are shown.
const kept = new Map();

const url = code => `./flags/${code}.svg`;

export function preloadFlags(codes) {
  for (const code of codes) {
    if (kept.has(code)) continue;
    const img = h('img', { src: url(code) });
    img.addEventListener('error', () => kept.delete(code));
    kept.set(code, img);
  }
}

const decoded = frame => frame.querySelector('img').decode().catch(() => {});

const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

async function revealAfter(frames, waiting) {
  frames.forEach(frame => frame.classList.add('loading'));
  await waiting;
  frames.forEach(frame => frame.classList.remove('loading'));
}

export const revealTogether = frames =>
  revealAfter(frames, Promise.race([Promise.all(frames.map(decoded)), timeout(MAX_GROUP_WAIT_MS)]));

export function flag(code, className = '', alt = '', { hold = false } = {}) {
  const img = h('img', { src: url(code), alt, draggable: 'false' });
  const frame = h('span', { class: `flag ${className}`, style: `--ratio: ${FLAG_RATIOS[code]}` }, img);
  if (hold) frame.classList.add('loading');
  else if (!img.complete) revealAfter([frame], decoded(frame));
  return frame;
}
