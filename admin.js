/* =========================================================
   LETSSTUDY PRO
   ADMIN.JS
   Admin Dashboard
   Firebase Auth + Firestore
   ========================================================= */

import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  limit
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

const ADMIN_CONFIG = {

  users: "users",

  courses: "courses",

  orders: "orders",

  payments: "payments",

  certificates: "certificates",

  posts: "communityPosts",

  authPage: "auth.html",

  dashboardPage: "dashboard.html"

};


/* =========================================================
   STATE
   ========================================================= */

let currentAdmin =
  null;

let adminData = {

  users: [],

  courses: [],

  orders: [],

  payments: [],

  certificates: [],

  posts: []

};


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


function formatMoney(
  amount
){

  return new Intl.NumberFormat(
    "en-TZ",
    {
      style:
        "currency",

      currency:
        "TZS",

      maximumFractionDigits:
        0
    }
  ).format(
    Number(
      amount || 0
    )
  );

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
        : new Date(value);

    return new Intl.DateTimeFormat(
      "en-TZ",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short"
      }
    ).format(date);

  }catch{

    return "—";

  }

}


function getMillis(
  value
){

  if(!value){

    return 0;

  }

  try{

    if(
      typeof value.toMillis ===
      "function"
    ){

      return value.toMillis();

    }

    return new Date(
      value
    ).getTime();

  }catch{

    return 0;

  }

}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
  message,
  type = "info"
){

  if(
    typeof window.showToast ===
    "function"
  ){

    window.showToast(
      message
    );

    return;

  }

  const box =
    $("adminMessage");

  if(box){

    box.textContent =
      message;

    box.className =
      "admin-message " +
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

  }

}


/* =========================================================
   ADMIN AUTHORIZATION
   ========================================================= */

async function checkAdmin(
  user
){

  if(!user){

    window.location.href =
      ADMIN_CONFIG.authPage;

    return false;

  }


  try{

    const userRef =
      doc(
        db,
        ADMIN_CONFIG.users,
        user.uid
      );

    const snapshot =
      await getDoc(
        userRef
      );


    if(
      !snapshot.exists()
    ){

      showAccessDenied();

      return false;

    }


    const data =
      snapshot.data();


    const role =
      String(
        data.role ||
        ""
      ).toLowerCase();


    /*
     Supported admin roles.
    */

    const allowedRoles = [

      "admin",

      "superadmin",

      "super_admin",

      "administrator"

    ];


    if(
      !allowedRoles.includes(
        role
      )
    ){

      showAccessDenied();

      return false;

    }


    currentAdmin = {

      uid:
        user.uid,

      ...data

    };


    return true;

  }catch(error){

    console.error(
      "Admin authorization error:",
      error
    );

    showAccessDenied();

    return false;

  }

}


/* =========================================================
   ACCESS DENIED
   ========================================================= */

function showAccessDenied(){

  document.body.innerHTML = `

    <main
      class="admin-access-denied"
    >

      <div>

        <h1>
          Access Denied
        </h1>

        <p>
          You do not have permission
          to access the Admin Panel.
        </p>

        <a
          href="dashboard.html"
        >
          Back to Dashboard
        </a>

      </div>

    </main>

  `;

}


/* =========================================================
   LOAD COLLECTION
   ========================================================= */

async function loadCollection(
  collectionName
){

  const snapshot =
    await getDocs(
      collection(
        db,
        collectionName
      )
    );


  return snapshot.docs.map(
    item => ({

      id:
        item.id,

      ...item.data()

    })
  );

}


/* =========================================================
   LOAD ALL ADMIN DATA
   ========================================================= */

async function loadAdminData(){

  try{

    showLoading();


    const results =
      await Promise.allSettled([

        loadCollection(
          ADMIN_CONFIG.users
        ),

        loadCollection(
          ADMIN_CONFIG.courses
        ),

        loadCollection(
          ADMIN_CONFIG.orders
        ),

        loadCollection(
          ADMIN_CONFIG.payments
        ),

        loadCollection(
          ADMIN_CONFIG.certificates
        ),

        loadCollection(
          ADMIN_CONFIG.posts
        )

      ]);


    adminData.users =
      results[0].status === "fulfilled"
        ? results[0].value
        : [];


    adminData.courses =
      results[1].status === "fulfilled"
        ? results[1].value
        : [];


    adminData.orders =
      results[2].status === "fulfilled"
        ? results[2].value
        : [];


    adminData.payments =
      results[3].status === "fulfilled"
        ? results[3].value
        : [];


    adminData.certificates =
      results[4].status === "fulfilled"
        ? results[4].value
        : [];


    adminData.posts =
      results[5].status === "fulfilled"
        ? results[5].value
        : [];


    updateStats();

    renderRecentOrders();

    renderUsers();

    renderCourses();

    renderPayments();

    renderCertificates();

    renderPosts();


    hideLoading();


  }catch(error){

    console.error(
      "Admin data error:",
      error
    );

    showMessage(
      "Unable to load admin data.",
      "error"
    );

  }

}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading(){

  const loader =
    $("adminLoading");

  if(loader){

    loader.style.display =
      "block";

  }

}


function hideLoading(){

  const loader =
    $("adminLoading");

  if(loader){

    loader.style.display =
      "none";

  }

}


/* =========================================================
   UPDATE STATISTICS
   ========================================================= */

function updateStats(){

  setText(
    "totalUsers",
    adminData.users.length
  );


  setText(
    "totalCourses",
    adminData.courses.length
  );


  setText(
    "totalOrders",
    adminData.orders.length
  );


  setText(
    "totalPayments",
    adminData.payments.length
  );


  setText(
    "totalCertificates",
    adminData.certificates.length
  );


  setText(
    "totalPosts",
    adminData.posts.length
  );


  const revenue =
    adminData.orders.reduce(
      (
        total,
        order
      ) => {

        const status =
          String(
            order.paymentStatus ||
            order.status ||
            ""
          ).toLowerCase();


        if(
          status === "paid" ||
          status === "completed" ||
          status === "success"
        ){

          return total +
            Number(
              order.total ||
              order.amount ||
              0
            );

        }

        return total;

      },
      0
    );


  setText(
    "totalRevenue",
    formatMoney(
      revenue
    )
  );

}


function setText(
  id,
  value
){

  const element =
    $(id);

  if(element){

    element.textContent =
      value;

  }

}


/* =========================================================
   RECENT ORDERS
   ========================================================= */

function renderRecentOrders(){

  const container =
    $("recentOrders");

  if(!container){

    return;

  }


  const orders =
    [...adminData.orders]
      .sort(
        (
          a,
          b
        ) =>
          getMillis(
            b.createdAt
          ) -
          getMillis(
            a.createdAt
          )
      )
      .slice(
        0,
        10
      );


  if(!orders.length){

    container.innerHTML = `
      <p>
        No orders found.
      </p>
    `;

    return;

  }


  container.innerHTML =
    orders
      .map(
        order => `

          <div
            class="admin-order"
          >

            <strong>
              ${escapeHTML(
                order.id
              )}
            </strong>

            <span>
              ${escapeHTML(
                order.customerEmail ||
                order.email ||
                order.userId ||
                ""
              )}
            </span>

            <strong>
              ${formatMoney(
                order.total ||
                order.amount ||
                0
              )}
            </strong>

            <span>
              ${escapeHTML(
                order.paymentStatus ||
                order.status ||
                "pending"
              )}
            </span>

            <small>
              ${escapeHTML(
                formatDate(
                  order.createdAt
                )
              )}
            </small>

          </div>

        `
      )
      .join("");

}


/* =========================================================
   USERS
   ========================================================= */

function renderUsers(){

  const container =
    $("adminUsers");

  if(!container){

    return;

  }


  container.innerHTML =
    adminData.users
      .slice(
        0,
        50
      )
      .map(
        user => `

          <div
            class="admin-user"
          >

            <strong>
              ${escapeHTML(
                user.displayName ||
                "User"
              )}
            </strong>

            <span>
              ${escapeHTML(
                user.email ||
                ""
              )}
            </span>

            <span>
              ${escapeHTML(
                user.role ||
                "student"
              )}
            </span>

            <small>
              ${escapeHTML(
                user.uid ||
                ""
              )}
            </small>

          </div>

        `
      )
      .join("");

}


/* =========================================================
   COURSES
   ========================================================= */

function renderCourses(){

  const container =
    $("adminCourses");

  if(!container){

    return;

  }


  container.innerHTML =
    adminData.courses
      .slice(
        0,
        50
      )
      .map(
        course => `

          <div
            class="admin-course"
          >

            <strong>
              ${escapeHTML(
                course.title ||
                course.name ||
                "Untitled Course"
              )}
            </strong>

            <span>
              ${formatMoney(
                course.price ||
                0
              )}
            </span>

            <span>
              ${escapeHTML(
                course.status ||
                "active"
              )}
            </span>

            <button
              type="button"
              data-delete-course="${
                escapeHTML(
                  course.id
                )
              }"
            >
              Delete
            </button>

          </div>

        `
      )
      .join("");


  document
    .querySelectorAll(
      "[data-delete-course]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            deleteRecord(
              ADMIN_CONFIG.courses,
              button.dataset
                .deleteCourse,
              "course"
            );

          }
        );

      }
    );

}


/* =========================================================
   PAYMENTS
   ========================================================= */

function renderPayments(){

  const container =
    $("adminPayments");

  if(!container){

    return;

  }


  container.innerHTML =
    adminData.payments
      .slice(
        0,
        50
      )
      .map(
        payment => `

          <div
            class="admin-payment"
          >

            <strong>
              ${formatMoney(
                payment.amount ||
                0
              )}
            </strong>

            <span>
              ${escapeHTML(
                payment.status ||
                payment.paymentStatus ||
                "pending"
              )}
            </span>

            <span>
              ${escapeHTML(
                payment.method ||
                "—"
              )}
            </span>

            <small>
              ${escapeHTML(
                formatDate(
                  payment.createdAt
                )
              )}
            </small>

          </div>

        `
      )
      .join("");

}


/* =========================================================
   CERTIFICATES
   ========================================================= */

function renderCertificates(){

  const container =
    $("adminCertificates");

  if(!container){

    return;

  }


  container.innerHTML =
    adminData.certificates
      .slice(
        0,
        50
      )
      .map(
        certificate => `

          <div
            class="admin-certificate"
          >

            <strong>
              ${escapeHTML(
                certificate.courseTitle ||
                certificate.courseName ||
                "Course"
              )}
            </strong>

            <span>
              ${escapeHTML(
                certificate.studentName ||
                certificate.userId ||
                ""
              )}
            </span>

            <span>
              ${escapeHTML(
                certificate.certificateId ||
                certificate.id
              )}
            </span>

            <small>
              ${escapeHTML(
                formatDate(
                  certificate.issuedAt ||
                  certificate.createdAt
                )
              )}
            </small>

          </div>

        `
      )
      .join("");

}


/* =========================================================
   COMMUNITY POSTS
   ========================================================= */

function renderPosts(){

  const container =
    $("adminPosts");

  if(!container){

    return;

  }


  container.innerHTML =
    adminData.posts
      .slice(
        0,
        50
      )
      .map(
        post => `

          <div
            class="admin-post"
          >

            <strong>
              ${escapeHTML(
                post.title ||
                "Community Post"
              )}
            </strong>

            <p>
              ${escapeHTML(
                post.content ||
                ""
              ).slice(
                0,
                180
              )}
            </p>

            <small>
              ${escapeHTML(
                post.userName ||
                post.userId ||
                ""
              )}
            </small>

            <button
              type="button"
              data-delete-post="${
                escapeHTML(
                  post.id
                )
              }"
            >
              Delete
            </button>

          </div>

        `
      )
      .join("");


  document
    .querySelectorAll(
      "[data-delete-post]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            deleteRecord(
              ADMIN_CONFIG.posts,
              button.dataset
                .deletePost,
              "post"
            );

          }
        );

      }
    );

}


/* =========================================================
   DELETE RECORD
   ========================================================= */

async function deleteRecord(
  collectionName,
  id,
  label
){

  if(!currentAdmin){

    return;

  }


  if(!id){

    return;

  }


  const confirmed =
    confirm(
      `Delete this ${label}? This action cannot be undone.`
    );


  if(!confirmed){

    return;

  }


  try{

    await deleteDoc(
      doc(
        db,
        collectionName,
        id
      )
    );


    showMessage(
      `${label} deleted successfully.`
    );


    await loadAdminData();


  }catch(error){

    console.error(
      "Delete error:",
      error
    );


    showMessage(
      `Unable to delete ${label}.`,
      "error"
    );

  }

}


/* =========================================================
   REFRESH
   ========================================================= */

function initRefresh(){

  const button =
    $("refreshAdminBtn");

  if(button){

    button.addEventListener(
      "click",
      async () => {

        button.disabled =
          true;

        button.textContent =
          "Refreshing...";


        await loadAdminData();


        button.disabled =
          false;

        button.textContent =
          "Refresh";

      }
    );

  }

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logoutAdmin(){

  try{

    await auth.signOut();

    window.location.href =
      ADMIN_CONFIG.authPage;

  }catch(error){

    console.error(
      error
    );

  }

}


function initLogout(){

  const button =
    $("adminLogoutBtn");

  if(button){

    button.addEventListener(
      "click",
      logoutAdmin
    );

  }

}


/* =========================================================
   DOM READY
   ========================================================= */

function initAdmin(){

  initRefresh();

  initLogout();

}


/* =========================================================
   AUTH
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    const authorized =
      await checkAdmin(
        user
      );


    if(!authorized){

      return;

    }


    initAdmin();

    await loadAdminData();

  }
);


/* =========================================================
   GLOBAL API
   ========================================================= */

window.LetsStudyAdmin = {

  loadAdminData,

  updateStats,

  renderUsers,

  renderCourses,

  renderPayments,

  renderCertificates,

  renderPosts,

  deleteRecord,

  logoutAdmin

};


console.log(
  "LetsStudy Pro Admin System ready."
);