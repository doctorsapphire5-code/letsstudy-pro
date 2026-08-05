/* =========================================================
   LETSSTUDY PRO
   CART.JS
   Cart + Quantity + Totals + Checkout
   ========================================================= */


/* =========================================================
   CONFIG
   ========================================================= */

const CART_CONFIG = {

  cartKey:
    "letsStudyCart",

  checkoutPage:
    "checkout.html",

  marketplacePage:
    "marketplace.html",

  coursesPage:
    "courses.html"

};


/* =========================================================
   DOM
   ========================================================= */

const $ =
  id =>
    document.getElementById(id);


/* =========================================================
   GET CART
   ========================================================= */

function getCart(){

  try{

    return JSON.parse(
      localStorage.getItem(
        CART_CONFIG.cartKey
      )
    ) || [];

  }catch(error){

    console.error(
      "Cart read error:",
      error
    );

    return [];

  }

}


/* =========================================================
   SAVE CART
   ========================================================= */

function saveCart(
  cart
){

  localStorage.setItem(
    CART_CONFIG.cartKey,
    JSON.stringify(
      cart
    )
  );


  updateCartCount();

}


/* =========================================================
   FORMAT MONEY
   ========================================================= */

function formatMoney(
  amount
){

  const value =
    Number(
      amount || 0
    );


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
    value
  );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
  value
){

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   UPDATE CART COUNT
   ========================================================= */

function updateCartCount(){

  const cart =
    getCart();


  const count =
    cart.reduce(
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


  document
    .querySelectorAll(
      "[data-cart-count]"
    )
    .forEach(
      element => {

        element.textContent =
          count;

        element.style.display =
          count > 0
            ? ""
            : "none";

      }
    );

}


/* =========================================================
   ADD TO CART
   ========================================================= */

function addToCart(
  item
){

  if(
    !item ||
    !item.id
  ){

    showCartMessage(
      "Invalid item."
    );

    return false;

  }


  const cart =
    getCart();


  const existing =
    cart.find(
      product =>
        product.id ===
        item.id
    );


  if(existing){

    existing.quantity =
      Number(
        existing.quantity || 1
      ) + 1;

  }else{

    cart.push({

      id:
        item.id,

      title:
        item.title ||
        item.name ||
        "Untitled",

      price:
        Number(
          item.price || 0
        ),

      image:
        item.image ||
        item.thumbnail ||
        "",

      type:
        item.type ||
        "course",

      quantity:
        1

    });

  }


  saveCart(
    cart
  );


  renderCart();


  showCartMessage(
    "Added to cart."
  );


  return true;

}


/* =========================================================
   REMOVE ITEM
   ========================================================= */

function removeFromCart(
  id
){

  let cart =
    getCart();


  cart =
    cart.filter(
      item =>
        item.id !== id
    );


  saveCart(
    cart
  );


  renderCart();


  showCartMessage(
    "Item removed."
  );

}


/* =========================================================
   CHANGE QUANTITY
   ========================================================= */

function changeQuantity(
  id,
  amount
){

  const cart =
    getCart();


  const item =
    cart.find(
      product =>
        product.id === id
    );


  if(!item){

    return;

  }


  item.quantity =
    Number(
      item.quantity || 1
    ) + Number(
      amount
    );


  if(
    item.quantity <= 0
  ){

    removeFromCart(
      id
    );

    return;

  }


  saveCart(
    cart
  );


  renderCart();

}


/* =========================================================
   SET QUANTITY
   ========================================================= */

function setQuantity(
  id,
  quantity
){

  const cart =
    getCart();


  const item =
    cart.find(
      product =>
        product.id === id
    );


  if(!item){

    return;

  }


  const value =
    Math.max(
      1,
      Number(
        quantity || 1
      )
    );


  item.quantity =
    value;


  saveCart(
    cart
  );


  renderCart();

}


/* =========================================================
   CLEAR CART
   ========================================================= */

function clearCart(){

  localStorage.removeItem(
    CART_CONFIG.cartKey
  );


  updateCartCount();


  renderCart();


  showCartMessage(
    "Cart cleared."
  );

}


/* =========================================================
   CALCULATE TOTALS
   ========================================================= */

function calculateCart(){

  const cart =
    getCart();


  let subtotal =
    0;


  let quantity =
    0;


  cart.forEach(
    item => {

      const price =
        Number(
          item.price || 0
        );


      const qty =
        Number(
          item.quantity || 1
        );


      subtotal +=
        price * qty;


      quantity +=
        qty;

    }
  );


  return {

    subtotal,

    quantity,

    total:
      subtotal

  };

}


/* =========================================================
   RENDER CART
   ========================================================= */

function renderCart(){

  const container =
    $("cartItems");


  const empty =
    $("cartEmpty");


  const summary =
    $("cartSummary");


  const cart =
    getCart();


  updateCartCount();


  if(
    !container
  ){

    updateSummary();

    return;

  }


  if(
    !cart.length
  ){

    container.innerHTML =
      "";


    if(empty){

      empty.style.display =
        "block";

    }


    if(summary){

      summary.style.display =
        "none";

    }


    return;

  }


  if(empty){

    empty.style.display =
      "none";

  }


  if(summary){

    summary.style.display =
      "block";

  }


  container.innerHTML =
    cart
      .map(
        item =>
          renderCartItem(
            item
          )
      )
      .join("");


  bindCartEvents();

  updateSummary();

}


/* =========================================================
   CART ITEM
   ========================================================= */

function renderCartItem(
  item
){

  const price =
    Number(
      item.price || 0
    );


  const quantity =
    Number(
      item.quantity || 1
    );


  const total =
    price *
    quantity;


  const image =
    item.image ||
    "https://placehold.co/120x80?text=LetsStudy";


  return `
    <article
      class="cart-item"
      data-cart-item="${escapeHTML(item.id)}"
    >

      <div class="cart-item-image">

        <img
          src="${escapeHTML(image)}"
          alt="${escapeHTML(item.title)}"
          loading="lazy"
        >

      </div>


      <div class="cart-item-info">

        <h3>
          ${escapeHTML(item.title)}
        </h3>

        <span class="cart-item-type">
          ${escapeHTML(item.type || "course")}
        </span>

        <strong class="cart-item-price">
          ${formatMoney(price)}
        </strong>

      </div>


      <div class="cart-quantity">

        <button
          type="button"
          data-minus="${escapeHTML(item.id)}"
          aria-label="Decrease quantity"
        >
          −
        </button>

        <input
          type="number"
          min="1"
          value="${quantity}"
          data-quantity="${escapeHTML(item.id)}"
        >

        <button
          type="button"
          data-plus="${escapeHTML(item.id)}"
          aria-label="Increase quantity"
        >
          +
        </button>

      </div>


      <div class="cart-item-total">

        ${formatMoney(total)}

      </div>


      <button
        type="button"
        class="cart-remove"
        data-remove="${escapeHTML(item.id)}"
        aria-label="Remove item"
      >
        ×
      </button>

    </article>
  `;

}


/* =========================================================
   BIND EVENTS
   ========================================================= */

function bindCartEvents(){

  document
    .querySelectorAll(
      "[data-minus]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          function(){

            changeQuantity(
              button.dataset.minus,
              -1
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-plus]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          function(){

            changeQuantity(
              button.dataset.plus,
              1
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-remove]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          function(){

            removeFromCart(
              button.dataset.remove
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-quantity]"
    )
    .forEach(
      input => {

        input.addEventListener(
          "change",
          function(){

            setQuantity(
              input.dataset.quantity,
              input.value
            );

          }
        );

      }
    );

}


/* =========================================================
   UPDATE SUMMARY
   ========================================================= */

function updateSummary(){

  const totals =
    calculateCart();


  const subtotal =
    $("cartSubtotal");


  const total =
    $("cartTotal");


  const count =
    $("cartQuantity");


  if(subtotal){

    subtotal.textContent =
      formatMoney(
        totals.subtotal
      );

  }


  if(total){

    total.textContent =
      formatMoney(
        totals.total
      );

  }


  if(count){

    count.textContent =
      totals.quantity;

  }

}


/* =========================================================
   CART MESSAGE
   ========================================================= */

function showCartMessage(
  text
){

  if(
    typeof window.showToast ===
    "function"
  ){

    window.showToast(
      text
    );

    return;

  }


  const box =
    $("cartMessage");


  if(!box){

    return;

  }


  box.textContent =
    text;


  box.style.display =
    "block";


  setTimeout(
    function(){

      box.style.display =
        "none";

    },
    2500
  );

}


/* =========================================================
   CHECKOUT
   ========================================================= */

function goToCheckout(){

  const cart =
    getCart();


  if(
    !cart.length
  ){

    showCartMessage(
      "Your cart is empty."
    );

    return;

  }


  /*
   Save a snapshot for checkout.
  */

  localStorage.setItem(
    "letsStudyCheckout",
    JSON.stringify(
      cart
    )
  );


  window.location.href =
    CART_CONFIG.checkoutPage;

}


/* =========================================================
   CONTINUE SHOPPING
   ========================================================= */

function continueShopping(){

  window.location.href =
    CART_CONFIG.coursesPage;

}


/* =========================================================
   CART EVENTS
   ========================================================= */

function initCart(){

  renderCart();


  const checkout =
    $("checkoutBtn");


  if(checkout){

    checkout.addEventListener(
      "click",
      goToCheckout
    );

  }


  const clear =
    $("clearCartBtn");


  if(clear){

    clear.addEventListener(
      "click",
      clearCart
    );

  }


  const continueButton =
    $("continueShoppingBtn");


  if(continueButton){

    continueButton.addEventListener(
      "click",
      continueShopping
    );

  }

}


/* =========================================================
   GLOBAL CART API
   ========================================================= */

window.LetsStudyCart = {

  getCart,

  saveCart,

  addToCart,

  removeFromCart,

  changeQuantity,

  setQuantity,

  clearCart,

  calculateCart,

  renderCart,

  goToCheckout

};


window.getCart =
  getCart;

window.addToCart =
  addToCart;

window.removeFromCart =
  removeFromCart;

window.clearCart =
  clearCart;


/* =========================================================
   DOM READY
   ========================================================= */

if(
  document.readyState ===
  "loading"
){

  document.addEventListener(
    "DOMContentLoaded",
    initCart
  );

}else{

  initCart();

}


console.log(
  "LetsStudy Pro Cart System ready."
);