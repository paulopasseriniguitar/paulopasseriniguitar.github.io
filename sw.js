// ⬇️⬇️⬇️ VERSIÓN CON TIMESTAMP (RECOMENDADO) ⬇️⬇️⬇️
const CACHE_NAME = 'tablagenius-v' + Date.now();
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// INSTALAR - Forzar nueva versión
self.addEventListener('install', event => {
  console.log('Service Worker instalando NUEVA versión:', CACHE_NAME);
  
  // ⬇️⬇️⬇️ IMPORTANTE: Activar inmediatamente ⬇️⬇️⬇️
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto, agregando recursos...');
        return cache.addAll(urlsToCache);
      })
  );
});

// ACTIVAR - Limpiar y tomar control
self.addEventListener('activate', event => {
  console.log('Service Worker activado - limpiando caches viejos');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Eliminar TODOS los caches antiguos
          if (!cacheName.startsWith('tablagenius-v')) {
            console.log('Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Toma control de TODAS las pestañas abiertas
      return self.clients.claim();
    })
  );
});

// FETCH - Interceptar peticiones
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache primero
        if (response) {
          console.log('Sirviendo desde cache:', event.request.url);
          return response;
        }
        
        // Si no está en cache, ir a red
        return fetch(event.request).then(response => {
          // Solo cachear respuestas exitosas
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Guardar en cache para próxima vez
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      })
      .catch(() => {
        // Fallback: mostrar página offline
        return caches.match('/index.html');
      })
  );
});

console.log('Service Worker cargado:', CACHE_NAME);
