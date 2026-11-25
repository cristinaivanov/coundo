import { ALL_CODES, COUNTRIES } from '../data/countries.js';
import { LEVEL_NAMES } from './srs.js';
import { percent, statistics } from './stats.js';
import { flag } from './flags.js';
import { countrySheet } from './ui.js';
import { formatDay, h, plural } from './util.js';

const SKILL_PLURALS = { cap: 'Capitals', map: 'Map', flag: 'Flags' };
const MIN_BAR = 3;
const number = n => n.toLocaleString('en');
const correct = accuracy => (accuracy === null ? 'not started' : `${accuracy}% correct`);

const figure = (value, label) => h('div', { class: 'figure' }, h('b', {}, value), h('span', {}, label));

function segments(counts, total) {
  return [3, 2, 1].map(level => counts[level] > 0 && h('i', { style: `width:${(counts[level] / total) * 100}%; background: var(--lv${level})` }));
}

const countLevels = levels => [0, 1, 2, 3].map(level => levels.filter(l => l === level).length);

function skillMeter({ skill, levels, accuracy }) {
  const counts = countLevels(levels);
  const label = SKILL_PLURALS[skill];
  return h('div', { class: 'meter' },
    h('b', {}, label),
    h('span', {}, `${levels.length} of ${ALL_CODES.length}, ${correct(accuracy)}`),
    h('div', { class: 'bar', role: 'img', 'aria-label': `${label}: ${counts[1]} learning, ${counts[2]} strong, ${counts[3]} gold` }, segments(counts, ALL_CODES.length)));
}

function activityChart(recent) {
  const most = Math.max(1, ...recent.map(d => d.answered));
  const caption = h('p', { class: 'small muted', 'aria-live': 'polite' });
  const describe = d => {
    const date = formatDay(d.day, { weekday: 'short', day: 'numeric', month: 'short' });
    return d.answered === 0 ? `${date}: no questions` : `${date}: ${plural(d.answered, 'question')}, ${percent(d.right, d.answered)}% correct, ${number(d.xp)} XP`;
  };
  const bars = recent.map((d, i) => h('button', {
    type: 'button', class: 'day-bar', 'aria-label': describe(d), 'aria-pressed': String(i === recent.length - 1),
    onClick: e => {
      bars.forEach(bar => bar.setAttribute('aria-pressed', String(bar === e.currentTarget)));
      caption.textContent = describe(d);
    },
  },
  h('span', { class: 'day-track' }, h('i', { style: `height:max(${MIN_BAR}px, ${(d.answered / most) * 100}%)`, class: d.answered === 0 ? 'empty' : null })),
  h('small', {}, formatDay(d.day, { weekday: 'narrow' }))));
  caption.textContent = describe(recent.at(-1));
  return h('section', { class: 'card' },
    h('h3', {}, 'Questions in the last 14 days'),
    h('div', { class: 'day-chart' }, bars),
    caption);
}

export function statisticsSection(state, today) {
  const s = statistics(state, today);
  return h('div', { class: 'statistics' },
    h('h2', { class: 'section-title' }, 'Statistics'),
    h('section', { class: 'figures' },
      figure(number(s.lessons), s.lessons === 1 ? 'daily lesson' : 'daily lessons'),
      figure(number(s.answered), 'questions'),
      figure(s.accuracy === null ? '–' : `${s.accuracy}%`, 'correct'),
      figure(number(Object.keys(state.met).length), 'countries met'),
      figure(number(s.weekXp), 'XP in 7 days'),
      figure(number(s.bestDayXp), 'best day XP')),
    activityChart(s.recent),
    h('section', { class: 'card' },
      h('h3', {}, 'Your 197 countries'),
      h('div', { class: 'meter' }, h('div', { class: 'bar tall', role: 'img', 'aria-label': LEVEL_NAMES.map((n, i) => `${s.levels[i]} ${n}`).join(', ') }, segments(s.levels, ALL_CODES.length))),
      h('div', { class: 'level-list' }, [3, 2, 1, 0].map(level => h('div', {},
        h('i', { style: `background: var(${level === 0 ? '--land' : `--lv${level}`})` }),
        h('span', {}, LEVEL_NAMES[level]),
        h('b', {}, String(s.levels[level])))))),
    h('section', { class: 'card' }, h('h3', {}, 'By skill'), s.skills.map(skillMeter)),
    s.continents.length > 0 && h('section', { class: 'card' },
      h('h3', {}, 'Correct answers by continent'),
      s.continents.map(c => h('div', { class: 'meter' },
        h('b', {}, c.name),
        h('span', {}, `${c.accuracy}%`),
        h('div', { class: 'bar', role: 'img', 'aria-label': `${c.name}: ${c.accuracy}% correct` }, h('i', { style: `width:${c.accuracy}%; background: var(--${c.id})` }))))),
    s.mostMissed && h('section', { class: 'card' },
      h('h3', {}, 'Most missed country'),
      h('div', { class: 'list' }, h('button', { type: 'button', onClick: () => countrySheet(s.mostMissed.code, state, today) },
        flag(s.mostMissed.code, 'mini-flag'),
        h('b', { class: 'grow' }, COUNTRIES[s.mostMissed.code].name),
        h('span', { class: 'small muted' }, plural(s.mostMissed.count, 'miss', 'misses'))))));
}
