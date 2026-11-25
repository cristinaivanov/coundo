import { COUNTRIES, ALL_CODES, SIMILAR_FLAGS, INDISTINGUISHABLE_FLAGS } from '../data/countries.js';
import { LOOKALIKES } from '../data/similar-flags.js';
import { shuffle } from './util.js';

const OPTION_COUNT = 4;
// Both claim Jerusalem, so a capital question must not offer one against the other.
const AMBIGUOUS_CAPITALS = [['il', 'ps']];

let shapes = {};
export const setMap = map => { shapes = map.countries; };

const distance = (a, b) => Math.hypot(shapes[a].c[0] - shapes[b].c[0], shapes[a].c[1] - shapes[b].c[1]);

const nearest = (code, n) => ALL_CODES
  .filter(c => c !== code)
  .sort((a, b) => distance(code, a) - distance(code, b))
  .slice(0, n);

const sameContinent = code => ALL_CODES.filter(c => c !== code && COUNTRIES[c].continent === COUNTRIES[code].continent);

const LOOKALIKE_CHANCE = 0.5;

const flagFamily = code => [...new Set(SIMILAR_FLAGS.filter(g => g.includes(code)).flat())].filter(c => c !== code);

export const similarFlags = code => [...new Set([...LOOKALIKES[code], ...flagFamily(code)])];

// Two lookalikes of any kind and one from the same family, such as a fellow Nordic cross.
function similarFlagMix(code, rng) {
  const alike = shuffle(similarFlags(code), rng);
  const family = shuffle(flagFamily(code), rng);
  return [...new Set([...alike.slice(0, 2), ...family.slice(0, 1), ...alike])];
}

const pairedWith = (pairs, code) => pairs.filter(p => p.includes(code)).flat().filter(c => c !== code);

function chooseFormat(skill, level, rng) {
  if (skill === 'cap') {
    if (level <= 0) return 'cap-pick';
    if (level === 1) return rng() < 0.5 ? 'cap-pick' : 'cap-rev';
    if (level === 2) return rng() < 0.5 ? 'cap-rev' : 'cap-type';
    return rng() < 0.75 ? 'cap-type' : 'cap-rev';
  }
  if (skill === 'map') {
    if (level <= 0) return 'map-name';
    return rng() < (level === 1 ? 0.5 : 0.85) ? 'map-tap' : 'map-name';
  }
  if (level <= 0) return 'flag-name';
  return rng() < 0.6 ? 'flag-pick' : 'flag-name';
}

function distractors(code, format, hard, rng) {
  const banned = new Set([code]);
  const skill = format.split('-')[0];
  if (skill === 'cap') pairedWith(AMBIGUOUS_CAPITALS, code).forEach(c => banned.add(c));
  if (skill === 'flag') pairedWith(INDISTINGUISHABLE_FLAGS, code).forEach(c => banned.add(c));

  const pools = [];
  if (skill === 'flag') {
    if (rng() < LOOKALIKE_CHANCE) pools.push(similarFlagMix(code, rng));
  } else {
    if (skill === 'map' || hard) pools.push(shuffle(nearest(code, 8), rng));
    pools.push(shuffle(sameContinent(code), rng));
  }
  pools.push(shuffle(ALL_CODES, rng));

  const chosen = [];
  for (const candidate of pools.flat()) {
    if (chosen.length === OPTION_COUNT - 1) break;
    if (banned.has(candidate)) continue;
    if (skill === 'flag' && pairedWith(INDISTINGUISHABLE_FLAGS, candidate).some(c => chosen.includes(c))) continue;
    if (skill === 'cap' && pairedWith(AMBIGUOUS_CAPITALS, candidate).some(c => chosen.includes(c))) continue;
    banned.add(candidate);
    chosen.push(candidate);
  }
  return chosen;
}

export function makeQuestion({ code, skill, level = 0, isNew = false }, rng = Math.random) {
  const format = chooseFormat(skill, level, rng);
  const needsOptions = format !== 'cap-type' && format !== 'map-tap';
  return {
    format,
    code,
    options: needsOptions ? shuffle([code, ...distractors(code, format, level >= 2, rng)], rng) : [],
    view: skill === 'map' ? (format === 'map-tap' && !isNew ? 'continent' : 'region') : null,
  };
}
