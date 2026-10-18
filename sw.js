// OnNextPDF service worker: makes the app work offline.
// The page itself (index.html) is always fetched fresh when online, so updates appear quickly.
// If you change icons or library files, bump CACHE (v3, v4 ...) so everyone gets the new files.
const CACHE = "onnextpdf-v3";
const FILES = [
  "./", "index.html", "manifest.webmanifest",
  "pdf-lib.min.js", "pdf.min.js", "pdf.worker.min.js", "jszip.min.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png",
  "icons/apple-touch-icon.png", "icons/favicon-64.png"
];
self.addEventListener("install", e => {
  // Cache each file separately so one missing file can never block the install.
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(FILES.map(f => c.add(f))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("index.html", copy));
        return res;
      }).catch(() => caches.match("index.html").then(r => r || caches.match("./")))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
