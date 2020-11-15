const CACHE_NAME = "V2";
const STATIC_CACHE_URLS = ["/", "styles.css", "scripts.js"];

self.addEventListener("install", event => {
    console.log("Service Worker installing.");
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_CACHE_URLS))
    );
});
  
self.addEventListener("activate", event => {
    // delete any unexpected caches
    event.waitUntil(
        caches
        .keys()
        .then(keys => keys.filter(key => key !== CACHE_NAME))
        .then(keys =>
            Promise.all(
            keys.map(key => {
                console.log(`Deleting cache ${key}`);
                return caches.delete(key);
            })
            )
        )
    );
});

function cache(request, response) {
    if (response.type === "error" || response.type === "opaque") {
      return Promise.resolve(); // do not put in cache network errors
    }
  
    return caches
      .open(CACHE_NAME)
      .then(cache => cache.put(request, response.clone()));
}

self.addEventListener("fetch", event => {
    // Cache-First Strategy
  event.respondWith(
    caches
      .match(event.request) // check if the request has already been cached
      .then(cached => cached || fetch(event.request)) // otherwise request network
      .then(
        response =>
          cache(event.request, response) // put response in cache
            .then(() => response) // resolve promise with the network response
      )
  );
});