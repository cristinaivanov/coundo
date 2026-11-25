import { COUNTRIES, REGIONS, REGION_BY_ID } from '../data/countries.js';
import { STAMP_ART } from './stamp-art.js';
import { LEVEL_NAMES, SKILLS, countryLevel, factId, factLevel } from './srs.js';
import { WorldMap, shapeOf } from './map.js';
import { flag } from './flags.js';
import { formatDay, h } from './util.js';

export const SKILL_NAMES = { cap: 'Capital', map: 'Map', flag: 'Flag' };

export const levelChip = level => h('span', { class: `level l${level}` }, LEVEL_NAMES[level]);

export const button = (label, onClick, className = '', props = {}) =>
  h('button', { type: 'button', class: `btn ${className}`, onClick, ...props }, label);

export const tone = continentId => `--tone: var(--${continentId}); --deep: var(--${continentId}-deep)`;

export function openSheet(build) {
  const backdrop = h('div', { class: 'backdrop' });
  const maps = [];
  const close = () => {
    maps.forEach(m => m.destroy());
    backdrop.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = e => { if (e.key === 'Escape') close(); };
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' });
  sheet.append(...build({ close, trackMap: m => { maps.push(m); return m.el; } }).filter(Boolean));
  backdrop.append(sheet);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(backdrop);
  return close;
}

const SURROUNDINGS = 0.6;
const MAX_SURROUNDINGS = 1200;
const CLOSEST_VIEW = [2300, 1400];
// Pacific islands sit far from any other land, so a close view would show only sea.
const CLOSEST_PACIFIC_VIEW = [5200, 3200];

export function countryView(code) {
  const [x0, y0, x1, y1] = shapeOf(code).f;
  const closest = COUNTRIES[code].continent === 'oc' ? CLOSEST_PACIFIC_VIEW : CLOSEST_VIEW;
  const [w, ht] = [x1 - x0, y1 - y0].map((size, i) => Math.max(size + Math.min(size * SURROUNDINGS, MAX_SURROUNDINGS), closest[i]));
  const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
  return [cx - w / 2, cy - ht / 2, cx + w / 2, cy + ht / 2];
}

export function countryMap(code, state) {
  const map = new WorldMap({ view: countryView(code), paint: () => '--land', dots: () => false, labelSize: 12, padding: 4 });
  map.emphasis.set(code, `--${COUNTRIES[code].continent}`);
  map.capitals = [code];
  map.labels = shapeOf(code).n
    .filter(other => state.met[other] !== undefined)
    .map(other => ({ code: other, text: COUNTRIES[other].name }));
  return map;
}

export function countrySheet(code, state, today) {
  const country = COUNTRIES[code];
  openSheet(({ close, trackMap }) => [
    h('div', { class: 'row' },
      flag(code, 'big-flag'),
      h('div', { class: 'grow' }, h('p', { class: 'small muted' }, REGION_BY_ID[country.region].name)),
      levelChip(countryLevel(state.facts, code))),
    h('h2', {}, country.name),
    h('div', {},
      h('p', {}, h('span', { class: 'muted' }, 'Capital: '), h('b', {}, country.capital)),
      country.note && h('p', { class: 'small muted' }, country.note)),
    trackMap(countryMap(code, state)),
    h('div', { class: 'list' }, SKILLS.map(skill => {
      const fact = state.facts[factId(code, skill)];
      const when = !fact ? 'Not started' : fact.due <= today ? 'Review due' : `Next review ${formatDay(fact.due, { day: 'numeric', month: 'short' })}`;
      return h('div', { class: 'item' },
        h('div', { class: 'grow' }, h('b', {}, SKILL_NAMES[skill]), h('div', { class: 'small muted' }, when)),
        levelChip(factLevel(fact)));
    })),
    button('Close', close, 'soft'),
  ]);
}

const tilt = id => ([...id].reduce((s, c) => s + c.charCodeAt(0), 0) % 13) - 6;

const PERFORATIONS = 10;
const EDGE = [4, 96];

// A postage stamp outline: straight sides with a row of half-circle bites.
function perforatedSquare() {
  const [lo, hi] = EDGE;
  const pitch = (hi - lo) / PERFORATIONS;
  const r = pitch * 0.3;
  const gap = pitch - r * 2;
  const side = (dx, dy) => Array.from({ length: PERFORATIONS }, () =>
    `l${(dx * gap) / 2} ${(dy * gap) / 2}a${r} ${r} 0 0 0 ${dx * r * 2} ${dy * r * 2}l${(dx * gap) / 2} ${(dy * gap) / 2}`).join('');
  return `M${lo} ${lo}${side(1, 0)}${side(0, 1)}${side(-1, 0)}${side(0, -1)}z`;
}

function scallopedCircle(bumps = 24, radius = 44) {
  const at = i => {
    const angle = (i / bumps) * Math.PI * 2;
    return `${(50 + radius * Math.cos(angle)).toFixed(2)} ${(50 + radius * Math.sin(angle)).toFixed(2)}`;
  };
  const r = (Math.PI * radius) / bumps;
  return `M${at(0)}${Array.from({ length: bumps }, (_, i) => `A${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${at(i + 1)}`).join('')}z`;
}

const FRAMES = [
  { outline: perforatedSquare(), window: '<rect x="12.500" y="12.500" width="75" height="75" rx="5"' },
  { outline: scallopedCircle(), window: '<circle cx="50" cy="50" r="38.500"' },
];

function stampPicture(region) {
  const { sky, art } = STAMP_ART[region.id];
  const { outline, window: opening } = FRAMES[REGIONS.indexOf(region) % FRAMES.length];
  const clip = `stamp-${region.id}`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true">
    <clipPath id="${clip}">${opening}/></clipPath>
    <path d="${outline}" fill="#fffdf8"/>
    <g clip-path="url(#${clip})"><rect width="100" height="100" fill="${sky}"/>${art}</g>
    ${opening} fill="none" stroke="var(--${region.continent})" stroke-width="1.600"/>
  </svg>`;
}

export const mysteryStamp = () => h('span', {
  class: 'mystery-stamp',
  'aria-hidden': 'true',
  html: `<svg viewBox="0 0 100 100"><path d="${FRAMES[0].outline}"/><rect x="15" y="15" width="70" height="70" rx="6"/></svg><b>?</b>`,
});

export function stamp(region, { earned = null, ready = false, met = 0, big = false, press = false, onClick = null } = {}) {
  const variant = [...region.id].length % 3;
  const classes = ['stamp', earned ? 'earned' : `v${variant}`, !earned && ready && 'ready', big && 'big', press && 'press'];
  return h(onClick ? 'button' : 'div', {
    class: classes.filter(Boolean).join(' '),
    style: `${tone(region.continent)}; --tilt: ${tilt(region.id)}deg`,
    type: onClick ? 'button' : null,
    'aria-label': earned ? `${region.name} stamp` : null,
    role: earned && !onClick ? 'img' : null,
    html: earned ? stampPicture(region) : null,
    onClick,
  }, earned ? [] : [region.name, h('small', {}, ready ? 'Test ready' : `${met} of ${region.codes.length}`)]);
}
