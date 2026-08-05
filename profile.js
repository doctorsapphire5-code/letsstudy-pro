/* =========================================================
   LETSSTUDY PRO
   PROFILE.JS
   Firebase Auth + Firestore User Profile
   ========================================================= */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  auth,
  db
} from "./firebase.js";


/* =========================================================
   CONFIG
   ========================================================= */

const PROFILE_CONFIG = {

  usersCollection:
    "users",

  authPage:
    "auth.html",

  dashboardPage:
    "dashboard.html"

};


/* =========================================================
   STATE
   ========================================================= */

let currentUser =
  null;

let profileData =
  {};


/* =========================================================
   HELPERS
   ========================================================= */

const $ =
  id =>
    document.getElementById(id);


function showMessage(
  message,
  type = "success"
){

  const box =
    $("profileMessage");


  if(box){

    box.textContent =
      message;

    box.className =
      "profile-message " +
      type;

    box.style.display =
      "block";


    setTimeout(
      () => {

        box.style.display =
          "none";

      },
      3000
    );


    return;

  }


  if(
    typeof window.showToast ===
    "function"
  ){

    window.showToast(
      message
    );

  }else{

    alert(
      message
    );

  }

}


/* =========================================================
   LOAD PROFILE
   ========================================================= */

async function loadProfile(
  user
){

  if(!user){

    return;

  }


  try{

    const userRef =
      doc(
        db,
        PROFILE_CONFIG.usersCollection,
        user.uid
      );


    const snapshot =
      await getDoc(
        userRef
      );


    if(
      snapshot.exists()
    ){

      profileData =
        snapshot.data();

    }else{

      profileData = {

        uid:
          user.uid,

        email:
          user.email ||
          "",

        displayName:
          user.displayName ||
          "",

        photoURL:
          user.photoURL ||
          "",

        role:
          "student",

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      };


      await setDoc(
        userRef,
        profileData,
        {
          merge:
            true
        }
      );

    }


    renderProfile(
      user,
      profileData
    );


  }catch(error){

    console.error(
      "Profile loading error:",
      error
    );


    showMessage(
      "Unable to load profile.",
      "error"
    );

  }

}


/* =========================================================
   RENDER PROFILE
   ========================================================= */

function renderProfile(
  user,
  data
){

  const name =
    data.displayName ||
    user.displayName ||
    "";


  const email =
    user.email ||
    data.email ||
    "";


  const photo =
    data.photoURL ||
    user.photoURL ||
    "";


  setValue(
    "profileName",
    name
  );


  setValue(
    "profileEmail",
    email
  );


  setValue(
    "profilePhone",
    data.phone ||
    ""
  );


  setValue(
    "profileCountry",
    data.country ||
    "Tanzania"
  );


  setValue(
    "profileBio",
    data.bio ||
    ""
  );


  setValue(
    "profileForm",
    data.form ||
    ""
  );


  setValue(
    "profileSchool",
    data.school ||
    ""
  );


  setValue(
    "profileRole",
    data.role ||
    "student"
  );


  const avatar =
    $("profileAvatar");


  if(avatar){

    if(photo){

      avatar.src =
        photo;

    }else{

      avatar.src =
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(
          name ||
          "LetsStudy User"
        ) +
        "&size=160";

    }

  }


  const uid =
    $("profileUid");


  if(uid){

    uid.textContent =
      user.uid;

  }

}


/* =========================================================
   SET VALUE
   ========================================================= */

function setValue(
  id,
  value
){

  const element =
    $(id);


  if(!element){

    return;

  }


  if(
    element.tagName ===
    "INPUT" ||
    element.tagName ===
    "TEXTAREA" ||
    element.tagName ===
    "SELECT"
  ){

    element.value =
      value;

  }else{

    element.textContent =
      value;

  }

}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

async function saveProfile(){

  if(!currentUser){

    showMessage(
      "Please login first.",
      "error"
    );

    return;

  }


  const button =
    $("saveProfileBtn");


  try{

    if(button){

      button.disabled =
        true;

      button.textContent =
        "Saving...";

    }


    const displayName =
      getValue(
        "profileName"
      );


    const phone =
      getValue(
        "profilePhone"
      );


    const country =
      getValue(
        "profileCountry"
      );


    const bio =
      getValue(
        "profileBio"
      );


    const form =
      getValue(
        "profileForm"
      );


    const school =
      getValue(
        "profileSchool"
      );


    /*
     Update Firebase Authentication
     display name.
    */

    await updateProfile(
      currentUser,
      {
        displayName:
          displayName
      }
    );


    /*
     Update Firestore profile.
    */

    const userRef =
      doc(
        db,
        PROFILE_CONFIG.usersCollection,
        currentUser.uid
      );


    await setDoc(
      userRef,
      {

        uid:
          currentUser.uid,

        email:
          currentUser.email ||
          "",

        displayName:
          displayName,

        phone:
          phone,

        country:
          country,

        bio:
          bio,

        form:
          form,

        school:
          school,

        updatedAt:
          serverTimestamp()

      },
      {
        merge:
          true
      }
    );


    profileData = {

      ...profileData,

      displayName,

      phone,

      country,

      bio,

      form,

      school

    };


    renderProfile(
      currentUser,
      profileData
    );


    showMessage(
      "Profile updated successfully."
    );


  }catch(error){

    console.error(
      "Save profile error:",
      error
    );


    showMessage(
      error.message ||
      "Unable to save profile.",
      "error"
    );

  }finally{

    if(button){

      button.disabled =
        false;

      button.textContent =
        "Save Changes";

    }

  }

}


/* =========================================================
   GET VALUE
   ========================================================= */

function getValue(
  id
){

  const element =
    $(id);


  return element
    ? element.value.trim()
    : "";

}


/* =========================================================
   CHANGE PASSWORD
   ========================================================= */

async function changePassword(){

  if(!currentUser){

    return;

  }


  const password =
    getValue(
      "newPassword"
    );


  const confirmPassword =
    getValue(
      "confirmPassword"
    );


  if(
    !password ||
    !confirmPassword
  ){

    showMessage(
      "Enter and confirm your new password.",
      "error"
    );

    return;

  }


  if(
    password.length < 6
  ){

    showMessage(
      "Password must be at least 6 characters.",
      "error"
    );

    return;

  }


  if(
    password !==
    confirmPassword
  ){

    showMessage(
      "Passwords do not match.",
      "error"
    );

    return;

  }


  try{

    await updatePassword(
      currentUser,
      password
    );


    setValue(
      "newPassword",
      ""
    );


    setValue(
      "confirmPassword",
      ""
    );


    showMessage(
      "Password changed successfully."
    );


  }catch(error){

    console.error(
      "Password update error:",
      error
    );


    if(
      error.code ===
      "auth/requires-recent-login"
    ){

      showMessage(
        "For security, please login again before changing your password.",
        "error"
      );

      return;

    }


    showMessage(
      error.message ||
      "Unable to change password.",
      "error"
    );

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
      PROFILE_CONFIG.authPage;


  }catch(error){

    console.error(
      "Logout error:",
      error
    );


    showMessage(
      "Unable to logout.",
      "error"
    );

  }

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function initProfile(){

  const form =
    $("profileForm");


  if(form){

    form.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        saveProfile();

      }
    );

  }


  const passwordForm =
    $("passwordForm");


  if(passwordForm){

    passwordForm.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        changePassword();

      }
    );

  }


  const logoutButton =
    $("logoutBtn");


  if(logoutButton){

    logoutButton.addEventListener(
      "click",
      logout
    );

  }

}


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user || null;


    if(!user){

      window.location.href =
        PROFILE_CONFIG.authPage;

      return;

    }


    await loadProfile(
      user
    );

  }
);


/* =========================================================
   DOM READY
   ========================================================= */

if(
  document.readyState ===
  "loading"
){

  document.addEventListener(
    "DOMContentLoaded",
    initProfile
  );

}else{

  initProfile();

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.LetsStudyProfile = {

  loadProfile,

  saveProfile,

  changePassword,

  logout

};


console.log(
  "LetsStudy Pro Profile System ready."
);