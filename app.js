/* =========================================================
   LETSSTUDY PRO
   APP.JS
   Global Website Controller
   ========================================================= */


/* =========================================================
   GLOBAL CONFIG
   ========================================================= */

const APP_CONFIG = {

  name:
    "LetsStudy Pro",

  home:
    "index.html",

  auth:
    "auth.html",

  dashboard:
    "dashboard.html",

  marketplace:
    "marketplace.html",

  courses:
    "courses.html",

  scholarships:
    "scholarships.html",

  career:
    "career.html",

  community:
    "community.html",

  premium:
    "premium.html",

  cart:
    "cart.html",

  checkout:
    "checkout.html"

};


/* =========================================================
   DOM SHORTCUT
   ========================================================= */

const $ =
  selector =>
    document.querySelector(
      selector
    );

const $$ =
  selector =>
    document.querySelectorAll(
      selector
    );


/* =========================================================
   MOBILE MENU
   ========================================================= */

function initMobileMenu(){

  const toggle =
    $("[data-menu-toggle]") ||
    $(".menu-toggle");

  const menu =
    $("[data-mobile-menu]") ||
    $(".mobile-menu") ||
    $(".nav-links");

  const overlay =
    $("[data-menu-overlay]") ||
    $(".menu-overlay");

  if(!toggle || !menu){

    return;

  }


  function openMenu(){

    menu.classList.add(
      "open"
    );

    toggle.classList.add(
      "active"
    );

    overlay?.classList.add(
      "active"
    );

    document.body.classList.add(
      "menu-open"
    );

  }


  function closeMenu(){

    menu.classList.remove(
      "open"
    );

    toggle.classList.remove(
      "active"
    );

    overlay?.classList.remove(
      "active"
    );

    document.body.classList.remove(
      "menu-open"
    );

  }


  toggle.addEventListener(
    "click",
    function(){

      menu.classList.contains(
        "open"
      )
        ? closeMenu()
        : openMenu();

    }
  );


  overlay?.addEventListener(
    "click",
    closeMenu
  );


  menu
    .querySelectorAll("a")
    .forEach(
      link => {

        link.addEventListener(
          "click",
          closeMenu
        );

      }
    );

}


/* =========================================================
   ACTIVE NAVIGATION
   ========================================================= */

function initActiveNavigation(){

  const current =
    window.location.pathname
      .split("/")
      .pop() ||
    "index.html";


  $$(
    "a[href]"
  ).forEach(
    link => {

      const href =
        link
          .getAttribute("href")
          ?.split("/")
          .pop()
          ?.split("?")[0];


      if(
        href &&
        href === current
      ){

        link.classList.add(
          "active"
        );

      }

    }
  );

}


/* =========================================================
   SEARCH
   ========================================================= */

function initSearch(){

  const inputs =
    $$(
      "[data-search]"
    );


  inputs.forEach(
    input => {

      input.addEventListener(
        "keydown",
        function(event){

          if(
            event.key !==
            "Enter"
          ){

            return;

          }


          const query =
            input.value.trim();


          if(!query){

            return;

          }


          window.location.href =
            "search.html?q=" +
            encodeURIComponent(
              query
            );

        }
      );

    }
  );


  $$(
    "[data-search-form]"
  ).forEach(
    form => {

      form.addEventListener(
        "submit",
        function(event){

          event.preventDefault();


          const input =
            form.querySelector(
              "input"
            );


          const query =
            input?.value.trim();


          if(!query){

            showToast(
              "Please enter a search term."
            );

            return;

          }


          window.location.href =
            "search.html?q=" +
            encodeURIComponent(
              query
            );

        }
      );

    }
  );

}


/* =========================================================
   THEME
   ========================================================= */

function initTheme(){

  const saved =
    localStorage.getItem(
      "letsStudyTheme"
    );


  if(saved){

    document.documentElement
      .setAttribute(
        "data-theme",
        saved
      );

  }


  $$(
    "[data-theme-toggle]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        toggleTheme
      );

    }
  );

}


function toggleTheme(){

  const current =
    document.documentElement
      .getAttribute(
        "data-theme"
      );


  const next =
    current === "dark"
      ? "light"
      : "dark";


  document.documentElement
    .setAttribute(
      "data-theme",
      next
    );


  localStorage.setItem(
    "letsStudyTheme",
    next
  );


  updateThemeIcon(
    next
  );

}


function updateThemeIcon(
  theme
){

  $$(
    "[data-theme-icon]"
  ).forEach(
    element => {

      element.textContent =
        theme === "dark"
          ? "☀️"
          : "🌙";

    }
  );

}


/* =========================================================
   CART
   ========================================================= */

function getCart(){

  try{

    return JSON.parse(
      localStorage.getItem(
        "letsStudyCart"
      )
    ) || [];

  }catch(error){

    console.error(
      "Cart error:",
      error
    );

    return [];

  }

}


function saveCart(
  cart
){

  localStorage.setItem(
    "letsStudyCart",
    JSON.stringify(
      cart
    )
  );


  updateCartCount();

}


function addToCart(
  item
){

  if(
    !item ||
    !item.id
  ){

    showToast(
      "Invalid item."
    );

    return false;

  }


  const cart =
    getCart();


  const exists =
    cart.find(
      product =>
        product.id ===
        item.id
    );


  if(exists){

    showToast(
      "Item is already in your cart."
    );

    return false;

  }


  cart.push({

    id:
      item.id,

    title:
      item.title ||
      "Untitled",

    price:
      Number(
        item.price || 0
      ),

    image:
      item.image || "",

    type:
      item.type ||
      "course",

    quantity:1

  });


  saveCart(
    cart
  );


  showToast(
    "Added to cart."
  );


  return true;

}


function removeFromCart(
  id
){

  const cart =
    getCart()
      .filter(
        item =>
          item.id !== id
      );


  saveCart(
    cart
  );


  showToast(
    "Removed from cart."
  );

}


function clearCart(){

  localStorage.removeItem(
    "letsStudyCart"
  );

  updateCartCount();

}


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


  $$(
    "[data-cart-count]"
  ).forEach(
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


window.addToCart =
  addToCart;

window.removeFromCart =
  removeFromCart;

window.getCart =
  getCart;


/* =========================================================
   WISHLIST
   ========================================================= */

function getWishlist(){

  try{

    return JSON.parse(
      localStorage.getItem(
        "letsStudyWishlist"
      )
    ) || [];

  }catch{

    return [];

  }

}


function toggleWishlist(
  id
){

  if(!id){

    return;

  }


  const wishlist =
    getWishlist();


  const index =
    wishlist.indexOf(
      id
    );


  if(index === -1){

    wishlist.push(
      id
    );

    showToast(
      "Added to wishlist."
    );

  }else{

    wishlist.splice(
      index,
      1
    );

    showToast(
      "Removed from wishlist."
    );

  }


  localStorage.setItem(
    "letsStudyWishlist",
    JSON.stringify(
      wishlist
    )
  );


  updateWishlistButtons();

}


function updateWishlistButtons(){

  const wishlist =
    getWishlist();


  $$(
    "[data-wishlist]"
  ).forEach(
    button => {

      const id =
        button.dataset.wishlist;


      const active =
        wishlist.includes(
          id
        );


      button.classList.toggle(
        "active",
        active
      );

      button.setAttribute(
        "aria-pressed",
        active
      );

    }
  );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
  text,
  duration = 3000
){

  let toast =
    $("#appToast");


  if(!toast){

    toast =
      document.createElement(
        "div"
      );

    toast.id =
      "appToast";

    toast.className =
      "app-toast";


    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    text;


  toast.classList.add(
    "show"
  );


  clearTimeout(
    toast._timer
  );


  toast._timer =
    setTimeout(
      function(){

        toast.classList.remove(
          "show"
        );

      },
      duration
    );

}


window.showToast =
  showToast;


/* =========================================================
   MODAL
   ========================================================= */

function openModal(
  id
){

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

  document.body.classList.add(
    "modal-open"
  );

}


function closeModal(
  id
){

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

  document.body.classList.remove(
    "modal-open"
  );

}


window.openModal =
  openModal;

window.closeModal =
  closeModal;


/* =========================================================
   MODAL AUTO CLOSE
   ========================================================= */

function initModals(){

  $$(
    ".modal"
  ).forEach(
    modal => {

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

            document.body.classList.remove(
              "modal-open"
            );

          }

        }
      );

    }
  );


  $$(
    "[data-modal-close]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        function(){

          const modal =
            button.closest(
              ".modal"
            );


          modal?.classList.remove(
            "active"
          );

          document.body.classList.remove(
            "modal-open"
          );

        }
      );

    }
  );

}


/* =========================================================
   DROPDOWNS
   ========================================================= */

function initDropdowns(){

  $$(
    "[data-dropdown-toggle]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        function(event){

          event.stopPropagation();


          const dropdown =
            button.closest(
              ".dropdown"
            );


          dropdown?.classList.toggle(
            "open"
          );

        }
      );

    }
  );


  document.addEventListener(
    "click",
    function(){

      $$(
        ".dropdown.open"
      ).forEach(
        dropdown => {

          dropdown.classList.remove(
            "open"
          );

        }
      );

    }
  );

}


/* =========================================================
   SCROLL TO TOP
   ========================================================= */

function initScrollTop(){

  const button =
    $(
      "[data-scroll-top]"
    );


  if(!button){

    return;

  }


  window.addEventListener(
    "scroll",
    function(){

      button.classList.toggle(
        "show",
        window.scrollY > 400
      );

    }
  );


  button.addEventListener(
    "click",
    function(){

      window.scrollTo({

        top:0,

        behavior:"smooth"

      });

    }
  );

}


/* =========================================================
   LAZY IMAGES
   ========================================================= */

function initLazyImages(){

  const images =
    $$(
      "img[data-src]"
    );


  if(
    !("IntersectionObserver"
      in window)
  ){

    images.forEach(
      image => {

        image.src =
          image.dataset.src;

      }
    );

    return;

  }


  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(
          entry => {

            if(
              !entry.isIntersecting
            ){

              return;

            }


            const image =
              entry.target;


            image.src =
              image.dataset.src;


            image.removeAttribute(
              "data-src"
            );


            observer.unobserve(
              image
            );

          }
        );

      },
      {
        rootMargin:
          "200px"
      }
    );


  images.forEach(
    image =>
      observer.observe(
        image
      )
  );

}


/* =========================================================
   URL HELPERS
   ========================================================= */

function getQuery(
  key
){

  return new URLSearchParams(
    window.location.search
  ).get(
    key
  );

}


function go(
  page
){

  window.location.href =
    page;

}


window.getQuery =
  getQuery;

window.go =
  go;


/* =========================================================
   AUTH UI
   ========================================================= */

function updateAuthLinks(){

  const user =
    window.currentUser;


  $$(
    "[data-auth-only]"
  ).forEach(
    element => {

      element.style.display =
        user
          ? ""
          : "none";

    }
  );


  $$(
    "[data-guest-only]"
  ).forEach(
    element => {

      element.style.display =
        user
          ? "none"
          : "";

    }
  );

}


/* =========================================================
   ONLINE / OFFLINE
   ========================================================= */

function initConnectionStatus(){

  function update(){

    document.body.classList.toggle(
      "offline",
      !navigator.onLine
    );


    if(
      !navigator.onLine
    ){

      showToast(
        "You are offline."
      );

    }

  }


  window.addEventListener(
    "online",
    function(){

      document.body.classList.remove(
        "offline"
      );

      showToast(
        "Connection restored."
      );

    }
  );


  window.addEventListener(
    "offline",
    update
  );


  update();

}


/* =========================================================
   COPY TO CLIPBOARD
   ========================================================= */

function initCopyButtons(){

  $$(
    "[data-copy]"
  ).forEach(
    button => {

      button.addEventListener(
        "click",
        async function(){

          const text =
            button.dataset.copy;


          try{

            await navigator.clipboard.writeText(
              text
            );


            showToast(
              "Copied."
            );


          }catch(error){

            console.error(
              error
            );

          }

        }
      );

    }
  );

}


/* =========================================================
   CURRENT YEAR
   ========================================================= */

function setCurrentYear(){

  const year =
    new Date()
      .getFullYear();


  $$(
    "[data-year]"
  ).forEach(
    element => {

      element.textContent =
        year;

    }
  );

}


/* =========================================================
   INIT
   ========================================================= */

function initApp(){

  initMobileMenu();

  initActiveNavigation();

  initSearch();

  initTheme();

  updateCartCount();

  updateWishlistButtons();

  initModals();

  initDropdowns();

  initScrollTop();

  initLazyImages();

  initConnectionStatus();

  initCopyButtons();

  setCurrentYear();

  updateAuthLinks();


  console.log(
    "LetsStudy Pro App loaded."
  );

}


/* =========================================================
   DOM READY
   ========================================================= */

if(
  document.readyState ===
  "loading"
){

  document.addEventListener(
    "DOMContentLoaded",
    initApp
  );

}else{

  initApp();

}


/* =========================================================
   GLOBAL APP OBJECT
   ========================================================= */

window.LetsStudyApp = {

  config:
    APP_CONFIG,

  cart:
    getCart,

  addToCart,

  removeFromCart,

  clearCart,

  wishlist:
    getWishlist,

  toggleWishlist,

  showToast,

  openModal,

  closeModal,

  getQuery,

  go

};