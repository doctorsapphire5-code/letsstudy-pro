/* =========================================================
   LETSSTUDY PRO
   AUTHENTICATION SYSTEM
   Firebase Authentication
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
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  auth,
  db
} from "./firebase.js";


/* =========================================================
   GOOGLE PROVIDER
   ========================================================= */

const googleProvider =
  new GoogleAuthProvider();


/* =========================================================
   HELPERS
   ========================================================= */

function getElement(id){

  return document.getElementById(id);

}


function showMessage(
  message,
  type = "info"
){

  const element =
    getElement("authMessage");

  if(!element){

    if(
      typeof window.showToast ===
      "function"
    ){

      window.showToast(
        message
      );

    }else{

      console.log(message);

    }

    return;

  }

  element.textContent =
    message;

  element.className =
    "alert alert-" +
    type;

  element.style.display =
    "block";

}


function setLoading(
  loading
){

  document
    .querySelectorAll(
      "[data-auth-submit]"
    )
    .forEach(function(button){

      button.disabled =
        loading;

      button.textContent =
        loading
          ? "Please wait..."
          : (
              button.dataset.originalText ||
              "Continue"
            );

    });

}


function getReturnUrl(){

  return (
    sessionStorage.getItem(
      "letsStudyReturnUrl"
    ) ||
    "dashboard.html"
  );

}


function redirectAfterLogin(){

  const returnUrl =
    sessionStorage.getItem(
      "letsStudyReturnUrl"
    );

  if(returnUrl){

    sessionStorage.removeItem(
      "letsStudyReturnUrl"
    );

    window.location.href =
      returnUrl;

    return;

  }

  window.location.href =
    "dashboard.html";

}


/* =========================================================
   CREATE / UPDATE USER DOCUMENT
   ========================================================= */

async function saveUserProfile(
  user,
  extraData = {}
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

  const existing =
    await getDoc(
      userRef
    );

  const userData = {

    uid:
      user.uid,

    email:
      user.email || "",

    displayName:
      user.displayName ||
      extraData.displayName ||
      "",

    photoURL:
      user.photoURL ||
      "",

    role:
      existing.exists()
        ? (
            existing.data().role ||
            "student"
          )
        : "student",

    status:
      existing.exists()
        ? (
            existing.data().status ||
            "active"
          )
        : "active",

    ...extraData,

    updatedAt:
      serverTimestamp()

  };

  if(!existing.exists()){

    userData.createdAt =
      serverTimestamp();

  }

  await setDoc(
    userRef,
    userData,
    {
      merge:true
    }
  );

  return userData;

}


/* =========================================================
   REGISTER
   ========================================================= */

async function registerUser(){

  const name =
    getElement("registerName")
      ?.value
      .trim();

  const email =
    getElement("registerEmail")
      ?.value
      .trim();

  const password =
    getElement("registerPassword")
      ?.value;

  const confirmPassword =
    getElement("registerConfirmPassword")
      ?.value;

  if(!name){

    showMessage(
      "Please enter your name.",
      "warning"
    );

    return;

  }

  if(!email){

    showMessage(
      "Please enter your email.",
      "warning"
    );

    return;

  }

  if(!password){

    showMessage(
      "Please enter a password.",
      "warning"
    );

    return;

  }

  if(password.length < 6){

    showMessage(
      "Password must contain at least 6 characters.",
      "warning"
    );

    return;

  }

  if(
    confirmPassword &&
    password !== confirmPassword
  ){

    showMessage(
      "Passwords do not match.",
      "danger"
    );

    return;

  }

  try{

    setLoading(true);

    const credential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user =
      credential.user;


    await updateProfile(
      user,
      {
        displayName:name
      }
    );


    await saveUserProfile(
      user,
      {
        displayName:name
      }
    );


    showMessage(
      "Account created successfully.",
      "success"
    );


    setTimeout(
      function(){

        redirectAfterLogin();

      },
      700
    );


  }catch(error){

    console.error(
      "Registration error:",
      error
    );

    handleAuthError(
      error
    );

  }finally{

    setLoading(false);

  }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function loginUser(){

  const email =
    getElement("loginEmail")
      ?.value
      .trim();

  const password =
    getElement("loginPassword")
      ?.value;


  if(!email){

    showMessage(
      "Please enter your email.",
      "warning"
    );

    return;

  }


  if(!password){

    showMessage(
      "Please enter your password.",
      "warning"
    );

    return;

  }


  try{

    setLoading(true);

    const credential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

    await saveUserProfile(
      credential.user
    );


    showMessage(
      "Login successful.",
      "success"
    );


    setTimeout(
      function(){

        redirectAfterLogin();

      },
      500
    );


  }catch(error){

    console.error(
      "Login error:",
      error
    );

    handleAuthError(
      error
    );

  }finally{

    setLoading(false);

  }

}


/* =========================================================
   GOOGLE LOGIN
   ========================================================= */

async function loginWithGoogle(){

  try{

    setLoading(true);

    const result =
      await signInWithPopup(
        auth,
        googleProvider
      );

    await saveUserProfile(
      result.user
    );


    showMessage(
      "Google login successful.",
      "success"
    );


    setTimeout(
      function(){

        redirectAfterLogin();

      },
      500
    );


  }catch(error){

    console.error(
      "Google login error:",
      error
    );

    handleAuthError(
      error
    );

  }finally{

    setLoading(false);

  }

}


/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

async function resetPassword(){

  const email =
    getElement("resetEmail")
      ?.value
      .trim() ||
    getElement("loginEmail")
      ?.value
      .trim();


  if(!email){

    showMessage(
      "Enter your email address first.",
      "warning"
    );

    return;

  }


  try{

    setLoading(true);

    await sendPasswordResetEmail(
      auth,
      email
    );


    showMessage(
      "Password reset email sent. Check your inbox.",
      "success"
    );


  }catch(error){

    console.error(
      "Password reset error:",
      error
    );

    handleAuthError(
      error
    );

  }finally{

    setLoading(false);

  }

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutUser(){

  try{

    await signOut(
      auth
    );

    sessionStorage.removeItem(
      "letsStudyReturnUrl"
    );

    if(
      typeof window.showToast ===
      "function"
    ){

      window.showToast(
        "You have been logged out."
      );

    }

    setTimeout(
      function(){

        window.location.href =
          "auth.html";

      },
      500
    );


  }catch(error){

    console.error(
      "Logout error:",
      error
    );

    showMessage(
      "Unable to logout. Please try again.",
      "danger"
    );

  }

}


/* =========================================================
   AUTH STATE
   ========================================================= */

function monitorAuth(){

  onAuthStateChanged(
    auth,
    async function(user){

      const protectedPage =
        document.body.dataset.requireAuth ===
        "true";


      if(user){

        window.LetsStudyAuthUser =
          user;


        document
          .querySelectorAll(
            "[data-user-name]"
          )
          .forEach(function(element){

            element.textContent =
              user.displayName ||
              user.email ||
              "Student";

          });


        document
          .querySelectorAll(
            "[data-user-email]"
          )
          .forEach(function(element){

            element.textContent =
              user.email ||
              "";

          });


        if(
          document.body.dataset.authPage ===
          "true"
        ){

          const returnUrl =
            sessionStorage.getItem(
              "letsStudyReturnUrl"
            );

          if(returnUrl){

            redirectAfterLogin();

          }

        }

      }else{

        window.LetsStudyAuthUser =
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
   FIREBASE AUTH ERROR HANDLER
   ========================================================= */

function handleAuthError(
  error
){

  let message =
    "Something went wrong. Please try again.";


  switch(error.code){

    case "auth/email-already-in-use":

      message =
        "This email is already registered.";

      break;


    case "auth/invalid-email":

      message =
        "Please enter a valid email address.";

      break;


    case "auth/weak-password":

      message =
        "Password is too weak.";

      break;


    case "auth/invalid-credential":

      message =
        "Invalid email or password.";

      break;


    case "auth/user-not-found":

      message =
        "No account was found with this email.";

      break;


    case "auth/wrong-password":

      message =
        "Incorrect password.";

      break;


    case "auth/popup-closed-by-user":

      message =
        "Google sign-in was cancelled.";

      break;


    case "auth/popup-blocked":

      message =
        "Your browser blocked the login popup.";

      break;


    case "auth/network-request-failed":

      message =
        "Network error. Check your internet connection.";

      break;


    case "auth/too-many-requests":

      message =
        "Too many attempts. Please try again later.";

      break;


    default:

      console.error(
        error.code,
        error.message
      );

  }


  showMessage(
    message,
    "danger"
  );

}


/* =========================================================
   AUTO BIND AUTH FORMS
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function(){

    document
      .querySelectorAll(
        "[data-auth-submit]"
      )
      .forEach(function(button){

        button.dataset.originalText =
          button.textContent.trim();

      });


    const registerForm =
      document.getElementById(
        "registerForm"
      );

    if(registerForm){

      registerForm.addEventListener(
        "submit",
        function(event){

          event.preventDefault();

          registerUser();

        }
      );

    }


    const loginForm =
      document.getElementById(
        "loginForm"
      );

    if(loginForm){

      loginForm.addEventListener(
        "submit",
        function(event){

          event.preventDefault();

          loginUser();

        }
      );

    }


    const resetForm =
      document.getElementById(
        "resetPasswordForm"
      );

    if(resetForm){

      resetForm.addEventListener(
        "submit",
        function(event){

          event.preventDefault();

          resetPassword();

        }
      );

    }


    document
      .querySelectorAll(
        "[data-google-login]"
      )
      .forEach(function(button){

        button.addEventListener(
          "click",
          loginWithGoogle
        );

      });


    document
      .querySelectorAll(
        "[data-logout]"
      )
      .forEach(function(button){

        button.addEventListener(
          "click",
          logoutUser
        );

      });


    monitorAuth();

  }
);


/* =========================================================
   GLOBAL EXPORTS
   ========================================================= */

window.registerUser =
  registerUser;

window.loginUser =
  loginUser;

window.loginWithGoogle =
  loginWithGoogle;

window.resetPassword =
  resetPassword;

window.logoutUser =
  logoutUser;

window.saveUserProfile =
  saveUserProfile;

window.requireAuth =
  requireAuth;


/* =========================================================
   READY
   ========================================================= */

console.log(
  "LetsStudy Pro Authentication loaded."
);