/* =========================================================
   LETSSTUDY PRO
   FIREBASE CONFIGURATION
   Authentication + Firestore + Realtime Database + Storage
   ========================================================= */

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import {
  getAuth,
  setPersistence,
  browserLocalPersistence
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
   INITIALIZE FIREBASE
   ========================================================= */

const app =
  initializeApp(
    firebaseConfig
  );


/* =========================================================
   SERVICES
   ========================================================= */

const auth =
  getAuth(app);

const db =
  getFirestore(app);

const rtdb =
  getDatabase(app);

const storage =
  getStorage(app);


/* =========================================================
   AUTH PERSISTENCE
   Keeps the user logged in across page refreshes.
   ========================================================= */

setPersistence(
  auth,
  browserLocalPersistence
).catch(
  function(error){

    console.error(
      "Firebase Auth persistence error:",
      error
    );

  }
);


/* =========================================================
   GLOBAL FIREBASE OBJECT
   ========================================================= */

window.LetsStudyFirebase = {

  app,

  auth,

  db,

  rtdb,

  storage

};


/* =========================================================
   EXPORTS
   ========================================================= */

export {
  app,
  auth,
  db,
  rtdb,
  storage
};


/* =========================================================
   READY
   ========================================================= */

console.log(
  "LetsStudy Pro Firebase initialized."
);

console.log(
  "Authentication: Ready"
);

console.log(
  "Firestore: Ready"
);

console.log(
  "Realtime Database: Ready"
);

console.log(
  "Storage: Ready"
);