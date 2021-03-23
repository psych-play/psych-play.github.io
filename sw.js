const cacheName = 'v0.0.2';
const appShellFiles = [
    './',
    './index.html',
];

self.addEventListener('install', function(e) {
    console.log('[Service Worker] Install');
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(appShellFiles);
        }).then(function () {
            console.log('[Service Worker] Skip waiting on install');
            return self.skipWaiting();
        })
    );
});
self.addEventListener('activate', function(e) {
    console.log('[Service Worker] Activate');
    e.waitUntil(clients.claim().then(function () {
        return caches.keys().then(function (keys) {
            return Promise.all(keys.map(function (key) {
                if (key !== cacheName) {
                    return caches.delete(key);
                }
            }))
        });
    }));
});

self.addEventListener('fetch', function(e) {
    e.respondWith(
        caches.match(e.request).then(function(r) {
            //console.log('[Service Worker] Fetching resource: '+e.request.url);
            return r || fetch(e.request).then(function(response) {
                return caches.open(cacheName).then(function(cache) {
                    // Do not cache delete request
                    //if (e.request.url === "https://psych.surge.sh/js/version.txt") return response;
                    //console.log('[Service Worker] Caching new resource: '+e.request.url);
                    cache.put(e.request, response.clone());
                    return response;
                });
            });
        })
    );
});
/*
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'DELETE_CACHE') {
        caches.delete(cacheName).then(function (deleted) {
            if (deleted) return caches.open(cacheName).then(function(cache) {
                console.log('[Service Worker] Deleted and now Caching all: app shell and content');
                return cache.addAll(appShellFiles);
            });
        });
    }
});
*/