import { CONTINENT_BY_ID, COUNTRIES, REGION_BY_ID } from '../data/countries.js';
import { TIME_LIMIT_MS, advance, applyAnswer, currentItem, difficulty, finish, finishedRegions, isFinalItem, isNewFact, meetCountry, testRules } from './lesson.js';
import { makeQuestion } from './questions.js';
import { checkCapital } from './text.js';
import { WorldMap, boxFromDegrees, shapeOf } from './map.js';
import { factId, parseFact } from './srs.js';
import { currentStreak } from './streak.js';
import { rankFor } from './game.js';
import { flag, preloadFlags, revealTogether } from './flags.js';
import { SKILL_NAMES, button, countryMap, mysteryStamp, stamp, tone } from './ui.js';
import { cactusCharacter, confetti, flameCharacter, globeCharacter } from './characters.js';
import { filledIcon, icon, rankBadge } from './icons.js';
import { ANSWER_BUZZ, FINISH_BUZZ, buzz, hapticOnTap } from './haptics.js';
import { play } from './sound.js';
import { h } from './util.js';

const IDLE_LIMIT_MS = 60 * 1000;
const PHASE_NAMES = { new: 'New', review: 'Review', practice: 'Practice', fix: 'Fix mistakes', recap: 'All-time recap', tricky: 'Trickiest', test: 'Region test' };
const LOOKAHEAD = 3;

export function runSession(root, ctx, session, onExit) {
  const { state } = ctx;
  const today = session.day;
  const rankBefore = rankFor(state.xp).index;
  let maps = [];
  let onItem = 0;

  const ticker = setInterval(() => {
    if (document.hidden || onItem >= IDLE_LIMIT_MS) return;
    onItem += 1000;
    session.elapsed += 1000;
  }, 1000);

  const persist = () => { state.session = session; ctx.save(); };
  const dropMaps = () => { maps.forEach(m => m.destroy()); maps = []; };
  const exit = () => { clearInterval(ticker); dropMaps(); ctx.save(); onExit(); };
  const useMap = map => { maps.push(map); return map; };

  const progress = h('i', { style: 'width:0%' });
  let body = h('div', { class: 'question' });
  const footer = h('div');
  const shell = h('div', { class: 'lesson' },
    h('div', { class: 'lesson-top' },
      h('button', { type: 'button', 'aria-label': 'Close', onClick: () => { persist(); exit(); } }, icon('close')),
      h('div', { class: 'bar', role: 'progressbar', 'aria-label': 'Lesson progress' }, progress)),
    body, footer);
  root.replaceChildren(shell);

  function show() {
    dropMaps();
    onItem = 0;
    const item = currentItem(session);
    progress.style.width = `${Math.max(3, (session.idx / session.items.length) * 100)}%`;
    const fresh = h('div', { class: 'question' });
    body.replaceWith(fresh);
    body = fresh;
    footer.replaceChildren();
    if (item.kind === 'meet') showMeeting(body, item.code);
    else showQuestion(body, item);
    prepareUpcoming();
  }

  const buildQuestion = item => makeQuestion({
    code: item.code,
    skill: item.skill,
    level: difficulty(state, session, item),
    isNew: isNewFact(state, item),
  });

  function prepareUpcoming() {
    const from = session.idx + 1;
    session.items.slice(from, from + LOOKAHEAD).forEach((item, offset) => {
      if (item.kind === 'meet') { preloadFlags([item.code]); return; }
      if (item.skill !== 'flag') return;
      const before = session.items.slice(session.idx, from + offset);
      const difficultyMayChange = before.some(other => other.code === item.code);
      if (difficultyMayChange) { preloadFlags([item.code]); return; }
      item.q ??= buildQuestion(item);
      preloadFlags(item.q.options);
    });
  }

  function next() {
    const more = advance(session);
    if (more) { persist(); show(); } else end();
  }

  function showMeeting(target, code) {
    const country = COUNTRIES[code];
    const map = useMap(countryMap(code, state));
    target.append(h('div', { class: 'meet' },
      h('span', { class: 'phase' }, 'New country'),
      flag(code, '', `Flag of ${country.name}`),
      h('h2', {}, country.name),
      h('dl', {}, h('dt', {}, 'Capital'), h('dd', {}, country.capital)),
      country.note && h('p', { class: 'small muted' }, country.note),
      map.el));
    const proceed = () => { meetCountry(state, session, today); next(); };
    footer.replaceChildren(h('div', { class: 'actions' }, button('Got it', proceed)));
  }

  function showQuestion(target, item) {
    item.q ??= buildQuestion(item);
    if (item.answered !== undefined) { next(); return; }
    persist();
    target.append(h('span', { class: 'phase' }, PHASE_NAMES[item.phase]));
    FORMATS[item.q.format](target, item.q);
  }

  const prompt = (text, title = null) => h('div', { class: 'prompt' }, h('p', {}, text), title && h('h2', {}, title));

  function choices(target, q, { render: content, className = '', two = false, explain }) {
    const buttons = q.options.map(code => h('button', { type: 'button', class: `option ${className}`, onClick: () => choose(code) }, content(code)));
    const choose = code => {
      const correct = code === q.code;
      buttons.forEach((b, i) => {
        b.disabled = true;
        if (q.options[i] === q.code) b.classList.add('right');
        else if (q.options[i] === code) b.classList.add('wrong');
      });
      settle(correct, explain(code, correct));
    };
    hapticOnTap(buttons[q.options.indexOf(q.code)]);
    target.append(h('div', { class: `options${two ? ' two' : ''}` }, buttons));
    const frames = buttons.flatMap(b => b.querySelector('.flag') ?? []);
    if (frames.length === 0) return;
    const enable = on => buttons.forEach(b => { b.disabled = !on; });
    enable(false);
    revealTogether(frames).then(() => enable(true));
  }

  const capitalNote = code => COUNTRIES[code].note;

  const FORMATS = {
    'cap-pick'(target, q) {
      target.append(prompt('What is the capital of', `${COUNTRIES[q.code].inSentence}?`));
      choices(target, q, {
        render: c => COUNTRIES[c].capital,
        explain: (_, ok) => [ok ? '' : `The capital is ${COUNTRIES[q.code].capital}.`, capitalNote(q.code)].join(' ').trim(),
      });
    },
    'cap-rev'(target, q) {
      target.append(prompt('Which country has this capital?', COUNTRIES[q.code].capital));
      choices(target, q, {
        render: c => COUNTRIES[c].name,
        explain: (_, ok) => [ok ? '' : `It's the capital of ${COUNTRIES[q.code].inSentence}.`, capitalNote(q.code)].join(' ').trim(),
      });
    },
    'cap-type'(target, q) {
      const input = h('input', {
        class: 'answer', type: 'text', placeholder: 'Type the capital', 'aria-label': 'Capital',
        autocomplete: 'off', autocorrect: 'off', autocapitalize: 'words', spellcheck: 'false', enterkeyhint: 'done',
        onInput: () => hapticOnTap(check, input.value.trim() !== '' && checkCapital(q.code, input.value) !== 'wrong'),
      });
      const submit = typed => {
        if (input.disabled) return;
        const verdict = typed === null ? 'wrong' : checkCapital(q.code, typed);
        const correct = verdict !== 'wrong';
        const { capital } = COUNTRIES[q.code];
        input.blur();
        input.disabled = true;
        input.classList.add(correct ? 'right' : 'wrong');
        controls.remove();
        const spelling = verdict === 'typo' ? `Spelled ${capital}.` : correct ? '' : `The capital is ${capital}.`;
        settle(correct, [spelling, capitalNote(q.code)].join(' ').trim());
      };
      const form = h('form', { class: 'stack', onSubmit: e => { e.preventDefault(); if (input.value.trim()) submit(input.value); } }, input);
      const check = h('button', { class: 'btn', type: 'button', onClick: () => { if (input.value.trim()) submit(input.value); } }, 'Check');
      const controls = h('div', { class: 'stack' },
        check,
        button("I don't know", () => submit(null), 'plain'));
      form.append(controls);
      target.append(prompt('What is the capital of', `${COUNTRIES[q.code].inSentence}?`), form);
      input.focus();
    },
    'map-name'(target, q) {
      const map = useMap(new WorldMap({ view: viewFor(q), paint: () => '--land', dots: () => false }));
      map.emphasis.set(q.code, `--${COUNTRIES[q.code].continent}`);
      map.el.classList.add('above-options');
      target.append(prompt('Which country is highlighted?'), map.el);
      choices(target, q, {
        two: true,
        render: c => COUNTRIES[c].name,
        explain: (code, ok) => {
          map.labels = [{ code: q.code, text: COUNTRIES[q.code].name }];
          if (!ok) map.labels.push({ code, text: COUNTRIES[code].name });
          map.draw();
          return ok ? '' : `It's ${COUNTRIES[q.code].inSentence}.`;
        },
      });
    },
    'map-tap'(target, q) {
      let selected = null;
      let locked = false;
      const map = useMap(new WorldMap({
        view: viewFor(q),
        paint: () => '--land',
        dots: code => COUNTRIES[code].continent === COUNTRIES[q.code].continent,
        onTap: code => {
          if (locked || !code) return;
          selected = code;
          map.emphasis = new Map([[code, '--accent']]);
          map.draw();
          check.disabled = false;
          hapticOnTap(check, code === q.code);
        },
      }));
      const check = button('Check', () => {
        locked = true;
        const correct = selected === q.code;
        map.emphasis = new Map([[q.code, '--good']]);
        map.labels = [{ code: q.code, text: COUNTRIES[q.code].name }];
        if (!correct) {
          map.emphasis.set(selected, '--bad');
          map.labels.push({ code: selected, text: COUNTRIES[selected].name });
          map.flyTo(viewOfBoth(q.code, selected));
        }
        map.draw();
        settle(correct, correct ? '' : `You picked ${COUNTRIES[selected].inSentence}. The right one is green.`);
      }, '', { disabled: true });
      target.append(prompt('Tap on the map', COUNTRIES[q.code].name), map.el);
      footer.replaceChildren(h('div', { class: 'actions' }, check));
    },
    'flag-name'(target, q) {
      target.append(prompt('Whose flag is this?'), h('div', { class: 'hero-flag' }, flag(q.code, '', 'Flag')));
      choices(target, q, {
        render: c => COUNTRIES[c].name,
        explain: (_, ok) => (ok ? '' : `It's the flag of ${COUNTRIES[q.code].inSentence}.`),
      });
    },
    'flag-pick'(target, q) {
      target.append(prompt('Which flag belongs to', `${COUNTRIES[q.code].inSentence}?`));
      choices(target, q, {
        two: true,
        className: 'flag-option',
        render: c => flag(c, '', 'Flag option', { hold: true }),
        explain: (code, ok) => (ok ? '' : `You picked the flag of ${COUNTRIES[code].inSentence}.`),
      });
    },
  };

  // Never wider than the continent, so a small country stays visible beside a huge one.
  function viewOfBoth(code, other) {
    const [a, b] = [shapeOf(code).f, shapeOf(other).f];
    const both = [Math.min(a[0], b[0]) - 120, Math.min(a[1], b[1]) - 120, Math.max(a[2], b[2]) + 120, Math.max(a[3], b[3]) + 120];
    const continent = boxFromDegrees(CONTINENT_BY_ID[COUNTRIES[code].continent].view);
    const isWider = both[2] - both[0] > continent[2] - continent[0] || both[3] - both[1] > continent[3] - continent[1];
    return isWider ? continent : both;
  }

  function viewFor(q) {
    const country = COUNTRIES[q.code];
    const source = q.view === 'continent' ? CONTINENT_BY_ID[country.continent] : REGION_BY_ID[country.region];
    return boxFromDegrees(source.view);
  }

  function settle(correct, message) {
    applyAnswer(state, session, correct, today);
    persist();
    play(correct ? 'right' : 'wrong', state.settings.sound);
    if (correct) buzz(ANSWER_BUZZ);
    const go = button('Continue', next);
    if (isFinalItem(session)) hapticOnTap(go);
    footer.replaceChildren(h('div', { class: `feedback ${correct ? 'right' : 'wrong'}`, role: 'status' },
      h('div', {}, h('strong', {}, correct ? 'Correct' : 'Not quite'), message && h('p', {}, message)),
      go));
    go.focus({ preventScroll: true });
  }

  function end() {
    clearInterval(ticker);
    dropMaps();
    finish(state, session, today);
    ctx.save();
    play('finish', state.settings.sound);
    buzz(FINISH_BUZZ);
    showResults();
  }

  function resultsPicture() {
    const { result } = session;
    if (result.newStamp) return stamp(REGION_BY_ID[session.regionId], { earned: state.stamps[session.regionId], big: true, press: true });
    if (session.type === 'test') return result.passed ? globeCharacter() : h('span', { style: tone(REGION_BY_ID[session.regionId].continent) }, mysteryStamp());
    return { lesson: () => flameCharacter('happy'), recap: globeCharacter, tricky: cactusCharacter }[session.type]();
  }

  function resultsMessage(accuracy) {
    const { result } = session;
    if (session.type === 'test') {
      if (result.newStamp) return `${REGION_BY_ID[session.regionId].name} is in your passport.`;
      if (result.passed) return `You already have this stamp, and you've still got it.`;
      return `You need ${session.needed} of ${session.items.length}. Try again whenever you like.`;
    }
    if (session.timedOut) return "That's five minutes. The rest moves to your next lesson.";
    if (accuracy === 100) return 'Perfect, not a single miss!';
    if (accuracy >= 80) return 'Great job!';
    return 'Good practice. The tricky ones will come back.';
  }

  const flagList = (title, codes, className = '') => h('section', { class: `card result-card ${className}` },
    h('h3', {}, title),
    h('div', { class: 'flag-chips' }, codes.map(code => h('span', { class: 'flag-chip' }, flag(code, 'trail-flag'), COUNTRIES[code].name))));

  const funFactCard = ({ code, text }) => h('section', { class: 'card result-card fun-fact', style: tone(COUNTRIES[code].continent) },
    globeCharacter(),
    h('p', { class: 'fun-fact-label' }, 'Fun fact of the day'),
    h('div', { class: 'fun-fact-country' }, flag(code, 'trail-flag'), h('h3', {}, COUNTRIES[code].name)),
    h('p', { class: 'fun-fact-text' }, text));

  function showResults() {
    const { result } = session;
    const rank = rankFor(state.xp);
    const streak = currentStreak(state.streak, today);
    const accuracy = result.answered ? Math.round((result.right / result.answered) * 100) : 0;
    const tile = (name, value, label) => h('div', { class: `result-tile ${name}` },
      h('span', { class: 'stat-icon' }, filledIcon(name)), h('b', {}, value), h('span', {}, label));
    const titles = {
      lesson: session.extra ? 'Extra lesson done!' : 'Lesson done!',
      recap: 'Recap done!',
      tricky: 'Practice done!',
      test: result.newStamp ? 'Stamp earned!' : result.passed ? 'Test passed!' : 'Not this time',
    };
    const finished = finishedRegions(state, session);
    const missed = result.missed.map(parseFact);

    root.replaceChildren(h('div', { class: 'screen results' },
      h('div', { class: 'results-hero' },
        h('div', { class: 'results-picture' }, (session.type !== 'test' || result.passed) && confetti(), resultsPicture()),
        h('h1', {}, titles[session.type]),
        h('p', { class: 'muted' }, resultsMessage(accuracy))),
      h('div', { class: 'result-tiles' },
        tile('spark', `+${result.xp}`, 'XP'),
        tile('tick', session.type === 'test' ? `${result.right}/${session.items.length}` : `${accuracy}%`, 'correct'),
        tile('flame', streak.toLocaleString('en'), 'day streak')),
      rank.index > rankBefore && h('section', { class: 'card result-card new-title' },
        rankBadge(rank.progress, rank.name),
        h('div', {}, h('p', { class: 'small muted' }, 'New title'), h('h3', {}, rank.name))),
      result.funFact && funFactCard(result.funFact),
      session.type === 'lesson' && result.met.length > 0 && flagList(result.met.length === 1 ? 'New country' : 'New countries', result.met),
      result.gold.length > 0 && flagList('Turned gold', result.gold, 'gold'),
      missed.length > 0 && h('section', { class: 'card result-card' },
        h('h3', {}, 'Worth another look'),
        h('div', { class: 'list' }, missed.map(({ code, skill }) => h('div', { class: 'item' },
          flag(code, 'mini-flag'),
          h('div', { class: 'grow' }, h('b', {}, COUNTRIES[code].name),
            h('div', { class: 'small muted' }, skill === 'cap' ? COUNTRIES[code].capital : SKILL_NAMES[skill])))))),
      h('div', { class: 'stack push' },
        session.type === 'recap' && button('Another round', () => { exit(); ctx.startRecap(); }, 'soft'),
        session.type === 'test' && !result.passed && button('Try again', () => { exit(); ctx.startTest(session.regionId); }, 'soft'),
        finished.length > 0 ? button('Continue', () => showFinishedRegion(finished)) : button('Done', exit))));
  }

  function showFinishedRegion([id, ...others]) {
    const finishedRegion = REGION_BY_ID[id];
    const { questions, needed } = testRules(id);
    const later = () => (others.length > 0 ? showFinishedRegion(others) : exit());
    root.replaceChildren(h('div', { class: 'finale', style: tone(finishedRegion.continent) },
      h('div', { class: 'finale-flags', 'aria-hidden': 'true' }, finishedRegion.codes.map(code => flag(code, 'trail-flag'))),
      mysteryStamp(),
      h('h1', {}, `Yay! You finished ${finishedRegion.name}`),
      h('p', {}, `You've met all ${finishedRegion.codes.length} countries. Pass a short test now to earn your stamp: ${questions} questions, ${needed} right.`),
      h('div', { class: 'stack push' },
        button('Take the test now', () => { exit(); ctx.startTest(id); }, 'hero-btn'),
        button('Later', later, 'plain'),
        h('p', { class: 'small' }, "Not now? You'll find it on your home screen."))));
  }


  if (session.elapsed >= TIME_LIMIT_MS && session.type === 'lesson') end();
  else show();
}
