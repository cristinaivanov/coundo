const BAR_COLORS = { light: '#e6eff2', dark: '#0f1f28' };
const systemDark = matchMedia('(prefers-color-scheme: dark)');

export const THEMES = [['auto', 'Automatic'], ['light', 'Light'], ['dark', 'Dark']];

let choice = 'auto';

export function applyTheme(next) {
  choice = next;
  const theme = choice in BAR_COLORS ? choice : systemDark.matches ? 'dark' : 'light';
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = BAR_COLORS[theme];
  window.dispatchEvent(new Event('themechange'));
}

systemDark.addEventListener('change', () => applyTheme(choice));
