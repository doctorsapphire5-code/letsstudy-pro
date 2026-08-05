/* =========================================================
   LETSSTUDY PRO
   ORDER.JS
   Order Details + Payment Status + Course Access
   ========================================================= */

import {
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

const ORDER_CONFIG = {

  ordersCollection:
    "orders",

  paymentPage:
    "payment.html",

  verifyPage:
    "verify.html",

  coursesPage:
    "courses.html",

  dashboardPage:
    "dashboard.html"

};


/* =========================================================
   STATE
   ========================================================= */

let currentUser =
  null;

let currentOrder =
  null;


/* =========================================================
   HELPERS
   ========================================================= */

const $ =
  id =>
    document.getElementById(id);


function getOrderId(){

  const params =
    new URLSearchParams(
      window.location.search
    );

  return (
    params.get("id") ||
    params.get("orderId")
  );

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


/* =========================================================
   STATUS CLASS
   ========================================================= */

function statusClass(
  status
){

  const value =
    String(
      status || ""
    )
      .toLowerCase();


  if(
    value === "completed" ||
    value === "paid" ||
    value === "success"
  ){

    return "success";

  }


  if(
    value === "pending" ||
    value === "processing" ||
    value === "unpaid"
  ){

    return "pending";

  }


  if(
    value === "failed" ||
    value === "cancelled" ||
    value === "canceled"
  ){

    return "failed";

  }


  return "default";

}


/* =========================================================
   LOAD ORDER
   ========================================================= */

async function loadOrder(){

  const orderId =
    getOrderId();


  if(!orderId){

    showError(
      "Order ID is missing."
    );

    return;

  }


  try{

    showLoading();


    const orderRef =
      doc(
        db,
        ORDER_CONFIG.ordersCollection,
        orderId
      );


    const snapshot =
      await getDoc(
        orderRef
      );


    if(
      !snapshot.exists()
    ){

      showError(
        "Order not found."
      );

      return;

    }


    currentOrder = {

      id:
        snapshot.id,

      ...snapshot.data()

    };


    /*
     Security check:
     A logged-in user can only
     view their own order.
    */

    if(
      currentUser &&
      currentOrder.userId &&
      currentOrder.userId !==
        currentUser.uid
    ){

      showError(
        "You cannot view this order."
      );

      return;

    }


    renderOrder(
      currentOrder
    );


  }catch(error){

    console.error(
      "Order loading error:",
      error
    );


    showError(
      "Unable to load order."
    );

  }

}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading(){

  const container =
    $("orderContainer");


  if(container){

    container.innerHTML = `
      <div class="order-loading">
        Loading order...
      </div>
    `;

  }

}


/* =========================================================
   ERROR
   ========================================================= */

function showError(
  message
){

  const container =
    $("orderContainer");


  if(container){

    container.innerHTML = `
      <div class="order-error">

        <div>
          ⚠️
        </div>

        <h2>
          ${escapeHTML(message)}
        </h2>

        <a
          href="dashboard.html"
          class="btn btn-primary"
        >
          Go to Dashboard
        </a>

      </div>
    `;

  }

}


/* =========================================================
   RENDER ORDER
   ========================================================= */

function renderOrder(
  order
){

  document.title =
    "Order " +
    order.id +
    " | LetsStudy Pro";


  const orderId =
    $("orderId");


  if(orderId){

    orderId.textContent =
      order.id;

  }


  const email =
    $("orderEmail");


  if(email){

    email.textContent =
      order.customerEmail ||
      currentUser?.email ||
      "";

  }


  const date =
    $("orderDate");


  if(date){

    date.textContent =
      formatDate(
        order.createdAt
      );

  }


  const status =
    $("orderStatus");


  if(status){

    status.textContent =
      order.status ||
      "pending";

    status.className =
      "status " +
      statusClass(
        order.status
      );

  }


  const paymentStatus =
    $("orderPaymentStatus");


  if(paymentStatus){

    paymentStatus.textContent =
      order.paymentStatus ||
      "unpaid";

    paymentStatus.className =
      "status " +
      statusClass(
        order.paymentStatus
      );

  }


  renderItems(
    order.items || []
  );


  const subtotal =
    $("orderSubtotal");


  if(subtotal){

    subtotal.textContent =
      formatMoney(
        order.subtotal ||
        order.total ||
        0
      );

  }


  const total =
    $("orderTotal");


  if(total){

    total.textContent =
      formatMoney(
        order.total ||
        0
      );

  }


  updateActions(
    order
  );

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
  timestamp
){

  if(
    !timestamp
  ){

    return "—";

  }


  try{

    const date =
      timestamp.toDate
        ? timestamp.toDate()
        : new Date(
            timestamp
          );


    return new Intl.DateTimeFormat(
      "en-TZ",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short"
      }
    ).format(
      date
    );

  }catch{

    return "—";

  }

}


/* =========================================================
   RENDER ITEMS
   ========================================================= */

function renderItems(
  items
){

  const container =
    $("orderItems");


  if(!container){

    return;

  }


  if(!items.length){

    container.innerHTML = `
      <p>
        No items found in this order.
      </p>
    `;

    return;

  }


  container.innerHTML =
    items
      .map(
        item => {

          const quantity =
            Number(
              item.quantity || 1
            );


          const price =
            Number(
              item.price || 0
            );


          return `
            <div
              class="order-item"
            >

              <div
                class="order-item-image"
              >

                <img
                  src="${
                    escapeHTML(
                      item.image ||
                      "https://placehold.co/100x70?text=Course"
                    )
                  }"
                  alt="${escapeHTML(
                    item.title ||
                    "Course"
                  )}"
                >

              </div>


              <div
                class="order-item-info"
              >

                <strong>
                  ${escapeHTML(
                    item.title ||
                    "Course"
                  )}
                </strong>

                <small>
                  ${escapeHTML(
                    item.type ||
                    "course"
                  )}
                  ×
                  ${quantity}
                </small>

              </div>


              <strong>
                ${formatMoney(
                  price *
                  quantity
                )}
              </strong>

            </div>
          `;

        }
      )
      .join("");

}


/* =========================================================
   ACTION BUTTONS
   ========================================================= */

function updateActions(
  order
){

  const paymentStatus =
    String(
      order.paymentStatus ||
      ""
    ).toLowerCase();


  const status =
    String(
      order.status ||
      ""
    ).toLowerCase();


  const payButton =
    $("payOrderBtn");


  const verifyButton =
    $("verifyOrderBtn");


  const dashboardButton =
    $("dashboardBtn");


  /*
   Paid / completed
  */

  if(
    paymentStatus === "paid" ||
    status === "completed"
  ){

    if(payButton){

      payButton.style.display =
        "none";

    }


    if(verifyButton){

      verifyButton.style.display =
        "none";

    }


    return;

  }


  /*
   Processing
  */

  if(
    paymentStatus ===
      "processing"
  ){

    if(payButton){

      payButton.style.display =
        "none";

    }


    if(verifyButton){

      verifyButton.style.display =
        "inline-flex";

      verifyButton.onclick =
        function(){

          window.location.href =
            ORDER_CONFIG.verifyPage +
            "?orderId=" +
            encodeURIComponent(
              order.id
            );

        };

    }


    return;

  }


  /*
   Pending / unpaid
  */

  if(payButton){

    payButton.style.display =
      "inline-flex";

    payButton.onclick =
      function(){

        window.location.href =
          ORDER_CONFIG.paymentPage +
          "?orderId=" +
          encodeURIComponent(
            order.id
          );

      };

  }

}


/* =========================================================
   COPY ORDER ID
   ========================================================= */

async function copyOrderId(){

  const id =
    getOrderId();


  if(!id){

    return;

  }


  try{

    await navigator.clipboard.writeText(
      id
    );


    showToast(
      "Order ID copied."
    );

  }catch(error){

    console.error(
      error
    );

  }

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
  message
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


  alert(
    message
  );

}


/* =========================================================
   INIT EVENTS
   ========================================================= */

function initOrder(){

  const copyButton =
    $("copyOrderIdBtn");


  if(copyButton){

    copyButton.addEventListener(
      "click",
      copyOrderId
    );

  }


  const dashboardButton =
    $("dashboardBtn");


  if(dashboardButton){

    dashboardButton.onclick =
      function(){

        window.location.href =
          ORDER_CONFIG.dashboardPage;

      };

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

      showError(
        "Please login to view this order."
      );

      return;

    }


    await loadOrder();

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
    initOrder
  );

}else{

  initOrder();

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.LetsStudyOrder = {

  loadOrder,

  copyOrderId

};


console.log(
  "LetsStudy Pro Order System ready."
);