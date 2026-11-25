import { ALL_CODES, CONTINENTS, COUNTRIES } from '../data/countries.js';
import { SKILLS, countryLevel, factLevel, parseFact } from './srs.js';

const CHART_DAYS = 14;
const EMPTY_DAY = { answered: 0, right: 0, xp: 0, lesson: false };

const sum = (list, value) => list.reduce((total, item) => total + value(item), 0);

export const percent = (part, whole) => (whole === 0 ? null : Math.round((part / whole) * 100));

const accuracyOf = facts => percent(sum(facts, f => f.right), sum(facts, f => f.right + f.wrong));

function mostMissed(facts) {
  const misses = {};
  for (const f of facts) misses[f.code] = (misses[f.code] ?? 0) + f.wrong;
  const [code, count] = Object.entries(misses).sort(([, a], [, b]) => b - a)[0] ?? [null, 0];
  return count > 0 ? { code, count } : null;
}

export function statistics(state, today) {
  const days = Object.values(state.days);
  const facts = Object.entries(state.facts).map(([id, fact]) => ({ ...fact, ...parseFact(id) }));
  const recent = Array.from({ length: CHART_DAYS }, (_, i) => {
    const day = today - CHART_DAYS + 1 + i;
    return { day, ...EMPTY_DAY, ...state.days[day] };
  });
  return {
    lessons: days.filter(d => d.lesson).length,
    answered: sum(days, d => d.answered),
    accuracy: percent(sum(days, d => d.right), sum(days, d => d.answered)),
    weekXp: sum(recent.slice(-7), d => d.xp),
    bestDayXp: Math.max(0, ...days.map(d => d.xp)),
    recent,
    levels: [0, 1, 2, 3].map(level => ALL_CODES.filter(c => countryLevel(state.facts, c) === level).length),
    skills: SKILLS.map(skill => {
      const own = facts.filter(f => f.skill === skill);
      return { skill, levels: own.map(factLevel), accuracy: accuracyOf(own) };
    }),
    continents: CONTINENTS.map(c => {
      const own = facts.filter(f => COUNTRIES[f.code].continent === c.id);
      return { ...c, accuracy: accuracyOf(own) };
    }).filter(c => c.accuracy !== null),
    mostMissed: mostMissed(facts),
  };
}
