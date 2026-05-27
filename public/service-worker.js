// Petita SW — só cacheia assets estáticos. Nunca intercepta navegação / API.
// Isso evita o erro "redirected response was used for a request whose redirect mode is not follow".
const CACHE = 'petita-v6';
const ASSETS = ['/logo-petita.png', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(ASSETS.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // NUNCA intercepta navegação ou API — deixa o browser/middleware fazer redirect normalmente.
  if (request.mode === 'navigate') return;
  if (url.pathname.startsWith('/api/')) return;
  if (url.pathname.startsWith('/_next/data/')) return;

  // Só cacheia assets estáticos imutáveis
  const isCacheable =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/logo-petita.png' ||
    url.pathname === '/manifest.json' ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg');

  if (!isCacheable) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request, { redirect: 'follow' }).then((res) => {
        if (!res || !res.ok || res.type === 'opaqueredirect' || res.redirected) return res;
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(request, clone));
        return res;
      }).catch(() => cached);
    })
  );
});
