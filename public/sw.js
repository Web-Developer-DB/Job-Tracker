// Name des Caches (bei Änderungen erhöhen).
const CACHE_NAME = 'job-tracker-v1';
// Offline-Fallback-Seite.
const OFFLINE_URL = '/offline.html';
// Kern-Dateien, die wir offline verfügbar machen.
const CORE_ASSETS = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg', OFFLINE_URL];

// Beim Installieren: Kern-Dateien in den Cache legen.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Beim Aktivieren: alte Caches entfernen.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Netzwerk-Anfragen abfangen und je nach Typ behandeln.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  // Für Navigationen: zuerst Netzwerk, bei Fehler offline.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }

  // Für Assets: zuerst Cache, dann Netzwerk.
  if (['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Standard: Netzwerk zuerst.
  event.respondWith(networkFirst(request));
});

// Cache-Strategie: Cache zuerst, dann Netzwerk.
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

// Cache-Strategie: Netzwerk zuerst, bei Fehler Cache/Offline.
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || caches.match(OFFLINE_URL);
  }
}
