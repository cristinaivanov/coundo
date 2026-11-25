export const EMPTY_STREAK = { count: 0, best: 0, lastDay: null };

const MAX_GAP = 2;

export function currentStreak(streak, today) {
  if (streak.lastDay === null) return 0;
  return today - streak.lastDay <= MAX_GAP ? streak.count : 0;
}

export const isStreakAtRisk = (streak, today) =>
  currentStreak(streak, today) > 0 && today - streak.lastDay === MAX_GAP;

export const isDoneToday = (streak, today) => streak.lastDay !== null && streak.lastDay >= today;

export function recordLesson(streak, today) {
  if (isDoneToday(streak, today)) return streak;
  const count = currentStreak(streak, today) + 1;
  return { count, best: Math.max(streak.best, count), lastDay: today };
}
