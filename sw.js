// Service worker minimo: serve solo a rendere l'app installabile (requisito PWA).
// Non fa caching aggressivo, così i contenuti restano sempre aggiornati.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Passa tutte le richieste dritte alla rete, nessuna cache personalizzata.
  event.respondWith(fetch(event.request));
});
