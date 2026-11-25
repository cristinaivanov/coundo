import { clearState, freshState, loadState, saveState } from './store.js';
import { buildLesson, buildRecap, buildTest, buildTrickyPractice, isResumable } from './lesson.js';
import { setMap } from './questions.js';
import { setMapData } from './map.js';
import { runSession } from './player.js';
import { installScreen, passportScreen, settingsScreen, todayScreen, welcomeScreen } from './screens.js';
import { ranksScreen } from './preview.js';
import { icon } from './icons.js';
import { dayNumber, h } from './util.js';

const TABS = [
  ['today', 'Today', todayScreen],
  ['passport', 'Passport', passportScreen],
];

const params = new URLSearchParams(location.search);
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);

const root = document.getElementById('app');
let tab = 'today';
let maps = [];
let playing = false;
let renderedDay = null;
let installSkipped = false;
let inSettings = false;

const ctx = {
  state: loadState(),
  today: () => dayNumber(),
  save: () => saveState(ctx.state),
  useMap: map => { maps.push(map); return map; },
  startLesson: () => start(buildLesson(ctx.state, ctx.today())),
  startRecap: () => start(buildRecap(ctx.state, ctx.today())),
  startTricky: () => start(buildTrickyPractice(ctx.state, ctx.today())),
  openSettings: () => { inSettings = true; render(); },
  closeSettings: () => { inSettings = false; render(); },
  startTest: regionId => start(buildTest(ctx.state, regionId, ctx.today())),
  resume: () => start(ctx.state.session),
  finishWelcome: () => {
    ctx.state.welcomed = true;
    ctx.save();
    navigator.storage?.persist?.().catch(() => {});
    render();
  },
  skipInstall: () => { installSkipped = true; render(); },
  replaceState: state => {
    ctx.state = { ...state, welcomed: true };
    ctx.save();
    tab = 'today';
    inSettings = false;
    render();
  },
  reset: () => {
    clearState();
    ctx.state = freshState();
    tab = 'today';
    inSettings = false;
    render();
  },
};

function clearMaps() {
  maps.forEach(m => m.destroy());
  maps = [];
}

function start(session) {
  if (session.items.length === 0) return;
  clearMaps();
  playing = true;
  runSession(root, ctx, session, () => { playing = false; tab = 'today'; render(); });
}

const needsInstall = () => /iPhone|iPad|iPod/.test(navigator.userAgent) && !navigator.standalone && !installSkipped && !ctx.state.welcomed;

function render() {
  clearMaps();
  renderedDay = ctx.today();
  if (isLocal && params.get('preview') === 'ranks') { root.replaceChildren(ranksScreen()); return; }
  if (needsInstall()) { root.replaceChildren(installScreen(ctx)); return; }
  if (!ctx.state.welcomed) { root.replaceChildren(welcomeScreen(ctx)); return; }
  const [, , tabScreen] = TABS.find(([id]) => id === tab);
  const screen = inSettings ? settingsScreen : tabScreen;
  root.replaceChildren(
    screen(ctx),
    h('nav', { class: 'tabs', 'aria-label': 'Main' }, TABS.map(([id, label]) =>
      h('button', { type: 'button', 'aria-current': id === tab ? 'page' : null, onClick: () => { tab = id; inSettings = false; render(); } }, icon(id), label))));
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !playing && renderedDay !== null && renderedDay !== ctx.today()) render();
});

async function boot() {
  const map = await (await fetch('./data/map.json', { cache: 'no-cache' })).json();
  setMap(map);
  setMapData(map);
  if (ctx.state.session && !isResumable(ctx.state.session, ctx.today())) {
    ctx.state.session = null;
    ctx.save();
  }
  render();
}

boot();

const wantsWorker = !isLocal || params.has('offline');
if ('serviceWorker' in navigator && wantsWorker) navigator.serviceWorker.register('./sw.js');
