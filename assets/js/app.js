/* =========================================================
   LETSSTUDY PRO
   GLOBAL JAVASCRIPT
   ========================================================= */


/* =========================================================
   1. GLOBAL CONFIG
   ========================================================= */

const LetsStudy = {

  name: "LetsStudy Pro",

  routes: {
    home: "index.html",
    auth: "auth.html",
    dashboard: "dashboard.html",
    marketplace: "marketplace.html",
    courses: "courses.html",
    scholarships: "scholarships.html",
    career: "career.html",
    community: "community.html",
    premium: "premium.html",
    cart: "cart.html",
    checkout: "checkout.html",
    verify: "verify.html",
    orders: "order.html",
    support: "support.html",
    legal: "legal.html"
  },

  storage: {
    cart: "letsStudyCart",
    wishlist: "letsStudyWishlist",
    theme: "letsStudyTheme",
    user: "letsStudyUser",
    pendingOrder: "letsStudyPendingOrder"
  }

};


/* =========================================================
   2. DOM READY
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function(){

    initMobileMenu();

    initNavigation();

    initSearch();

    initCart();

    initTheme();

    initModals();

    initToasts();

    updateCurrentYear();

    loadSavedUser();

  }
);


/* =========================================================
   3. MOBILE MENU
   ========================================================= */

function initMobileMenu(){

  const toggle =
    document.querySelector(
      ".menu-toggle"
    );

  const nav =
    document.querySelector(
      ".nav-links"
    );

  if(!toggle || !nav){
    return;
  }

  toggle.addEventListener(
    "click",
    function(){

      nav.classList.toggle(
        "mobile-open"
      );

    }
  );

}


/* =========================================================
   4. NAVIGATION
   ========================================================= */

function initNavigation(){

  const currentPage =
    window.location.pathname
      .split("/")
      .pop()
      .toLowerCase();

  document
    .querySelectorAll(
      ".nav-links a"
    )
    .forEach(function(link){

      const href =
        link.getAttribute("href");

      if(!href){
        return;
      }

      const page =
        href
          .split("/")
          .pop()
          .toLowerCase();

      if(
        page === currentPage ||
        (
          currentPage === "" &&
          page === "index.html"
        )
      ){

        link.classList.add(
          "active"
        );

      }

    });

}


/* =========================================================
   5. PAGE NAVIGATION
   ========================================================= */

function goTo(page){

  if(!page){
    return;
  }

  window.location.href =
    page;

}


/* =========================================================
   6. SEARCH
   ========================================================= */

function initSearch(){

  document
    .querySelectorAll(
      ".search"
    )
    .forEach(function(form){

      form.addEventListener(
        "submit",
        function(event){

          event.preventDefault();

          const input =
            form.querySelector(
              "input"
            );

          if(!input){
            return;
          }

          const query =
            input.value.trim();

          if(!query){

            showToast(
              "Please enter something to search."
            );

            return;
          }

          searchLetsStudy(
            query
          );

        }
      );

    });

}


function searchLetsStudy(query){

  const cleanQuery =
    String(query).trim();

  if(!cleanQuery){
    return;
  }

  window.location.href =
    "search.html?q=" +
    encodeURIComponent(
      cleanQuery
    );

}


/* =========================================================
   7. CART
   ========================================================= */

function getCart(){

  try{

    const data =
      localStorage.getItem(
        LetsStudy.storage.cart
      );

    if(!data){
      return [];
    }

    const cart =
      JSON.parse(data);

    return Array.isArray(cart)
      ? cart
      : [];

  }catch(error){

    console.error(
      "Cart error:",
      error
    );

    return [];

  }

}


function saveCart(cart){

  localStorage.setItem(
    LetsStudy.storage.cart,
    JSON.stringify(cart)
  );

  updateCartCount();

}


function addToCart(product){

  if(!product){
    return false;
  }

  const cart =
    getCart();

  const id =
    String(
      product.id ||
      product.courseId ||
      product.resourceId ||
      Date.now()
    );

  const exists =
    cart.find(
      item =>
        String(item.id) === id
    );

  if(exists){

    showToast(
      "This item is already in your cart."
    );

    return false;

  }

  cart.push({

    id:id,

    title:
      product.title ||
      "Untitled Item",

    price:
      Number(product.price || 0),

    image:
      product.image ||
      "",

    type:
      product.type ||
      "product",

    quantity:1,

    addedAt:
      new Date().toISOString()

  });

  saveCart(cart);

  showToast(
    "Added to cart successfully."
  );

  return true;

}


function removeFromCart(id){

  let cart =
    getCart();

  cart =
    cart.filter(
      item =>
        String(item.id) !==
        String(id)
    );

  saveCart(cart);

  showToast(
    "Item removed from cart."
  );

}


function clearCart(){

  localStorage.removeItem(
    LetsStudy.storage.cart
  );

  updateCartCount();

}


function getCartTotal(){

  return getCart()
    .reduce(
      function(total,item){

        const price =
          Number(
            item.price || 0
          );

        const quantity =
          Number(
            item.quantity || 1
          );

        return total +
          price * quantity;

      },
      0
    );

}


function updateCartCount(){

  const cart =
    getCart();

  const count =
    cart.reduce(
      function(total,item){

        return total +
          Number(
            item.quantity || 1
          );

      },
      0
    );

  document
    .querySelectorAll(
      ".cart-count"
    )
    .forEach(function(element){

      element.textContent =
        count;

      element.style.display =
        count > 0
          ? "inline-flex"
          : "none";

    });

}


function initCart(){

  updateCartCount();

}


/* =========================================================
   8. WISHLIST
   ========================================================= */

function getWishlist(){

  try{

    const data =
      localStorage.getItem(
        LetsStudy.storage.wishlist
      );

    return data
      ? JSON.parse(data)
      : [];

  }catch(error){

    return [];

  }

}


function toggleWishlist(id){

  if(!id){
    return;
  }

  let wishlist =
    getWishlist();

  const exists =
    wishlist.includes(
      String(id)
    );

  if(exists){

    wishlist =
      wishlist.filter(
        item =>
          item !== String(id)
      );

    showToast(
      "Removed from wishlist."
    );

  }else{

    wishlist.push(
      String(id)
    );

    showToast(
      "Added to wishlist."
    );

  }

  localStorage.setItem(
    LetsStudy.storage.wishlist,
    JSON.stringify(
      wishlist
    )
  );

}


/* =========================================================
   9. TOAST
   ========================================================= */

function initToasts(){

  if(
    !document.getElementById(
      "toast"
    )
  ){

    const toast =
      document.createElement(
        "div"
      );

    toast.id =
      "toast";

    toast.className =
      "toast";

    document.body.appendChild(
      toast
    );

  }

}


function showToast(
  message,
  duration = 3000
){

  let toast =
    document.getElementById(
      "toast"
    );

  if(!toast){

    initToasts();

    toast =
      document.getElementById(
        "toast"
      );

  }

  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );

  clearTimeout(
    window.__letsStudyToastTimer
  );

  window.__letsStudyToastTimer =
    setTimeout(
      function(){

        toast.classList.remove(
          "show"
        );

      },
      duration
    );

}


/* =========================================================
   10. MODALS
   ========================================================= */

function initModals(){

  document
    .querySelectorAll(
      "[data-modal-open]"
    )
    .forEach(function(button){

      button.addEventListener(
        "click",
        function(){

          const id =
            button.dataset.modalOpen;

          openModal(id);

        }
      );

    });


  document
    .querySelectorAll(
      "[data-modal-close]"
    )
    .forEach(function(button){

      button.addEventListener(
        "click",
        function(){

          const id =
            button.dataset.modalClose;

          closeModal(id);

        }
      );

    });


  document
    .querySelectorAll(
      ".modal"
    )
    .forEach(function(modal){

      modal.addEventListener(
        "click",
        function(event){

          if(
            event.target ===
            modal
          ){

            modal.classList.remove(
              "active"
            );

          }

        }
      );

    });

}


function openModal(id){

  const modal =
    document.getElementById(
      id
    );

  if(!modal){
    return;
  }

  modal.classList.add(
    "active"
  );

  document.body.style.overflow =
    "hidden";

}


function closeModal(id){

  const modal =
    document.getElementById(
      id
    );

  if(!modal){
    return;
  }

  modal.classList.remove(
    "active"
  );

  document.body.style.overflow =
    "";

}


function closeAllModals(){

  document
    .querySelectorAll(
      ".modal.active"
    )
    .forEach(function(modal){

      modal.classList.remove(
        "active"
      );

    });

  document.body.style.overflow =
    "";

}


/* =========================================================
   11. THEME
   ========================================================= */

function initTheme(){

  const savedTheme =
    localStorage.getItem(
      LetsStudy.storage.theme
    );

  if(
    savedTheme ===
    "dark"
  ){

    document.body.classList.add(
      "dark-mode"
    );

  }

}


function toggleTheme(){

  const isDark =
    document.body.classList.toggle(
      "dark-mode"
    );

  localStorage.setItem(
    LetsStudy.storage.theme,
    isDark
      ? "dark"
      : "light"
  );

}


/* =========================================================
   12. USER LOCAL STATE
   ========================================================= */

function getSavedUser(){

  try{

    const data =
      localStorage.getItem(
        LetsStudy.storage.user
      );

    return data
      ? JSON.parse(data)
      : null;

  }catch(error){

    return null;

  }

}


function saveUser(user){

  if(!user){

    localStorage.removeItem(
      LetsStudy.storage.user
    );

    return;

  }

  localStorage.setItem(
    LetsStudy.storage.user,
    JSON.stringify(user)
  );

}


function loadSavedUser(){

  const user =
    getSavedUser();

  if(!user){
    return;
  }

  document
    .querySelectorAll(
      "[data-user-name]"
    )
    .forEach(function(element){

      element.textContent =
        user.displayName ||
        user.name ||
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

}


/* =========================================================
   13. LOGOUT
   ========================================================= */

function logout(){

  /*
    Firebase logout will be added
    in the Firebase module.
  */

  localStorage.removeItem(
    LetsStudy.storage.user
  );

  showToast(
    "You have been logged out."
  );

  setTimeout(
    function(){

      window.location.href =
        LetsStudy.routes.auth;

    },
    700
  );

}


/* =========================================================
   14. AUTH REDIRECT HELPERS
   ========================================================= */

function requireLogin(){

  const user =
    getSavedUser();

  if(!user){

    const current =
      window.location.href;

    sessionStorage.setItem(
      "letsStudyReturnUrl",
      current
    );

    window.location.href =
      LetsStudy.routes.auth;

    return false;

  }

  return true;

}


function continueAfterLogin(){

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
    LetsStudy.routes.dashboard;

}


/* =========================================================
   15. PENDING ORDER
   ========================================================= */

function savePendingOrder(order){

  if(!order){
    return;
  }

  localStorage.setItem(
    LetsStudy.storage.pendingOrder,
    JSON.stringify(order)
  );

}


function getPendingOrder(){

  try{

    const data =
      localStorage.getItem(
        LetsStudy.storage.pendingOrder
      );

    return data
      ? JSON.parse(data)
      : null;

  }catch(error){

    return null;

  }

}


function clearPendingOrder(){

  localStorage.removeItem(
    LetsStudy.storage.pendingOrder
  );

}


/* =========================================================
   16. ORDER ID
   ========================================================= */

function generateOrderId(){

  const time =
    Date.now()
      .toString(36)
      .toUpperCase();

  const random =
    Math.random()
      .toString(36)
      .substring(2,7)
      .toUpperCase();

  return (
    "LSP-" +
    time +
    "-" +
    random
  );

}


/* =========================================================
   17. CURRENCY
   ========================================================= */

function formatTZS(amount){

  const value =
    Number(amount || 0);

  return new Intl.NumberFormat(
    "en-TZ",
    {
      style:"currency",
      currency:"TZS",
      maximumFractionDigits:0
    }
  ).format(value);

}


/* =========================================================
   18. DATE
   ========================================================= */

function formatDate(date){

  if(!date){
    return "";
  }

  const value =
    new Date(date);

  if(
    Number.isNaN(
      value.getTime()
    )
  ){

    return "";

  }

  return value.toLocaleDateString(
    "en-TZ",
    {
      year:"numeric",
      month:"short",
      day:"numeric"
    }
  );

}


/* =========================================================
   19. ESCAPE HTML
   ========================================================= */

function escapeHTML(value){

  if(value === null ||
     value === undefined){

    return "";

  }

  return String(value)
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
   20. QUERY PARAMETERS
   ========================================================= */

function getQueryParam(name){

  const params =
    new URLSearchParams(
      window.location.search
    );

  return params.get(name);

}


/* =========================================================
   21. URL REDIRECT
   ========================================================= */

function redirect(url){

  if(!url){
    return;
  }

  window.location.href =
    url;

}


/* =========================================================
   22. CURRENT YEAR
   ========================================================= */

function updateCurrentYear(){

  const year =
    new Date()
      .getFullYear();

  document
    .querySelectorAll(
      "[data-current-year]"
    )
    .forEach(function(element){

      element.textContent =
        year;

    });

}


/* =========================================================
   23. COPY TO CLIPBOARD
   ========================================================= */

async function copyText(text){

  if(!text){
    return false;
  }

  try{

    await navigator.clipboard.writeText(
      text
    );

    showToast(
      "Copied successfully."
    );

    return true;

  }catch(error){

    console.error(
      "Copy failed:",
      error
    );

    return false;

  }

}


/* =========================================================
   24. DEBOUNCE
   ========================================================= */

function debounce(
  callback,
  delay = 300
){

  let timer;

  return function(){

    const context =
      this;

    const args =
      arguments;

    clearTimeout(
      timer
    );

    timer =
      setTimeout(
        function(){

          callback.apply(
            context,
            args
          );

        },
        delay
      );

  };

}


/* =========================================================
   25. ONLINE / OFFLINE
   ========================================================= */

window.addEventListener(
  "online",
  function(){

    showToast(
      "Internet connection restored."
    );

  }
);


window.addEventListener(
  "offline",
  function(){

    showToast(
      "You are offline. Some features may not work."
    );

  }
);


/* =========================================================
   26. GLOBAL ERROR HANDLER
   ========================================================= */

window.addEventListener(
  "error",
  function(event){

    console.error(
      "LetsStudy Pro error:",
      event.error ||
      event.message
    );

  }
);


/* =========================================================
   27. EXPORT
   ========================================================= */

window.LetsStudy =
  LetsStudy;

window.goTo =
  goTo;

window.addToCart =
  addToCart;

window.removeFromCart =
  removeFromCart;

window.getCart =
  getCart;

window.getCartTotal =
  getCartTotal;

window.clearCart =
  clearCart;

window.showToast =
  showToast;

window.openModal =
  openModal;

window.closeModal =
  closeModal;

window.toggleTheme =
  toggleTheme;

window.logout =
  logout;

window.requireLogin =
  requireLogin;

window.savePendingOrder =
  savePendingOrder;

window.getPendingOrder =
  getPendingOrder;

window.clearPendingOrder =
  clearPendingOrder;

window.generateOrderId =
  generateOrderId;

window.formatTZS =
  formatTZS;

window.formatDate =
  formatDate;

window.getQueryParam =
  getQueryParam;

window.copyText =
  copyText;