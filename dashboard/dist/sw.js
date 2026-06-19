/**
 * CSR-First Service Worker for Atheon Benchmark Dashboard
 * Client-Side Rendering First strategy for better scalability
 */

const CACHE_VERSION = 'v2';
const CACHE_PREFIX = 'atheon-benchmark-';

// Cache strategies
const CACHE_STRATEGIES = {
  NETWORK_FIRST: 'network-first',
  CACHE_FIRST: 'cache-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Cache configurations for different resource types
const CACHE_CONFIG = {
  // Static assets - cache first for performance
  static: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 365 * 24 * 60 * 60, // 1 year
    maxEntries: 100
  },
  // API calls - network first for fresh data
  api: {
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    maxAge: 5 * 60, // 5 minutes
    maxEntries: 50
  },
  // Pages - stale while revalidate for balance
  pages: {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    maxAge: 24 * 60 * 60, // 24 hours
    maxEntries: 20
  },
  // Benchmark results - cache first for offline support
  results: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 7 * 24 * 60 * 60, // 7 days
    maxEntries: 100
  }
};

// URLs to pre-cache
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/icons/icon.svg',
  '/app/page.js',
  '/app/layout.js',
  '/app/benchmark/page.js',
  '/app/results/page.js'
];

// Cache names
const CACHES = {
  static: `${CACHE_PREFIX}static-${CACHE_VERSION}`,
  api: `${CACHE_PREFIX}api-${CACHE_VERSION}`,
  pages: `${CACHE_PREFIX}pages-${CACHE_VERSION}`,
  results: `${CACHE_PREFIX}results-${CACHE_VERSION}`,
  runtime: `${CACHE_PREFIX}runtime-${CACHE_VERSION}`
};

/**
 * Install event - pre-cache static assets
 */
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHES.static);
      await cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: 'no-cache' })));

      // Pre-load important pages
      await cache.addAll(PRECACHE_URLS);

      console.log('[SW] Pre-cached', PRECACHE_URLS.length, 'assets');
      self.skipWaiting(); // Activate immediately
    })()
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name =>
        name.startsWith(CACHE_PREFIX) && !name.includes(CACHE_VERSION)
      );

      await Promise.all(oldCaches.map(name => caches.delete(name)));
      console.log('[SW] Deleted', oldCaches.length, 'old caches');

      // Take control of all clients immediately
      await self.clients.claim();
      console.log('[SW] Claimed all clients');
    })()
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different request types
  if (request.method === 'GET') {
    // Handle static assets
    if (isStaticAsset(request.url)) {
      event.respondWith(handleStaticAsset(request));
      return;
    }

    // Handle API calls
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleApiCall(request));
      return;
    }

    // Handle pages
    if (url.pathname.endsWith('.html') || url.pathname === '/') {
      event.respondWith(handlePage(request));
      return;
    }

    // Handle benchmark results
    if (url.pathname.startsWith('/results') || url.pathname.startsWith('/benchmark')) {
      event.respondWith(handleResults(request));
      return;
    }

    // Default: network first with cache fallback
    event.respondWith(networkFirst(request));
  }

  // Handle POST requests - always network
  // (let them pass through without caching)
});

/**
 * Determine if request is for static asset
 */
function isStaticAsset(url: string): boolean {
  return url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) !== null;
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticAsset(request) {
  return cacheFirst(request, CACHES.static);
}

/**
 * Handle API calls with network-first strategy
 */
async function handleApiCall(request) {
  return networkFirst(request, CACHES.api);
}

/**
 * Handle pages with stale-while-revalidate strategy
 */
async function handlePage(request) {
  return staleWhileRevalidate(request, CACHES.pages);
}

/**
 * Handle benchmark results with cache-first strategy
 */
async function handleResults(request) {
  return cacheFirst(request, CACHES.results);
}

/**
 * Network-first caching strategy
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache the fresh response
      cache.put(request, networkResponse.clone());
      return networkResponse;
    } else {
      // Network failed, try cache
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      // Return offline fallback
      return createOfflineResponse(request);
    }
  } catch (error) {
    console.error('[SW] Network error:', error);
    // Try cache on network error
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return createOfflineResponse(request);
  }
}

/**
 * Cache-first caching strategy
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    // Check if cache is still fresh
    const age = getCacheAge(cachedResponse);
    if (age < 86400) { // 24 hours
      // Fetch in background to update cache
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      });
      return cachedResponse;
    }
  }

  // Cache miss or stale - fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    return createOfflineResponse(request);
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    return createOfflineResponse(request);
  }
}

/**
 * Stale-while-revalidate caching strategy
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);

  // Try cache first
  const cachedResponse = await cache.match(request);

  // Fetch in background to update cache
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cachedResponse || null);

  // Return cached response immediately
  if (cachedResponse) {
    return cachedResponse;
  }

  // Wait for network response
  const networkResponse = await networkPromise;
  return networkResponse || createOfflineResponse(request);
}

/**
 * Get cache age from response
 */
function getCacheAge(response) {
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return 0;

  const cacheDate = new Date(response.headers.get('date') || 0);
  const now = new Date();
  return Math.floor((now - cacheDate) / 1000);
}

/**
 * Create offline fallback response
 */
function createOfflineResponse(request) {
  const url = new URL(request.url);

  // For HTML pages, return offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    return caches.match('/offline.html') || caches.match('/') || new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // For API calls, return offline data
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      success: false,
      error: 'offline',
      cached: true,
      data: getOfflineData(url.pathname)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Default 503
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

/**
 * Get offline data for API calls
 */
function getOfflineData(pathname) {
  // Return cached offline data if available
  if (pathname.includes('benchmark')) {
    return {
      benchmarks: [],
      message: 'Currently offline. Showing cached data when available.'
    };
  }
  return null;
}

/**
 * Background sync for offline operations
 */
self.addEventListener('sync', event => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-benchmarks') {
    event.waitUntil(syncOfflineBenchmarks());
  }
});

/**
 * Sync offline benchmark results
 */
async function syncOfflineBenchmarks() {
  try {
    // Get offline storage results
    const offlineResults = localStorage.getItem('offline-benchmarks');
    if (offlineResults) {
      const results = JSON.parse(offlineResults);

      // Sync each result
      for (const result of results) {
        try {
          await fetch('/api/benchmark/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
          });
        } catch (error) {
          console.error('[SW] Failed to sync benchmark:', error);
        }
      }

      // Clear synced results
      localStorage.removeItem('offline-benchmarks');
    }
  } catch (error) {
    console.error('[SW] Sync error:', error);
  }
}

/**
 * Push notification handler
 */
self.addEventListener('push', event => {
  if (event.data) {
    const options = {
      body: event.data.text() || 'Atheon Benchmark Update',
      icon: '/icons/icon.svg',
      badge: '/icons/badge.svg',
      vibrate: [200, 100, 200],
      tag: 'atheon-benchmark',
      data: {
        url: '/benchmark',
        timestamp: Date.now()
      },
      actions: [
        { action: 'view', title: 'View Benchmark', url: '/benchmark' },
        { action: 'results', title: 'View Results', url: '/results' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification('Atheon Benchmark', options)
    );
  }
});

/**
 * Message handler for communication with clients
 */
self.addEventListener('message', event => {
  const { data, ports } = event;

  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (data && data.type === 'CACHE_URLS') {
    event.waitUntil(cacheUrls(data.urls));
  }

  if (data && data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearCache(data.cache));
  }

  if (data && data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

/**
 * Cache specific URLs
 */
async function cacheUrls(urls) {
  const cache = await caches.open(CACHES.pages);
  await cache.addAll(urls.map(url => new Request(url, { cache: 'reload' })));
  console.log('[SW] Cached', urls.length, 'URLs');
}

/**
 * Clear specific cache
 */
async function clearCache(cacheName) {
  await caches.delete(cacheName);
  console.log('[SW] Cleared cache:', cacheName);
}

/**
 * Get client info for debugging
 */
async function getClientInfo() {
  const clients = await self.clients.matchAll();
  return {
    version: CACHE_VERSION,
    clients: clients.length,
    caches: Object.keys(CACHES)
  };
}

console.log('[SW] CSR-First Service Worker loaded successfully');