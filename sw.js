/* Kanvas Ajaib: service worker: cache-first untuk semua aset (aktif hanya via http/https) */
const VERSION = "ka-v3.2.3";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./css/style.css",
  "./js/storage.js",
  "./js/audio.js",
  "./js/fx.js",
  "./js/icons.js",
  "./js/levels.js",
  "./js/scoring.js",
  "./js/economy.js",
  "./js/art.js",
  "./js/reason.js",
  "./js/puzzles.js",
  "./js/engine.js",
  "./js/screens.js",
  "./js/main.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) =>
      /* satu aset gagal tidak boleh menggagalkan seluruh pemasangan */
      Promise.all(ASSETS.map((a) => c.add(new Request(a, { cache: "reload" })).catch(() => null)))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => (req.mode === "navigate" ? caches.match("./index.html") : undefined));
    })
  );
});
