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

// URLs to pre-cache - using actual static export paths
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/benchmark.html',
  '/results.html',
  '/status.html',
  '/offline.html'
];

// Cache names
const CACHES = {
  static: CACHE_PREFIX + 'static-' + CACHE_VERSION,
  api: CACHE_PREFIX + 'api-' + CACHE_VERSION,
  pages: CACHE_PREFIX + 'pages-' + CACHE_VERSION,
  results: CACHE_PREFIX + 'results-' + CACHE_VERSION,
  runtime: CACHE_PREFIX + 'runtime-' + CACHE_VERSION
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
  const request = event.request;
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
function isStaticAsset(url) {
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
  if (request.headers.get('accept') && request.headers.get('accept').includes('text/html')) {
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
 * Periodic background sync handler
 * Used for periodically fetching fresh benchmark results
 */
self.addEventListener('periodicsync', event => {
  console.log('[SW] Periodic sync event:', event.tag);

  if (event.tag === 'periodic-benchmark-sync') {
    event.waitUntil(periodicSyncBenchmarks());
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
 * Periodic sync for fresh benchmark results
 * Fetches latest results and updates cache
 */
async function periodicSyncBenchmarks() {
  try {
    console.log('[SW] Running periodic benchmark sync...');

    // Refresh the results cache
    const cache = await caches.open(CACHES.results);

    // Try to fetch latest results from API
    try {
      const response = await fetch('/api/v1/results', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-cache'
      });

      if (response.ok) {
        // Update cache with fresh results
        cache.put('/api/v1/results', response.clone());
        console.log('[SW] Periodic sync: Updated results cache');
      }
    } catch (error) {
      console.error('[SW] Periodic sync: Network fetch failed, using cache:', error);
    }

    // Notify clients that new data may be available
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PERIODIC_SYNC_COMPLETE',
        timestamp: Date.now()
      });
    });

    console.log('[SW] Periodic sync complete');
  } catch (error) {
    console.error('[SW] Periodic sync error:', error);
  }
}

/**
 * Register for periodic background sync
 * Call this from the client to enable periodic data refresh
 */
async function registerPeriodicSync() {
  if ('periodicSync' in self.registration) {
    try {
      // Request permission for periodic background sync
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync',
      });

      if (status.state === 'granted') {
        await self.registration.periodicSync.register('periodic-benchmark-sync', {
          minInterval: 60 * 60 * 1000, // Minimum 1 hour between syncs
          delay: 5000 // Initial delay of 5 seconds after registration
        });
        console.log('[SW] Periodic background sync registered');
        return true;
      } else {
        console.log('[SW] Periodic background sync permission not granted:', status.state);
        return false;
      }
    } catch (error) {
      console.error('[SW] Failed to register periodic sync:', error);
      return false;
    }
  } else {
    console.log('[SW] Periodic background sync not supported');
    return false;
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
      badge: '/icons/badge.png',
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
  const data = event.data;

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

  if (data && data.type === 'CHECK_FOR_UPDATE') {
    event.waitUntil(checkForSWUpdate());
  }

  if (data && data.type === 'TRIGGER_UPDATE') {
    event.waitUntil(triggerUpdateNotification());
  }
});

/**
 * Check for service worker updates
 * Called by the client to manually check for updates
 */
async function checkForSWUpdate() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (registration && registration.waiting) {
      // There's a new version waiting
      registration.waiting.postMessage({
        type: 'UPDATE_AVAILABLE',
        version: CACHE_VERSION
      });
      return { updateAvailable: true, version: CACHE_VERSION };
    }

    // Check for updates
    if (registration) {
      await registration.update();
    }

    return { updateAvailable: false };
  } catch (error) {
    console.error('[SW] Update check failed:', error);
    return { updateAvailable: false, error: error.message };
  }
}

/**
 * Trigger update notification to all clients
 * Called when update is detected and user should be prompted
 */
async function triggerUpdateNotification() {
  const clients = await self.clients.matchAll();

  clients.forEach(client => {
    client.postMessage({
      type: 'SW_UPDATE_AVAILABLE',
      version: CACHE_VERSION,
      timestamp: Date.now()
    });
  });

  // Show notification if permitted
  if (self.registration && self.registration.showNotification) {
    const notification = await self.registration.showNotification('Atheon Benchmark Update Available', {
      body: 'A new version is available. Click to update.',
      icon: '/icons/icon.svg',
      badge: '/icons/badge.png',
      tag: 'sw-update',
      data: {
        type: 'sw-update',
        url: '/'
      },
      actions: [
        { action: 'update', title: 'Update Now' },
        { action: 'later', title: 'Later' }
      ]
    });

    return notification;
  }

  return null;
}

/**
 * Handle notification click for update
 */
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'update' || !event.action) {
    // User chose to update
    if (event.notification.data && event.notification.data.url) {
      clients.openWindow(event.notification.data.url);
    }

    // Trigger skip waiting to activate new SW
    if (self.registration && self.registration.waiting) {
      self.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }
  // If 'later', just close the notification
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
