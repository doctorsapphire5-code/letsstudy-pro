<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, viewport-fit=cover"
  />

  <title>Resource Details | LetsStudy Pro</title>

  <meta
    name="description"
    content="Explore educational resources, notes, past papers, study materials and digital learning resources on LetsStudy Pro."
  />

  <meta name="robots" content="index,follow,max-image-preview:large" />

  <meta name="theme-color" content="#0f172a" />

  <link
    rel="canonical"
    href="https://letsstudy.pro/resource-details.html"
  />

  <meta
    property="og:title"
    content="Resource Details | LetsStudy Pro"
  />

  <meta
    property="og:description"
    content="Access educational resources and digital learning materials on LetsStudy Pro."
  />

  <meta
    property="og:type"
    content="website"
  />

  <meta
    property="og:url"
    content="https://letsstudy.pro/resource-details.html"
  />

  <meta
    property="og:image"
    content="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj_example/s1600/letsstudy-pro.png"
  />

  <meta
    name="twitter:card"
    content="summary_large_image"
  />

  <meta
    name="twitter:title"
    content="Resource Details | LetsStudy Pro"
  />

  <meta
    name="twitter:description"
    content="Explore educational resources on LetsStudy Pro."
  />

  <meta
    name="twitter:image"
    content="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj_example/s1600/letsstudy-pro.png"
  />

  <link
    rel="icon"
    href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj_example/s1600/letsstudy-pro.png"
  />

  <link
    rel="apple-touch-icon"
    href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj_example/s1600/letsstudy-pro.png"
  />

  <link rel="preconnect" href="https://www.gstatic.com" />
  <link rel="preconnect" href="https://firestore.googleapis.com" />

  <style>
    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      font-family:
        Inter,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.6;
    }

    a {
      color: inherit;
      text-decoration: none;
    }

    button {
      font: inherit;
    }

    .header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(12px);
      color: #fff;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }

    .header-inner {
      max-width: 1180px;
      margin: auto;
      min-height: 68px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      letter-spacing: -.3px;
    }

    .brand img {
      width: 40px;
      height: 40px;
      object-fit: contain;
      border-radius: 10px;
      background: #fff;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      min-height: 42px;
      padding: 0 13px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,.14);
      background: rgba(255,255,255,.08);
      color: #fff;
      cursor: pointer;
      transition: .2s ease;
    }

    .header-btn:hover {
      background: rgba(255,255,255,.15);
    }

    .container {
      max-width: 1180px;
      margin: auto;
      padding: 25px 18px 110px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      margin-bottom: 20px;
      color: #2563eb;
      font-weight: 700;
    }

    .error-box {
      display: none;
      padding: 24px;
      margin-bottom: 20px;
      background: #fff;
      border: 1px solid #fecaca;
      border-radius: 18px;
      box-shadow: 0 8px 30px rgba(15,23,42,.06);
    }

    .error-box h2 {
      margin-top: 0;
      color: #b91c1c;
    }

    .error-box a {
      display: inline-flex;
      margin-top: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      background: #0f172a;
      color: #fff;
      font-weight: 700;
    }

    .resource-card {
      overflow: hidden;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 22px;
      box-shadow: 0 15px 45px rgba(15,23,42,.08);
    }

    .resource-grid {
      display: grid;
      grid-template-columns: minmax(280px, 390px) 1fr;
    }

    .resource-media {
      min-height: 330px;
      background: #e2e8f0;
      position: relative;
    }

    .resource-media img {
      width: 100%;
      height: 100%;
      min-height: 330px;
      display: block;
      object-fit: cover;
    }

    .resource-placeholder {
      width: 100%;
      height: 100%;
      min-height: 330px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      font-weight: 800;
      background: linear-gradient(
        135deg,
        #e2e8f0,
        #f8fafc
      );
    }

    .resource-content {
      padding: 32px;
    }

    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 14px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 30px;
      padding: 5px 11px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 800;
    }

    .badge-category {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .badge-free {
      background: #dcfce7;
      color: #15803d;
    }

    .badge-plan {
      background: #fef3c7;
      color: #a16207;
    }

    .resource-title {
      margin: 0 0 12px;
      font-size: clamp(28px, 4vw, 44px);
      line-height: 1.15;
      letter-spacing: -.8px;
    }

    .resource-description {
      color: #475569;
      font-size: 16px;
      white-space: pre-line;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0,1fr));
      gap: 12px;
      margin: 22px 0;
    }

    .meta-item {
      padding: 14px;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      background: #f8fafc;
    }

    .meta-label {
      display: block;
      margin-bottom: 3px;
      color: #64748b;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: .5px;
    }

    .meta-value {
      font-weight: 800;
      word-break: break-word;
    }

    .price {
      margin: 20px 0;
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 22px;
    }

    .btn {
      min-height: 46px;
      padding: 0 17px;
      border: 0;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      font-weight: 800;
      transition: .2s ease;
    }

    .btn:hover {
      transform: translateY(-1px);
    }

    .btn-primary {
      background: #2563eb;
      color: #fff;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-dark {
      background: #0f172a;
      color: #fff;
    }

    .btn-light {
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #e2e8f0;
    }

    .btn-success {
      background: #16a34a;
      color: #fff;
    }

    .notice {
      margin-top: 22px;
      padding: 15px 16px;
      border-radius: 14px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      font-size: 14px;
    }

    .section {
      margin-top: 28px;
    }

    .section-title {
      margin: 0 0 14px;
      font-size: 21px;
    }

    .quick-links {
      display: grid;
      grid-template-columns: repeat(4, minmax(0,1fr));
      gap: 12px;
    }

    .quick-link {
      padding: 16px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 15px;
      font-weight: 800;
      transition: .2s ease;
    }

    .quick-link:hover {
      border-color: #93c5fd;
      transform: translateY(-2px);
    }

    .related-box {
      padding: 20px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
    }

    .skeleton {
      overflow: hidden;
      border-radius: 22px;
      background: #fff;
      border: 1px solid #e2e8f0;
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: 380px 1fr;
    }

    .sk-media {
      min-height: 330px;
      background: #e2e8f0;
      position: relative;
      overflow: hidden;
    }

    .sk-content {
      padding: 30px;
    }

    .sk-line {
      height: 14px;
      margin-bottom: 12px;
      border-radius: 8px;
      background: #e2e8f0;
      position: relative;
      overflow: hidden;
    }

    .sk-line::after,
    .sk-media::after {
      content: "";
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,.6),
        transparent
      );
      animation: shimmer 1.3s infinite;
    }

    .sk-title {
      height: 35px;
      width: 70%;
      margin-bottom: 18px;
    }

    .sk-large {
      height: 100px;
    }

    @keyframes shimmer {
      100% {
        transform: translateX(100%);
      }
    }

    .bottom-bar {
      position: fixed;
      z-index: 999;
      left: 0;
      right: 0;
      bottom: 0;
      padding:
        10px
        max(12px, env(safe-area-inset-right))
        calc(10px + env(safe-area-inset-bottom))
        max(12px, env(safe-area-inset-left));
      background: rgba(15,23,42,.97);
      color: #fff;
      border-top: 1px solid rgba(255,255,255,.08);
    }

    .bottom-inner {
      max-width: 1180px;
      margin: auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .bottom-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .bottom-link {
      padding: 9px 12px;
      border-radius: 9px;
      background: rgba(255,255,255,.08);
      font-size: 13px;
      font-weight: 700;
    }

    @media (max-width: 850px) {
      .resource-grid,
      .skeleton-grid {
        grid-template-columns: 1fr;
      }

      .resource-media,
      .resource-media img,
      .sk-media {
        min-height: 260px;
      }

      .quick-links {
        grid-template-columns: repeat(2,1fr);
      }
    }

    @media (max-width: 600px) {
      .header-inner {
        padding: 9px 12px;
      }

      .brand span {
        display: none;
      }

      .header-btn {
        min-height: 38px;
        padding: 0 10px;
        font-size: 13px;
      }

      .container {
        padding: 18px 12px 120px;
      }

      .resource-content {
        padding: 22px 18px;
      }

      .meta-grid {
        grid-template-columns: 1fr;
      }

      .actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }

      .quick-links {
        grid-template-columns: 1fr;
      }

      .bottom-inner {
        flex-direction: column;
        align-items: stretch;
      }

      .bottom-links {
        justify-content: center;
      }
    }
  </style>

  <!-- Google AdSense -->
  <script
    async
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9557927842145806"
    crossorigin="anonymous">
  </script>

  <!-- Google Analytics -->
  <script
    async
    src="https://www.googletagmanager.com/gtag/js?id=G-3RD5Z87VF0">
  </script>

  <script>
    window.dataLayer = window.dataLayer || [];

    function gtag() {
      dataLayer.push(arguments);
    }

    gtag("js", new Date());
    gtag("config", "G-3RD5Z87VF0");
  </script>
</head>

<body>

<header class="header">
  <div class="header-inner">

    <a class="brand" href="search.html">
      <img
        src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj_example/s1600/letsstudy-pro.png"
        alt="LetsStudy Pro"
      />
      <span>LetsStudy Pro</span>
    </a>

    <div class="header-actions">
      <a class="header-btn" href="search.html">
        Search
      </a>

      <a class="header-btn" href="resources-cart.html">
        Resource Cart
      </a>
    </div>

  </div>
</header>

<main class="container">

  <a class="back-link" href="resources.html">
    ← Back to Resources
  </a>

  <div id="errorBox" class="error-box"></div>

  <section id="loading" class="skeleton">

    <div class="skeleton-grid">

      <div class="sk-media"></div>

      <div class="sk-content">

        <div class="sk-line sk-title"></div>

        <div class="sk-line"></div>
        <div class="sk-line"></div>
        <div class="sk-line" style="width:65%;"></div>

        <div style="height:20px;"></div>

        <div class="sk-line sk-large"></div>

      </div>

    </div>

  </section>

  <section id="page" style="display:none;"></section>

</main>

<div class="bottom-bar">

  <div class="bottom-inner">

    <div>
      <strong>LetsStudy Pro</strong>
    </div>

    <div class="bottom-links">

      <a
        class="bottom-link"
        href="index-auth.html">
        App
      </a>

      <a
        class="bottom-link"
        href="admin-dashboard.html">
        Publish
      </a>

    </div>

  </div>

</div>

<script type="module">

  import {
    initializeApp
  } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

  import {
    getFirestore,
    doc,
    getDoc
  } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


  /* =========================
     FIREBASE
  ========================= */

  const firebaseConfig = {

    apiKey:
      "AIzaSyBcOYDfAVKXbkljsyRgI_0rjodBn678tCc",

    authDomain:
      "let-s-study-pro-course.firebaseapp.com",

    databaseURL:
      "https://let-s-study-pro-course-default-rtdb.firebaseio.com",

    projectId:
      "let-s-study-pro-course",

    storageBucket:
      "let-s-study-pro-course.firebasestorage.app",

    messagingSenderId:
      "474928293390",

    appId:
      "1:474928293390:web:2bcc2aebf2351c12a9fe5f",

    measurementId:
      "G-85B7V5H5J0"
  };


  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);


  /* =========================
     ELEMENTS
  ========================= */

  const page =
    document.getElementById("page");

  const loading =
    document.getElementById("loading");

  const errorBox =
    document.getElementById("errorBox");


  /* =========================
     HELPERS
  ========================= */

  function escapeHtml(value) {

    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  function safeUrl(value) {

    if (!value) return "";

    try {

      const url =
        new URL(value, window.location.origin);

      if (
        url.protocol === "http:" ||
        url.protocol === "https:"
      ) {
        return url.href;
      }

    } catch (_) {}

    return "";
  }


  function formatTZS(value) {

    const number =
      Number(value);

    if (!Number.isFinite(number)) {
      return "TZS 0";
    }

    return new Intl.NumberFormat(
      "en-TZ",
      {
        style: "currency",
        currency: "TZS",
        maximumFractionDigits: 0
      }
    ).format(number);
  }


  function isPlan(data) {

    return Boolean(

      data?.access === "plan" ||

      data?.accessType === "plan" ||

      data?.membership === "plan" ||

      data?.plan === true ||

      data?.isPremium === true ||

      data?.premium === true ||

      data?.paid === true

    );
  }


  function priceOf(data) {

    return (

      data?.price ??

      data?.amount ??

      data?.cost ??

      data?.planPrice ??

      0

    );
  }


  function getResourceId() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    return (
      params.get("id") ||
      params.get("resourceId") ||
      ""
    ).trim();
  }


  /* =========================
     ERROR
  ========================= */

  function showError(
    title,
    message
  ) {

    loading.style.display = "none";

    page.style.display = "none";

    errorBox.replaceChildren();

    const h2 =
      document.createElement("h2");

    h2.textContent = title;

    const p =
      document.createElement("p");

    p.textContent = message;

    const a =
      document.createElement("a");

    a.href = "resources.html";
    a.textContent = "Back to Resources";

    errorBox.appendChild(h2);
    errorBox.appendChild(p);
    errorBox.appendChild(a);

    errorBox.style.display = "block";
  }


  /* =========================
     CACHE
  ========================= */

  const CACHE_TIME =
    60 * 1000;


  function cacheKey(id) {

    return `lsp:resource:${id}`;
  }


  function readCache(id) {

    try {

      const raw =
        localStorage.getItem(
          cacheKey(id)
        );

      if (!raw) return null;

      const parsed =
        JSON.parse(raw);

      if (
        !parsed ||
        !parsed.timestamp ||
        !parsed.data
      ) {
        return null;
      }

      if (
        Date.now() -
        parsed.timestamp >
        CACHE_TIME
      ) {
        return null;
      }

      return parsed.data;

    } catch (_) {

      return null;
    }
  }


  function writeCache(id, data) {

    try {

      localStorage.setItem(
        cacheKey(id),
        JSON.stringify({
          timestamp: Date.now(),
          data
        })
      );

    } catch (_) {}
  }


  /* =========================
     SHARE
  ========================= */

  async function copyLink(url) {

    try {

      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {

        await navigator.clipboard.writeText(
          url
        );

        alert("Link copied.");

        return;
      }

    } catch (_) {}

    const t =
      document.createElement("textarea");

    t.value = url;

    t.style.position = "fixed";
    t.style.opacity = "0";

    document.body.appendChild(t);

    t.select();

    try {
      document.execCommand("copy");
    } catch (_) {}

    document.body.removeChild(t);

    alert("Link copied.");
  }


  async function shareResource(
    title
  ) {

    const url =
      window.location.href;

    if (
      navigator.share
    ) {

      try {

        await navigator.share({
          title:
            title || "LetsStudy Pro Resource",
          text:
            "Check out this resource on LetsStudy Pro.",
          url
        });

        return;

      } catch (error) {

        if (
          error?.name === "AbortError"
        ) {
          return;
        }

      }
    }

    await copyLink(url);
  }


  /* =========================
     CART
  ========================= */

  function getCart() {

    try {

      const cart =
        JSON.parse(
          localStorage.getItem(
            "resourceCart"
          ) || "[]"
        );

      return Array.isArray(cart)
        ? cart
        : [];

    } catch (_) {

      return [];
    }
  }


  function saveCart(cart) {

    localStorage.setItem(
      "resourceCart",
      JSON.stringify(cart)
    );
  }


  function addToCart(data, id) {

    const cart =
      getCart();

    const exists =
      cart.some(
        item =>
          String(
            item.id
          ) === String(id)
      );

    if (exists) {

      window.location.href =
        "resources-cart.html";

      return;
    }


    cart.push({

      id,

      title:
        data.title ||
        data.name ||
        "Resource",

      description:
  data.description ||
  data.descr ||
  data.details ||
  "No description available.",

category:
  data.category ||
  data.resourceCategory ||
  "Educational Resource",

thumbnail:
  safeUrl(
    data.thumbnail ||
    data.image ||
    data.coverImage ||
    data.photo ||
    ""
  ),

fileUrl:
  safeUrl(
    data.fileUrl ||
    data.downloadUrl ||
    data.file ||
    data.pdfUrl ||
    ""
  ),

websiteUrl:
  safeUrl(
    data.website ||
    data.officialWebsite ||
    data.sourceUrl ||
    ""
  ),

plan:
  isPlan(data),

price:
  priceOf(data)
};


/* =========================
   PAGE TITLE & SEO
========================= */

document.title =
  `${title} | LetsStudy Pro`;

const descriptionMeta =
  document.querySelector(
    'meta[name="description"]'
  );

if (descriptionMeta) {
  descriptionMeta.setAttribute(
    "content",
    description.slice(0, 160)
  );
}

const canonical =
  document.querySelector(
    'link[rel="canonical"]'
  );

if (canonical) {
  canonical.href =
    window.location.href;
}


/* =========================
   IMAGE
========================= */

const imageHtml =
  thumbnail

    ? `
      <img
        src="${escapeHtml(thumbnail)}"
        alt="${escapeHtml(title)}"
        loading="eager"
        decoding="async"
      />
    `

    : `
      <div class="resource-placeholder">
        LetsStudy Pro
      </div>
    `;


/* =========================
   ACTION
========================= */

const actionHtml =
  plan

    ? `
      <button
        class="btn btn-primary"
        id="cartBtn"
        type="button">
        Add to Resource Cart
      </button>
    `

    : fileUrl

      ? `
        <button
          class="btn btn-success"
          id="downloadBtn"
          type="button">
          Download Resource
        </button>
      `

      : `
        <button
          class="btn btn-light"
          type="button"
          disabled>
          File Unavailable
        </button>
      `;


/* =========================
   PRICE
========================= */

const priceHtml =
  plan

    ? `
      <div class="price">
        ${formatTZS(price)}
      </div>
    `

    : `
      <div class="price">
        Free
      </div>
    `;


/* =========================
   RENDER
========================= */

page.innerHTML = `

  <article class="resource-card">

    <div class="resource-grid">

      <div class="resource-media">
        ${imageHtml}
      </div>


      <div class="resource-content">

        <div class="badge-row">

          <span class="badge badge-category">
            ${escapeHtml(category)}
          </span>

          ${
            plan
              ? `
                <span class="badge badge-plan">
                  Plan Resource
                </span>
              `
              : `
                <span class="badge badge-free">
                  Free Resource
                </span>
              `
          }

        </div>


        <h1 class="resource-title">
          ${escapeHtml(title)}
        </h1>


        <div class="resource-description">
          ${escapeHtml(description)}
        </div>


        <div class="meta-grid">

          <div class="meta-item">

            <span class="meta-label">
              Category
            </span>

            <span class="meta-value">
              ${escapeHtml(category)}
            </span>

          </div>


          <div class="meta-item">

            <span class="meta-label">
              Access
            </span>

            <span class="meta-value">
              ${
                plan
                  ? "Plan / Paid"
                  : "Free"
              }
            </span>

          </div>

        </div>


        ${priceHtml}


        <div class="actions">

          ${actionHtml}


          <button
            class="btn btn-dark"
            id="shareBtn"
            type="button">
            Share
          </button>


          ${
            websiteUrl
              ? `
                <a
                  class="btn btn-light"
                  href="${escapeHtml(websiteUrl)}"
                  target="_blank"
                  rel="noopener noreferrer">
                  Official Website
                </a>
              `
              : ""
          }

        </div>


        ${
          plan
            ? `
              <div class="notice">
                This resource is available through
                the applicable LetsStudy Pro plan.
                Add it to your resource cart to continue.
              </div>
            `
            : ""
        }

      </div>

    </div>

  </article>


  <section class="section">

    <h2 class="section-title">
      Explore LetsStudy Pro
    </h2>

    <div class="quick-links">

      <a
        class="quick-link"
        href="courses.html">
        Courses
      </a>

      <a
        class="quick-link"
        href="scholarships.html">
        Scholarships
      </a>

      <a
        class="quick-link"
        href="careers.html">
        Careers
      </a>

      <a
        class="quick-link"
        href="search.html">
        Search Resources
      </a>

    </div>

  </section>


  <section class="section">

    <div class="related-box">

      <h2 class="section-title">
        More Resources
      </h2>

      <p>
        Discover more learning materials,
        courses, scholarships and career
        opportunities through LetsStudy Pro.
      </p>

      <a
        class="btn btn-primary"
        href="resources.html">
        Browse Resources
      </a>

    </div>

  </section>

`;


/* =========================
   SHARE BUTTON
========================= */

const shareBtn =
  document.getElementById(
    "shareBtn"
  );

if (shareBtn) {

  shareBtn.addEventListener(
    "click",
    () => shareResource(title)
  );

}


/* =========================
   DOWNLOAD BUTTON
========================= */

const downloadBtn =
  document.getElementById(
    "downloadBtn"
  );

if (downloadBtn) {

  downloadBtn.addEventListener(
    "click",
    () => downloadResource(fileUrl)
  );

}


/* =========================
   CART BUTTON
========================= */

const cartBtn =
  document.getElementById(
    "cartBtn"
  );

if (cartBtn) {

  cartBtn.addEventListener(
    "click",
    () => addToCart(data, id)
  );

}


/* =========================
   DISPLAY PAGE
========================= */

loading.style.display =
  "none";

errorBox.style.display =
  "none";

page.style.display =
  "block";


/* =========================
   GOOGLE ANALYTICS
========================= */

try {

  if (
    typeof gtag === "function"
  ) {

    gtag(
      "event",
      "view_resource",
      {
        resource_id: id,
        resource_title: title,
        resource_category: category
      }
    );

  }

} catch (_) {}


/* =========================
   JSON-LD
========================= */

const oldSchema =
  document.getElementById(
    "resourceSchema"
  );

if (oldSchema) {
  oldSchema.remove();
}

const schema =
  document.createElement(
    "script"
  );

schema.type =
  "application/ld+json";

schema.id =
  "resourceSchema";

schema.textContent =
  JSON.stringify({

    "@context":
      "https://schema.org",

    "@type":
      "CreativeWork",

    name:
      title,

    description:
      description,

    url:
      window.location.href,

    image:
      thumbnail || undefined,

    learningResourceType:
      "Educational Resource",

    isAccessibleForFree:
      !plan,

    publisher: {

      "@type":
        "Organization",

      name:
        "LetsStudy Pro",

      url:
        "https://letsstudy.pro"

    }

  });

document.head.appendChild(
  schema
);


/* =========================
   END RENDER
========================= */

}


/* =========================
   LOAD RESOURCE
========================= */

async function loadResource() {

  const id =
    getResourceId();

  if (!id) {

    showError(
      "Resource Not Found",
      "No resource ID was provided in the URL."
    );

    return;
  }


  /* =========================
     CACHE
  ========================= */

  const cached =
    readCache(id);

  if (cached) {

    renderResource(
      cached,
      id
    );

  }


  /* =========================
     FIRESTORE
  ========================= */

  try {

    const resourceRef =
      doc(
        db,
        "resources",
        id
      );

    const snapshot =
      await getDoc(
        resourceRef
      );


    if (!snapshot.exists()) {

      if (!cached) {

        showError(
          "Resource Not Found",
          "The requested resource does not exist or may have been removed."
        );

      }

      return;
    }


    const data =
      snapshot.data();


    /* Save cache */

    writeCache(
      id,
      data
    );


    /* Render */

    renderResource(
      data,
      id
    );


  } catch (error) {

    console.error(
      "Resource loading error:",
      error
    );


    if (!cached) {

      showError(
        "Unable to Load Resource",
        "Something went wrong while loading this resource. Please try again."
      );

    }

  }

}


/* =========================
   START
========================= */

loadResource();

</script>

</body>
</html>