export const DARK = '#33272a';

export const dot = (x, y, r, fill) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`;
export const oval = (x, y, rx, ry, fill, turn = 0) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"${turn ? ` transform="rotate(${turn} ${x} ${y})"` : ''}/>`;
export const box = (x, y, w, h, r, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"/>`;
export const shape = (d, fill) => `<path d="${d}" fill="${fill}" stroke="${fill}" stroke-width="1.5" stroke-linejoin="round"/>`;
export const line = (d, color, width = 2) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const eye = (x, y, r = 2.6) => dot(x, y, r, DARK) + dot(x + r * 0.3, y - r * 0.35, r * 0.36, '#fff');
export const eyes = (y, gap, r) => eye(50 - gap, y, r) + eye(50 + gap, y, r);
export const cheeks = (y, gap, color = '#f29a94') => oval(50 - gap, y, 3.4, 2.2, color) + oval(50 + gap, y, 3.4, 2.2, color);
export const smile = (y, w = 3) => line(`M${50 - w} ${y}q${w / 2} 2.600 ${w} 0q${w / 2} 2.600 ${w} 0`, DARK, 1.6);
export const spin = (n, draw) => Array.from({ length: n }, (_, i) => draw((360 / n) * i)).join('');
export const cloud = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#fff"><circle r="4"/><circle cx="5" cy="-2" r="5"/><circle cx="10" r="4"/><rect y="0" width="10" height="4" rx="2"/></g>`;
