import { ALL_CODES, CONTINENTS, COUNTRIES, REGIONS, REGION_BY_ID } from '../data/countries.js';
import { SKILLS, answerFact, countryLevel, factId, isDue, newFact, parseFact } from './srs.js';
import { isDoneToday, recordLesson } from './streak.js';
import { XP, xpForAnswer } from './game.js';
import { arrange } from './mix.js';
import { pickFunFact } from './fun-facts.js';
import { clamp, pick, shuffle } from './util.js';

export const MAX_QUESTIONS = 30;
export const MIN_QUESTIONS = 20;
export const MIN_COUNTRIES = 7;
export const MAX_NEW_PER_LESSON = 6;
export const TIME_LIMIT_MS = 5 * 60 * 1000;
export const RECAP_QUESTIONS = 15;
export const MIN_TRICKY_FACTS = 3;
export const TEST_QUESTIONS = 12;
export const PASS_RATIO = 0.8;
const SESSION_VERSION = 2;
const TRICKY_MIN_MISSES = 2;
const TRICKY_MISS_RATIO = 0.4;
const NEW_COUNTRIES_SPAN = 0.6;
const ENOUGH_REVIEWS_TO_START_WITH = 4;
const TEST_LEVEL = 2;

const question = (code, skill, phase) => ({ kind: 'q', code, skill, phase });
const meeting = code => ({ kind: 'meet', code });
const idOf = item => factId(item.code, item.skill);

const createSession = (type, items, today, extra = {}) => ({
  version: SESSION_VERSION,
  type,
  day: today,
  items,
  idx: 0,
  fixAdded: false,
  elapsed: 0,
  result: { right: 0, answered: 0, xp: 0, met: [], missed: [], gold: [] },
  ...extra,
});

export const isResumable = (session, today) => session?.version === SESSION_VERSION && session.day === today;

export const metCodes = state => ALL_CODES.filter(code => state.met[code] !== undefined);

export const dueFacts = (state, today) => Object.entries(state.facts)
  .filter(([, fact]) => isDue(fact, today))
  .sort(([, a], [, b]) => a.due - b.due || a.step - b.step)
  .map(([id]) => parseFact(id));

const missingSkills = (state, code) => SKILLS.filter(skill => !state.facts[factId(code, skill)]);

export function nextNewCountries(state, n, exclude = []) {
  const start = CONTINENTS.findIndex(c => c.id === state.settings.continent);
  const order = [...CONTINENTS.slice(start), ...CONTINENTS.slice(0, start)].map(c => c.id);
  return order
    .flatMap(id => REGIONS.filter(r => r.continent === id))
    .flatMap(r => r.codes)
    .filter(code => state.met[code] === undefined && !exclude.includes(code))
    .slice(0, n);
}

export function currentRegion(state) {
  const [code] = nextNewCountries(state, 1);
  return code ? REGION_BY_ID[COUNTRIES[code].region] : null;
}

const newQuestions = (state, code) => missingSkills(state, code).map(skill => question(code, skill, 'new'));

// Spreads new countries over the lesson, with each card right before its first question.
function withCards(questions, fresh, rng) {
  const span = Math.floor(questions.length * NEW_COUNTRIES_SPAN);
  const others = questions.filter(item => !fresh.includes(item.code)).length;
  const firstSlot = k => {
    if (others >= ENOUGH_REVIEWS_TO_START_WITH) return Math.floor(((k + 0.5) * span) / fresh.length);
    return k < 2 ? 0 : Math.floor(((k - 1) * span) / (fresh.length - 1));
  };
  const earliest = new Map(fresh.map((code, k) => [code, firstSlot(k)]));
  const waiting = new Set(fresh);
  return arrange(questions, { earliest }, rng)
    .flatMap(item => (waiting.delete(item.code) ? [meeting(item.code), item] : [item]));
}

function extraPractice(state, questions, rng) {
  const used = new Set(questions.map(idOf));
  const perCountry = {};
  for (const { code } of questions) perCountry[code] = (perCountry[code] ?? 0) + 1;
  const candidates = shuffle(Object.keys(state.facts).filter(id => !used.has(id)), rng).map(parseFact);
  const chosen = [];
  const isEnough = () => {
    const total = questions.length + chosen.length;
    return total >= MAX_QUESTIONS || (total >= MIN_QUESTIONS && Object.keys(perCountry).length >= MIN_COUNTRIES);
  };
  while (candidates.length > 0 && !isEnough()) {
    const count = c => perCountry[c.code] ?? 0;
    const least = Math.min(...candidates.map(count));
    const [{ code, skill }] = candidates.splice(candidates.findIndex(c => count(c) === least), 1);
    perCountry[code] = (perCountry[code] ?? 0) + 1;
    chosen.push(question(code, skill, 'practice'));
  }
  return chosen;
}

export function buildLesson(state, today, rng = Math.random) {
  const due = dueFacts(state, today);
  const extra = isDoneToday(state.streak, today);
  const metToday = extra ? 0 : Object.values(state.met).filter(day => day === today).length;
  const knownBefore = metCodes(state).length - metToday;
  const wanted = clamp(MIN_COUNTRIES - knownBefore, state.settings.pace, MAX_NEW_PER_LESSON);
  const room = Math.floor((MAX_QUESTIONS - due.length) / SKILLS.length);
  const fresh = nextNewCountries(state, clamp(room, 0, Math.max(0, wanted - metToday)));

  const questions = fresh.flatMap(code => newQuestions(state, code));
  questions.push(...due.slice(0, MAX_QUESTIONS - questions.length).map(({ code, skill }) => question(code, skill, 'review')));
  questions.push(...extraPractice(state, questions, rng));
  return createSession('lesson', withCards(questions, fresh, rng), today, { extra });
}

export function buildRecap(state, today, rng = Math.random) {
  const skillsByCode = new Map();
  for (const id of Object.keys(state.facts)) {
    const { code, skill } = parseFact(id);
    skillsByCode.set(code, [...(skillsByCode.get(code) ?? []), skill]);
  }
  for (const [code, skills] of skillsByCode) skillsByCode.set(code, shuffle(skills, rng));
  const items = [];
  for (let round = 0; round < SKILLS.length && items.length < RECAP_QUESTIONS; round++) {
    const codes = [...skillsByCode.keys()].filter(code => skillsByCode.get(code).length > round);
    for (const code of shuffle(codes, rng)) {
      if (items.length === RECAP_QUESTIONS) break;
      items.push(question(code, skillsByCode.get(code)[round], 'recap'));
    }
  }
  return createSession('recap', arrange(items, {}, rng), today);
}

export const trickyFacts = state => Object.entries(state.facts)
  .filter(([, f]) => f.wrong >= TRICKY_MIN_MISSES && f.wrong >= f.right * TRICKY_MISS_RATIO)
  .sort(([, a], [, b]) => b.wrong / (b.right + b.wrong) - a.wrong / (a.right + a.wrong) || b.wrong - a.wrong)
  .map(([id]) => parseFact(id));

export function buildTrickyPractice(state, today, rng = Math.random) {
  const items = trickyFacts(state).slice(0, RECAP_QUESTIONS).map(({ code, skill }) => question(code, skill, 'tricky'));
  return createSession('tricky', arrange(items, {}, rng), today);
}

export const isTestUnlocked = (state, regionId) => REGION_BY_ID[regionId].codes.every(code => state.met[code] !== undefined);

export const openTests = state => REGIONS.filter(r => !state.stamps[r.id] && isTestUnlocked(state, r.id));

export function latestStamp(state) {
  const [id, earned] = Object.entries(state.stamps).reduce((best, entry) => (best && best[1].day > entry[1].day ? best : entry), null) ?? [];
  return id ? { region: REGION_BY_ID[id], earned } : null;
}

export function testRules(regionId) {
  const questions = Math.min(TEST_QUESTIONS, REGION_BY_ID[regionId].codes.length * SKILLS.length);
  return { questions, needed: Math.ceil(questions * PASS_RATIO) };
}

export const finishedRegions = (state, session) => (session.type !== 'lesson' ? []
  : [...new Set(session.result.met.map(code => COUNTRIES[code].region))]
    .filter(id => isTestUnlocked(state, id) && !state.stamps[id]));

export function buildTest(state, regionId, today, rng = Math.random) {
  const { codes } = REGION_BY_ID[regionId];
  const onePerCountry = shuffle(codes, rng).map(code => question(code, pick(SKILLS, rng), 'test'));
  const chosen = new Set(onePerCountry.map(idOf));
  const rest = shuffle(
    codes.flatMap(code => SKILLS.map(skill => question(code, skill, 'test'))).filter(item => !chosen.has(idOf(item))),
    rng,
  );
  const items = arrange([...onePerCountry, ...rest].slice(0, TEST_QUESTIONS), {}, rng);
  return createSession('test', items, today, { regionId, needed: testRules(regionId).needed });
}

export const currentItem = session => session.items[session.idx] ?? null;

export const isNewFact = (state, item) => item.phase !== 'test' && (state.facts[idOf(item)]?.step ?? 0) === 0;

export function difficulty(state, session, item, rng = Math.random) {
  const step = state.facts[idOf(item)]?.step ?? 0;
  if (item.phase === 'test') return Math.max(TEST_LEVEL, step + 1);
  if (item.phase === 'practice' || item.phase === 'recap') return Math.floor(rng() * (Math.min(step, 3) + 2));
  if (item.phase === 'fix') return step;
  const earlier = session.items.slice(0, session.items.indexOf(item));
  const hasGotOneRight = earlier.some(other => other.kind === 'q' && other.code === item.code && other.answered);
  return step + (hasGotOneRight ? 1 : 0);
}

export function meetCountry(state, session, today) {
  const { code } = currentItem(session);
  for (const skill of missingSkills(state, code)) state.facts[factId(code, skill)] = newFact(today);
  state.met[code] = today;
  session.result.met.push(code);
}

function logDay(state, today, patch) {
  const day = state.days[today] ?? { answered: 0, right: 0, xp: 0, lesson: false };
  state.days[today] = {
    answered: day.answered + (patch.answered ?? 0),
    right: day.right + (patch.right ?? 0),
    xp: day.xp + (patch.xp ?? 0),
    lesson: day.lesson || Boolean(patch.lesson),
  };
}

function award(state, session, today, xp) {
  state.xp += xp;
  session.result.xp += xp;
  logDay(state, today, { xp });
}

export function applyAnswer(state, session, correct, today) {
  const item = currentItem(session);
  const id = idOf(item);
  item.answered = correct;

  if (item.phase !== 'fix') {
    const before = countryLevel(state.facts, item.code);
    state.facts[id] = answerFact(state.facts[id] ?? newFact(today), correct, today);
    if (countryLevel(state.facts, item.code) === 3 && before < 3) session.result.gold.push(item.code);
    session.result.answered += 1;
    session.result.right += correct ? 1 : 0;
    if (!correct && !session.result.missed.includes(id)) session.result.missed.push(id);
    logDay(state, today, { answered: 1, right: correct ? 1 : 0 });
  }
  if (correct) award(state, session, today, xpForAnswer(item.q?.format, item.phase));
}

export function advance(session, rng = Math.random) {
  const previous = currentItem(session);
  session.idx += 1;
  if (session.type === 'lesson' && session.elapsed >= TIME_LIMIT_MS) {
    session.timedOut = session.idx < session.items.length;
    return false;
  }
  if (session.idx < session.items.length) return true;
  const canFix = session.type !== 'test';
  if (!canFix || session.fixAdded || session.result.missed.length === 0) return false;
  session.fixAdded = true;
  const fixes = session.result.missed.map(parseFact).map(({ code, skill }) => question(code, skill, 'fix'));
  session.items.push(...arrange(fixes, { previous }, rng));
  return true;
}

export function finish(state, session, today, rng = Math.random) {
  if (session.type === 'lesson') {
    const previous = state.streak;
    state.streak = recordLesson(state.streak, today);
    session.result.streakGrew = state.streak !== previous;
    logDay(state, today, { lesson: true });
    award(state, session, today, XP.lesson);
    session.result.funFact = pickFunFact(state, session.items.map(item => item.code), today, rng);
  }
  if (session.type === 'test') {
    session.result.passed = session.result.right >= session.needed;
    if (session.result.passed && !state.stamps[session.regionId]) {
      state.stamps[session.regionId] = { day: today, right: session.result.right, total: session.items.length };
      session.result.newStamp = true;
      award(state, session, today, XP.stamp);
    }
  }
  state.session = null;
}
