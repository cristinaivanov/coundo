import { RANKS } from './game.js';
import { rankBadge } from './icons.js';
import { h } from './util.js';

export function ranksScreen() {
  const ringFor = i => (i === RANKS.length - 1 ? 1 : 0.65);
  return h('div', { class: 'screen' },
    h('h1', {}, 'All titles'),
    h('p', { class: 'muted' }, 'Mock page. The gold ring shows progress to the next title.'),
    h('div', { class: 'rank-gallery' }, RANKS.map((rank, i) => h('section', { class: 'card' },
      rankBadge(ringFor(i), rank.name),
      h('h3', {}, rank.name),
      h('span', { class: 'small muted' }, rank.xp === 0 ? 'Where you start' : `${rank.xp.toLocaleString('en')} XP`)))),
    h('h2', { class: 'section-title' }, 'At small size'),
    h('div', { class: 'rank-strip' }, RANKS.map((rank, i) => rankBadge(ringFor(i), rank.name))));
}
