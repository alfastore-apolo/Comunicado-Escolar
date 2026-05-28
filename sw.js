// ══════════════════════════════════════
//  SERVICE WORKER — Escola Conectada
//  Cache Strategy: Network First + Offline Fallback
// ══════════════════════════════════════

const CACHE_NAME = "escola-conectada-v1";

// Arquivos essenciais para funcionar offline
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// ── INSTALL: pré-cacheia os assets essenciais ──────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[SW] Cacheando assets essenciais...");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE: limpa caches antigos ────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log("[SW] Removendo cache antigo:", key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ── FETCH: Network First, fallback para cache ─────────────
self.addEventListener("fetch", event => {
  const { request } = event;

  // Ignora requisições não-GET e externas (Firebase, CDN)
  if (request.method !== "GET") return;
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        // Clona e armazena no cache
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      })
      .catch(() => {
        // Offline: tenta servir do cache
        return caches.match(request).then(cached => {
          if (cached) return cached;
          // Fallback final: página principal
          return caches.match("/index.html");
        });
      })
  );
});
