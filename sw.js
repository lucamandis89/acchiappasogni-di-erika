const CACHE_NAME = 'acchiappasogni-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './app.js',
  './products.json',
  './config.json',
  './configuratore.html',
  './pwa.html',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async ()=>{
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve()));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo stesso origin
  if (url.origin !== self.location.origin) return;

  // Navigazioni: network-first con fallback cache (anti pagina bianca)
  if (req.mode === 'navigate') {
    event.respondWith((async ()=>{
      try{
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      }catch(e){
        const cached = await caches.match(req);
        return cached || caches.match('./index.html');
      }
    })());
    return;
  }

  // Asset: cache-first
  event.respondWith((async ()=>{
    const cached = await caches.match(req);
    if(cached) return cached;
    const fresh = await fetch(req);
    const cache = await caches.open(CACHE_NAME);
    cache.put(req, fresh.clone());
    return fresh;
  })());
});
