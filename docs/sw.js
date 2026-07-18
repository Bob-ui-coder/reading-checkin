// Service Worker v6 — v5.0 架构升级（图片仓库存储）
const CACHE_NAME = 'reading-checkin-v6';
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

// 监听消息：收到 SKIP_WAITING 直接跳过等待
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 激活：清理所有旧缓存
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
  
  // 对于 HTML 请求：始终从网络获取，不使用缓存
  if (event.request.mode === 'navigate' ||
      event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request).then(response => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }
  
  // 其他请求：网络优先，缓存兜底
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const cloned = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
