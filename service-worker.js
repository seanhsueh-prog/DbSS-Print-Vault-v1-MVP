// DbSS Print Vault v1.0 Service Worker
const CACHE_NAME = 'dbss-vault-cache-v1.0';

// App Shell 核心檔案 (這些會優先被快取)
const APP_SHELL = [
    './DbSS-PrintVault-v1.0.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/react@18/umd/react.development.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
    'https://unpkg.com/@babel/standalone/babel.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

// Install Event: 快取 App Shell 基礎檔案，並強制立即生效
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching App Shell');
                return cache.addAll(APP_SHELL);
            })
            .then(() => self.skipWaiting()) // 強制停止等待，立即進入 activate 階段
    );
});

// Activate Event: 清除舊版快取，接管所有客戶端
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 若快取名稱與當前版本不符，則刪除 (確保 PWA 無痛更新)
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // 立即接管控制權
    );
});

// Fetch Event: 攔截請求並應用快取策略
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // 策略 1: 對於主 HTML 檔案，使用 Network-First (網路優先，失敗才讀快取)
    // 這樣能確保使用者只要有網路，重新整理就會看到最新版的 HTML
    if (requestUrl.pathname.endsWith('.html') || event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // 取得最新版後，也更新到快取中
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // 策略 2: 對於圖片與圖庫資產 (PNG/JPG)，使用 Cache-First (快取優先)
    // 節省頻寬，提升圖庫載入速度
    if (requestUrl.pathname.endsWith('.png') || requestUrl.pathname.endsWith('.jpg') || requestUrl.pathname.endsWith('.jpeg')) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request).then((networkResponse) => {
                    // 確保只快取成功的圖片
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

    // 策略 3: 其他靜態資源 (JS/CSS/CDN)，使用 Cache-First (快取優先，並在背景更新)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});