import { EMPTY_STREAK } from './streak.js';

const KEY = 'coundo-state';
const APP = 'coundo';
const VERSION = 1;

export const freshState = () => ({
  app: APP,
  version: VERSION,
  welcomed: false,
  facts: {},
  met: {},
  streak: { ...EMPTY_STREAK },
  xp: 0,
  stamps: {},
  days: {},
  session: null,
  settings: { pace: 2, sound: true, continent: 'eu', theme: 'auto' },
});

export function parseBackup(text) {
  const data = JSON.parse(text);
  const valid = data?.app === APP
    && data.version === VERSION
    && ['facts', 'met', 'streak', 'stamps', 'days', 'settings'].every(k => data[k] && typeof data[k] === 'object')
    && Number.isFinite(data.xp);
  if (!valid) throw new Error('Not a Coundo backup');
  const base = freshState();
  return { ...base, ...data, settings: { ...base.settings, ...data.settings }, session: null };
}

export function loadState(storage = localStorage) {
  const raw = storage.getItem(KEY);
  if (!raw) return freshState();
  try {
    const { session, ...rest } = JSON.parse(raw);
    return { ...parseBackup(JSON.stringify(rest)), session: session ?? null };
  } catch {
    storage.setItem(`${KEY}-unreadable`, raw);
    return freshState();
  }
}

export const saveState = (state, storage = localStorage) => storage.setItem(KEY, JSON.stringify(state));

export const clearState = (storage = localStorage) => storage.removeItem(KEY);

export const backupText = state => JSON.stringify({ ...state, session: null });
