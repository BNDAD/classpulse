// ClassPulse Service Worker — 오프라인 캐싱 + 푸시 알림 지원
const CACHE_NAME = 'classpulse-v1';
const OFFLINE_URL = '/offline';

// 캐싱할 정적 자산
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// 설치: 정적 자산 프리캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).catch(() => {
      // 프리캐시 실패해도 SW 설치는 진행
    })
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 네트워크 우선, 실패 시 캐시 폴백
self.addEventListener('fetch', (event) => {
  // API 호출은 캐싱하지 않음
  if (event.request.url.includes('/api/')) return;

  // GET 요청만 캐싱
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공 응답을 캐시에 저장
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // 오프라인: 캐시에서 반환
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || new Response('오프라인 상태입니다.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        });
      })
  );
});

// 푸시 알림 수신
self.addEventListener('push', (event) => {
  let data = { title: 'ClassPulse', body: '새 알림이 있습니다.', url: '/dashboard' };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url },
      vibrate: [200, 100, 200],
    })
  );
});

// 알림 클릭 → 해당 페이지로 이동
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // 이미 열린 탭이 있으면 포커스
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 탭 열기
      return self.clients.openWindow(url);
    })
  );
});
