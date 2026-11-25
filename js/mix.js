import { shuffle } from './util.js';

const ATTEMPTS = 80;
const ADJACENT_COUNTRY = 20;
const NEAR_COUNTRY = 2;
const SKILL_RUN = 3;

const isSkillRun = (list, skill) => list.length >= 2 && list.at(-1).skill === skill && list.at(-2).skill === skill;

function penalty(list, previous) {
  const sequence = previous ? [previous, ...list] : list;
  return sequence.reduce((score, item, i) => {
    const [before, earlier] = [sequence[i - 1], sequence[i - 2]];
    return score
      + (before?.code === item.code ? ADJACENT_COUNTRY : 0)
      + (earlier?.code === item.code ? NEAR_COUNTRY : 0)
      + (before?.skill === item.skill && earlier?.skill === item.skill ? SKILL_RUN : 0);
  }, 0);
}

function weightedPick(pool, weightOf, rng) {
  const weights = pool.map(weightOf);
  let roll = rng() * weights.reduce((a, b) => a + b, 0);
  return pool[Math.max(0, weights.findIndex(w => (roll -= w) < 0))];
}

function attempt(items, earliest, previous, rng) {
  const rest = shuffle(items, rng);
  const out = [];
  while (rest.length > 0) {
    const last = out.at(-1) ?? previous;
    const otherCountry = item => item.code !== last?.code;
    const varied = item => otherCountry(item) && !isSkillRun(out, item.skill);
    const ready = rest.filter(item => (earliest.get(item.code) ?? 0) <= out.length);
    const pool = [ready.filter(varied), ready.filter(otherCountry), rest.filter(varied), rest.filter(otherCountry), rest]
      .find(options => options.length > 0);
    const remaining = code => rest.filter(item => item.code === code).length;
    const chosen = weightedPick(pool, item => remaining(item.code) ** 2, rng);
    out.push(chosen);
    rest.splice(rest.indexOf(chosen), 1);
  }
  return out;
}

export function arrange(items, { earliest = new Map(), previous = null } = {}, rng = Math.random) {
  let best = null;
  for (let i = 0; i < ATTEMPTS; i++) {
    const list = attempt(items, earliest, previous, rng);
    const score = penalty(list, previous);
    if (!best || score < best.score) best = { list, score };
    if (best.score === 0) break;
  }
  return best.list;
}
