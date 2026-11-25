import { DARK, cheeks, cloud, dot, eyes, line, oval, smile } from './draw.js';
import { h } from './util.js';

const picture = (className, viewBox, art) => h('span', {
  'aria-hidden': 'true',
  style: 'display:contents',
  html: `<svg class="${className}" viewBox="${viewBox}">${art}</svg>`,
});

const BODY = 'M52 6c3 15 27 27 27 53a29 29 0 01-58 0c0-13 7-21 13-28 1 7 4 11 8 13 0-15 3-28 10-38z';
const HEART = 'M51 44c2 8 13 13 13 26a14 14 0 01-28 0c0-10 11-14 15-26z';

const AWAKE = eyes(61, 8.5, 3.4) + cheeks(67, 13.5, '#f58a6a');
const FACES = {
  happy: line('M38 61q3.500-4.500 7 0M55 61q3.500-4.500 7 0', DARK, 2.6) + cheeks(67, 14, '#f0704f') + `<path d="M44 66h12a6 6 0 01-12 0z" fill="${DARK}"/>` + oval(50, 70, 3, 1.600, '#f0704f'),
  ready: AWAKE + smile(67, 3.500),
  worried: AWAKE + line('M36 55l6-2.500M64 55l-6-2.500', DARK, 2.200) + line('M46 70.500q4-3.500 8 0', DARK, 2) + '<path d="M72 34c3 4 4.500 6 4.500 8.500a4.500 4.500 0 01-9 0C67.500 40 69 38 72 34z" fill="#7cc9ee"/>',
  asleep: line('M37 61q4 3.500 8 0M55 61q4 3.500 8 0', DARK, 2.400) + line('M47.500 69q2.500 1.500 5 0', DARK, 1.800),
};
const COLORS = {
  happy: ['#ee7f33', '#fbc04d'],
  ready: ['#ee8f45', '#fbcb6a'],
  worried: ['#e9a56f', '#f8d79b'],
  asleep: ['#a9b8c4', '#cdd8e0'],
};

export function flameCharacter(mood) {
  const [outer, inner] = COLORS[mood];
  const sleepy = mood === 'asleep' ? `<g class="zzz">${line('M76 22h8l-8 9h8M88 8h6l-6 7h6', '#8ea3b1', 2.600)}</g>` : '';
  return picture(`character flame-${mood}`, '14 2 74 90', `<path d="${BODY}" fill="${outer}"/><path d="${HEART}" fill="${inner}"/>${FACES[mood]}${sleepy}`);
}

export const globeCharacter = () => picture('character-small', '0 0 100 100',
  dot(50, 50, 40, '#8fd3ee')
  + '<path fill="#6db56f" d="M22 24c9-10 22-14 28-11s2 9-4 12-6 6-5 11-6 9-12 6-12-10-7-18zM60 14c12 2 24 14 27 26-6 3-12 0-14-5s-8-5-11-9-5-9-2-12zM14 62c6-2 14 2 15 8s-2 10-7 8-11-10-8-16zM62 78c6-6 16-8 20-4-5 8-14 14-22 15-4-3-2-7 2-11z"/>'
  + eyes(50, 13, 4.400) + cheeks(58, 22) + line('M44 59q6 6 12 0', DARK, 2.800));

const GREEN = '#6cb56f';
export const cactusCharacter = () => picture('character-small', '0 0 100 100',
  line('M24 40v10q0 11 14 11M76 32v12q0 11-14 11', GREEN, 14)
  + `<rect x="33" y="12" width="34" height="66" rx="17" fill="${GREEN}"/>`
  + line('M42 22v5M58 20v5M50 28v4M43 66v4M57 67v4M24 38v3M76 30v3', '#d8f0c8', 2.600)
  + eyes(45, 8, 3.800) + cheeks(52, 12.500) + smile(53, 3.500)
  + [[42, 12], [50, 8], [58, 12]].map(([x, y]) => dot(x, y, 5, '#f58fb0')).join('') + dot(50, 12, 3.200, '#fbd35a')
  + '<path d="M28 76h44l-5 18H33z" fill="#d9774f"/><rect x="25" y="72" width="50" height="8" rx="4" fill="#e98b5f"/>');

const CONFETTI = [[12, 40, '#f6c453'], [24, 14, '#6f84d6'], [40, 4, '#e8667a'], [62, 6, '#4fae6b'], [78, 16, '#f18f33'], [90, 42, '#b283c6'], [8, 72, '#3fa0a8'], [93, 70, '#f6c453'], [17, 94, '#e8667a'], [84, 93, '#6f84d6']];

export const confetti = () => picture('confetti', '0 0 100 100', CONFETTI.map(([x, y, color], i) => (i % 2
  ? `<circle cx="${x}" cy="${y}" r="2.200" fill="${color}" style="animation-delay:${i * 35}ms"/>`
  : `<rect x="${x - 2}" y="${y - 1.300}" width="4.400" height="2.600" rx="1.100" fill="${color}" style="rotate:${i * 47}deg;animation-delay:${i * 35}ms"/>`)).join(''));

export const skyDecoration = () => picture('sky-decoration', '0 0 390 60', cloud(26, 28, 1.800) + cloud(84, 18, 1.100));

export const waveEdge = () => h('span', {
  'aria-hidden': 'true',
  style: 'display:contents',
  html: '<svg class="wave-edge" viewBox="0 0 400 24" preserveAspectRatio="none"><path d="M0 14q25-14 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V25H0z"/></svg>',
});
