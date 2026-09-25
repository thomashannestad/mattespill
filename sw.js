/* Service worker: nett først, cache som reserve. Spillet virker uten nett etter første besøk.
   Når filer endres: bump ?v= i index.html og CACHE/SHELL her i samme commit. */
const CACHE = 'enhjorningsdalen-v11';
const SHELL = ['./', './index.html', './styles.css?v=11', './game.js?v=11', './app.js?v=11', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(SHELL.map(url => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(request)
    .then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); }
      return response;
    })
    .catch(() => caches.match(request, { ignoreSearch: request.mode === 'navigate' })
      .then(cached => cached || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
