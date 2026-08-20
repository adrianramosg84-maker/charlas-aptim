/**
 * service-worker.js
 * PWA Service Worker — APTIM PERÚ S.A.C.
 * Gestiona caché offline para que la app funcione
 * sin internet después del primer acceso
 */

const CACHE_NAME    = 'charlas-aptim-v3';
const CACHE_OFFLINE = 'charlas-aptim-offline-v3';

// Archivos a cachear al instalar (app shell)
const ARCHIVOS_CACHE = [
  './',
  './index.html',
  './registro.html',
  './historial.html',
  './configuracion.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/database.js',
  './js/firma.js',
  './js/scanner.js',
  './js/pdf.js',
  './js/email.js',
  './assets/formato_base.png',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

// CDN externos que también se cachean
const CDN_CACHE = [
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js'
];

// ─────────────────────────────────────────────
//  INSTALL — cachear todos los archivos del app shell
// ─────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cachear archivos locales
      await cache.addAll(ARCHIVOS_CACHE);

      // Cachear CDN (sin fallar si no hay internet)
      for (const url of CDN_CACHE) {
        try {
          await cache.add(url);
        } catch {
          console.warn('SW: No se pudo cachear CDN:', url);
        }
      }
    })
  );
  // Activar inmediatamente sin esperar que cierren otras pestañas
  self.skipWaiting();
});

// ─────────────────────────────────────────────
//  ACTIVATE — limpiar cachés viejas
// ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter(n => n !== CACHE_NAME && n !== CACHE_OFFLINE)
          .map(n => caches.delete(n))
      )
    )
  );
  // Tomar control de todas las pestañas abiertas
  self.clients.claim();
});

// ─────────────────────────────────────────────
//  FETCH — estrategia Cache First para archivos locales
//          Network First para peticiones de datos
// ─────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Solo interceptar GET
  if (event.request.method !== 'GET') return;

  // Para archivos locales: Cache First (rápido offline)
  if (url.origin === self.location.origin || esCDN(url.href)) {
    event.respondWith(cacheFirst(event.request));
  }
  // Para todo lo demás: Network First
  else {
    event.respondWith(networkFirst(event.request));
  }
});

// ─────────────────────────────────────────────
//  Estrategia Cache First
//  Sirve desde caché, si no está va a red y lo guarda
// ─────────────────────────────────────────────
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Sin red y sin caché — respuesta de fallback
    return new Response('Sin conexión', { status: 503 });
  }
}

// ─────────────────────────────────────────────
//  Estrategia Network First
//  Intenta red, si falla usa caché
// ─────────────────────────────────────────────
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Sin conexión', { status: 503 });
  }
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function esCDN(url) {
  return url.includes('cdnjs.cloudflare.com') ||
         url.includes('cdn.jsdelivr.net');
}

// ─────────────────────────────────────────────
//  MENSAJE — forzar actualización desde la app
// ─────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.tipo === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
