// Service Worker v7 — 自毁版本（v5.1 已移除 SW，此文件仅用于清理旧版 SW 缓存）
// v5.1 决定彻底移除 Service Worker：实时数据共享应用不需要离线缓存，
// SW 缓存是反复导致用户看到旧版本页面的元凶。

self.addEventListener('install', event => {
  // 跳过等待，立即激活
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // 清除所有缓存
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
  );
  // 注销自己 + 通知所有客户端
  self.registration.unregister().then(() => {
    self.clients.matchAll().then(clients => {
      clients.forEach(c => c.navigate(c.url));
    });
  });
  self.clients.claim();
});

// 所有请求直接走网络，不拦截不缓存
self.addEventListener('fetch', event => {
  // 不调用 respondWith，让浏览器默认处理
});
