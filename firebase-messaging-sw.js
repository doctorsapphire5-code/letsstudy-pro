importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({

  apiKey:
    "AIzaSyBcOYDfAVKXbkljsyRgI_0rjodBn678tCc",

  authDomain:
    "let-s-study-pro-course.firebaseapp.com",

  databaseURL:
    "https://let-s-study-pro-course-default-rtdb.firebaseio.com",

  projectId:
    "let-s-study-pro-course",

  storageBucket:
    "let-s-study-pro-course.firebasestorage.app",

  messagingSenderId:
    "474928293390",

  appId:
    "1:474928293390:web:2bcc2aebf2351c12a9fe5f",

  measurementId:
    "G-85B7V5H5J0"

});

const messaging =
  firebase.messaging();


/* =====================================================
   BACKGROUND MESSAGE
===================================================== */

messaging.onBackgroundMessage(
  (payload) => {

    console.log(
      "[LetsStudy Pro] Background message:",
      payload
    );

    const data =
      payload.data || {};

    const notification =
      payload.notification || {};

    const notificationId =
      data.notificationId ||
      `UNKNOWN-${Date.now()}`;

    const title =
      notification.title ||
      data.title ||
      "LetsStudy Pro";

    const body =
      notification.body ||
      data.body ||
      "You have a new notification.";

    const icon =
      notification.icon ||
      data.icon ||
      "/icons/icon-192.png";

    const url =
      data.url ||
      "https://letsstudy.pro/";


    return self.registration.showNotification(
      title,
      {

        body,

        icon,

        badge:
          data.badge ||
          "/icons/icon-192.png",

        tag:
          `lsp-${notificationId}`,

        renotify:
          true,

        requireInteraction:
          false,

        data: {

          notificationId,

          url

        }

      }
    );

  }
);


/* =====================================================
   NOTIFICATION CLICK
===================================================== */

self.addEventListener(
  "notificationclick",
  (event) => {

    event.notification.close();

    const data =
      event.notification.data || {};

    const url =
      data.url ||
      "https://letsstudy.pro/";

    event.waitUntil(

      clients.matchAll({

        type:
          "window",

        includeUncontrolled:
          true

      })

      .then(
        (clientList) => {

          for (
            const client
            of clientList
          ) {

            if (
              client.url.includes(
                "letsstudy.pro"
              )
            ) {

              if (
                "focus"
                in client
              ) {

                client.focus();

              }

              if (
                "navigate"
                in client
              ) {

                return client.navigate(
                  url
                );

              }

            }

          }

          if (
            clients.openWindow
          ) {

            return clients.openWindow(
              url
            );

          }

        }
      )

    );

  }
);