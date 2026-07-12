/* 오프라인 지원 서비스 워커 — 네트워크 우선, 실패하면 캐시 사용.
   온라인이면 항상 최신 버전을 받아오므로 배포(푸시) 즉시 반영된다. */
"use strict";
const CACHE = "vocamon-v2";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(res => {
      // 같은 사이트의 응답만 캐시에 갱신 (외부 API·폰트 CDN은 그대로 통과)
      if (res.ok && new URL(e.request.url).origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() =>
      caches.match(e.request, { ignoreSearch: true }).then(r => r || Response.error())
    )
  );
});
