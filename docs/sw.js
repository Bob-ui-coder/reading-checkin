// Service Worker v1 — 读书打卡离线缓存
const CACHE_NAME = 'reading-checkin-v1';
const URLS = [
  './',
  './index.html'
];

// 安装：预缓存核心页面
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(URLS))
  );
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// 请求拦截：网络优先，失败回退缓存
self.addEventListener('fetch', event => {
  // 跳过 Gist API 请求（让它们走网络）
  if (event.request.url.includes('api.github.com') ||
      event.request.url.includes('gist.githubusercontent.com')) {
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 缓存成功的响应
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return response;
      })
      .catch(() => {
        // 网络失败时返回缓存
        return caches.match(event.request);
      })
  );
});
