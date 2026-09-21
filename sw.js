"use strict";

const CACHE_NAME = "letsstudy-pro-pwa-v1";

const STATIC_FILES = [
  "/",
  "/index-auth.html",
  "/manifest.json"
];

/* =====================================================
   INSTALL
===================================================== */

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => {

        return cache.addAll(STATIC_FILES);

      })
      .then(() => {

        return self.skipWaiting();

      })

  );

});


/* =====================================================
   ACTIVATE
===================================================== */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys()
      .then(keys => {

        return Promise.all(

          keys.map(key => {

            if (key !== CACHE_NAME) {

              return caches.delete(key);

            }

            return null;

          })

        );

      })
      .then(() => {

        return self.clients.claim();

      })

  );

});


/* =====================================================
   FETCH
===================================================== */

self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }

  const requestURL = new URL(event.request.url);

  /*
    Only handle same-origin requests.
  */

  if (requestURL.origin !== self.location.origin) {
    return;
  }

  event.respondWith(

    fetch(event.request)

      .then(response => {

        if (
          response &&
          response.status === 200 &&
          response.type === "basic"
        ) {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {

              cache.put(
                event.request,
                copy
              );

            });

        }

        return response;

      })

      .catch(() => {

        return caches.match(event.request)
          .then(cached => {

            if (cached) {
              return cached;
            }

            return caches.match(
              "/index-auth.html"
            );

          });

      })

  );

});