/* =========================================================
   LETSSTUDY PRO
   FIREBASE CORE
   ========================================================= */

import {
  initializeApp,
  getApps,
  getApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  getDatabase
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

import {
  getStorage
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


/* =========================================================
   FIREBASE CONFIG
   ========================================================= */

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


/* =========================================================
   INITIALIZE APP
   ========================================================= */

const app =
  getApps().length
    ? getApp()
    : initializeApp(
        firebaseConfig
      );


/* =========================================================
   FIREBASE SERVICES
   ========================================================= */

const auth =
  getAuth(app);

const db =
  getFirestore(app);

const realtimeDB =
  getDatabase(app);

const storage =
  getStorage(app);


/* =========================================================
   GLOBAL ACCESS
   ========================================================= */

window.LetsStudyFirebase = {

  app,

  auth,

  db,

  realtimeDB,

  storage

};


/* =========================================================
   STATUS
   ========================================================= */

console.log(
  "LetsStudy Pro Firebase initialized successfully."
);


/* =========================================================
   EXPORT
   ========================================================= */

export {

  app,

  auth,

  db,

  realtimeDB,

  storage

};