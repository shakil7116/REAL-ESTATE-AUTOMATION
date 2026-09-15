/**
 * PropertyEase Service Worker — v5
 *
 * FIX (v5): Never fall back to cached '/' for routes that aren't themselves cached.
 * Previously, navigating to /dashboard would fail the fetch and silently serve the
 * marketing landing page — producing the "HTML outside the app" symptom.
 *
 * Strategy:
 *   - /api/*         → network only, never cached
 *   - /_next/*       → network only, never cached (Next.js internals)
 *   - /dashboard/*   → precached shell; served from cache ONLY if we have it
 *   - /              → precached shell
 *   - Everything else → network only, NO fallback to /
 */

const CACHE_NAME = 'propertyease-v5';
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/login',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  // Immediately take control of all open clients so the new SW applies right away
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ── API & Next.js internal requests: always hit the network ────────────────
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.searchParams.has('_rsc') ||
    event.request.headers.get('RSC') === '1'
  ) {
    return; // no respondWith — let the browser handle it directly
  }

  // ── Non-GET requests: pass through to network ──────────────────────────────
  if (event.request.method !== 'GET') return;

  // ── Try cache first, but only serve what was actually precached ─────────────
  if (event.request.destination === 'document') {
    event.respondWith(
      (async () => {
        // 1. Network-first for document requests
        try {
          const networkResp = await fetch(event.request);
          // Successful response — cache it for next time
          if (networkResp && networkResp.ok && networkResp.type === 'basic') {
            const clone = networkResp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone)).catch(() => {});
          }
          return networkResp;
        } catch {
          // 2. Network failed — try cache for THIS exact URL
          const cached = await caches.match(event.request);
          if (cached) return cached;
          // 3. NOT in cache either — do NOT fall back to '/'.
          //    Return a 503 so the browser shows an offline error instead
          //    of injecting the wrong page.
          return new Response(
            '<!DOCTYPE html><html><body><h1>Offline — page not available</h1></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html' } }
          );
        }
      })()
    );
    return;
  }

  // ── Static assets (scripts, styles, images): cache-first ───────────────────
  if (
    event.request.destination === 'script' ||
    event.request.destination === 'style' ||
    event.request.destination === 'image' ||
    event.request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone)).catch(() => {});
          }
          return networkResponse;
        });
      }).catch(() => new Response('', { status: 404 }))
    );
    return;
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-payments') event.waitUntil(Promise.resolve());
});

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(self.registration.showNotification(data.title || 'PropertyEase', {
    body: data.body || 'You have a new notification',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: data.url ? { url: data.url } : undefined,
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(clients.openWindow(url));
});
