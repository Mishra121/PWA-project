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

// It was used to fake update response and test it.
// const delay = ms => _ => new Promise(resolve => setTimeout(() => resolve(_), ms))
//  + `?per_page=${Math.ceil(Math.random() * 10)}`
// .then(delay(8000))

function update(request) {
  return fetch(request.url)
  .then(
    response =>
      cache(request, response) // we can put response in cache
        .then(() => response) // resolve promise with the Response object
  );
}

function refresh(response) {
  return response
    .json() // read and parse JSON response
    .then(jsonResponse => {
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          // report and send new data to client
          client.postMessage(
            JSON.stringify({
              type: response.url,
              data: jsonResponse.data
            })
          );
        });
      });
      return jsonResponse.data; // resolve promise with new data
    });
}

self.addEventListener("fetch", event => {

  if (event.request.url.includes("/api/")) {
    // response to API requests, Cache Update Refresh strategy
    event.respondWith(caches.match(event.request));
    event.waitUntil(update(event.request).then(refresh));
  } else {
    // response to static files requests, Cache-First strategy
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
  }
});


// sync event 
self.addEventListener('sync', function(event) {
	console.log("sync event", event);
    if (event.tag === 'syncAttendees') {
      event.waitUntil(syncAttendees()); // sending sync request
    }
});

function syncAttendees(){
	return update({ url: `https://reqres.in/api/users` })
    	.then(refresh)
    	.then((attendees) => self.registration.showNotification(
    		`${attendees.length} attendees to the PWA Workshop`
    	))
}