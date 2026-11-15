// チームデータ分析 ― オフライン対応とホーム画面インストール用
const VERSION = 'bb-v21';
const SHELL = ['./index.html','./manifest.json','./logo.png','./icon-192.png','./icon-512.png','./field.jpg','./field-l.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // 書き込みは素通し
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.endsWith('/api.php')) return;          // データ通信は絶対にキャッシュしない
  if (url.pathname.endsWith('/setup.php')) return;

  // 画面は「新しいものを取りに行き、つながらなければ手元の控えを出す」
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
