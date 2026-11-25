export const RANKS = [
  ['Tourist', 0],
  ['Backpacker', 500],
  ['Traveler', 2000],
  ['Explorer', 5000],
  ['Navigator', 10000],
  ['Globetrotter', 20000],
  ['Diplomat', 35000],
  ['Ambassador', 50000],
].map(([name, xp]) => ({ name, xp }));

export function rankFor(xp) {
  const index = RANKS.findLastIndex(r => xp >= r.xp);
  const rank = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  return { ...rank, index, next, progress: next ? (xp - rank.xp) / (next.xp - rank.xp) : 1 };
}

const HARD_FORMATS = new Set(['cap-type', 'map-tap', 'flag-pick']);

export const XP = { easy: 10, hard: 15, fix: 5, lesson: 20, stamp: 100 };

export const xpForAnswer = (format, phase) =>
  phase === 'fix' ? XP.fix : HARD_FORMATS.has(format) ? XP.hard : XP.easy;
