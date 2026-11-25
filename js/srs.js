export const SKILLS = ['cap', 'map', 'flag'];
export const INTERVALS = [1, 3, 7, 14, 30, 60];
export const MASTERED_STEP = 5;
export const STRONG_STEP = 3;
const LAPSE = 2;

export const factId = (code, skill) => `${code}:${skill}`;

export const parseFact = id => {
  const [code, skill] = id.split(':');
  return { code, skill };
};

export const newFact = today => ({ step: 0, due: today, relearn: false, right: 0, wrong: 0 });

export const isDue = (fact, today) => fact.due <= today;

export function answerFact(fact, correct, today) {
  if (!correct) {
    return {
      ...fact,
      wrong: fact.wrong + 1,
      step: fact.relearn ? fact.step : Math.max(0, fact.step - LAPSE),
      relearn: true,
      due: today + 1,
    };
  }
  const answered = { ...fact, right: fact.right + 1 };
  if (!isDue(fact, today)) return answered;
  const step = fact.relearn ? Math.max(1, fact.step) : Math.min(fact.step + 1, INTERVALS.length);
  return { ...answered, step, relearn: false, due: today + INTERVALS[step - 1] };
}

export const factLevel = fact => {
  if (!fact) return 0;
  if (fact.step >= MASTERED_STEP) return 3;
  return fact.step >= STRONG_STEP ? 2 : 1;
};

export const LEVEL_NAMES = ['Undiscovered', 'Learning', 'Strong', 'Gold'];

export function countryLevel(facts, code) {
  const own = SKILLS.map(skill => facts[factId(code, skill)]);
  if (own.every(f => !f)) return 0;
  return Math.max(1, Math.min(...own.map(factLevel)));
}
