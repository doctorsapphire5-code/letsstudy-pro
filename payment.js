/* =========================================================
   LETSSTUDY PRO
   PAYMENT.JS
   Checkout → Payment → Pesapal
   ========================================================= */

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
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

const PAYMENT_CONFIG = {

  ordersCollection:
    "orders",

  paymentApi:
    "/api/create-payment",

  verifyPage:
    "verify.html",

  orderPage:
    "order.html",

  checkoutPage:
    "checkout.html",

  cartKey:
    "letsStudyCart",

  pendingOrderKey:
    "letsStudyPendingOrder"

};


/* =========================================================
   STATE
   ========================================================= */

let currentUser =
  null;

let currentOrder =
  null;

let orderId =
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
    params.get("orderId") ||
    params.get("id")
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


function showMessage(
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


  const box =
    $("paymentMessage");


  if(box){

    box.textContent =
      message;

    box.style.display =
      "block";

  }else{

    alert(
      message
    );

  }

}


/* =========================================================
   LOAD ORDER
   ========================================================= */

async function loadOrder(){

  orderId =
    getOrderId();


  if(!orderId){

    showError(
      "Payment order was not found."
    );

    return;

  }


  try{

    showLoading();


    const orderRef =
      doc(
        db,
        PAYMENT_CONFIG.ordersCollection,
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
        "This order does not exist."
      );

      return;

    }


    currentOrder = {

      id:
        snapshot.id,

      ...snapshot.data()

    };


    /*
     Make sure the logged-in
     user owns this order.
    */

    if(
      currentUser &&
      currentOrder.userId &&
      currentOrder.userId !==
        currentUser.uid
    ){

      showError(
        "You do not have access to this order."
      );

      return;

    }


    renderOrder(
      currentOrder
    );


  }catch(error){

    console.error(
      "Load payment order error:",
      error
    );


    showError(
      "Unable to load payment information."
    );

  }

}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading(){

  const title =
    $("paymentTitle");


  if(title){

    title.textContent =
      "Loading payment...";

  }

}


/* =========================================================
   ERROR
   ========================================================= */

function showError(
  message
){

  const container =
    $("paymentContainer");


  if(container){

    container.innerHTML = `
      <div class="payment-error">

        <div>
          ⚠️
        </div>

        <h2>
          ${escapeHTML(message)}
        </h2>

        <a
          href="checkout.html"
          class="btn btn-primary"
        >
          Back to Checkout
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

  const title =
    $("paymentTitle");


  if(title){

    title.textContent =
      "Secure Payment";

  }


  const orderNumber =
    $("paymentOrderId");


  if(orderNumber){

    orderNumber.textContent =
      order.id;

  }


  const email =
    $("paymentEmail");


  if(email){

    email.textContent =
      order.customerEmail ||
      currentUser?.email ||
      "";

  }


  const total =
    $("paymentTotal");


  if(total){

    total.textContent =
      formatMoney(
        order.total
      );

  }


  const items =
    $("paymentItems");


  if(items){

    items.innerHTML =
      (order.items || [])
        .map(
          item => `

            <div class="payment-item">

              <div>

                <strong>
                  ${escapeHTML(
                    item.title ||
                    "Course"
                  )}
                </strong>

                <small>
                  ×
                  ${Number(
                    item.quantity || 1
                  )}
                </small>

              </div>

              <strong>
                ${formatMoney(
                  Number(
                    item.price || 0
                  ) *
                  Number(
                    item.quantity || 1
                  )
                )}
              </strong>

            </div>

          `
        )
        .join("");

  }


  const status =
    $("paymentStatus");


  if(status){

    status.textContent =
      order.paymentStatus ||
      "unpaid";

  }


  updatePaymentButton(
    order
  );

}


/* =========================================================
   PAYMENT BUTTON
   ========================================================= */

function updatePaymentButton(
  order
){

  const button =
    $("payNowBtn");


  if(!button){

    return;

  }


  if(
    order.status ===
      "completed" ||
    order.paymentStatus ===
      "paid"
  ){

    button.textContent =
      "Payment Completed";

    button.disabled =
      true;

    return;

  }


  button.disabled =
    false;

  button.textContent =
    "Pay Now";

}


/* =========================================================
   CREATE PESAPAL PAYMENT
   ========================================================= */

async function startPayment(){

  if(!currentUser){

    showMessage(
      "Please login before making payment."
    );

    return;

  }


  if(!currentOrder){

    showMessage(
      "Order information is unavailable."
    );

    return;

  }


  if(
    !currentOrder.total ||
    Number(
      currentOrder.total
    ) <= 0
  ){

    showMessage(
      "This order does not require payment."
    );

    return;

  }


  const button =
    $("payNowBtn");


  try{

    if(button){

      button.disabled =
        true;

      button.textContent =
        "Starting payment...";

    }


    /*
     IMPORTANT:
     This endpoint must exist on your
     secure backend.

     Do NOT put:
     PESAPAL_CONSUMER_KEY
     PESAPAL_CONSUMER_SECRET

     inside frontend JavaScript.
    */

    const response =
      await fetch(
        PAYMENT_CONFIG.paymentApi,
        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              orderId:
                currentOrder.id,

              amount:
                Number(
                  currentOrder.total
                ),

              currency:
                "TZS",

              description:
                `LetsStudy Pro Order ${currentOrder.id}`,

              email:
                currentOrder.customerEmail ||
                currentUser.email ||
                "",

              callbackUrl:
                window.location.origin +
                "/verify.html?orderId=" +
                encodeURIComponent(
                  currentOrder.id
                )

            })

        }
      );


    const data =
      await response.json()
        .catch(
          () => ({})
        );


    if(
      !response.ok
    ){

      throw new Error(
        data.message ||
        data.error ||
        "Payment request failed."
      );

    }


    /*
     Accept common response names
     from your backend.
    */

    const redirectUrl =
      data.redirectUrl ||
      data.redirectURL ||
      data.paymentUrl ||
      data.paymentURL;


    const trackingId =
      data.orderTrackingId ||
      data.OrderTrackingId ||
      data.trackingId ||
      "";


    if(!redirectUrl){

      throw new Error(
        "Payment gateway did not return a payment URL."
      );

    }


    /*
     Save payment information
     locally for verification page.
    */

    localStorage.setItem(
      PAYMENT_CONFIG.pendingOrderKey,
      JSON.stringify({

        orderId:
          currentOrder.id,

        trackingId,

        redirectUrl,

        amount:
          currentOrder.total,

        createdAt:
          Date.now()

      })
    );


    /*
     Update order status.
    */

    const orderRef =
      doc(
        db,
        PAYMENT_CONFIG.ordersCollection,
        currentOrder.id
      );


    await updateDoc(
      orderRef,
      {

        paymentStatus:
          "processing",

        paymentTrackingId:
          trackingId,

        paymentStartedAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    /*
     Redirect to Pesapal.
    */

    window.location.href =
      redirectUrl;


  }catch(error){

    console.error(
      "Payment error:",
      error
    );


    showMessage(
      error.message ||
      "Unable to start payment."
    );


    if(button){

      button.disabled =
        false;

      button.textContent =
        "Pay Now";

    }

  }

}


/* =========================================================
   CANCEL PAYMENT
   ========================================================= */

function cancelPayment(){

  if(
    currentOrder &&
    currentOrder.id
  ){

    window.location.href =
      PAYMENT_CONFIG.orderPage +
      "?id=" +
      encodeURIComponent(
        currentOrder.id
      );

  }else{

    window.location.href =
      PAYMENT_CONFIG.checkoutPage;

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


    if(user){

      await loadOrder();

    }else{

      showError(
        "Please login to continue."
      );

    }

  }
);


/* =========================================================
   INIT
   ========================================================= */

function initPayment(){

  const payButton =
    $("payNowBtn");


  if(payButton){

    payButton.addEventListener(
      "click",
      startPayment
    );

  }


  const cancelButton =
    $("cancelPaymentBtn");


  if(cancelButton){

    cancelButton.addEventListener(
      "click",
      cancelPayment
    );

  }

}


if(
  document.readyState ===
  "loading"
){

  document.addEventListener(
    "DOMContentLoaded",
    initPayment
  );

}else{

  initPayment();

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.LetsStudyPayment = {

  loadOrder,

  startPayment,

  cancelPayment

};


console.log(
  "LetsStudy Pro Payment System ready."
);