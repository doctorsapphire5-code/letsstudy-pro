import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


/* =====================================================
   FIREBASE CONFIG
===================================================== */

const firebaseConfig = {

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

};


/* =====================================================
   INITIALIZE
===================================================== */

const app =
  initializeApp(
    firebaseConfig
  );

const db =
  getFirestore(app);

const auth =
  getAuth(app);

const messaging =
  getMessaging(app);


/* =====================================================
   VAPID PUBLIC KEY
===================================================== */

/*
 * Firebase Console:
 *
 * Project Settings
 * → Cloud Messaging
 * → Web configuration
 * → Web Push certificates
 *
 * Copy PUBLIC key here.
 */

const VAPID_KEY =
  "YOUR_PUBLIC_VAPID_KEY";


/* =====================================================
   BROWSER SUPPORT
===================================================== */

export function isPushSupported() {

  return (

    "Notification"
    in window

    &&

    "serviceWorker"
    in navigator

    &&

    "PushManager"
    in window

  );

}


/* =====================================================
   SERVICE WORKER
===================================================== */

export async function registerServiceWorker() {

  if (
    !("serviceWorker" in navigator)
  ) {

    throw new Error(
      "Service Worker is not supported."
    );

  }

  return await navigator.serviceWorker.register(
    "/firebase-messaging-sw.js"
  );

}


/* =====================================================
   GENERATE NOTIFICATION ID
===================================================== */

export function generateNotificationId() {

  const now =
    new Date();

  const date =
    now
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "");

  const time =
    now
      .toTimeString()
      .slice(0, 8)
      .replaceAll(":", "");

  const random =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  return (
    `NTF-${date}-${time}-${random}`
  );

}


/* =====================================================
   GENERATE TOKEN ID
===================================================== */

function generateTokenId(token) {

  let hash = 0;

  for (
    let i = 0;
    i < token.length;
    i++
  ) {

    hash =
      (
        (
          hash << 5
        ) -
        hash
      ) +
      token.charCodeAt(i);

    hash |= 0;

  }

  return (
    "TOK-" +
    Math.abs(hash)
  );

}


/* =====================================================
   ENABLE NOTIFICATIONS
===================================================== */

export async function enableNotifications() {

  if (
    !isPushSupported()
  ) {

    throw new Error(
      "This browser does not support Web Push."
    );

  }


  if (
    !VAPID_KEY ||
    VAPID_KEY ===
      "YOUR_PUBLIC_VAPID_KEY"
  ) {

    throw new Error(
      "VAPID public key is not configured."
    );

  }


  const permission =
    await Notification.requestPermission();


  if (
    permission !== "granted"
  ) {

    throw new Error(
      "Notification permission was not granted."
    );

  }


  const registration =
    await registerServiceWorker();


  const token =
    await getToken(
      messaging,
      {

        vapidKey:
          VAPID_KEY,

        serviceWorkerRegistration:
          registration

      }
    );


  if (!token) {

    throw new Error(
      "FCM registration token was not created."
    );

  }


  await saveNotificationToken(
    token
  );


  localStorage.setItem(
    "lspNotificationsEnabled",
    "true"
  );


  return token;

}


/* =====================================================
   SAVE TOKEN
===================================================== */

async function saveNotificationToken(
  token
) {

  const user =
    auth.currentUser;

  const tokenId =
    generateTokenId(token);

  const ref =
    doc(
      db,
      "notificationTokens",
      tokenId
    );


  await setDoc(
    ref,
    {

      tokenId,

      fcmToken:
        token,

      userId:
        user?.uid || null,

      email:
        user?.email || null,

      browser:
        detectBrowser(),

      platform:
        detectPlatform(),

      permission:
        Notification.permission,

      active:
        true,

      website:
        "letsstudy.pro",

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()

    },

    {
      merge:
        true
    }

  );


  return tokenId;

}


/* =====================================================
   DETECT BROWSER
===================================================== */

function detectBrowser() {

  const ua =
    navigator.userAgent;

  if (
    /Edg\//.test(ua)
  ) {

    return "Edge";

  }

  if (
    /OPR\//.test(ua)
  ) {

    return "Opera";

  }

  if (
    /Firefox\//.test(ua)
  ) {

    return "Firefox";

  }

  if (
    /Chrome\//.test(ua)
  ) {

    return "Chrome";

  }

  if (
    /Safari\//.test(ua) &&
    !/Chrome\//.test(ua)
  ) {

    return "Safari";

  }

  return "Other";

}


/* =====================================================
   DETECT PLATFORM
===================================================== */

function detectPlatform() {

  const ua =
    navigator.userAgent;

  if (
    /Android/i.test(ua)
  ) {

    return "Android";

  }

  if (
    /iPhone|iPad|iPod/i.test(ua)
  ) {

    return "iOS";

  }

  if (
    /Mac/i.test(ua)
  ) {

    return "macOS";

  }

  if (
    /Windows/i.test(ua)
  ) {

    return "Windows";

  }

  if (
    /Linux/i.test(ua)
  ) {

    return "Linux";

  }

  return "Other";

}


/* =====================================================
   CREATE NOTIFICATION
===================================================== */

export async function createNotification({
  title,
  body,
  category = "general",
  url = "https://letsstudy.pro/",
  icon = "/icons/icon-192.png",
  audience = "all"
}) {

  if (
    !title ||
    !body
  ) {

    throw new Error(
      "Title and body are required."
    );

  }


  const notificationId =
    generateNotificationId();


  const ref =
    doc(
      db,
      "notifications",
      notificationId
    );


  await setDoc(
    ref,
    {

      notificationId,

      title,

      body,

      category,

      url,

      icon,

      audience,

      platform:
        "web",

      status:
        "pending",

      createdBy:
        auth.currentUser?.uid ||
        null,

      createdAt:
        serverTimestamp(),

      sentAt:
        null,

      deliveredCount:
        0,

      readCount:
        0,

      clickCount:
        0,

      failedCount:
        0

    }
  );


  return notificationId;

}


/* =====================================================
   SAVE USER NOTIFICATION
===================================================== */

export async function saveUserNotification(
  payload
) {

  const user =
    auth.currentUser;

  if (!user) {
    return;
  }


  const {
    notificationId,
    title,
    body,
    category,
    url,
    icon
  } = payload;


  if (!notificationId) {
    return;
  }


  const id =
    `${user.uid}_${notificationId}`;


  const ref =
    doc(
      db,
      "userNotifications",
      id
    );


  await setDoc(
    ref,
    {

      notificationId,

      userId:
        user.uid,

      title,

      body,

      category,

      url,

      icon,

      read:
        false,

      clicked:
        false,

      createdAt:
        serverTimestamp(),

      readAt:
        null,

      clickedAt:
        null

    },

    {
      merge:
        true
    }

  );

}


/* =====================================================
   GET USER NOTIFICATIONS
===================================================== */

export async function getMyNotifications(
  maxResults = 50
) {

  const user =
    auth.currentUser;

  if (!user) {
    return [];
  }


  const q =
    query(

      collection(
        db,
        "userNotifications"
      ),

      where(
        "userId",
        "==",
        user.uid
      ),

      orderBy(
        "createdAt",
        "desc"
      ),

      limit(
        maxResults
      )

    );


  const snapshot =
    await getDocs(q);


  return snapshot.docs.map(
    (item) => ({
      id:
        item.id,

      ...item.data()

    })
  );

}


/* =====================================================
   UNREAD COUNT
===================================================== */

export async function getUnreadCount() {

  const user =
    auth.currentUser;

  if (!user) {
    return 0;
  }


  const q =
    query(

      collection(
        db,
        "userNotifications"
      ),

      where(
        "userId",
        "==",
        user.uid
      ),

      where(
        "read",
        "==",
        false
      )

    );


  const snapshot =
    await getDocs(q);


  return snapshot.size;

}


/* =====================================================
   MARK READ
===================================================== */

export async function markNotificationRead(
  notificationId
) {

  const user =
    auth.currentUser;

  if (!user) {
    return;
  }


  const id =
    `${user.uid}_${notificationId}`;


  const ref =
    doc(
      db,
      "userNotifications",
      id
    );


  await updateDoc(
    ref,
    {

      read:
        true,

      readAt:
        serverTimestamp()

    }
  );


  const notificationRef =
    doc(
      db,
      "notifications",
      notificationId
    );


  await updateDoc(
    notificationRef,
    {

      readCount:
        increment(1)

    }
  );

}


/* =====================================================
   MARK CLICKED
===================================================== */

export async function markNotificationClicked(
  notificationId
) {

  const user =
    auth.currentUser;

  if (!user) {
    return;
  }


  const id =
    `${user.uid}_${notificationId}`;


  const ref =
    doc(
      db,
      "userNotifications",
      id
    );


  await updateDoc(
    ref,
    {

      clicked:
        true,

      clickedAt:
        serverTimestamp(),

      read:
        true,

      readAt:
        serverTimestamp()

    }
  );


  const notificationRef =
    doc(
      db,
      "notifications",
      notificationId
    );


  await updateDoc(
    notificationRef,
    {

      clickCount:
        increment(1)

    }
  );

}


/* =====================================================
   FOREGROUND MESSAGE
===================================================== */

onMessage(
  messaging,
  async (payload) => {

    console.log(
      "[LetsStudy Pro] Foreground:",
      payload
    );


    const data =
      payload.data || {};

    const notification =
      payload.notification || {};


    const notificationId =
      data.notificationId;


    const title =
      notification.title ||
      data.title ||
      "LetsStudy Pro";


    const body =
      notification.body ||
      data.body ||
      "You have a new notification.";


    const category =
      data.category ||
      "general";


    const url =
      data.url ||
      "https://letsstudy.pro/";


    const icon =
      data.icon ||
      "/icons/icon-192.png";


    await saveUserNotification({

      notificationId,

      title,

      body,

      category,

      url,

      icon

    });


    showForegroundNotification({

      notificationId,

      title,

      body,

      url

    });

  }
);


/* =====================================================
   FOREGROUND UI
===================================================== */

function showForegroundNotification({
  notificationId,
  title,
  body,
  url
}) {

  const old =
    document.getElementById(
      "lsp-notification-toast"
    );

  if (old) {
    old.remove();
  }


  const box =
    document.createElement(
      "div"
    );


  box.id =
    "lsp-notification-toast";


  box.innerHTML = `

    <div class="lsp-toast-icon">
      🔔
    </div>

    <div class="lsp-toast-content">

      <strong>
        ${escapeHTML(title)}
      </strong>

      <span>
        ${escapeHTML(body)}
      </span>

    </div>

    <button
      type="button"
      class="lsp-toast-close"
      aria-label="Close">
      ×
    </button>

  `;


  document.body.appendChild(
    box
  );


  box.addEventListener(
    "click",
    async (event) => {

      if (
        event.target.closest(
          ".lsp-toast-close"
        )
      ) {

        return;

      }


      await markNotificationClicked(
        notificationId
      );


      window.location.href =
        url;

    }
  );


  box
    .querySelector(
      ".lsp-toast-close"
    )
    .addEventListener(
      "click",
      () => {

        box.remove();

      }
    );


  setTimeout(
    () => {

      if (box.isConnected) {
        box.remove();
      }

    },
    10000
  );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


/* =====================================================
   AUTO REGISTER AUTH
===================================================== */

onAuthStateChanged(
  auth,
  (user) => {

    if (user) {

      console.log(
        "[LetsStudy Pro] Notification user:",
        user.uid
      );

    }

  }
);