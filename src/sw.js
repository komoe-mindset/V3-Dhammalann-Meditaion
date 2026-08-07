import { precacheAndRoute } from 'workbox-precaching';

// Workbox manifest injection point
precacheAndRoute(self.__WB_MANIFEST || []);

const CACHE_NAME = 'mindful-ui-v1';
const MEDIA_CACHE_NAME = 'mindful-media-v1';
const MAX_MEDIA_CACHE_BYTES = 250 * 1024 * 1024; // 250MB Quota Limit

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== MEDIA_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Check if the request is an MP3 file, from mp3.dhammalann.org, or contains a Range header
  const isMp3 = url.pathname.toLowerCase().endsWith('.mp3');
  const isAudioDomain = url.hostname.includes('mp3.dhammalann.org');
  const hasRangeHeader = event.request.headers.has('range');

  if (isMp3 || isAudioDomain || hasRangeHeader) {
    // BYPASS Service Worker completely for HTML5 audio range requests and streaming.
    // Returning immediately without calling event.respondWith() lets Chrome's native HTML5 audio engine
    // handle HTTP 206 Partial Content range requests directly with zero SW caching conflicts.
    return;
  }

  // Skip Service Worker for Vite internal paths and dev modules
  const isViteDev = url.pathname.startsWith('/@') || 
                    url.pathname.includes('.tsx') || 
                    url.pathname.includes('.ts') ||
                    url.search.includes('import') ||
                    url.search.includes('t=');

  if (!url.pathname.startsWith('/api/') && !isViteDev && url.origin === self.location.origin) {
    // Strategy: Stale-While-Revalidate for UI static assets and JS/CSS bundles
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

/**
 * Cache First Strategy for Audio Files (https://mp3.dhammalann.org/*)
 * Supports HTTP Range Requests (206 Partial Content) and enforces a 250MB cache limit.
 */
async function handleAudioCacheFirst(request) {
  const mediaCache = await caches.open(MEDIA_CACHE_NAME);
  // Match without range headers by creating a clean Request key
  const cleanUrl = request.url.split('#')[0];
  const cacheKey = new Request(cleanUrl, { method: 'GET' });

  // 1. Try Cache First
  const cachedResponse = await mediaCache.match(cacheKey);
  if (cachedResponse) {
    return handleRangeRequest(request, cachedResponse);
  }

  // 2. Fetch from Network if not cached
  try {
    // Fetch full audio file to allow caching and slicing for range requests
    const fetchRequest = new Request(cleanUrl, {
      method: 'GET',
      headers: request.headers,
      mode: request.mode === 'navigate' ? 'cors' : request.mode,
      credentials: request.credentials,
      redirect: 'follow'
    });

    const networkResponse = await fetch(fetchRequest);

    if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 206)) {
      // Store in media cache
      const responseToCache = networkResponse.clone();
      await mediaCache.put(cacheKey, responseToCache);

      // Enforce 250MB storage quota in background
      enforceMediaCacheQuota().catch((err) => console.warn('Quota enforcement error:', err));

      return handleRangeRequest(request, networkResponse);
    }

    return networkResponse;
  } catch (error) {
    // Offline fallback
    if (cachedResponse) {
      return handleRangeRequest(request, cachedResponse);
    }
    return new Response('Audio file unavailable offline', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Handles HTTP Range Requests (206 Partial Content) from cached audio responses
 */
async function handleRangeRequest(request, response) {
  const rangeHeader = request.headers.get('Range');
  if (!rangeHeader) return response;

  try {
    const blob = await response.clone().blob();
    const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
    if (!match) return response;

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : blob.size - 1;

    if (start >= blob.size || (match[2] && end >= blob.size)) {
      return new Response('', {
        status: 416,
        statusText: 'Range Not Satisfiable',
        headers: { 'Content-Range': `bytes */${blob.size}` }
      });
    }

    const slicedBlob = blob.slice(start, end + 1);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Content-Range', `bytes ${start}-${end}/${blob.size}`);
    responseHeaders.set('Content-Length', slicedBlob.size.toString());
    responseHeaders.set('Accept-Ranges', 'bytes');

    return new Response(slicedBlob, {
      status: 206,
      statusText: 'Partial Content',
      headers: responseHeaders
    });
  } catch (e) {
    return response;
  }
}

/**
 * Enforces 250MB cache quota on MEDIA_CACHE_NAME by evicting oldest cached files
 */
async function enforceMediaCacheQuota() {
  try {
    const cache = await caches.open(MEDIA_CACHE_NAME);
    const requests = await cache.keys();
    let totalSizeBytes = 0;
    const entries = [];

    for (const req of requests) {
      const res = await cache.match(req);
      if (res) {
        const blob = await res.clone().blob();
        const dateHeader = res.headers.get('date');
        const cachedTime = dateHeader ? new Date(dateHeader).getTime() : 0;
        entries.push({ request: req, size: blob.size, time: cachedTime });
        totalSizeBytes += blob.size;
      }
    }

    if (totalSizeBytes > MAX_MEDIA_CACHE_BYTES) {
      // Sort entries by cached timestamp (oldest first)
      entries.sort((a, b) => a.time - b.time);

      for (const entry of entries) {
        if (totalSizeBytes <= MAX_MEDIA_CACHE_BYTES) break;
        await cache.delete(entry.request);
        totalSizeBytes -= entry.size;
      }
    }
  } catch (err) {
    console.warn('Failed to enforce media cache quota:', err);
  }
}

/**
 * Stale-While-Revalidate Strategy for UI Static Assets and Bundles
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse && networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetchPromise;
  if (response) {
    return response;
  }

  return fetch(request);
}
