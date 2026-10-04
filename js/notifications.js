import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

import {
  getMessaging,
  getToken,
  onMessage
} from
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging.js";

import {
  getFirestore,
  doc,
  setDoc
} from
  "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBcOYDfAVKXbkljsyRgI_0rjodBn678tCc",
  authDomain: "let-s-study-pro-course.firebaseapp.com",
  databaseURL:
    "https://let-s-study-pro-course-default-rtdb.firebaseio.com",
  projectId: "let-s-study-pro-course",
  storageBucket:
    "let-s-study-pro-course.firebasestorage.app",
  messagingSenderId: "474928293390",
  appId: "1:474928293390:web:2bcc2aebf2351c12a9fe5f",
  measurementId: "G-85B7V5H5J0"
};

const VAPID_KEY =
  "BJDic00IuQgQzKFTjXb6zqUmJX09tEVXT0vNDom8DOdKwJEdZddHcBOUQKevvUY7i3QYyoTddU6AI0wDS4uIrj0";

const app = initializeApp(firebaseConfig);

const messaging = getMessaging(app);
const db = getFirestore(app);

const supported =
  "Notification" in window &&
  "serviceWorker" in navigator &&
  "PushManager" in window;

export async function enableNotifications() {

  if (!supported) {
    throw new Error(
      "Push notifications are not supported by this browser."
    );
  }

  const permission =
    await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      "Notification permission was not granted."
    );
  }

  const registration =
    await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration
  });

  if (!token) {
    throw new Error(
      "Unable to create notification token."
    );
  }

  /*
    Token ndiyo document ID.
    Hakuna notificationId.
  */
  await setDoc(
    doc(db, "pushTokens", token),
    {
      token: token,
      createdAt: Date.now()
    },
    {
      merge: true
    }
  );

  localStorage.setItem(
    "lspNotificationsEnabled",
    "true"
  );

  return token;
}

/*
  Notification ikiwa page iko wazi.
*/
onMessage(messaging, (payload) => {

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

  if (Notification.permission === "granted") {

    new Notification(title, {
      body: body,
      icon:
        notification.icon ||
        data.icon ||
        "/icons/icon-192.png"
    });
  }
});