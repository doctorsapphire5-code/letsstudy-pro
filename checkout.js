/* =========================================================
   LETSSTUDY PRO
   CHECKOUT.JS
   Cart → Checkout → Order → Payment
   ========================================================= */

import {
  collection,
  addDoc,
  doc,
  getDoc,
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

const CHECKOUT_CONFIG = {

  cartKey:
    "letsStudyCart",

  checkoutKey:
    "letsStudyCheckout",

  pendingOrderKey:
    "letsStudyPendingOrder",

  ordersCollection:
    "orders",

  paymentPage:
    "payment.html",

  authPage:
    "auth.html",

  coursesPage:
    "courses.html"

};


/* =========================================================
   STATE
   ========================================================= */

let currentUser =
  null;

let checkoutItems =
  [];

let checkoutTotal =
  0;


/* =========================================================
   HELPERS
   ========================================================= */

const $ =
  id =>
    document.getElementById(id);


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


  const element =
    $("checkoutMessage");


  if(element){

    element.textContent =
      message;

    element.style.display =
      "block";

  }else{

    alert(
      message
    );

  }

}


/* =========================================================
   GET CART
   ========================================================= */

function getCheckoutItems(){

  let items =
    [];


  try{

    const saved =
      localStorage.getItem(
        CHECKOUT_CONFIG.checkoutKey
      );


    if(saved){

      items =
        JSON.parse(
          saved
        ) || [];

    }


    /*
     Fallback to normal cart.
    */

    if(!items.length){

      items =
        JSON.parse(
          localStorage.getItem(
            CHECKOUT_CONFIG.cartKey
          )
        ) || [];

    }

  }catch(error){

    console.error(
      "Checkout cart error:",
      error
    );

    items =
      [];

  }


  return items;

}


/* =========================================================
   CALCULATE TOTAL
   ========================================================= */

function calculateTotal(){

  checkoutTotal =
    checkoutItems.reduce(
      (
        total,
        item
      ) => {

        const price =
          Number(
            item.price || 0
          );


        const quantity =
          Number(
            item.quantity || 1
          );


        return (
          total +
          price *
          quantity
        );

      },
      0
    );


  return checkoutTotal;

}


/* =========================================================
   RENDER CHECKOUT
   ========================================================= */

function renderCheckout(){

  const container =
    $("checkoutItems");


  checkoutItems =
    getCheckoutItems();


  if(
    !checkoutItems.length
  ){

    if(container){

      container.innerHTML = `
        <div class="checkout-empty">

          <div>
            🛒
          </div>

          <h2>
            Your cart is empty
          </h2>

          <a
            href="courses.html"
            class="btn btn-primary"
          >
            Browse Courses
          </a>

        </div>
      `;

    }


    updateSummary();

    return;

  }


  if(container){

    container.innerHTML =
      checkoutItems
        .map(
          item => {

            const price =
              Number(
                item.price || 0
              );


            const quantity =
              Number(
                item.quantity || 1
              );


            return `
              <div
                class="checkout-item"
              >

                <div class="checkout-item-info">

                  <strong>
                    ${escapeHTML(
                      item.title ||
                      "Course"
                    )}
                  </strong>

                  <small>
                    Qty:
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


  calculateTotal();

  updateSummary();

}


/* =========================================================
   SUMMARY
   ========================================================= */

function updateSummary(){

  const total =
    calculateTotal();


  const subtotal =
    $("checkoutSubtotal");


  const grandTotal =
    $("checkoutTotal");


  const count =
    $("checkoutItemCount");


  if(subtotal){

    subtotal.textContent =
      formatMoney(
        total
      );

  }


  if(grandTotal){

    grandTotal.textContent =
      formatMoney(
        total
      );

  }


  if(count){

    count.textContent =
      checkoutItems.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.quantity || 1
          ),
        0
      );

  }

}


/* =========================================================
   FILL USER DATA
   ========================================================= */

function fillUserData(
  user
){

  if(!user){

    return;

  }


  const email =
    $("customerEmail");


  const uid =
    $("customerUid");


  if(email){

    email.value =
      user.email ||
      "";

  }


  if(uid){

    uid.value =
      user.uid;

  }

}


/* =========================================================
   VALIDATE CHECKOUT
   ========================================================= */

function validateCheckout(){

  if(!currentUser){

    showMessage(
      "Please login before checkout."
    );

    return false;

  }


  if(
    !checkoutItems.length
  ){

    showMessage(
      "Your cart is empty."
    );

    return false;

  }


  if(
    checkoutTotal <= 0
  ){

    /*
     Free courses don't need
     payment, but still create
     an order/enrollment flow.
    */

    return true;

  }


  return true;

}


/* =========================================================
   CREATE ORDER
   ========================================================= */

async function createOrder(){

  if(
    !validateCheckout()
  ){

    return;

  }


  const button =
    $("placeOrderBtn");


  try{

    if(button){

      button.disabled =
        true;

      button.textContent =
        "Creating order...";

    }


    const orderData = {

      userId:
        currentUser.uid,

      customerEmail:
        currentUser.email ||
        "",

      items:
        checkoutItems.map(
          item => ({

            id:
              item.id,

            title:
              item.title ||
              "Course",

            price:
              Number(
                item.price || 0
              ),

            quantity:
              Number(
                item.quantity || 1
              ),

            type:
              item.type ||
              "course",

            image:
              item.image ||
              ""

          })
        ),

      subtotal:
        checkoutTotal,

      total:
        checkoutTotal,

      currency:
        "TZS",

      status:
        "pending",

      paymentStatus:
        checkoutTotal > 0
          ? "unpaid"
          : "paid",

      paymentMethod:
        "",

      createdAt:
        serverTimestamp(),

      updatedAt:
        serverTimestamp()

    };


    const ordersRef =
      collection(
        db,
        CHECKOUT_CONFIG.ordersCollection
      );


    const order =
      await addDoc(
        ordersRef,
        orderData
      );


    /*
     Save pending order locally
     so payment page can continue.
    */

    const pendingOrder = {

      orderId:
        order.id,

      userId:
        currentUser.uid,

      email:
        currentUser.email ||
        "",

      items:
        checkoutItems,

      total:
        checkoutTotal,

      currency:
        "TZS",

      createdAt:
        Date.now()

    };


    localStorage.setItem(
      CHECKOUT_CONFIG.pendingOrderKey,
      JSON.stringify(
        pendingOrder
      )
    );


    /*
     Free order
    */

    if(
      checkoutTotal <= 0
    ){

      await completeFreeOrder(
        order.id
      );

      return;

    }


    /*
     Paid order
    */

    window.location.href =
      CHECKOUT_CONFIG.paymentPage +
      "?orderId=" +
      encodeURIComponent(
        order.id
      );

  }catch(error){

    console.error(
      "Create order error:",
      error
    );


    showMessage(
      "Unable to create your order. Please try again."
    );


    if(button){

      button.disabled =
        false;

      button.textContent =
        "Place Order";

    }

  }

}


/* =========================================================
   COMPLETE FREE ORDER
   ========================================================= */

async function completeFreeOrder(
  orderId
){

  try{

    const orderRef =
      doc(
        db,
        CHECKOUT_CONFIG.ordersCollection,
        orderId
      );


    await getDoc(
      orderRef
    );


    /*
     The backend/admin/payment
     verification flow should normally
     grant course access.

     For a free course we can safely
     mark the order as completed.
    */

    const orderUpdate = {

      status:
        "completed",

      paymentStatus:
        "paid",

      paymentMethod:
        "free",

      updatedAt:
        serverTimestamp()

    };


    /*
     updateDoc is loaded below
     dynamically to keep the main
     import section simple.
    */

    const {
      updateDoc
    } = await import(
      "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js"
    );


    await updateDoc(
      orderRef,
      orderUpdate
    );


    localStorage.removeItem(
      CHECKOUT_CONFIG.cartKey
    );


    localStorage.removeItem(
      CHECKOUT_CONFIG.checkoutKey
    );


    showMessage(
      "Order completed successfully."
    );


    setTimeout(
      function(){

        window.location.href =
          "order.html?id=" +
          encodeURIComponent(
            orderId
          );

      },
      700
    );


  }catch(error){

    console.error(
      "Free order error:",
      error
    );


    showMessage(
      "Order created, but completion could not be confirmed."
    );

  }

}


/* =========================================================
   CHECKOUT FORM
   ========================================================= */

function initCheckoutForm(){

  const form =
    $("checkoutForm");


  if(!form){

    return;

  }


  form.addEventListener(
    "submit",
    function(event){

      event.preventDefault();

      createOrder();

    }
  );

}


/* =========================================================
   AUTH
   ========================================================= */

onAuthStateChanged(
  auth,
  function(user){

    currentUser =
      user || null;


    if(user){

      fillUserData(
        user
      );

    }

  }
);


/* =========================================================
   INIT
   ========================================================= */

function initCheckout(){

  renderCheckout();

  initCheckoutForm();

}


/* =========================================================
   GLOBAL API
   ========================================================= */

window.LetsStudyCheckout = {

  getCheckoutItems,

  calculateTotal,

  renderCheckout,

  createOrder,

  validateCheckout

};


/* =========================================================
   DOM READY
   ========================================================= */

if(
  document.readyState ===
  "loading"
){

  document.addEventListener(
    "DOMContentLoaded",
    initCheckout
  );

}else{

  initCheckout();

}


console.log(
  "LetsStudy Pro Checkout System ready."
);