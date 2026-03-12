/**
 * DbSS Print Vault v2.6 - Service Worker
 * 任務：強制更新快取，啟動智慧圖檔抓取引擎與全螢幕震撼開場
 */

const CACHE_NAME = 'dbss-vault-cache-v2.6';

// 核心資源清單（App Shell）
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

// 安裝階段：強制快取最新資源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] v2.6 正在快取核心資源...');
            return cache.addAll(APP_SHELL);
        })
    );
    self.skipWaiting();
});

// 激活階段：清理舊版快取（確保 v2.5 以前的殘留不影響 v2.6 邏輯）
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

// 抓取階段：快取優先策略
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // 對於圖檔，嘗試快取，若無則抓取網路並存入快取
    if (requestUrl.pathname.endsWith('.png') || requestUrl.pathname.endsWith('.jpg')) {
        event.respondWith(
            caches.match(event.request).then((res) => {
                return res || fetch(event.request).then((networkRes) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkRes.clone());
                        return networkRes;
                    });
                });
            })
        );
        return;
    }

    // 預設策略：快取優先
    event.respondWith(
        caches.match(event.request).then((res) => {
            return res || fetch(event.request);
        })
    );
});