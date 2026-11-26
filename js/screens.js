import { ALL_CODES, CONTINENTS, CONTINENT_BY_ID, COUNTRIES, REGIONS } from '../data/countries.js';
import { LEVEL_NAMES, countryLevel, parseFact } from './srs.js';
import { currentStreak, isDoneToday, isStreakAtRisk } from './streak.js';
import { MIN_TRICKY_FACTS, buildLesson, currentRegion, isTestUnlocked, latestStamp, metCodes, openTests, trickyFacts } from './lesson.js';
import { rankFor } from './game.js';
import { WorldMap, boxFromDegrees, worldBox } from './map.js';
import { flag } from './flags.js';
import { button, countrySheet, levelChip, mysteryStamp, openSheet, stamp, tone } from './ui.js';
import { cactusCharacter, flameCharacter, globeCharacter, skyDecoration, waveEdge } from './characters.js';
import { filledIcon, icon, rankBadge } from './icons.js';
import { statisticsSection } from './statistics.js';
import { backupText, parseBackup } from './store.js';
import { THEMES, applyTheme } from './theme.js';
import { formatDay, h, plural } from './util.js';

const LEVEL_COLORS = ['--land', '--lv1', '--lv2', '--lv3'];
const SECONDS_PER_QUESTION = 8;
const SECONDS_PER_CARD = 8;

const goldCount = state => ALL_CODES.filter(c => countryLevel(state.facts, c) === 3).length;

function weekStrip(state, today) {
  const days = Array.from({ length: 7 }, (_, i) => today - 6 + i);
  return h('div', { class: 'week', role: 'img', 'aria-label': 'Last seven days' }, days.map(day =>
    h('div', { class: `${state.days[day]?.lesson ? 'done' : ''} ${day === today ? 'today' : ''}` },
      formatDay(day, { weekday: 'narrow' }), h('i', {}, state.days[day]?.lesson && icon('check')))));
}

function lessonSummary(state, today) {
  const { items } = buildLesson(state, today);
  const questions = items.filter(i => i.kind === 'q').length;
  const fresh = items.filter(i => i.kind === 'meet').length;
  const minutes = Math.max(1, Math.min(5, Math.round((questions * SECONDS_PER_QUESTION + fresh * SECONDS_PER_CARD) / 60)));
  return [fresh && plural(fresh, 'new country', 'new countries'), plural(questions, 'question'), `about ${minutes} min`].filter(Boolean).join(', ');
}

function streakCard(state, today) {
  const streak = currentStreak(state.streak, today);
  const done = isDoneToday(state.streak, today);
  const atRisk = isStreakAtRisk(state.streak, today);
  const mood = done ? 'happy' : atRisk ? 'worried' : streak > 0 ? 'ready' : 'asleep';
  const message = {
    happy: 'Done for today. See you tomorrow!',
    ready: `Today's lesson makes it ${(streak + 1).toLocaleString('en')}.`,
    worried: "You missed yesterday. Do today's lesson to keep your streak.",
    asleep: 'Do a lesson to wake it up.',
  }[mood];
  return h('section', { class: `card streak-card ${mood}` },
    h('div', { class: 'row' },
      flameCharacter(mood),
      h('div', { class: 'grow streak' },
        h('p', {}, h('b', {}, streak.toLocaleString('en')), ' day streak'),
        h('p', { class: 'small muted' }, message))),
    weekStrip(state, today));
}

function flagTrail(state, region) {
  return h('div', { class: 'trail', role: 'img', 'aria-label': `${region.codes.filter(c => state.met[c] !== undefined).length} of ${region.codes.length} countries met` },
    h('div', { class: 'trail-flags' }, region.codes.map(code =>
      (state.met[code] === undefined ? h('span', { class: 'trail-unknown' }, '?') : flag(code, 'trail-flag')))),
    mysteryStamp());
}

function earnedWhen(day, today) {
  const ago = today - day;
  if (ago <= 0) return 'Earned today';
  if (ago === 1) return 'Earned yesterday';
  return ago < 7 ? `Earned ${ago} days ago` : `Earned ${formatDay(day)}`;
}

function latestStampCard(ctx, today) {
  const latest = latestStamp(ctx.state);
  if (!latest) return null;
  const { region, earned } = latest;
  return h('button', { type: 'button', class: 'card fun-card latest-stamp', style: tone(region.continent), onClick: () => regionSheet(ctx, region) },
    stamp(region, { earned }),
    h('span', { class: 'grow' },
      h('span', { class: 'kicker' }, 'Latest stamp'),
      h('span', { class: 'latest-name' }, region.name),
      h('span', { class: 'small muted' }, earnedWhen(earned.day, today))));
}

export function todayScreen(ctx) {
  const { state } = ctx;
  const today = ctx.today();
  const rank = rankFor(state.xp);
  const done = isDoneToday(state.streak, today);
  const region = currentRegion(state);
  const focus = region ?? REGIONS[0];
  const continent = CONTINENT_BY_ID[focus.continent];
  const metHere = focus.codes.filter(c => state.met[c] !== undefined).length;
  const learned = new Set(Object.keys(state.facts).map(id => parseFact(id).code)).size;
  const tricky = trickyFacts(state);
  const trickyCountries = [...new Set(tricky.map(f => COUNTRIES[f.code].name))];
  const trickyNames = trickyCountries.slice(0, 2).join(trickyCountries.length > 2 ? ', ' : ' and ');
  const resumable = state.session?.day === today && state.session.type === 'lesson';

  const map = ctx.useMap(new WorldMap({
    view: boxFromDegrees(focus.view),
    interactive: false,
    padding: 6,
    dots: code => COUNTRIES[code].region === focus.id,
    paint: code => {
      if (COUNTRIES[code].region !== focus.id) return '--land';
      const level = countryLevel(state.facts, code);
      return level === 0 ? `--${focus.continent}` : LEVEL_COLORS[level];
    },
  }));

  const action = resumable
    ? button('Continue lesson', ctx.resume, 'hero-btn')
    : done ? button('Extra lesson', ctx.startLesson, 'hero-btn ghost') : button("Start today's lesson", ctx.startLesson, 'hero-btn');
  const summary = resumable ? 'You stopped partway through.' : done ? 'Your next lesson opens tomorrow.' : lessonSummary(state, today);

  return h('div', { class: 'screen' },
    h('div', { class: 'traveler' },
      rankBadge(rank.progress, rank.name),
      h('div', {},
        h('h1', {}, rank.name),
        h('p', { class: 'small muted' }, rank.next ? `${(rank.next.xp - state.xp).toLocaleString('en')} XP to ${rank.next.name}` : `${state.xp.toLocaleString('en')} XP`))),
    streakCard(state, today),
    h('section', { class: 'hero', style: tone(focus.continent) },
      h('div', { class: 'hero-map' }, map.el, skyDecoration(), waveEdge()),
      h('div', { class: 'hero-body' },
        h('div', {},
          h('p', { class: 'hero-kicker' }, `${continent.name}, ${metHere} of ${focus.codes.length} met`),
          h('h2', {}, region ? region.name : 'Every country met')),
        flagTrail(state, focus),
        h('p', { class: 'small' }, summary),
        action)),
    latestStampCard(ctx, today),
    openTests(state).map(r => h('section', { class: 'card fun-card', style: tone(r.continent) },
      h('div', { class: 'row' },
        mysteryStamp(),
        h('div', { class: 'grow' }, h('h3', {}, `You finished ${r.name}!`), h('p', { class: 'small muted' }, 'Pass a short test to earn your stamp.'))),
      button('Earn your stamp', () => ctx.startTest(r.id), 'soft', { 'aria-label': `Take the ${r.name} test` }))),
    learned > 0 && h('section', { class: 'card fun-card', style: tone('na') },
      h('div', { class: 'row' },
        globeCharacter(),
        h('div', { class: 'grow' },
          h('h3', {}, 'All-time recap'),
          h('p', { class: 'small muted' }, `Random questions from ${plural(learned, 'country', 'countries')} you've learned`)),
        button('Go', ctx.startRecap, 'soft compact', { 'aria-label': 'Start all-time recap' }))),
    tricky.length >= MIN_TRICKY_FACTS && h('section', { class: 'card fun-card', style: tone('sa') },
      h('div', { class: 'row' },
        cactusCharacter(),
        h('div', { class: 'grow' },
          h('h3', {}, 'Practice your trickiest'),
          h('p', { class: 'small muted' }, `${trickyNames}${trickyCountries.length > 2 ? ' and more' : ''}`)),
        button('Go', ctx.startTricky, 'soft compact', { 'aria-label': 'Practice your trickiest' }))));
}

function regionSheet(ctx, region) {
  const { state } = ctx;
  const unlocked = isTestUnlocked(state, region.id);
  const earned = state.stamps[region.id];
  openSheet(({ close }) => [
    h('p', { class: 'kicker', style: tone(region.continent) }, CONTINENT_BY_ID[region.continent].name),
    h('h2', {}, region.name),
    earned && h('p', { class: 'muted' }, `Stamped ${formatDay(earned.day)} with ${earned.right} of ${earned.total}.`),
    !unlocked && h('p', { class: 'muted' }, `Meet all ${region.codes.length} countries in lessons to unlock the test.`),
    h('div', { class: 'list' }, region.codes.map(code => h('button', {
      type: 'button',
      onClick: () => { close(); countrySheet(code, state, ctx.today()); },
    }, flag(code, 'mini-flag'), h('b', { class: 'grow' }, COUNTRIES[code].name), levelChip(countryLevel(state.facts, code))))),
    unlocked && button(earned ? 'Retake the test' : 'Take the test', () => { close(); ctx.startTest(region.id); }, earned ? 'soft' : ''),
    button('Close', close, 'plain'),
  ]);
}

const isMet = state => code => state.met[code] !== undefined;

function stampSection(ctx, continent) {
  const { state } = ctx;
  const regions = REGIONS.filter(r => r.continent === continent.id);
  const codes = regions.flatMap(r => r.codes);
  return [
    h('h2', { class: 'section-title' }, continent.name, h('small', {}, `${codes.filter(isMet(state)).length} of ${codes.length} met`)),
    h('div', { class: 'stamp-grid' }, regions.map(r => stamp(r, {
      earned: state.stamps[r.id],
      ready: isTestUnlocked(state, r.id),
      met: r.codes.filter(isMet(state)).length,
      onClick: () => regionSheet(ctx, r),
    }))),
  ];
}

function progressMap(ctx) {
  const { state } = ctx;
  const map = ctx.useMap(new WorldMap({
    view: worldBox(),
    padding: 0,
    scrollsPage: true,
    expandable: true,
    paint: code => LEVEL_COLORS[countryLevel(state.facts, code)],
    onTap: code => {
      map.emphasis = new Map();
      if (code) {
        map.emphasis.set(code, LEVEL_COLORS[countryLevel(state.facts, code)]);
        countrySheet(code, state, ctx.today());
      }
      map.draw();
    },
  }));
  map.el.classList.add('atlas');
  return map;
}

export function passportScreen(ctx) {
  const { state } = ctx;
  const rank = rankFor(state.xp);
  const gold = goldCount(state);
  const stat = (name, value, label) => h('div', { class: `stat ${name}` },
    h('span', { class: 'stat-icon' }, filledIcon(name)),
    h('div', {}, h('b', {}, value.toLocaleString('en')), h('span', {}, label)));

  const map = progressMap(ctx);
  const stamps = h('div', { class: 'stamp-sections' });
  const showStamps = continents => stamps.replaceChildren(...continents.flatMap(c => stampSection(ctx, c)));
  const views = [['World', worldBox(), CONTINENTS], ...CONTINENTS.map(c => [c.name, boxFromDegrees(c.view), [c]])];
  const chips = views.map(([name, view, continents], i) => h('button', {
    type: 'button', class: 'chip', 'aria-pressed': String(i === 0),
    onClick: e => {
      chips.forEach(chip => chip.setAttribute('aria-pressed', String(chip === e.currentTarget)));
      map.flyTo(view);
      showStamps(continents);
    },
  }, name));
  showStamps(CONTINENTS);

  return h('div', { class: 'screen' },
    h('div', { class: 'title-bar' },
      h('h1', {}, 'Passport'),
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Settings', onClick: ctx.openSettings }, icon('settings'))),
    h('section', { class: 'holder' },
      rankBadge(rank.progress, rank.name),
      h('div', {},
        h('h2', {}, rank.name),
        h('p', { class: 'muted' }, rank.next ? `${(rank.next.xp - state.xp).toLocaleString('en')} XP to ${rank.next.name}` : 'Highest rank reached'))),
    h('section', { class: 'stats' },
      stat('flame', state.streak.best, 'best streak'),
      stat('spark', state.xp, 'total XP'),
      stat('stamps', Object.keys(state.stamps).length, `of ${REGIONS.length} stamps`),
      stat('star', gold, `of ${ALL_CODES.length} gold`)),
    h('div', { class: 'chips' }, chips),
    map.el,
    h('div', { class: 'legend' }, LEVEL_NAMES.map((name, i) => h('span', {}, h('i', { style: `background: var(${LEVEL_COLORS[i]})` }), name))),
    stamps,
    statisticsSection(state, ctx.today()));
}

async function saveBackup(state) {
  const name = `coundo-backup-${new Date().toLocaleDateString('sv')}.json`;
  const file = new File([backupText(state)], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file] }).catch(() => {});
    return;
  }
  const url = URL.createObjectURL(file);
  const link = h('a', { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function pickBackup(ctx) {
  const input = h('input', { type: 'file', accept: '.json,application/json' });
  input.addEventListener('change', async () => {
    const [file] = input.files;
    if (!file) return;
    let restored;
    try {
      restored = parseBackup(await file.text());
    } catch {
      openSheet(({ close }) => [
        h('h2', {}, "That file isn't a coundo backup"),
        h('p', { class: 'muted' }, 'Nothing was changed. Choose a file named coundo-backup.'),
        button('OK', close, 'soft'),
      ]);
      return;
    }
    openSheet(({ close }) => [
      h('h2', {}, 'Replace your progress?'),
      h('p', {}, `The backup has ${plural(metCodes(restored).length, 'country', 'countries')}, ${plural(Object.keys(restored.stamps).length, 'stamp')} and ${restored.xp.toLocaleString('en')} XP. It replaces what's on this phone.`),
      button('Restore backup', () => { close(); ctx.replaceState(restored); }),
      button('Cancel', close, 'plain'),
    ]);
  });
  input.click();
}

function confirmReset(ctx) {
  openSheet(({ close }) => [
    h('h2', {}, 'Erase all progress?'),
    h('p', {}, "Your streak, stamps and everything you've learned will be deleted from this phone. This can't be undone."),
    button('Erase everything', () => { close(); ctx.reset(); }, 'danger'),
    button('Keep my progress', close, 'plain'),
  ]);
}

export function settingsScreen(ctx) {
  const { state } = ctx;
  const { settings } = state;
  const update = patch => { Object.assign(settings, patch); ctx.save(); };

  const paceButtons = [1, 2, 3].map(n => h('button', {
    type: 'button', 'aria-pressed': String(settings.pace === n),
    onClick: () => { update({ pace: n }); paceButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === n))); },
  }, String(n)));

  const themeButtons = THEMES.map(([id, label]) => h('button', {
    type: 'button', 'aria-pressed': String(settings.theme === id),
    onClick: e => {
      update({ theme: id });
      applyTheme(id);
      themeButtons.forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
    },
  }, label));

  const continent = h('select', { 'aria-label': 'Learning now', onChange: e => update({ continent: e.target.value }) },
    CONTINENTS.map(c => h('option', { value: c.id, selected: c.id === settings.continent }, c.name)));

  const sound = h('button', {
    type: 'button', class: 'switch', role: 'switch', 'aria-checked': String(settings.sound), 'aria-label': 'Sound',
    onClick: () => { update({ sound: !settings.sound }); sound.setAttribute('aria-checked', String(settings.sound)); },
  });

  return h('div', { class: 'screen' },
    h('div', { class: 'title-bar start' },
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Back', onClick: ctx.closeSettings }, icon('back')),
      h('h1', {}, 'Settings')),
    h('section', { class: 'card' },
      h('div', { class: 'setting' }, h('span', {}, 'New countries a day'), h('div', { class: 'segmented' }, paceButtons)),
      h('div', { class: 'setting' }, h('span', {}, 'Learning now'), continent),
      h('div', { class: 'setting' }, h('span', {}, 'Sound'), sound),
      h('div', { class: 'setting stacked' }, h('span', {}, 'Theme'), h('div', { class: 'segmented', role: 'group', 'aria-label': 'Theme' }, themeButtons))),
    h('section', { class: 'card' },
      h('h3', {}, 'Backup'),
      h('p', { class: 'small muted' }, 'Your progress lives only on this phone. Save a copy now and then, for example to iCloud Drive.'),
      button('Save backup', () => saveBackup(state), 'soft'),
      button('Restore backup', () => pickBackup(ctx), 'plain')),
    h('section', { class: 'card' },
      h('h3', {}, 'Daily reminder'),
      h('p', { class: 'small muted' }, 'In the iPhone Reminders app, add a reminder called coundo, set a time, and set Repeat to Daily.')),
    button('Erase all progress', () => confirmReset(ctx), 'danger'),
    h('p', { class: 'small muted' }, 'Map: Natural Earth. Flags: hampusborgos/country-flags and flag-icons.'));
}

export function welcomeScreen(ctx) {
  const { state } = ctx;
  const map = ctx.useMap(new WorldMap({ view: worldBox(), interactive: false, padding: 0, dots: () => false, paint: code => `--${COUNTRIES[code].continent}` }));
  const chips = CONTINENTS.map(c => h('button', {
    type: 'button', class: 'chip', 'aria-pressed': String(c.id === state.settings.continent),
    onClick: e => {
      state.settings.continent = c.id;
      chips.forEach(chip => chip.setAttribute('aria-pressed', String(chip === e.currentTarget)));
    },
  }, c.name));
  return h('div', { class: 'welcome' },
    map.el,
    h('h1', {}, 'coundo'),
    h('p', {}, 'Learn every country: its capital, its flag and its place on the map. One lesson a day, five minutes at most.'),
    h('div', { class: 'stack' }, h('b', {}, 'Where do you want to start?'), h('div', { class: 'wrap' }, chips)),
    h('div', { class: 'stack push' },
      button('Start learning', ctx.finishWelcome),
      button('Restore a backup', () => pickBackup(ctx), 'plain')));
}

export function installScreen(ctx) {
  return h('div', { class: 'welcome' },
    h('h1', {}, 'Add coundo to your Home Screen'),
    h('p', {}, 'It runs as its own app from there, and works without internet.'),
    h('ol', {},
      h('li', {}, 'Tap the Share button in Safari.'),
      h('li', {}, 'Choose Add to Home Screen, then Add.'),
      h('li', {}, 'Open coundo from your Home Screen.')),
    h('p', { class: 'muted' }, "Progress made here in the browser doesn't carry over to the Home Screen app."),
    h('div', { class: 'stack push' }, button('Use it here anyway', ctx.skipInstall, 'plain')));
}

