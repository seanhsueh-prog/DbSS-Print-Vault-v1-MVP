// DbSS Print Vault v1.1 Service Worker
const CACHE_NAME = 'dbss-vault-cache-v1.1';

// App Shell 核心檔案 (固定入口為 index.html)
const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/react@18/umd/react.development.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
    'https://unpkg.com/@babel/standalone/babel.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

// Install Event: 快取 App Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching App Shell v1.1');
                return cache.addAll(APP_SHELL);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate Event: 清除舊版快取
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch Event: 攔截請求並應用快取策略
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // 策略 1: 對於主 HTML 與根目錄，使用 Network-First (網路優先，失敗才讀快取)
    if (requestUrl.pathname.endsWith('.html') || requestUrl.pathname.endsWith('/') || event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // 策略 2: 圖片與圖庫資產 (Cache-First)
    if (requestUrl.pathname.endsWith('.png') || requestUrl.pathname.endsWith('.jpg') || requestUrl.pathname.endsWith('.jpeg')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                    return networkResponse;
                });
            })
        );
        return;
    }

    // 策略 3: 其他靜態資源 (Cache-First)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});