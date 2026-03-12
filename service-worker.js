/**
 * DbSS Print Vault v2.7 - Service Worker
 * 任務：更新浮水印層級邏輯與智慧抓圖路徑
 */

const CACHE_NAME = 'dbss-vault-cache-v2.7';

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
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            })
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((res) => {
            return res || fetch(event.request).then((networkRes) => {
                // 如果是圖稿資源，順手存入快取
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