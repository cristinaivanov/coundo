export const dayNumber = (date = new Date()) =>
  Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 864e5);

export const formatDay = (day, options = { day: 'numeric', month: 'short', year: 'numeric' }) =>
  new Date(day * 864e5).toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' });

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function shuffle(list, rng = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];

export const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'html') el.innerHTML = value;
    else if (key === 'style') el.style.cssText = value;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, value);
  }
  el.append(...children.flat(Infinity).filter(c => c !== null && c !== undefined && c !== false));
  return el;
}
