/**
 * DbSS Print Vault v2.5 - Service Worker
 * 任務：強制更新快取，啟動 v2.5 終極視覺修補與數位防護
 */

const CACHE_NAME = 'dbss-vault-cache-v2.5';

// 核心資源清單
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

// 安裝階段：快取新版資源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] v2.5 正在寫入新快取...');
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

// 激活階段：清理 v2.4 (含) 以前的所有舊快取
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

// 抓取階段：快取優先策略
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((res) => {
            return res || fetch(event.request);
        })
    );
});