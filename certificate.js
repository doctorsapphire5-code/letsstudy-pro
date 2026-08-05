/* =========================================================
   LETSSTUDY PRO
   CERTIFICATE.JS
   Certificate System
   Firebase Auth + Firestore
   ========================================================= */

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  auth,
  db
} from "./firebase.js";


/* =========================================================
   CONFIG
   ========================================================= */

const CERTIFICATE_CONFIG = {

  collection:
    "certificates",

  verifyPage:
    "verify.html",

  dashboardPage:
    "dashboard.html"

};


/* =========================================================
   STATE
   ========================================================= */

let currentUser =
  null;

let certificates =
  [];


/* =========================================================
   HELPERS
   ========================================================= */

const $ =
  id =>
    document.getElementById(id);


function escapeHTML(
  value
){

  return String(
    value ?? ""
  )
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


function formatDate(
  value
){

  if(!value){

    return "—";

  }


  try{

    const date =
      value.toDate
        ? value.toDate()
        : new Date(
            value
          );


    return new Intl.DateTimeFormat(
      "en-TZ",
      {
        dateStyle:
          "long"
      }
    ).format(
      date
    );

  }catch{

    return "—";

  }

}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
  message,
  type = "info"
){

  const box =
    $("certificateMessage");


  if(!box){

    return;

  }


  box.textContent =
    message;

  box.className =
    "certificate-message " +
    type;

  box.style.display =
    "block";


  setTimeout(
    () => {

      box.style.display =
        "none";

    },
    3500
  );

}


/* =========================================================
   LOAD USER CERTIFICATES
   ========================================================= */

async function loadCertificates(){

  if(!currentUser){

    return;

  }


  const container =
    $("certificateList");


  try{

    if(container){

      container.innerHTML = `
        <div class="certificate-loading">
          Loading certificates...
        </div>
      `;

    }


    const certificatesRef =
      collection(
        db,
        CERTIFICATE_CONFIG.collection
      );


    const certificatesQuery =
      query(
        certificatesRef,
        where(
          "userId",
          "==",
          currentUser.uid
        )
      );


    const snapshot =
      await getDocs(
        certificatesQuery
      );


    certificates =
      snapshot.docs.map(
        item => ({

          id:
            item.id,

          ...item.data()

        })
      );


    renderCertificates();


  }catch(error){

    console.error(
      "Certificate loading error:",
      error
    );


    if(container){

      container.innerHTML = `
        <div class="certificate-error">
          Unable to load certificates.
        </div>
      `;

    }

  }

}


/* =========================================================
   RENDER CERTIFICATES
   ========================================================= */

function renderCertificates(){

  const container =
    $("certificateList");


  if(!container){

    return;

  }


  if(
    !certificates.length
  ){

    container.innerHTML = `
      <div class="certificate-empty">

        <div class="certificate-icon">
          🎓
        </div>

        <h2>
          No certificates yet
        </h2>

        <p>
          Complete a course to earn your certificate.
        </p>

        <a
          href="dashboard.html"
          class="btn btn-primary"
        >
          Go to Dashboard
        </a>

      </div>
    `;

    return;

  }


  container.innerHTML =
    certificates
      .map(
        certificate =>
          certificateCard(
            certificate
          )
      )
      .join("");


  bindCertificateEvents();

}


/* =========================================================
   CERTIFICATE CARD
   ========================================================= */

function certificateCard(
  certificate
){

  const title =
    certificate.courseTitle ||
    certificate.courseName ||
    "LetsStudy Pro Course";


  const issueDate =
    formatDate(
      certificate.issuedAt ||
      certificate.createdAt
    );


  const certificateId =
    certificate.certificateId ||
    certificate.id;


  const status =
    certificate.status ||
    "valid";


  return `
    <article
      class="certificate-card"
      data-certificate-id="${escapeHTML(
        certificate.id
      )}"
    >

      <div class="certificate-card-icon">
        🎓
      </div>


      <div class="certificate-card-content">

        <span class="certificate-status">
          ${escapeHTML(status)}
        </span>

        <h3>
          ${escapeHTML(title)}
        </h3>

        <p>
          Certificate ID:
          <strong>
            ${escapeHTML(
              certificateId
            )}
          </strong>
        </p>

        <p>
          Issued:
          ${escapeHTML(issueDate)}
        </p>

      </div>


      <div class="certificate-card-actions">

        <button
          type="button"
          data-view-certificate="${escapeHTML(
            certificate.id
          )}"
        >
          View
        </button>

        <button
          type="button"
          data-print-certificate="${escapeHTML(
            certificate.id
          )}"
        >
          Download / Print
        </button>

        <button
          type="button"
          data-verify-certificate="${escapeHTML(
            certificateId
          )}"
        >
          Verify
        </button>

      </div>

    </article>
  `;

}


/* =========================================================
   BIND EVENTS
   ========================================================= */

function bindCertificateEvents(){

  document
    .querySelectorAll(
      "[data-view-certificate]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            viewCertificate(
              button.dataset
                .viewCertificate
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-print-certificate]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            printCertificate(
              button.dataset
                .printCertificate
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-verify-certificate]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            verifyCertificate(
              button.dataset
                .verifyCertificate
            );

          }
        );

      }
    );

}


/* =========================================================
   GET CERTIFICATE
   ========================================================= */

async function getCertificate(
  id
){

  const local =
    certificates.find(
      certificate =>
        certificate.id === id
    );


  if(local){

    return local;

  }


  const certificateRef =
    doc(
      db,
      CERTIFICATE_CONFIG.collection,
      id
    );


  const snapshot =
    await getDoc(
      certificateRef
    );


  if(
    !snapshot.exists()
  ){

    throw new Error(
      "Certificate not found."
    );

  }


  return {

    id:
      snapshot.id,

    ...snapshot.data()

  };

}


/* =========================================================
   VIEW CERTIFICATE
   ========================================================= */

async function viewCertificate(
  id
){

  try{

    const certificate =
      await getCertificate(
        id
      );


    renderCertificateViewer(
      certificate
    );


  }catch(error){

    console.error(
      "View certificate error:",
      error
    );


    showMessage(
      "Certificate could not be opened.",
      "error"
    );

  }

}


/* =========================================================
   CERTIFICATE VIEWER
   ========================================================= */

function renderCertificateViewer(
  certificate
){

  const modal =
    $("certificateModal");


  if(!modal){

    /*
     If no modal exists,
     create one automatically.
    */

    createCertificateModal();

    return renderCertificateViewer(
      certificate
    );

  }


  const name =
    certificate.studentName ||
    currentUser?.displayName ||
    "Student";


  const course =
    certificate.courseTitle ||
    certificate.courseName ||
    "Course";


  const certificateId =
    certificate.certificateId ||
    certificate.id;


  const issueDate =
    formatDate(
      certificate.issuedAt ||
      certificate.createdAt
    );


  const certificateName =
    $("certificateStudentName");


  const certificateCourse =
    $("certificateCourse");


  const certificateDate =
    $("certificateDate");


  const certificateNumber =
    $("certificateNumber");


  if(certificateName){

    certificateName.textContent =
      name;

  }


  if(certificateCourse){

    certificateCourse.textContent =
      course;

  }


  if(certificateDate){

    certificateDate.textContent =
      issueDate;

  }


  if(certificateNumber){

    certificateNumber.textContent =
      certificateId;

  }


  modal.style.display =
    "flex";


  modal.dataset.certificateId =
    certificate.id;

}


/* =========================================================
   CREATE MODAL
   ========================================================= */

function createCertificateModal(){

  const modal =
    document.createElement(
      "div"
    );


  modal.id =
    "certificateModal";


  modal.className =
    "certificate-modal";


  modal.innerHTML = `

    <div
      class="certificate-document"
    >

      <button
        type="button"
        id="closeCertificateModal"
        class="certificate-close"
      >
        ×
      </button>


      <div class="certificate-logo">
        🎓
      </div>


      <p>
        LETSSTUDY PRO
      </p>


      <h1>
        Certificate of Completion
      </h1>


      <p>
        This certificate is proudly presented to
      </p>


      <h2 id="certificateStudentName">
        Student
      </h2>


      <p>
        for successfully completing
      </p>


      <h3 id="certificateCourse">
        Course
      </h3>


      <div class="certificate-meta">

        <p>
          Issued:
          <strong id="certificateDate">
            —
          </strong>
        </p>

        <p>
          Certificate ID:
          <strong id="certificateNumber">
            —
          </strong>
        </p>

      </div>


      <div class="certificate-signature">
        LetsStudy Pro
      </div>


      <div class="certificate-actions">

        <button
          type="button"
          id="printCertificateBtn"
        >
          Download / Print
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  $("closeCertificateModal")
    ?.addEventListener(
      "click",
      closeCertificateModal
    );


  $("printCertificateBtn")
    ?.addEventListener(
      "click",
      () => {

        window.print();

      }
    );

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeCertificateModal(){

  const modal =
    $("certificateModal");


  if(modal){

    modal.style.display =
      "none";

  }

}


/* =========================================================
   PRINT / DOWNLOAD
   ========================================================= */

async function printCertificate(
  id
){

  try{

    await viewCertificate(
      id
    );


    setTimeout(
      () => {

        window.print();

      },
      300
    );


  }catch(error){

    console.error(
      error
    );

  }

}


/* =========================================================
   VERIFY CERTIFICATE
   ========================================================= */

function verifyCertificate(
  certificateId
){

  if(!certificateId){

    return;

  }


  window.location.href =
    CERTIFICATE_CONFIG.verifyPage +
    "?certificateId=" +
    encodeURIComponent(
      certificateId
    );

}


/* =========================================================
   SEARCH / VERIFY
   ========================================================= */

async function searchCertificate(){

  const input =
    $("certificateSearch");


  if(!input){

    return;

  }


  const certificateId =
    input.value.trim();


  if(!certificateId){

    showMessage(
      "Enter a certificate ID.",
      "error"
    );

    return;

  }


  try{

    const certificatesRef =
      collection(
        db,
        CERTIFICATE_CONFIG.collection
      );


    const certificateQuery =
      query(
        certificatesRef,
        where(
          "certificateId",
          "==",
          certificateId
        )
      );


    const snapshot =
      await getDocs(
        certificateQuery
      );


    if(
      snapshot.empty
    ){

      showMessage(
        "Certificate not found.",
        "error"
      );

      return;

    }


    window.location.href =
      CERTIFICATE_CONFIG.verifyPage +
      "?certificateId=" +
      encodeURIComponent(
        certificateId
      );

  }catch(error){

    console.error(
      "Certificate search error:",
      error
    );


    showMessage(
      "Unable to verify certificate.",
      "error"
    );

  }

}


/* =========================================================
   INIT
   ========================================================= */

function initCertificate(){

  const searchButton =
    $("certificateSearchBtn");


  if(searchButton){

    searchButton.addEventListener(
      "click",
      searchCertificate
    );

  }


  const searchInput =
    $("certificateSearch");


  if(searchInput){

    searchInput.addEventListener(
      "keydown",
      event => {

        if(
          event.key ===
          "Enter"
        ){

          event.preventDefault();

          searchCertificate();

        }

      }
    );

  }

}


/* =========================================================
   AUTH
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user || null;


    if(!user){

      const container =
        $("certificateList");


      if(container){

        container.innerHTML = `
          <div class="certificate-login">

            <h2>
              Login required
            </h2>

            <p>
              Login to view your certificates.
            </p>

            <a href="auth.html">
              Login
            </a>

          </div>
        `;

      }

      return;

    }


    await loadCertificates();

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
    initCertificate
  );

}else{

  initCertificate();

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.LetsStudyCertificates = {

  loadCertificates,

  viewCertificate,

  printCertificate,

  verifyCertificate,

  searchCertificate

};


console.log(
  "LetsStudy Pro Certificate System ready."
);