const CACHE_VERSION = 'app-v2';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const APP_SHELL = [
   '/baterias73/',
    '/baterias73/index.html',
    '/baterias73/manifest.json',
    '/baterias73/icon-192.png',
    '/baterias73/icon-512.png'
];

// INSTALL
self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => cache.addAll(APP_SHELL))
    );
});

// ACTIVATE
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== STATIC_CACHE)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// FETCH
self.addEventListener('fetch', event => {

    if (event.request.method !== 'GET') return;

    const requestURL = new URL(event.request.url);

    // Solo manejar mismo origen
    if (requestURL.origin === location.origin) {

        // Navegación HTML → Network First con fallback
        if (event.request.mode === 'navigate') {
            event.respondWith(
                fetch(event.request)
                    .then(response => {
                        const copy = response.clone();
                        caches.open(STATIC_CACHE)
                            .then(cache => cache.put('/index.html', copy));
                        return response;
                    })
                    .catch(() => caches.match('/index.html'))
            );
            return;
        }

        // Assets → Cache First + actualización en segundo plano
        event.respondWith(
            caches.match(event.request)
                .then(cached => {
                    const networkFetch = fetch(event.request)
                        .then(response => {
                            if (response && response.status === 200) {
                                const copy = response.clone();
                                caches.open(STATIC_CACHE)
                                    .then(cache => cache.put(event.request, copy));
                            }
                            return response;
                        })
                        .catch(() => cached);

                    return cached || networkFetch;
                })
        );
    }
});

