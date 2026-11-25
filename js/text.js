import { COUNTRIES } from '../data/countries.js';

export const normalize = text => text
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/\bst\b\.?/g, 'saint')
  .replace(/[^a-z ]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const squash = text => normalize(text).replace(/ /g, '');

export function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

const allowedTypos = length => (length <= 4 ? 0 : length <= 7 ? 1 : 2);

export function checkCapital(code, typed) {
  const answer = squash(typed);
  if (!answer) return 'wrong';
  const country = COUNTRIES[code];
  const accepted = [country.capital, ...country.alternatives].map(squash);
  if (accepted.includes(answer)) return 'exact';
  const isAnotherCapital = Object.values(COUNTRIES)
    .some(other => other.code !== code && [other.capital, ...other.alternatives].some(c => squash(c) === answer));
  if (isAnotherCapital) return 'wrong';
  return accepted.some(a => editDistance(a, answer) <= allowedTypos(a.length)) ? 'typo' : 'wrong';
}
