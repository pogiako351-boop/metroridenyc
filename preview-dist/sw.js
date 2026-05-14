/**
 * MetroRide NYC — Service Worker
 *
 * Strategy:
 *  - Network-First for MTA API calls (real-time accuracy is critical)
 *  - Cache-First for static Gold/Black UI assets (instant loading)
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `metroride-nyc-static-${CACHE_VERSION}`;
const API_CACHE = `metroride-nyc-api-${CACHE_VERSION}`;

// Static assets to cache immediately on install (Cache-First)
const STATIC_ASSETS = [
  '/nyc/',
  '/nyc/index.html',
  '/assets/images/metroride-nyc-icon.png',
  '/assets/images/mgenie-app-icon.png',
  '/manifest.json',
];

// URL patterns that need Network-First (MTA real-time data)
const NETWORK_FIRST_PATTERNS = [
  'api-endpoint.mta.info',
  'gtfs',
  'supabase.co',
  '/api/',
];

// ─── Install: pre-cache static shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently ignore failures during install (some assets may not exist yet)
      });
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: clean up old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch: routing logic ─────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http schemes
  if (!url.protocol.startsWith('http')) return;

  // Check if this is a Network-First request (MTA API / Supabase)
  const isNetworkFirst = NETWORK_FIRST_PATTERNS.some(
    (pattern) => url.href.includes(pattern)
  );

  if (isNetworkFirst) {
    // Network-First: always try live data first, fall back to cache
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (isStaticAsset(url.pathname)) {
    // Cache-First: UI shell, icons, fonts
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else {
    // Navigation requests: Network-First with offline fallback to app shell
    event.respondWith(navigationHandler(request));
  }
});

// ─── Strategies ──────────────────────────────────────────────────────────────

/**
 * Network-First: fetch from network, cache successful responses,
 * fall back to cache on network failure.
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Clone before consuming — cache a copy
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Cache-First: serve from cache immediately, update cache in background.
 * For static Gold/Black UI assets — instant loading.
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    // Stale-while-revalidate: update in background
    fetch(request).then((response) => {
      if (response.ok) cache.put(request, response);
    }).catch(() => {});
    return cached;
  }
  // Not in cache — fetch and store
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Navigation handler: Network-First with SPA shell fallback.
 * Ensures React Navigation routing works offline.
 */
async function navigationHandler(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    // Return cached app shell for SPA navigation
    const shell = await cache.match('/nyc/') || await cache.match('/nyc/index.html');
    if (shell) return shell;
    return new Response('MetroRide NYC — Offline', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isStaticAsset(pathname) {
  return (
    pathname.match(/\.(png|jpg|jpeg|webp|gif|svg|ico|woff|woff2|ttf|otf|css|js)$/) ||
    pathname.startsWith('/assets/')
  );
}
