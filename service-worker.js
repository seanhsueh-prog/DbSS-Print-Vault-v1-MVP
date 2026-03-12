/**
 * DbSS Print Vault v2.4 - Service Worker
 * * 任務：強制更新快取，確保 v2.4 的「零閃爍」開場邏輯生效
 */

const CACHE_NAME = 'dbss-vault-cache-v2.4';

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

// Install Event: 強制安裝並快取最新資源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] v2.4 正在快取核心資源...');
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

// Activate Event: 清除舊版快取 (v2.3 以前的都會被刪除)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[SW] 正在清理舊快取:', key);
                    return caches.delete(key);
                }
            })
        ))
    );
    self.clients.claim();
});

// Fetch Event: 攔截請求，優先使用快取以達到秒開效果
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((res) => {
            return res || fetch(event.request);
        })
    );
});