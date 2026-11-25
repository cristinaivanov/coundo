// Usage: node tools/build-map.mjs <ne_10m_admin_0_countries.geojson> <mapshaper module path>
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { COUNTRIES } from '../data/countries.js';
import { CAPITAL_LOCATIONS } from '../data/capital-locations.js';

const [, , input, mapshaperPath] = process.argv;
const mapshaper = (await import(pathToFileURL(mapshaperPath))).default;

const CENTRAL_MERIDIAN = 11;
const UNITS_PER_DEGREE = 100;
const CRIMEA = [34.1, 45.2];
const MERGE_BY_NAME = {
  Somaliland: 'so',
  'Northern Cyprus': 'cy',
  'Cyprus No Mans Area': 'cy',
  'Baykonur Cosmodrome': 'kz',
  'Brazilian Island': 'br',
  'US Naval Base Guantanamo Bay': 'cu',
};
const DROP = new Set(['Antarctica', 'Clipperton Island', 'Spratly Islands', 'Bajo Nuevo Bank (Petrel Is.)', 'Serranilla Bank', 'Scarborough Reef']);
const MAINLAND_ONLY = { fr: [-6, 41, 10, 52], nl: [3, 50, 8, 54] };
const CENTER_OVERRIDE = { ki: [173.0, 1.4], us: [-98, 39.5], fj: [178, -17.8], gq: [10.4, 1.6], my: [102.2, 4.2] };
const FOCUS_OVERRIDE = {
  us: [-168.9, 18, -66, 72], ru: [19.5, 41, 190.5, 82], ki: [169, -4, 178, 4.5], nz: [165.5, -48, 179.5, -33.5],
  cl: [-77, -56, -66, -17], ec: [-82, -5.2, -75, 1.6], es: [-10, 35.5, 4.5, 44], pt: [-10, 36.5, -6, 42.5],
  fr: [-5.5, 41.2, 9.8, 51.3], no: [4, 57.5, 31.5, 71.5], za: [16, -35, 33.2, -22], au: [112.5, -44.5, 154, -10],
  fj: [176.5, -19.5, 181, -15.8], mh: [165, 4, 173, 12.5], fm: [137, 3, 164, 11], sc: [45.5, -10, 56.5, -3.5],
  mu: [57, -20.8, 58.1, -19.8], tv: [176, -10.8, 180.2, -5.5], pw: [131, 2.8, 135, 8.2], cv: [-25.6, 14.6, -22.5, 17.4],
  mv: [72, -1, 74.2, 7.3], st: [6.2, -0.2, 7.7, 1.9], tt: [-62.1, 9.9, -60.4, 11.5], ag: [-62.1, 16.9, -61.5, 17.8],
  to: [-176.5, -21.6, -173.5, -18.4], cr: [-86, 8, -82.4, 11.3], ve: [-73.5, 0.5, -59.7, 12.3],
};

const ringArea = r => Math.abs(r.reduce((s, [x, y], i) => { const [a, b] = r[(i + 1) % r.length]; return s + x * b - a * y; }, 0) / 2);
const meanLat = r => r.reduce((sum, [, y]) => sum + y / r.length, 0);
const mean = r => r.reduce(([a, b], [x, y]) => [a + x / r.length, b + y / r.length], [0, 0]);
const inRing = ([x, y], r) => r.reduce((inside, [xi, yi], i) => {
  const [xj, yj] = r[(i + r.length - 1) % r.length];
  return (yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi ? !inside : inside;
}, false);
const within = ([x, y], [x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const wrapOffset = lon => (lon - CENTRAL_MERIDIAN > 180 ? -360 : lon - CENTRAL_MERIDIAN < -180 ? 360 : 0);
const shiftLon = lon => lon + wrapOffset(lon);

const source = JSON.parse(fs.readFileSync(input));
const features = [];
for (const { properties: p, geometry: g } of source.features) {
  if (DROP.has(p.ADMIN)) continue;
  const iso = p.ISO_A2_EH.toLowerCase();
  const base = MERGE_BY_NAME[p.ADMIN] ?? (COUNTRIES[iso] && p.ADMIN !== 'Indian Ocean Territories' && p.ADMIN !== 'Coral Sea Islands' && p.ADMIN !== 'Ashmore and Cartier Islands' ? iso : 'other');
  for (const polygon of g.type === 'Polygon' ? [g.coordinates] : g.coordinates) {
    let code = base;
    if (code === 'ru' && inRing(CRIMEA, polygon[0])) code = 'ua';
    if (MAINLAND_ONLY[code] && !within(mean(polygon[0]), MAINLAND_ONLY[code])) code = 'other';
    const offset = wrapOffset(mean(polygon[0])[0]);
    features.push({
      type: 'Feature',
      properties: { code },
      geometry: { type: 'Polygon', coordinates: polygon.map(r => r.map(([x, y]) => [x + offset, y])) },
    });
  }
}

const out = await mapshaper.applyCommands(
  '-i in.json snap -dissolve2 code -simplify weighted 11% keep-shapes -clean -o out.json format=geojson precision=0.001',
  { 'in.json': JSON.stringify({ type: 'FeatureCollection', features }) },
);
const simplified = JSON.parse(out['out.json']);

const rad = d => (d * Math.PI) / 180;
const k = (UNITS_PER_DEGREE * 180) / Math.PI;
const miller = lat => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * rad(lat)));
const TOP = miller(84);
const project = ([lon, lat]) => [Math.round((rad(lon - CENTRAL_MERIDIAN) + Math.PI) * k), Math.round((TOP - miller(lat)) * k)];
const projectBox = ([x0, y0, x1, y1]) => {
  const a = project([shiftLon(x0), y1]);
  const b = project([shiftLon(x1), y0]);
  return [a[0], a[1], b[0], b[1]];
};
const boxOf = pts => pts.reduce(([a, b, c, d], [x, y]) => [Math.min(a, x), Math.min(b, y), Math.max(c, x), Math.max(d, y)], [Infinity, Infinity, -Infinity, -Infinity]);

const toPath = polygons => polygons.flat().map(ring => {
  const pts = ring.map(project);
  let [px, py] = pts[0];
  let d = `M${px} ${py}`;
  let n = 1;
  for (const [x, y] of pts.slice(1, -1)) {
    if (x === px && y === py) continue;
    d += `l${x - px} ${y - py}`;
    [px, py] = [x, y];
    n++;
  }
  return n > 2 ? `${d}z` : '';
}).join('');

const LABEL_SEARCH = 24;
const LABEL_HEIGHT_PER_LETTER = 1.15 / 0.6;

// Finds the widest spot inside a country where its name fits on one line: [x, y, width].
function nameSpot(rings, letters) {
  const [x0, y0, x1, y1] = boxOf(rings[0]);
  const vertices = rings.flat();
  const inside = point => rings.reduce((odd, ring) => (inRing(point, ring) ? !odd : odd), false);
  const aspect = LABEL_HEIGHT_PER_LETTER / letters;
  const fits = (x, y, w) => {
    const ht = w * aspect;
    if (vertices.some(([vx, vy]) => Math.abs(vx - x) < w / 2 && Math.abs(vy - y) < ht / 2)) return false;
    for (let i = 0; i <= 6; i++) {
      for (const j of [-0.5, 0, 0.5]) if (!inside([x + w * (i / 6 - 0.5), y + ht * j])) return false;
    }
    return true;
  };
  let best = [Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2), 0];
  for (let i = 1; i < LABEL_SEARCH; i++) {
    for (let j = 1; j < LABEL_SEARCH; j++) {
      const x = x0 + ((x1 - x0) * i) / LABEL_SEARCH;
      const y = y0 + ((y1 - y0) * j) / LABEL_SEARCH;
      if (!fits(x, y, best[2] + 1)) continue;
      let [low, high] = [best[2] + 1, x1 - x0];
      while (high - low > 1) {
        const middle = (low + high) / 2;
        if (fits(x, y, middle)) low = middle; else high = middle;
      }
      best = [Math.round(x), Math.round(y), Math.floor(low)];
    }
  }
  return best;
}

const ownersOf = new Map();
for (const { properties: { code }, geometry: g } of simplified.features) {
  if (code === 'other') continue;
  for (const point of (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).flat(2)) {
    const key = point.join();
    ownersOf.set(key, (ownersOf.get(key) ?? new Set()).add(code));
  }
}
// Their borders end a few hundred meters apart, which the simplified map cannot show.
const NOT_NEIGHBORS = new Set(['na-zw']);
const neighbors = {};
for (const owners of ownersOf.values()) {
  for (const a of owners) for (const b of owners) if (a !== b && !NOT_NEIGHBORS.has([a, b].sort().join('-'))) (neighbors[a] ??= new Set()).add(b);
}

const result = { width: 360 * UNITS_PER_DEGREE, height: Math.round((TOP - miller(-58)) * k), units: UNITS_PER_DEGREE, meridian: CENTRAL_MERIDIAN, countries: {}, other: '' };
let points = 0;
for (const { properties: { code }, geometry: g } of simplified.features) {
  const polygons = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  points += polygons.flat(2).length;
  const d = toPath(polygons);
  if (code === 'other') { result.other = d; continue; }
  const byArea = polygons.map(p => ({ p, area: ringArea(p[0]) })).sort((a, b) => b.area - a.area);
  const main = byArea.filter(x => x.area >= byArea[0].area * 0.015).flatMap(x => x.p[0]);
  const projected = byArea[0].p[0].map(project);
  const [x0, y0, x1, y1] = boxOf(projected);
  const label = source.features.find(f => f.properties.ISO_A2_EH.toLowerCase() === code && f.properties.TYPE !== 'Dependency')?.properties;
  const center = CENTER_OVERRIDE[code] ?? (label && within([label.LABEL_X, label.LABEL_Y], boxOf(polygons.flat(2))) ? [label.LABEL_X, label.LABEL_Y] : null);
  const tiny = byArea[0].area < 0.25;
  const [cx, cy] = [Math.round((x0 + x1) / 2), Math.round((y0 + y1) / 2)];
  const focus = FOCUS_OVERRIDE[code] ? projectBox(FOCUS_OVERRIDE[code]) : boxOf(main.map(project));
  const marker = center && !(tiny && !CENTER_OVERRIDE[code]) ? project([shiftLon(center[0]), center[1]]) : [cx, cy];
  result.countries[code] = {
    d: d || `M${cx - 1} ${cy}l1 -1l1 1l-1 1z`,
    b: boxOf([...polygons.flat(2).map(project), focus.slice(0, 2), focus.slice(2), marker]),
    f: focus,
    a: Math.round(byArea[0].area * Math.cos(rad(meanLat(byArea[0].p[0]))) ** -1 * UNITS_PER_DEGREE ** 2),
    c: marker,
    p: project([shiftLon(CAPITAL_LOCATIONS[code][0]), CAPITAL_LOCATIONS[code][1]]),
    l: nameSpot(byArea[0].p.map(ring => ring.map(project)), COUNTRIES[code].name.length),
    n: [...(neighbors[code] ?? [])].sort(),
  };
}
const missing = Object.keys(COUNTRIES).filter(c => !result.countries[c]?.d);
fs.writeFileSync(new URL('../data/map.json', import.meta.url), JSON.stringify(result));
console.log({ points, kb: Math.round(JSON.stringify(result).length / 1024), count: Object.keys(result.countries).length, missing });
