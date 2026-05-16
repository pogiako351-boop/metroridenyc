/**
 * MetroRide NYC — Service Worker
 *
 * Caching Strategy:
 *  - Network-First for MTA/GTFS API calls (real-time accuracy is critical)
 *  - Cache-First for static UI assets (JS, CSS, images — instant loading)
 *  - Offline fallback page support for navigation requests
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `metroride-nyc-static-${CACHE_VERSION}`;
const API_CACHE = `metroride-nyc-api-${CACHE_VERSION}`;

// Static assets to pre-cache on install (Cache-First)
// Note: manifest.json excluded — it should always be fetched fresh
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/images/metroride-nyc-icon.png',
];

// URL patterns that need Network-First (MTA real-time data)
const NETWORK_FIRST_PATTERNS = [
  'api-endpoint.mta.info',
  'gtfs',
  'mta',
  'supabase.co',
  '/api/',
];

// Files that should NEVER be cached with long TTL (always fresh)
const NEVER_CACHE_LONG = [
  '_redirects',
  'manifest.json',
  'sw.js',
];

// Offline fallback HTML for when network is unavailable
const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MetroRide NYC — Offline</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #121212;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .container {
      text-align: center;
      max-width: 360px;
    }
    .icon { font-size: 64px; margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #FFD700; }
    p { font-size: 14px; color: #888; line-height: 1.6; margin-bottom: 24px; }
    button {
      background: #FFD700;
      color: #000;
      border: none;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
    }
    button:active { opacity: 0.8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">🚇</div>
    <h1>You're Offline</h1>
    <p>MetroRide NYC needs a connection for real-time subway data. Check your network and try again.</p>
    <button onclick="location.reload()">Retry Connection</button>
  </div>
</body>
</html>`;

// ─── Install: pre-cache static shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Cache the offline fallback page
      cache.put(
        new Request('/_offline'),
        new Response(OFFLINE_FALLBACK_HTML, {
          headers: { 'Content-Type': 'text/html' },
        })
      );
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

  // Never long-cache certain files — always network-first
  const isNeverCache = NEVER_CACHE_LONG.some(
    (file) => url.pathname.endsWith(file)
  );
  if (isNeverCache) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Check if this is a Network-First request (MTA API / Supabase)
  const isNetworkFirst = NETWORK_FIRST_PATTERNS.some(
    (pattern) => url.href.includes(pattern)
  );

  if (isNetworkFirst) {
    // Network-First: always try live data first, fall back to cache
    event.respondWith(networkFirst(request, API_CACHE));
  } else if (isStaticAsset(url.pathname)) {
    // Cache-First: UI shell, icons, fonts, JS, CSS bundles
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else {
    // Navigation requests: Network-First with offline fallback to app shell
    event.respondWith(navigationHandler(request));
  }
});

// ─── Message handler: cache status queries ───────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.keys().then((keys) => {
      const isActive = keys.length > 0;
      event.ports[0].postMessage({ cached: isActive, cacheNames: keys });
    });
  }
});

// ─── Strategies ──────────────────────────────────────────────────────────────

/**
 * Network-First: fetch from network, cache successful responses,
 * fall back to cache on network failure.
 * Used for all MTA/GTFS API calls where real-time accuracy matters.
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
 * Used for static assets (JS, CSS, images) — instant loading.
 * Stale-while-revalidate pattern ensures freshness.
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
 * Falls back to offline page if shell isn't cached.
 */
async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    // Cache successful navigation responses for offline use
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    // Try cached app shell for SPA navigation
    const shell = await cache.match('/') || await cache.match('/index.html');
    if (shell) return shell;
    // Last resort: serve offline fallback page
    const offline = await cache.match('/_offline');
    if (offline) return offline;
    return new Response(OFFLINE_FALLBACK_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isStaticAsset(pathname) {
  return (
    pathname.match(/\.(png|jpg|jpeg|webp|gif|svg|ico|woff|woff2|ttf|otf|css|js|map)$/) ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/_expo/')
  );
}
