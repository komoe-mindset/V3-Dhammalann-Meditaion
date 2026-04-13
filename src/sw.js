import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

const CACHE_NAME = 'mindful-v1';
const MEDIA_CACHE_NAME = 'mindful-media-v1';
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
  
  // Check if it's an audio file
  const isAudio = url.pathname.match(/\.(mp3|wav|m4a|ogg|aac)$/i) || 
                  url.pathname.includes('/api/files/') ||
                  event.request.headers.get('Accept')?.includes('audio/');

  // Skip Service Worker for Vite internal paths and dev modules
  const isViteDev = url.pathname.startsWith('/@') || 
                    url.pathname.includes('.tsx') || 
                    url.pathname.includes('.ts') ||
                    url.search.includes('import') ||
                    url.search.includes('t=');

  if (isAudio) {
    event.respondWith(handleAudioRequest(event.request));
  } else if (!url.pathname.startsWith('/api/') && !isViteDev) {
    // Stale-while-revalidate for static assets, excluding API calls and dev modules
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

async function handleAudioRequest(request) {
  const cache = await caches.open(MEDIA_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return handleRangeRequest(request, cachedResponse);
  }

  // If not in cache, fetch the full file to enable offline playback
  const fullRequest = new Request(request.url, {
    method: 'GET',
    headers: new Headers(request.headers)
  });
  fullRequest.headers.delete('Range');

  try {
    const networkResponse = await fetch(fullRequest);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
      return handleRangeRequest(request, networkResponse);
    }
    return networkResponse;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function handleRangeRequest(request, response) {
  const rangeHeader = request.headers.get('Range');
  if (!rangeHeader) return response;

  try {
    const blob = await response.blob();
    const match = rangeHeader.match(/bytes=(\d+)-(\d+)?/);
    if (!match) return response;

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : blob.size - 1;

    if (start >= blob.size || end >= blob.size) {
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

    return new Response(slicedBlob, {
      status: 206,
      statusText: 'Partial Content',
      headers: responseHeaders
    });
  } catch (e) {
    return response;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // If fetch fails, we don't want to return null to respondWith
    return null;
  });

  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetchPromise;
  if (response) {
    return response;
  }

  // If both fail, let the browser handle it (will show offline error)
  return fetch(request);
}
