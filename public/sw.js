/* VUKA Lite service worker - offline first, 3G friendly */
const VERSION = 'v1';
const STATIC = `vuka-static-${VERSION}`;
const PAGES = `vuka-pages-${VERSION}`;
const TILES = `vuka-tiles-${VERSION}`;
const FONTS = `vuka-fonts-${VERSION}`;
const MAX_TILES = 400;
const PRECACHE = ['/offline.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png', '/login'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.addAll(PRECACHE).catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('vuka-') && ![STATIC, PAGES, TILES, FONTS].includes(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

async function trim(cacheName, max) {
  const c = await caches.open(cacheName);
  const keys = await c.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => c.delete(k)));
}

function timeout(ms) { return new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms)); }

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Map tiles: cache first, so visited areas work offline
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(
      caches.open(TILES).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok || res.type === 'opaque') { c.put(req, res.clone()); trim(TILES, MAX_TILES); }
          return res;
        } catch { return new Response('', { status: 504 }); }
      })
    );
    return;
  }

  // Google Fonts: stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTS).then(async (c) => {
        const hit = await c.match(req);
        const net = fetch(req).then((res) => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Immutable build assets & icons: cache first
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.open(STATIC).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // Pages + RSC payloads: network first (with a 4s cap for slow 3G), fall back to cache, then offline page
  event.respondWith(
    (async () => {
      const c = await caches.open(PAGES);
      try {
        const res = await Promise.race([fetch(req), timeout(4000)]);
        if (res && res.ok) c.put(req, res.clone());
        return res;
      } catch {
        const hit = await c.match(req, { ignoreVary: true });
        if (hit) return hit;
        if (req.mode === 'navigate') return (await caches.match('/offline.html')) || Response.error();
        return Response.error();
      }
    })()
  );
});
