import { icon } from './icons.js';
import { clamp, h } from './util.js';

const TAP_SLOP = 9;
const MAX_SCALE = 1.6;
const TINY_PX = 8;
const LARGE_PX = 60;
const CAPITAL_RADIUS = 4;
const MARKER_MIN_SCALE = 0.022;
const MARKER_HIT = 24;
const FLY_MS = 520;
const FULLSCREEN_WORLD_HEIGHT = 0.7;
const LABEL_GAPS = [4, 10, 18, 28, 40];
const LABEL_TURNS = [0, 30, -30, 60, -60, 90, -90];
const rad = d => (d * Math.PI) / 180;

let data = null;
const paths = new Map();
let otherPath = null;
const probe = document.createElement('canvas').getContext('2d');

export function setMapData(json) {
  data = json;
  for (const [code, shape] of Object.entries(json.countries)) paths.set(code, new Path2D(shape.d));
  otherPath = new Path2D(json.other);
}

export const shapeOf = code => data.countries[code];

const miller = lat => 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * rad(lat)));

export function boxFromDegrees([west, south, east, north]) {
  const k = (data.units * 180) / Math.PI;
  const x = lon => (rad(lon - data.meridian) + Math.PI) * k;
  const y = lat => (miller(84) - miller(lat)) * k;
  return [x(west), y(north), x(east), y(south)];
}

export const worldBox = () => [0, 900, data.width, data.height];

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export class WorldMap {
  constructor({ view, paint, onTap = null, interactive = true, padding = 14, dots = () => true, labelSize = 13, scrollsPage = false, expandable = false }) {
    this.paint = paint;
    this.onTap = onTap;
    this.padding = padding;
    this.dots = dots;
    this.scrollsPage = scrollsPage;
    this.labelSize = labelSize;
    this.box = view;
    this.labels = [];
    this.capitals = [];
    this.emphasis = new Map();
    this.pointers = new Map();
    this.canvas = h('canvas', { role: 'img', 'aria-label': 'Map' });
    this.el = h('div', { class: `map${interactive ? '' : ' map-static'}` }, this.canvas);
    this.key = h('div', { class: 'map-key', hidden: true }, h('i'), 'Tiny country');
    if (interactive) {
      this.el.append(this.key, h('div', { class: 'map-zoom' },
        h('button', { type: 'button', 'aria-label': 'Zoom in', onClick: () => this.zoomBy(1.8) }, '+'),
        h('button', { type: 'button', 'aria-label': 'Zoom out', onClick: () => this.zoomBy(1 / 1.8) }, '−'),
        expandable && this.expandButton()));
      this.listen();
    }
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(this.el);
    this.scheme = matchMedia('(prefers-color-scheme: dark)');
    this.onScheme = () => { this.colors = null; this.draw(); };
    this.scheme.addEventListener('change', this.onScheme);
  }

  expandButton() {
    this.expander = h('button', { type: 'button', 'aria-label': 'Fullscreen map', onClick: () => (this.home ? this.collapse() : this.expand()) }, icon('expand'));
    return this.expander;
  }

  // Safari on iPhone has no fullscreen mode for pages, so the map moves into a layer over the app.
  expand() {
    const wasWholeWorld = this.isZoomedOut;
    cancelAnimationFrame(this.flight);
    this.before = { camera: { ...this.camera }, moved: this.moved };
    this.home = h('div', { class: this.el.className });
    this.el.replaceWith(this.home);
    document.body.append(this.el);
    this.el.classList.add('fullscreen');
    this.moved = true;
    this.resize();
    if (wasWholeWorld) this.camera.scale = (this.h * FULLSCREEN_WORLD_HEIGHT) / data.height;
    this.constrain();
    this.draw();
    this.showExpanded(true);
    this.onEscape = e => { if (e.key === 'Escape' && !document.querySelector('.backdrop')) this.collapse(); };
    document.addEventListener('keydown', this.onEscape);
  }

  collapse() {
    document.removeEventListener('keydown', this.onEscape);
    cancelAnimationFrame(this.flight);
    this.el.classList.remove('fullscreen');
    this.home.replaceWith(this.el);
    this.home = null;
    this.camera = this.before.camera;
    this.moved = this.before.moved;
    this.resize();
    this.draw();
    this.showExpanded(false);
  }

  showExpanded(on) {
    this.expander.replaceChildren(icon(on ? 'shrink' : 'expand'));
    this.expander.setAttribute('aria-label', on ? 'Exit fullscreen' : 'Fullscreen map');
  }

  get isZoomedOut() { return this.camera.scale <= this.minScale * 1.02; }

  destroy() {
    if (this.home) {
      document.removeEventListener('keydown', this.onEscape);
      this.el.remove();
    }
    this.observer.disconnect();
    this.scheme.removeEventListener('change', this.onScheme);
    cancelAnimationFrame(this.flight);
    cancelAnimationFrame(this.frame);
  }

  resize() {
    const { clientWidth: w, clientHeight: ht } = this.el;
    if (!w || !ht || (w === this.w && ht === this.h)) return;
    const ratio = Math.min(devicePixelRatio || 1, 3);
    const isFirst = !this.w;
    this.w = w;
    this.h = ht;
    this.ratio = ratio;
    this.canvas.width = Math.round(w * ratio);
    this.canvas.height = Math.round(ht * ratio);
    if (isFirst || !this.moved) this.camera = this.cameraFor(this.box);
    this.constrain();
    this.draw();
  }

  cameraFor([x0, y0, x1, y1]) {
    const scale = Math.min((this.w - this.padding * 2) / (x1 - x0), (this.h - this.padding * 2) / (y1 - y0));
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, scale: Math.min(scale, MAX_SCALE) };
  }

  get minScale() { return Math.min(this.w / data.width, this.h / data.height); }

  constrain() {
    const c = this.camera;
    c.scale = clamp(c.scale, this.minScale, MAX_SCALE);
    const halfW = this.w / 2 / c.scale;
    const halfH = this.h / 2 / c.scale;
    c.x = halfW * 2 >= data.width ? data.width / 2 : clamp(c.x, halfW, data.width - halfW);
    c.y = halfH * 2 >= data.height ? data.height / 2 : clamp(c.y, halfH, data.height - halfH);
  }

  toMap(px, py) {
    const c = this.camera;
    return [(px - this.w / 2) / c.scale + c.x, (py - this.h / 2) / c.scale + c.y];
  }

  toScreen([x, y]) {
    const c = this.camera;
    return [(x - c.x) * c.scale + this.w / 2, (y - c.y) * c.scale + this.h / 2];
  }

  flyTo(box) {
    this.box = box;
    if (!this.w) return;
    const from = { ...this.camera };
    this.camera = this.cameraFor(box);
    this.constrain();
    const to = { ...this.camera };
    if (reducedMotion()) { this.draw(); return; }
    const start = performance.now();
    cancelAnimationFrame(this.flight);
    const step = now => {
      const t = clamp((now - start) / FLY_MS, 0, 1);
      const e = 1 - (1 - t) ** 3;
      const scale = from.scale * (to.scale / from.scale) ** e;
      this.camera = { scale, x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e };
      this.draw();
      if (t < 1) this.flight = requestAnimationFrame(step);
    };
    this.camera = from;
    this.flight = requestAnimationFrame(step);
  }

  zoomBy(factor, px = this.w / 2, py = this.h / 2) {
    cancelAnimationFrame(this.flight);
    const before = this.toMap(px, py);
    this.camera.scale = clamp(this.camera.scale * factor, this.minScale, MAX_SCALE);
    const after = this.toMap(px, py);
    this.camera.x += before[0] - after[0];
    this.camera.y += before[1] - after[1];
    this.moved = true;
    this.constrain();
    this.requestDraw();
  }

  listen() {
    const c = this.canvas;
    const at = e => {
      const r = c.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    c.addEventListener('pointerdown', e => {
      c.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, at(e));
      if (this.pointers.size === 1) this.press = { start: at(e), travelled: 0, multi: false };
      else this.press.multi = true;
    });
    c.addEventListener('pointermove', e => {
      if (!this.pointers.has(e.pointerId)) return;
      const previous = this.pointers.get(e.pointerId);
      const now = at(e);
      if (this.pointers.size === 1) {
        this.press.travelled = Math.max(this.press.travelled, Math.hypot(now[0] - this.press.start[0], now[1] - this.press.start[1]));
        if (this.press.travelled > TAP_SLOP) {
          cancelAnimationFrame(this.flight);
          this.camera.x -= (now[0] - previous[0]) / this.camera.scale;
          this.camera.y -= (now[1] - previous[1]) / this.camera.scale;
          this.moved = true;
          this.constrain();
          this.requestDraw();
        }
      } else {
        const other = [...this.pointers].find(([id]) => id !== e.pointerId)[1];
        const gapBefore = Math.hypot(previous[0] - other[0], previous[1] - other[1]);
        const gapNow = Math.hypot(now[0] - other[0], now[1] - other[1]);
        this.camera.x -= (now[0] - previous[0]) / 2 / this.camera.scale;
        this.camera.y -= (now[1] - previous[1]) / 2 / this.camera.scale;
        if (gapBefore > 0) this.zoomBy(gapNow / gapBefore, (now[0] + other[0]) / 2, (now[1] + other[1]) / 2);
      }
      this.pointers.set(e.pointerId, now);
    });
    const release = e => {
      if (!this.pointers.delete(e.pointerId)) return;
      const isTap = e.type === 'pointerup' && this.pointers.size === 0 && !this.press.multi && this.press.travelled <= TAP_SLOP;
      if (isTap && this.onTap) this.onTap(this.hit(...at(e)));
    };
    c.addEventListener('pointerup', release);
    c.addEventListener('pointercancel', release);
    c.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoomBy(Math.exp(-e.deltaY * 0.0022), ...at(e));
    }, { passive: false });
  }

  isTiny(code) {
    return Math.sqrt(shapeOf(code).a) * this.camera.scale < TINY_PX;
  }

  needsMarker(code) {
    if (!this.isTiny(code)) return false;
    return this.emphasis.has(code) || (this.dots(code) && this.camera.scale >= MARKER_MIN_SCALE);
  }

  markerRadius() { return clamp(2.6 + this.camera.scale * 26, 3, 7); }

  contains(code, x, y) {
    const [x0, y0, x1, y1] = shapeOf(code).b;
    if (x < x0 || x > x1 || y < y0 || y > y1) return false;
    return probe.isPointInPath(paths.get(code), x, y, 'evenodd');
  }

  hit(px, py) {
    const codes = Object.keys(data.countries);
    const near = codes
      .filter(code => this.needsMarker(code))
      .map(code => {
        const [sx, sy] = this.toScreen(shapeOf(code).c);
        return { code, gap: Math.hypot(sx - px, sy - py) };
      })
      .sort((a, b) => a.gap - b.gap)[0];
    const under = codes.find(code => this.contains(code, ...this.toMap(px, py)));
    const underIsLarge = under && Math.sqrt(shapeOf(under).a) * this.camera.scale > LARGE_PX;
    const reach = !under ? MARKER_HIT : this.markerRadius() + (underIsLarge ? 6 : 0);
    if (near && near.gap <= reach) return near.code;
    if (under) return under;
    for (const r of [5, 10, 15]) {
      for (let a = 0; a < 12; a++) {
        const point = this.toMap(px + r * Math.cos((a * Math.PI) / 6), py + r * Math.sin((a * Math.PI) / 6));
        const found = codes.find(code => this.contains(code, ...point));
        if (found) return found;
      }
    }
    return null;
  }

  requestDraw() {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.draw());
  }

  palette() {
    if (!this.colors) {
      const css = getComputedStyle(document.documentElement);
      const read = name => css.getPropertyValue(name).trim();
      this.colors = {
        sea: read('--sea'), land: read('--land'), other: read('--land-other'), border: read('--land-border'),
        ink: read('--ink'), halo: read('--surface'), read,
      };
    }
    return this.colors;
  }

  resolve(color) {
    return color.startsWith('--') ? this.palette().read(color) : color;
  }

  draw() {
    if (!this.w) return;
    const ctx = this.canvas.getContext('2d');
    const p = this.palette();
    const { x, y, scale } = this.camera;
    const r = this.ratio;
    this.canvas.style.touchAction = this.scrollsPage && this.isZoomedOut && !this.home ? 'pan-y' : 'none';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = p.sea;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const s = scale * r;
    ctx.setTransform(s, 0, 0, s, (this.w / 2) * r - x * s, (this.h / 2) * r - y * s);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 0.7 / scale;
    ctx.strokeStyle = p.border;
    ctx.fillStyle = p.other;
    ctx.fill(otherPath, 'evenodd');

    const [left, top] = this.toMap(0, 0);
    const [right, bottom] = this.toMap(this.w, this.h);
    const visible = Object.keys(data.countries).filter(code => {
      const [x0, y0, x1, y1] = shapeOf(code).b;
      return x1 >= left && x0 <= right && y1 >= top && y0 <= bottom;
    });
    const fillFor = code => this.resolve(this.emphasis.get(code) ?? this.paint(code));
    for (const code of visible) {
      ctx.fillStyle = fillFor(code);
      ctx.fill(paths.get(code), 'evenodd');
      ctx.stroke(paths.get(code));
    }
    ctx.lineWidth = 1.6 / scale;
    ctx.strokeStyle = p.ink;
    for (const code of visible.filter(c => this.emphasis.has(c))) ctx.stroke(paths.get(code));

    ctx.setTransform(r, 0, 0, r, 0, 0);
    const radius = this.markerRadius();
    const markers = visible.filter(code => this.needsMarker(code))
      .sort((a, b) => this.emphasis.has(a) - this.emphasis.has(b));
    for (const code of markers) {
      const [sx, sy] = this.toScreen(shapeOf(code).c);
      const strong = this.emphasis.has(code);
      ctx.beginPath();
      ctx.arc(sx, sy, strong ? radius + 2 : radius, 0, Math.PI * 2);
      ctx.fillStyle = fillFor(code);
      ctx.fill();
      ctx.lineWidth = strong ? 2 : 1.2;
      ctx.strokeStyle = strong ? p.ink : p.halo;
      ctx.stroke();
      if (!strong) {
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = p.ink;
        ctx.stroke();
      }
    }
    this.drawCapitals(ctx, p);
    this.key.hidden = !markers.some(code => !this.emphasis.has(code) && this.dots(code));
    this.drawLabels(ctx, p, radius);
  }

  drawCapitals(ctx, p) {
    for (const code of this.capitals) {
      const [x, y] = this.toScreen(shapeOf(code).p);
      ctx.beginPath();
      ctx.arc(x, y, CAPITAL_RADIUS, 0, Math.PI * 2);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#fff';
      ctx.stroke();
      ctx.fillStyle = p.read('--capital');
      ctx.fill();
    }
  }

  // Directions to try, starting with straight away from the highlighted country.
  labelAngles(code) {
    const others = [...this.emphasis.keys()].filter(other => other !== code).map(other => this.toScreen(shapeOf(other).c));
    const [sx, sy] = this.toScreen(shapeOf(code).c);
    if (others.length === 0) return [-90, 90, 0, 180].map(rad);
    const ox = others.reduce((sum, o) => sum + o[0], 0) / others.length;
    const oy = others.reduce((sum, o) => sum + o[1], 0) / others.length;
    const away = Math.atan2(sy - oy, sx - ox);
    return LABEL_TURNS.map(turn => away + rad(turn));
  }

  placeLabel({ code }, w, ht, taken, radius) {
    const [sx, sy] = this.toScreen(shapeOf(code).c);
    const overlaps = (a, b) => Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h;
    const isFree = box => !taken.some(t => overlaps(box, t))
      && box.x >= w / 2 && box.x <= this.w - w / 2 && box.y >= ht / 2 && box.y <= this.h - ht / 2;
    const boxAt = (x, y) => ({ x, y, w, h: ht, sx, sy });
    const centered = boxAt(sx, sy);
    if (!this.needsMarker(code) && isFree(centered)) return centered;
    const angles = this.labelAngles(code);
    for (const gap of LABEL_GAPS) {
      for (const angle of angles) {
        const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
        const edge = Math.min(w / 2 / Math.max(Math.abs(cos), 0.01), ht / 2 / Math.max(Math.abs(sin), 0.01));
        const reach = edge + gap + (this.needsMarker(code) ? radius : 0);
        const box = boxAt(sx + cos * reach, sy + sin * reach);
        if (isFree(box)) return box;
      }
    }
    return { ...centered, x: clamp(sx, w / 2, Math.max(w / 2, this.w - w / 2)), y: clamp(sy, ht / 2, this.h - ht / 2) };
  }

  labelInside({ code }, w, ht) {
    const [x, y, room] = shapeOf(code).l;
    if (room * this.camera.scale < w) return null;
    const [sx, sy] = this.toScreen([x, y]);
    const isOnScreen = sx >= w / 2 && sx <= this.w - w / 2 && sy >= ht / 2 && sy <= this.h - ht / 2;
    return isOnScreen ? { x: sx, y: sy, w, h: ht, sx, sy } : null;
  }

  drawLabels(ctx, p, radius) {
    const size = this.labelSize;
    ctx.font = `600 ${size}px ui-rounded, -apple-system, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    const taken = [];
    const boxes = this.labels.flatMap(label => {
      const w = ctx.measureText(label.text).width + 6;
      const box = this.emphasis.has(label.code)
        ? this.placeLabel(label, w, size + 4, taken, radius)
        : this.labelInside(label, w, size + 4);
      if (!box) return [];
      taken.push(box);
      return [{ ...box, ...label }];
    });
    const isBesideCountry = b => Math.abs(b.x - b.sx) * 2 > b.w || Math.abs(b.y - b.sy) * 2 > b.h;
    for (const b of boxes.filter(isBesideCountry)) {
      for (const [width, color] of [[3, p.halo], [1.2, p.ink]]) {
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.sx, b.sy);
        ctx.stroke();
      }
      if (this.needsMarker(b.code)) continue;
      ctx.beginPath();
      ctx.arc(b.sx, b.sy, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = p.ink;
      ctx.fill();
    }
    for (const b of boxes) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = p.halo;
      ctx.strokeText(b.text, b.x, b.y);
      ctx.fillStyle = p.ink;
      ctx.fillText(b.text, b.x, b.y);
    }
  }
}
