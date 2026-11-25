import { RANK_ART } from './rank-art.js';
import { h } from './util.js';

const SHAPES = {
  today: '<circle class="body" cx="12" cy="12" r="9.200"/><path class="detail" d="M15.800 8.200l-2.100 5.500-5.500 2.100 2.100-5.500z"/>',
  passport: '<rect class="body" x="4.800" y="2.800" width="14.400" height="18.400" rx="3"/><circle class="detail" cx="12" cy="10" r="3.500"/><path class="detail" d="M9.200 17.300h5.600"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M10.200 3.500h3.600l.5 2.500 1.700 1 2.400-.8 1.800 3.100-1.900 1.700v2l1.900 1.700-1.800 3.100-2.400-.8-1.700 1-.5 2.500h-3.600l-.5-2.500-1.700-1-2.400.8-1.800-3.100 1.900-1.700v-2l-1.900-1.700 1.800-3.100 2.400.8 1.700-1z"/>',
  expand: '<path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"/>',
  shrink: '<path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5"/>',
  back: '<path d="M14.500 5.500L8 12l6.500 6.500"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  check: '<path d="M5 12.500l4.500 4.500L19 7.500"/>',
};

const FILLED = {
  tick: '<path fill="none" stroke="#fff" stroke-width="3.600" stroke-linecap="round" stroke-linejoin="round" d="M5 12.800l4.600 4.600L19.200 7.400"/>',
  flame: '<path d="M12.600 1.800c.5 3.600 5.900 6.400 5.900 12.200a6.500 6.500 0 01-13 0c0-2.700 1.300-4.600 2.700-6 .2 1.500.8 2.500 1.700 3 .1-3.600 1-6.800 2.700-9.200z"/><path class="inner" d="M12.200 12.300c.3 1.600 2.600 2.500 2.600 4.800a2.800 2.800 0 01-5.600 0c0-2 1.900-2.800 3-4.800z"/>',
  star: '<path d="M12 2.200l2.900 6.100 6.700.9-4.900 4.700 1.200 6.700-5.900-3.300-5.900 3.300 1.200-6.700L2.400 9.200l6.700-.9z"/>',
  stamps: '<path d="M8.500 13c.7-2-1-3.300-1-5.600a4.500 4.500 0 019 0c0 2.300-1.700 3.600-1 5.600H18a2.500 2.500 0 012.500 2.500V18h-17v-2.500A2.500 2.500 0 016 13z"/><rect x="3.500" y="19.300" width="17" height="2.500" rx="1.250"/><circle class="inner" cx="10.700" cy="6.700" r="1.500"/>',
  spark: '<path d="M11 2.500c.8 5.600 2.900 7.700 8.500 8.500-5.600.8-7.700 2.900-8.500 8.500-.8-5.600-2.900-7.700-8.500-8.500 5.600-.8 7.700-2.900 8.500-8.500z"/><path d="M18.500 15c.3 2.300 1.200 3.200 3.500 3.500-2.300.3-3.200 1.200-3.500 3.500-.3-2.300-1.200-3.200-3.500-3.500 2.300-.3 3.200-1.200 3.500-3.500z"/><circle class="inner" cx="11" cy="11" r="1.900"/>',
};

const RING_LENGTH = 2 * Math.PI * 44;

export const filledIcon = name => h('span', {
  'aria-hidden': 'true',
  style: 'display:contents',
  html: `<svg class="filled-icon" viewBox="0 0 24 24">${FILLED[name]}</svg>`,
});

export function rankBadge(progress, name) {
  const { face, art } = RANK_ART[name];
  const clip = `face-${name}`;
  return h('span', {
    'aria-hidden': 'true',
    style: 'display:contents',
    html: `<svg class="rank-badge" viewBox="0 0 100 100">
      <clipPath id="${clip}"><circle cx="50" cy="50" r="34"/></clipPath>
      <circle class="track" cx="50" cy="50" r="44"/>
      <circle class="progress" cx="50" cy="50" r="44" transform="rotate(-90 50 50)" stroke-dasharray="${RING_LENGTH * progress} ${RING_LENGTH}"${progress > 0 ? '' : ' visibility="hidden"'}/>
      <circle cx="50" cy="50" r="34" fill="${face}"/>
      <g clip-path="url(#${clip})">${art}</g>
    </svg>`,
  });
}

export const icon = name => h('span', {
  'aria-hidden': 'true',
  style: 'display:contents',
  html: `<svg class="icon" viewBox="0 0 24 24">${SHAPES[name]}</svg>`,
});
