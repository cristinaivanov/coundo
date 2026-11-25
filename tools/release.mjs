// Usage: node tools/release.mjs - rewrites sw.js so phones pick up the current files.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const list = dir => fs.readdirSync(path.join(root, dir)).filter(f => !f.startsWith('.')).sort().map(f => `${dir}/${f}`);
const files = ['index.html', 'style.css', 'manifest.webmanifest', ...list('js'), ...list('data'), ...list('icons'), ...list('flags')];
const hash = createHash('sha256');
for (const file of files) hash.update(file).update(fs.readFileSync(path.join(root, file)));
const version = hash.digest('hex').slice(0, 10);

fs.writeFileSync(path.join(root, 'sw.js'), `const PREFIX = 'coundo-';
const CACHE = PREFIX + '${version}';
const FILES = ${JSON.stringify(['./', ...files.map(f => `./${f}`)])};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(FILES.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  event.respondWith(
    caches.open(CACHE).then(cache => cache.match(event.request, { ignoreSearch: true })
      .then(hit => hit ?? fetch(event.request))),
  );
});
`);
console.log(`${files.length} files, version ${version}`);
