importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBcOYDfAVKXbkljsyRgI_0rjodBn678tCc",
  authDomain: "let-s-study-pro-course.firebaseapp.com",
  databaseURL:
    "https://let-s-study-pro-course-default-rtdb.firebaseio.com",
  projectId: "let-s-study-pro-course",
  storageBucket: "let-s-study-pro-course.firebasestorage.app",
  messagingSenderId: "474928293390",
  appId: "1:474928293390:web:2bcc2aebf2351c12a9fe5f",
  measurementId: "G-85B7V5H5J0"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const notification = payload.notification || {};

  const title =
    notification.title ||
    data.title ||
    "LetsStudy Pro";

  const body =
    notification.body ||
    data.body ||
    "A new update is available.";

  const url =
    data.url ||
    "https://letsstudy.pro/";

  self.registration.showNotification(title, {
    body,
    icon:
      notification.icon ||
      data.icon ||
      "https://letsstudy.pro/icons/icon-192.png",

    data: {
      url
    }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url =
    event.notification.data?.url ||
    "https://letsstudy.pro/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then((clientList) => {

      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }

      return clients.openWindow(url);
    })
  );
});