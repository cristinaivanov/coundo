import { FUN_FACTS } from '../data/fun-facts.js';

export const NO_FUN_FACTS = { day: null, seen: [] };

export function pickFunFact(state, codes, today, rng = Math.random, facts = FUN_FACTS) {
  const log = state.funFacts;
  if (log.day === today) return null;
  const seen = new Set(log.seen);
  const unseen = code => (facts[code] ?? []).map((text, i) => ({ id: `${code}-${i}`, code, text })).filter(f => !seen.has(f.id));
  const candidates = [...new Set(codes)].map(unseen).filter(list => list.length > 0);
  if (candidates.length === 0) return null;
  const fact = candidates[Math.floor(rng() * candidates.length)][0];
  state.funFacts = { day: today, seen: [...log.seen, fact.id] };
  return { code: fact.code, text: fact.text };
}
