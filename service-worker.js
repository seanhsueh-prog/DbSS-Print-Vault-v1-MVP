/**
 * DbSS Print Vault v2.8 - Service Worker
 * 任務：支援 DAM 架構，確保 data.json 清單隨時保持最新
 */

const CACHE_NAME = 'dbss-vault-cache-v2.8';

// 核心資源清單 (App Shell)
const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './logo-dbss.png',
    './splash-dbss.png',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/react@18/umd/react.development.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
    'https://unpkg.com/@babel/standalone/babel.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] v2.8 正在寫入新快取...');
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[SW] 正在清理過時快取:', key);
                    return caches.delete(key);
                }
            })
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // 🌟 針對 data.json：使用 Network-First 策略 (永遠嘗試抓最新清單)
    if (requestUrl.pathname.endsWith('data.json')) {
        event.respondWith(
            fetch(event.request)
                .then(networkRes => {
                    // 如果網路抓成功了，順便存一份到快取裡備用
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkRes.clone());
                        return networkRes;
                    });
                })
                .catch(() => {
                    // 如果沒網路 (Offline)，才使用快取裡的舊清單
                    return caches.match(event.request);
                })
        );
        return;
    }

    // 🖼️ 針對圖片與其他資源：使用 Cache-First 策略 (秒開體驗)
    event.respondWith(
        caches.match(event.request).then((res) => {
            return res || fetch(event.request).then((networkRes) => {
                // 如果是新圖片，抓完後自動存入快取
                if (event.request.url.match(/\.(png|jpg|jpeg|svg)$/)) {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkRes.clone());
                        return networkRes;
                    });
                }
                return networkRes;
            });
        })
    );
});