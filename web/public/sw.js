const CACHE_NAME = 'touse-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/scan',
  '/my-furniture',
  '/inbox',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch strategy:
// - API calls: network-first, fall back to cached response
// - Static assets: cache-first
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API calls — network-first
  if (url.hostname === 'localhost' && url.port === '8000') {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        if (res.ok && request.method === 'GET') {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return res
      }).catch(() => {
        // Offline fallback for navigation
        if (request.mode === 'navigate') {
          return caches.match('/') 
        }
        return new Response('Offline', { status: 503 })
      })
    })
  )
})
