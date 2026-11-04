/* ==========================================================
   根在侨乡 · Service Worker
   ----------------------------------------------------------
   目标：断网也能打开、可“添加到主屏幕”当 App 用。
   策略：
     · 安装时预缓存核心文件（HTML / CSS / JS / 首页图）
     · 其余同源资源（照片）首次访问时顺手缓存，之后离线可用
     · 更新版本只需改 VERSION 常量
   ========================================================== */
const VERSION = 'gzx-v3';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './assets/css/style.css',
  './assets/css/style_v3.css',
  './assets/css/style_v4.css',
  './assets/css/style_v5.css',
  './assets/css/style_v6.css',
  './assets/js/data.js',
  './assets/js/longread.js',
  './assets/js/game.js',
  './assets/img/front.jpg',
  './assets/img/hall.jpg',
  './assets/img/map2f.jpg',
  './assets/img/icon-192.png',
  './assets/img/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;   // 只处理本站资源

  // 页面导航：优先走网络，失败回退到缓存的 index
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 其他资源：缓存优先，命中就用；未命中请求网络并顺手缓存
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => hit);
    })
  );
});
