/* =========================================================
   LETSSTUDY PRO
   AUTH.JS
   Authentication System
   ========================================================= */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  auth,
  db
} from "./firebase.js";


/* =========================================================
   GOOGLE
   ========================================================= */

const googleProvider =
  new GoogleAuthProvider();


/* =========================================================
   HELPERS
   ========================================================= */

const $ = id =>
  document.getElementById(id);


function message(
  text,
  type = "info"
){

  const box =
    $("authMessage");

  if(!box){

    console.log(text);

    return;

  }

  box.textContent =
    text;

  box.dataset.type =
    type;

  box.style.display =
    "block";

}


function loading(
  state
){

  document
    .querySelectorAll(
      "[data-auth-submit]"
    )
    .forEach(button => {

      if(
        !button.dataset.originalText
      ){

        button.dataset.originalText =
          button.textContent;

      }

      button.disabled =
        state;

      button.textContent =
        state
          ? "Please wait..."
          : button.dataset.originalText;

    });

}


/* =========================================================
   REDIRECT
   ========================================================= */

function redirectUser(){

  const returnUrl =
    sessionStorage.getItem(
      "letsStudyReturnUrl"
    );

  sessionStorage.removeItem(
    "letsStudyReturnUrl"
  );

  window.location.href =
    returnUrl ||
    "dashboard.html";

}


/* =========================================================
   SAVE USER
   ========================================================= */

async function saveUser(
  user,
  extra = {}
){

  if(!user){

    return;

  }

  const userRef =
    doc(
      db,
      "users",
      user.uid
    );

  const snapshot =
    await getDoc(
      userRef
    );

  const oldData =
    snapshot.exists()
      ? snapshot.data()
      : {};


  const data = {

    uid:
      user.uid,

    email:
      user.email || "",

    displayName:
      user.displayName ||
      extra.displayName ||
      oldData.displayName ||
      "",

    photoURL:
      user.photoURL ||
      oldData.photoURL ||
      "",

    role:
      oldData.role ||
      "student",

    status:
      oldData.status ||
      "active",

    ...extra,

    updatedAt:
      serverTimestamp()

  };


  if(!snapshot.exists()){

    data.createdAt =
      serverTimestamp();

  }


  await setDoc(
    userRef,
    data,
    {
      merge:true
    }
  );


  return data;

}


/* =========================================================
   REGISTER
   ========================================================= */

async function register(){

  const name =
    $("registerName")
      ?.value
      .trim();

  const email =
    $("registerEmail")
      ?.value
      .trim();

  const password =
    $("registerPassword")
      ?.value;

  const confirm =
    $("registerConfirmPassword")
      ?.value;


  if(!name){

    message(
      "Enter your full name.",
      "warning"
    );

    return;

  }


  if(!email){

    message(
      "Enter your email.",
      "warning"
    );

    return;

  }


  if(password.length < 6){

    message(
      "Password must be at least 6 characters.",
      "warning"
    );

    return;

  }


  if(password !== confirm){

    message(
      "Passwords do not match.",
      "danger"
    );

    return;

  }


  try{

    loading(true);


    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    await updateProfile(
      result.user,
      {
        displayName:name
      }
    );


    await saveUser(
      result.user,
      {
        displayName:name
      }
    );


    message(
      "Account created successfully.",
      "success"
    );


    setTimeout(
      redirectUser,
      700
    );


  }catch(error){

    console.error(
      error
    );

    handleError(
      error
    );

  }finally{

    loading(false);

  }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function login(){

  const email =
    $("loginEmail")
      ?.value
      .trim();

  const password =
    $("loginPassword")
      ?.value;


  if(!email){

    message(
      "Enter your email.",
      "warning"
    );

    return;

  }


  if(!password){

    message(
      "Enter your password.",
      "warning"
    );

    return;

  }


  try{

    loading(true);


    const result =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


    await saveUser(
      result.user
    );


    message(
      "Login successful.",
      "success"
    );


    setTimeout(
      redirectUser,
      500
    );


  }catch(error){

    console.error(
      error
    );

    handleError(
      error
    );

  }finally{

    loading(false);

  }

}


/* =========================================================
   GOOGLE LOGIN
   ========================================================= */

async function googleLogin(){

  try{

    loading(true);


    const result =
      await signInWithPopup(
        auth,
        googleProvider
      );


    await saveUser(
      result.user
    );


    message(
      "Google login successful.",
      "success"
    );


    setTimeout(
      redirectUser,
      500
    );


  }catch(error){

    console.error(
      error
    );

    handleError(
      error
    );

  }finally{

    loading(false);

  }

}


/* =========================================================
   RESET PASSWORD
   ========================================================= */

async function resetPassword(){

  const email =
    $("resetEmail")
      ?.value
      .trim() ||
    $("loginEmail")
      ?.value
      .trim();


  if(!email){

    message(
      "Enter your email address.",
      "warning"
    );

    return;

  }


  try{

    loading(true);


    await sendPasswordResetEmail(
      auth,
      email
    );


    message(
      "Password reset email sent. Check your inbox.",
      "success"
    );


  }catch(error){

    console.error(
      error
    );

    handleError(
      error
    );

  }finally{

    loading(false);

  }

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout(){

  try{

    await signOut(
      auth
    );

    window.location.href =
      "auth.html";

  }catch(error){

    console.error(
      error
    );

    message(
      "Unable to logout.",
      "danger"
    );

  }

}


/* =========================================================
   AUTH STATE
   ========================================================= */

function protectPage(){

  onAuthStateChanged(
    auth,
    async user => {

      const protectedPage =
        document.body.dataset.requireAuth ===
        "true";


      if(user){

        window.currentUser =
          user;


        document
          .querySelectorAll(
            "[data-user-name]"
          )
          .forEach(element => {

            element.textContent =
              user.displayName ||
              "Student";

          });


        document
          .querySelectorAll(
            "[data-user-email]"
          )
          .forEach(element => {

            element.textContent =
              user.email || "";

          });


        if(
          document.body.dataset.authPage ===
          "true"
        ){

          redirectUser();

        }


      }else{

        window.currentUser =
          null;


        if(protectedPage){

          sessionStorage.setItem(
            "letsStudyReturnUrl",
            window.location.href
          );

          window.location.href =
            "auth.html";

        }

      }

    }
  );

}


/* =========================================================
   ERROR HANDLER
   ========================================================= */

function handleError(
  error
){

  let text =
    "Something went wrong. Please try again.";


  switch(error.code){

    case "auth/email-already-in-use":

      text =
        "This email is already registered.";

      break;


    case "auth/invalid-email":

      text =
        "Invalid email address.";

      break;


    case "auth/weak-password":

      text =
        "Password is too weak.";

      break;


    case "auth/invalid-credential":

      text =
        "Invalid email or password.";

      break;


    case "auth/user-not-found":

      text =
        "No account found with this email.";

      break;


    case "auth/wrong-password":

      text =
        "Incorrect password.";

      break;


    case "auth/popup-closed-by-user":

      text =
        "Google login was cancelled.";

      break;


    case "auth/popup-blocked":

      text =
        "Please allow popups for Google login.";

      break;


    case "auth/network-request-failed":

      text =
        "Network error. Check your connection.";

      break;


    case "auth/too-many-requests":

      text =
        "Too many attempts. Try again later.";

      break;

  }


  message(
    text,
    "danger"
  );

}


/* =========================================================
   AUTO EVENTS
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {


    document
      .querySelectorAll(
        "[data-auth-submit]"
      )
      .forEach(button => {

        button.dataset.originalText =
          button.textContent;

      });


    $("registerForm")
      ?.addEventListener(
        "submit",
        event => {

          event.preventDefault();

          register();

        }
      );


    $("loginForm")
      ?.addEventListener(
        "submit",
        event => {

          event.preventDefault();

          login();

        }
      );


    $("resetPasswordForm")
      ?.addEventListener(
        "submit",
        event => {

          event.preventDefault();

          resetPassword();

        }
      );


    document
      .querySelectorAll(
        "[data-google-login]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          googleLogin
        );

      });


    document
      .querySelectorAll(
        "[data-logout]"
      )
      .forEach(button => {

        button.addEventListener(
          "click",
          logout
        );

      });


    protectPage();

  }
);


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.LetsStudyAuth = {

  register,

  login,

  googleLogin,

  resetPassword,

  logout,

  saveUser,

  protectPage

};


console.log(
  "LetsStudy Pro Auth loaded."
);