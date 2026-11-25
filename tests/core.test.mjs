import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { ALL_CODES, COUNTRIES, INDISTINGUISHABLE_FLAGS, REGIONS } from '../data/countries.js';
import { EMPTY_STREAK, currentStreak, isStreakAtRisk, recordLesson } from '../js/streak.js';
import { INTERVALS, SKILLS, answerFact, countryLevel, factId, factLevel, newFact } from '../js/srs.js';
import { checkCapital } from '../js/text.js';
import { makeQuestion, setMap, similarFlags } from '../js/questions.js';
import { backupText, freshState, loadState, parseBackup, saveState } from '../js/store.js';
import { RANKS, rankFor } from '../js/game.js';
import { dayNumber } from '../js/util.js';
import * as L from '../js/lesson.js';
import { statistics } from '../js/stats.js';
import { STAMP_ART } from '../js/stamp-art.js';
import { RANK_ART } from '../js/rank-art.js';

const map = JSON.parse(fs.readFileSync(new URL('../data/map.json', import.meta.url)));
setMap(map);

const seeded = (seed = 1) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const playStreak = pattern => {
  let streak = { ...EMPTY_STREAK };
  [...pattern].forEach((c, day) => { if (c === 'D') streak = recordLesson(streak, day); });
  return currentStreak(streak, pattern.length);
};

function play(state, session, today, isCorrect, rng) {
  let guard = 0;
  while (L.currentItem(session) && guard++ < 200) {
    const item = L.currentItem(session);
    if (item.kind === 'meet') L.meetCountry(state, session, today);
    else {
      item.q ??= makeQuestion({ code: item.code, skill: item.skill, level: L.difficulty(state, session, item, rng) }, rng);
      L.applyAnswer(state, session, isCorrect(item), today);
    }
    if (!L.advance(session, rng)) break;
  }
  L.finish(state, session, today);
  return session;
}

test('streak: one missed day keeps it, two in a row reset it', () => {
  assert.equal(playStreak('DMDMDM'), 3);
  assert.equal(playStreak('DMM'), 0);
  assert.equal(playStreak('DM'), 1);
  assert.equal(playStreak('DDD'), 3);
  assert.equal(playStreak('DDMDD'), 4);
  assert.equal(playStreak('DDMMD'), 1);
  assert.equal(playStreak('M'), 0);
});

test('streak: warning shows only after exactly one missed day', () => {
  const streak = recordLesson(EMPTY_STREAK, 10);
  assert.equal(isStreakAtRisk(streak, 10), false);
  assert.equal(isStreakAtRisk(streak, 11), false);
  assert.equal(isStreakAtRisk(streak, 12), true);
  assert.equal(isStreakAtRisk(streak, 13), false);
});

test('streak: a second lesson the same day or a clock moved back changes nothing', () => {
  const streak = recordLesson(EMPTY_STREAK, 10);
  assert.equal(recordLesson(streak, 10), streak);
  assert.equal(recordLesson(streak, 9), streak);
});

test('best streak survives a reset', () => {
  let streak = EMPTY_STREAK;
  for (const d of [1, 2, 3, 4]) streak = recordLesson(streak, d);
  streak = recordLesson(streak, 20);
  assert.deepEqual([streak.count, streak.best], [1, 4]);
});

test('day numbers are consecutive across a daylight saving change', () => {
  assert.equal(dayNumber(new Date(2026, 2, 30, 0, 5)) - dayNumber(new Date(2026, 2, 28, 23, 55)), 2);
});

test('facts climb 1, 3, 7, 14, 30, 60 days and master after the 14 day gap', () => {
  let fact = newFact(0);
  let today = 0;
  const gaps = [];
  for (let i = 0; i < 7; i++) {
    fact = answerFact(fact, true, today);
    gaps.push(fact.due - today);
    assert.equal(factLevel(fact) === 3, i >= 4);
    today = fact.due;
  }
  assert.deepEqual(gaps, [...INTERVALS, 60]);
});

test('a miss drops two steps, comes back tomorrow and cannot skip the 14 day gap', () => {
  let fact = { ...newFact(0), step: 6, due: 100 };
  fact = answerFact(fact, false, 100);
  assert.deepEqual([fact.step, fact.due, fact.relearn], [4, 101, true]);
  assert.equal(answerFact(fact, false, 100).step, 4);
  fact = answerFact(fact, true, 101);
  assert.deepEqual([fact.step, fact.due], [4, 115]);
  assert.equal(factLevel(fact), 2);
  assert.equal(factLevel(answerFact(fact, true, 115)), 3);
});

test('early correct answers do not advance the schedule', () => {
  const fact = { ...newFact(0), step: 2, due: 10 };
  assert.deepEqual(answerFact(fact, true, 5), { ...fact, right: 1 });
});

test('a country is gold only when all three facts are mastered', () => {
  const facts = Object.fromEntries(SKILLS.map(s => [factId('fr', s), { ...newFact(0), step: 5 }]));
  assert.equal(countryLevel(facts, 'fr'), 3);
  facts['fr:map'].step = 4;
  assert.equal(countryLevel(facts, 'fr'), 2);
  facts['fr:map'].step = 1;
  assert.equal(countryLevel(facts, 'fr'), 1);
  assert.equal(countryLevel(facts, 'de'), 0);
});

test('data covers 197 countries with flag, shape and region', () => {
  assert.equal(ALL_CODES.length, 197);
  assert.equal(new Set(ALL_CODES).size, 197);
  for (const code of ALL_CODES) {
    assert.ok(COUNTRIES[code].capital, code);
    assert.ok(map.countries[code].d, code);
    assert.ok(fs.existsSync(new URL(`../flags/${code}.svg`, import.meta.url)), code);
  }
  assert.ok(COUNTRIES.xk && COUNTRIES.tw);
});

test('typed capitals ignore accents, case and small typos', () => {
  for (const code of ALL_CODES) assert.equal(checkCapital(code, COUNTRIES[code].capital), 'exact', code);
  assert.equal(checkCapital('co', 'bogota'), 'exact');
  assert.equal(checkCapital('us', 'washington dc'), 'exact');
  assert.equal(checkCapital('gd', 'st. georges'), 'exact');
  assert.equal(checkCapital('ro', 'Bucarest'), 'typo');
  assert.equal(checkCapital('bo', 'la paz'), 'exact');
  assert.equal(checkCapital('za', 'Cape Town'), 'exact');
  assert.equal(checkCapital('fr', ''), 'wrong');
  assert.equal(checkCapital('hu', 'Bucharest'), 'wrong');
});

test('another country\'s capital is never accepted as a typo', () => {
  assert.equal(checkCapital('vc', 'Kingston'), 'wrong');
  assert.equal(checkCapital('jm', 'Kingstown'), 'wrong');
  for (const a of ALL_CODES) {
    for (const b of ALL_CODES) {
      if (a === b || COUNTRIES[a].alternatives.includes(COUNTRIES[b].capital)) continue;
      assert.equal(checkCapital(a, COUNTRIES[b].capital), 'wrong', `${a} ${b}`);
    }
  }
});

test('questions have four distinct options including the answer', () => {
  const rng = seeded();
  for (const code of ALL_CODES) {
    for (const skill of SKILLS) {
      for (let level = 0; level <= 7; level++) {
        const q = makeQuestion({ code, skill, level }, rng);
        if (['cap-type', 'map-tap'].includes(q.format)) continue;
        assert.equal(new Set(q.options).size, 4);
        assert.ok(q.options.includes(code));
        if (skill === 'flag') {
          for (const pair of INDISTINGUISHABLE_FLAGS) assert.ok(!pair.every(c => q.options.includes(c)));
        }
        if (skill === 'cap') assert.ok(!['il', 'ps'].every(c => q.options.includes(c)));
      }
    }
  }
});

const quiz = session => session.items.filter(i => i.kind === 'q' && i.phase !== 'fix');

function countsOf(session) {
  const counts = {};
  for (const { code } of quiz(session)) counts[code] = (counts[code] ?? 0) + 1;
  return counts;
}

function assertWellMixed(session, label) {
  const list = quiz(session);
  list.forEach((item, i) => assert.notEqual(list[i - 1]?.code, item.code, `${label}: ${item.code} twice in a row`));
  list.forEach((item, i) => assert.ok(!(list[i - 1]?.skill === item.skill && list[i - 2]?.skill === item.skill), `${label}: three ${item.skill} in a row`));
  assert.ok(Math.max(...Object.values(countsOf(session))) <= 3, `${label}: too many on one country`);
  assert.equal(new Set(list.map(i => factId(i.code, i.skill))).size, list.length, `${label}: repeated fact`);
}

test('first lesson spreads six new countries from the chosen continent', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const state = freshState();
    const session = L.buildLesson(state, 100, seeded(seed));
    const cards = session.items.map((item, i) => (item.kind === 'meet' ? i : -1)).filter(i => i >= 0);
    assert.equal(cards.length, 6);
    assert.equal(quiz(session).length, 18);
    assertWellMixed(session, `seed ${seed}`);
    assert.ok(cards.at(-1) >= 8, 'cards are spread out');
    play(state, session, 100, () => true, seeded(seed));
    assert.deepEqual([...session.result.met].sort(), [...REGIONS[0].codes.slice(0, 6)].sort());
    assert.equal(currentStreak(state.streak, 100), 1);
  }
  const asia = freshState();
  asia.settings.continent = 'as';
  assert.equal(COUNTRIES[L.nextNewCountries(asia, 1)[0]].continent, 'as');
});

test('each card comes right before the first question about that country', () => {
  const state = freshState();
  const { items } = L.buildLesson(state, 100, seeded(3));
  items.forEach((item, i) => {
    if (item.kind !== 'meet') return;
    assert.equal(items[i + 1].code, item.code);
    assert.ok(!items.slice(0, i).some(earlier => earlier.code === item.code));
  });
});

test('a learner who knows only a few countries still gets seven per lesson', () => {
  for (let known = 1; known <= 8; known++) {
    const state = freshState();
    for (const code of ALL_CODES.slice(0, known)) {
      state.met[code] = 90;
      for (const skill of SKILLS) state.facts[factId(code, skill)] = { ...newFact(90), step: 2, due: 150 };
    }
    const session = L.buildLesson(state, 100, seeded(known));
    assert.ok(Object.keys(countsOf(session)).length >= 7, `${known} known`);
    assertWellMixed(session, `${known} known`);
  }
});

test('every lesson after the first has at least seven countries, whatever the pace or accuracy', () => {
  for (const [pace, accuracy] of [[1, 0.95], [2, 0.9], [2, 0.6], [3, 0.8]]) {
    const rng = seeded(pace * 100 + accuracy * 10);
    const state = freshState();
    state.settings.pace = pace;
    for (let day = 1; day <= 90; day++) {
      const session = L.buildLesson(state, day, rng);
      const label = `pace ${pace}, accuracy ${accuracy}, day ${day}`;
      if (day > 1) assert.ok(Object.keys(countsOf(session)).length >= 7, label);
      assert.ok(quiz(session).length <= L.MAX_QUESTIONS, label);
      assertWellMixed(session, label);
      play(state, session, day, () => rng() < accuracy, rng);
    }
  }
});

test('questions about a new country get harder once one has been answered right', () => {
  const state = freshState();
  const session = L.buildLesson(state, 100, seeded(5));
  const [a, b] = session.items.filter(i => i.kind === 'q' && i.code === session.items[0].code);
  assert.equal(L.difficulty(state, session, b), 0);
  a.answered = false;
  assert.equal(L.difficulty(state, session, b), 0);
  a.answered = true;
  assert.equal(L.difficulty(state, session, b), 1);
});

test('practice and recap questions vary in difficulty, tests are never easy', () => {
  const state = freshState();
  state.facts['fr:cap'] = { ...newFact(1), step: 3 };
  const levels = phase => {
    const item = { kind: 'q', code: 'fr', skill: 'cap', phase };
    const rng = seeded(11);
    return new Set(Array.from({ length: 200 }, () => L.difficulty(state, { items: [item] }, item, rng)));
  };
  assert.ok(levels('practice').size >= 4);
  assert.ok(levels('recap').size >= 4);
  assert.ok(Math.min(...levels('test')) >= 2);
});

test('missed questions come back exactly once', () => {
  const state = freshState();
  const session = play(state, L.buildLesson(state, 100, seeded()), 100, () => false, seeded());
  assert.equal(session.result.missed.length, 18);
  assert.equal(session.items.filter(i => i.phase === 'fix').length, 18);
});

test('a restarted lesson meets only the new countries that were left', () => {
  const state = freshState();
  const session = L.buildLesson(state, 100, seeded());
  while (session.result.met.length < 2) {
    if (L.currentItem(session).kind === 'meet') L.meetCountry(state, session, 100);
    else L.applyAnswer(state, session, true, 100);
    L.advance(session);
  }
  const again = L.buildLesson(state, 100, seeded());
  assert.equal(again.items.filter(i => i.kind === 'meet').length, 4);
  assertWellMixed(again, 'restarted');
});

test('the lesson stops after five minutes', () => {
  const state = freshState();
  const session = L.buildLesson(state, 100, seeded());
  session.elapsed = L.TIME_LIMIT_MS;
  assert.equal(L.advance(session), false);
  assert.equal(session.timedOut, true);
});

test('recaps and region tests are mixed too', () => {
  const state = freshState();
  const { id, codes } = REGIONS[0];
  for (const code of codes) {
    state.met[code] = 1;
    for (const skill of SKILLS) state.facts[factId(code, skill)] = { ...newFact(1), step: 2, due: 200 };
  }
  for (let seed = 1; seed <= 30; seed++) {
    assertWellMixed(L.buildRecap(state, 100, seeded(seed)), 'recap');
    assertWellMixed(L.buildTest(state, id, 100, seeded(seed)), 'test');
  }
});

test('recap draws on every continent learned and does not touch the streak', () => {
  const state = freshState();
  for (const code of ['fr', 'br', 'jp', 'ke', 'fj']) {
    state.met[code] = 1;
    for (const skill of SKILLS) state.facts[factId(code, skill)] = { ...newFact(1), step: 2, due: 200 };
  }
  const session = L.buildRecap(state, 100, seeded());
  assert.equal(session.items.length, 15);
  assert.equal(new Set(session.items.map(i => factId(i.code, i.skill))).size, 15);
  play(state, session, 100, () => true, seeded());
  assert.equal(currentStreak(state.streak, 100), 0);
  assert.ok(state.xp > 0);
  assert.ok(Object.values(state.facts).every(f => f.due === 200));
});

test('recap covers different countries before repeating one', () => {
  const state = freshState();
  for (const code of ALL_CODES.slice(0, 40)) state.facts[factId(code, 'cap')] = newFact(1);
  const items = L.buildRecap(state, 100, seeded()).items;
  assert.equal(new Set(items.map(i => i.code)).size, 15);
});

test('region tests unlock when every country is met and award a stamp at 80%', () => {
  const state = freshState();
  const { id, codes } = REGIONS[0];
  assert.equal(L.isTestUnlocked(state, id), false);
  for (const code of codes) {
    state.met[code] = 1;
    for (const skill of SKILLS) state.facts[factId(code, skill)] = newFact(1);
  }
  assert.deepEqual(L.openTests(state).map(r => r.id), [id]);

  let wrong = 3;
  play(state, L.buildTest(state, id, 100, seeded()), 100, () => wrong-- <= 0, seeded());
  assert.equal(state.stamps[id], undefined);
  wrong = 2;
  const session = play(state, L.buildTest(state, id, 100, seeded()), 100, () => wrong-- <= 0, seeded());
  assert.equal(session.needed, 10);
  assert.equal(state.stamps[id].right, 10);
  assert.equal(new Set(session.items.map(i => i.code)).size, codes.length);
});

test('backups round-trip and reject other files', () => {
  const state = freshState();
  play(state, L.buildLesson(state, 100, seeded()), 100, () => true, seeded());
  assert.deepEqual(parseBackup(backupText(state)), state);
  assert.throws(() => parseBackup('{"app":"other"}'));
  assert.throws(() => parseBackup('not json'));
});

test('unreadable saved data is kept aside instead of overwritten', () => {
  const data = new Map([['coundo-state', '{broken']]);
  const storage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
  assert.equal(loadState(storage).xp, 0);
  saveState(freshState(), storage);
  assert.equal(data.get('coundo-state-unreadable'), '{broken');
});

test('ranks run from Tourist to Ambassador', () => {
  assert.equal(rankFor(0).name, 'Tourist');
  assert.equal(rankFor(500).name, 'Backpacker');
  assert.equal(rankFor(1e6).name, 'Ambassador');
  assert.equal(RANKS.length, 8);
});

test('a learner with 90% accuracy never exceeds 30 planned questions and meets every country', t => {
  const rng = seeded(7);
  const state = freshState();
  let finishedOn = null;
  const sizes = [];
  for (let day = 1; day <= 400; day++) {
    const session = L.buildLesson(state, day, rng);
    const planned = session.items.filter(i => i.kind === 'q').length;
    sizes.push(planned);
    assert.ok(planned > 0 && planned <= L.MAX_QUESTIONS);
    play(state, session, day, () => rng() < 0.9, rng);
    if (!finishedOn && L.metCodes(state).length === 197) finishedOn = day;
  }
  t.diagnostic(`met all on day ${finishedOn}, average ${(sizes.slice(0, finishedOn).reduce((a, b) => a + b) / finishedOn).toFixed(1)} questions, gold on day 400: ${ALL_CODES.filter(c => countryLevel(state.facts, c) === 3).length}`);
  assert.ok(finishedOn);
});

test('region name words fit inside a passport stamp', () => {
  for (const region of REGIONS) {
    for (const word of region.name.split(' ')) assert.ok(word.length <= 10, region.name);
  }
});

test('bordering countries are mutual and islands have none', () => {
  for (const code of ALL_CODES) {
    for (const other of map.countries[code].n) assert.ok(map.countries[other].n.includes(code), `${code} ${other}`);
  }
  assert.deepEqual(map.countries.nl.n, ['be', 'de']);
  assert.deepEqual(map.countries.ch.n, ['at', 'de', 'fr', 'it', 'li']);
  assert.deepEqual(map.countries.is.n, []);
  assert.ok(!map.countries.na.n.includes('zw'));
});

test('a lesson saved by an older version or another day is not resumed', () => {
  const session = L.buildLesson(freshState(), 100, seeded());
  assert.equal(L.isResumable(session, 100), true);
  assert.equal(L.isResumable(session, 101), false);
  assert.equal(L.isResumable({ ...session, version: undefined }, 100), false);
  assert.equal(L.isResumable(null, 100), false);
});

test('each country\'s map view is a proper box around that country', () => {
  for (const code of ALL_CODES) {
    const { f: [x0, y0, x1, y1], c: [x, y], l: [lx, ly] } = map.countries[code];
    assert.ok(x0 <= x1 && y0 <= y1, `${code}: reversed box`);
    assert.ok(x >= x0 && x <= x1 && y >= y0 && y <= y1, `${code}: center outside its view`);
    if (code !== 'ki') assert.ok(lx >= x0 && lx <= x1 && ly >= y0 && ly <= y1, `${code}: name outside its view`);
  }
});

test('only facts never met are undiscovered', () => {
  assert.equal(factLevel(undefined), 0);
  assert.equal(factLevel(newFact(1)), 1);
  assert.equal(factLevel(answerFact(newFact(1), false, 1)), 1);
});

test('every region has its own stamp drawing and every rank its own badge', () => {
  assert.deepEqual(Object.keys(STAMP_ART).sort(), REGIONS.map(r => r.id).sort());
  assert.equal(new Set(Object.values(STAMP_ART).map(s => s.art)).size, REGIONS.length);
  assert.deepEqual(Object.keys(RANK_ART), RANKS.map(r => r.name));
  for (const { art } of [...Object.values(STAMP_ART), ...Object.values(RANK_ART)]) assert.ok(!/undefined|NaN/.test(art));
});

test('trickiest practice picks the most missed facts and leaves the streak alone', () => {
  const state = freshState();
  const fact = (right, wrong) => ({ ...newFact(1), step: 2, due: 200, right, wrong });
  state.facts = { 'fr:cap': fact(1, 3), 'de:map': fact(2, 4), 'it:flag': fact(20, 2), 'es:cap': fact(0, 1), 'pt:map': fact(3, 2) };
  assert.deepEqual(L.trickyFacts(state).map(f => f.code), ['fr', 'de', 'pt']);
  const session = L.buildTrickyPractice(state, 100, seeded());
  assert.equal(session.items.length, 3);
  play(state, session, 100, () => false, seeded());
  assert.equal(session.items.filter(i => i.phase === 'fix').length, 3);
  assert.equal(currentStreak(state.streak, 100), 0);
});

test('statistics add up, and an empty history shows no accuracy', () => {
  const empty = statistics(freshState(), 100);
  assert.deepEqual([empty.lessons, empty.answered, empty.accuracy, empty.weekXp, empty.bestDayXp, empty.mostMissed], [0, 0, null, 0, 0, null]);
  assert.deepEqual(empty.levels, [197, 0, 0, 0]);

  const state = freshState();
  state.days = { 80: { answered: 10, right: 10, xp: 500, lesson: true }, 99: { answered: 20, right: 15, xp: 200, lesson: true }, 100: { answered: 10, right: 5, xp: 100, lesson: false } };
  state.met = { fr: 91, de: 95 };
  state.facts = {
    'fr:cap': { ...newFact(1), step: 5, due: 101, right: 9, wrong: 1 },
    'fr:map': { ...newFact(1), step: 3, due: 107, right: 4, wrong: 4 },
    'jp:flag': { ...newFact(1), step: 1, due: 108, right: 3, wrong: 1 },
  };
  const s = statistics(state, 100);
  assert.deepEqual([s.lessons, s.answered, s.accuracy, s.weekXp, s.bestDayXp], [2, 40, 75, 300, 500]);
  assert.deepEqual([s.recent.length, s.recent.at(-1).answered, s.recent.at(-2).answered, s.recent[0].answered], [14, 10, 20, 0]);
  assert.deepEqual(s.mostMissed, { code: 'fr', count: 5 });
  assert.deepEqual(s.skills.map(x => x.accuracy), [90, 50, 75]);
  assert.deepEqual(s.continents.map(c => [c.id, c.accuracy]), [['eu', 72], ['as', 75]]);
  assert.equal(s.levels.reduce((a, b) => a + b), 197);
});

test('latest stamp is the newest one, and none before the first', () => {
  const state = freshState();
  assert.equal(L.latestStamp(state), null);
  state.stamps = { balkans: { day: 90 }, 'west-europe': { day: 99 }, gulf: { day: 95 } };
  assert.equal(L.latestStamp(state).region.id, 'west-europe');
  state.stamps['east-asia'] = { day: 99 };
  assert.equal(L.latestStamp(state).region.id, 'east-asia');
});

test('about half of flag questions offer lookalikes, the rest random flags', () => {
  const rng = seeded(21);
  let [total, lookalike] = [0, 0];
  const randomOptions = new Set();
  for (const code of ALL_CODES) {
    const alike = new Set(similarFlags(code));
    assert.ok(alike.size >= 8, code);
    for (let i = 0; i < 20; i++) {
      const q = makeQuestion({ code, skill: 'flag', level: i % 7 }, rng);
      const others = q.options.filter(c => c !== code);
      total += 1;
      if (others.every(c => alike.has(c))) lookalike += 1;
      else others.forEach(c => randomOptions.add(c));
      for (const pair of INDISTINGUISHABLE_FLAGS) assert.ok(!pair.every(c => q.options.includes(c)), `${code}: ${q.options}`);
    }
  }
  assert.ok(Math.abs(lookalike / total - 0.5) < 0.03, `${lookalike / total}`);
  assert.equal(randomOptions.size, 197);
});

test('lookalike options change from one question to the next', () => {
  const rng = seeded(5);
  const sets = new Set(Array.from({ length: 30 }, () => makeQuestion({ code: 'ro', skill: 'flag', level: 0 }, rng).options.sort().join()));
  assert.ok(sets.size >= 15);
});

test('every capital lies in or right beside its own country', () => {
  const SLACK = 45;
  for (const code of ALL_CODES) {
    const { p: [x, y], b: [x0, y0, x1, y1] } = map.countries[code];
    assert.ok(x >= x0 - SLACK && x <= x1 + SLACK && y >= y0 - SLACK && y <= y1 + SLACK, code);
  }
  assert.equal(new Set(ALL_CODES.map(c => map.countries[c].p.join())).size, 197);
});

test('tapping on the map: new countries zoom to the region, known ones show the continent', () => {
  const rng = seeded(8);
  const taps = isNew => {
    const views = new Set();
    for (const code of ALL_CODES) {
      for (let level = 0; level <= 6; level++) {
        const q = makeQuestion({ code, skill: 'map', level, isNew }, rng);
        if (q.format === 'map-tap') views.add(q.view);
        else assert.equal(q.view, 'region');
      }
    }
    return [...views];
  };
  assert.deepEqual(taps(true), ['region']);
  assert.deepEqual(taps(false), ['continent']);
});

test('a map fact is new until answered right, and again after a miss takes it back to the start', () => {
  const state = freshState();
  const item = { kind: 'q', code: 'fr', skill: 'map', phase: 'review' };
  assert.equal(L.isNewFact(state, item), true);
  state.facts['fr:map'] = newFact(1);
  assert.equal(L.isNewFact(state, item), true);
  state.facts['fr:map'] = answerFact(state.facts['fr:map'], true, 1);
  assert.equal(L.isNewFact(state, item), false);
  state.facts['fr:map'] = answerFact(state.facts['fr:map'], false, 2);
  assert.equal(L.isNewFact(state, item), true);
  assert.equal(L.isNewFact(state, { ...item, phase: 'test' }), false);
});

test('finishing a region is announced once, only in a lesson and only without a stamp', () => {
  const state = freshState();
  const [region, other] = REGIONS;
  for (const code of region.codes) state.met[code] = 1;
  const session = { type: 'lesson', result: { met: region.codes.slice(-2) } };
  assert.deepEqual(L.finishedRegions(state, session), [region.id]);
  assert.deepEqual(L.finishedRegions(state, { ...session, type: 'recap' }), []);
  assert.deepEqual(L.finishedRegions(state, { type: 'lesson', result: { met: [] } }), []);
  assert.deepEqual(L.finishedRegions(state, { type: 'lesson', result: { met: [other.codes[0]] } }), []);
  state.stamps[region.id] = { day: 1 };
  assert.deepEqual(L.finishedRegions(state, session), []);
});

test('the announced test rules match the real test', () => {
  for (const region of REGIONS) {
    const session = L.buildTest(freshState(), region.id, 100, seeded());
    assert.deepEqual(L.testRules(region.id), { questions: session.items.length, needed: session.needed });
  }
});

test('saves from before themes existed follow the phone', () => {
  const old = freshState();
  delete old.settings.theme;
  assert.equal(parseBackup(backupText(old)).settings.theme, 'auto');
});
