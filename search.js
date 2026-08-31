/* =========================================================
   LETSSTUDY PRO — SEARCH.JS
   Dynamic Firebase Search
========================================================= */

const SEARCH_API =
  "https://africa-south1-let-s-study-pro-course.cloudfunctions.net/searchAPI";

const searchInput =
  document.getElementById("searchInput");

const searchButton =
  document.getElementById("searchButton");

const voiceButton =
  document.getElementById("voiceButton");

const clearButton =
  document.getElementById("clearButton");

const resultsContainer =
  document.getElementById("results");

const suggestions =
  document.getElementById("suggestions");

const loading =
  document.getElementById("loading");

const emptyState =
  document.getElementById("emptyState");

const errorState =
  document.getElementById("errorState");

const resultCount =
  document.getElementById("resultCount");

const categoryFilter =
  document.getElementById("categoryFilter");

const typeFilter =
  document.getElementById("typeFilter");

const loadMoreButton =
  document.getElementById("loadMoreButton");


/* =========================================================
   STATE
========================================================= */

let currentQuery = "";

let currentPage = 1;

let currentLimit = 10;

let hasMore = false;

let isSearching = false;


/* =========================================================
   NORMALIZE
========================================================= */

function normalize(value) {

  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   SAFE IMAGE
========================================================= */

function getImage(item) {

  if (
    item.image &&
    /^https?:\/\//i.test(item.image)
  ) {

    return item.image;

  }

  return "/assets/images/og-default.jpg";

}


/* =========================================================
   LOADING
========================================================= */

function setLoading(state) {

  if (!loading) return;

  loading.classList.toggle(
    "hidden",
    !state
  );

}


/* =========================================================
   EMPTY STATE
========================================================= */

function setEmpty(state) {

  if (!emptyState) return;

  emptyState.classList.toggle(
    "hidden",
    !state
  );

}


/* =========================================================
   ERROR STATE
========================================================= */

function setError(state, message = "") {

  if (!errorState) return;

  errorState.classList.toggle(
    "hidden",
    !state
  );

  if (state) {

    errorState.textContent =
      message ||
      "Something went wrong. Please try again.";

  }

}


/* =========================================================
   CLEAR RESULTS
========================================================= */

function clearResults() {

  if (!resultsContainer) return;

  resultsContainer.innerHTML = "";

}


/* =========================================================
   RESULT CARD
========================================================= */

function createResultCard(item) {

  const article =
    document.createElement("article");

  article.className =
    "search-result-card";

  const image =
    escapeHtml(
      getImage(item)
    );

  const title =
    escapeHtml(
      item.title ||
      "Untitled"
    );

  const description =
    escapeHtml(
      item.description ||
      "No description available."
    );

  const category =
    escapeHtml(
      item.category ||
      item.type ||
      "Content"
    );

  const subject =
    escapeHtml(
      item.subject || ""
    );

  const level =
    escapeHtml(
      item.level || ""
    );

  const url =
    item.url &&
    /^https?:\/\//i.test(item.url)
      ? item.url
      : "#";


  article.innerHTML = `

    <div class="result-image-wrapper">

      <img
        class="result-image"
        src="${image}"
        alt="${title}"
        loading="lazy"
        onerror="
          this.src='/assets/images/og-default.jpg'
        "
      >

    </div>


    <div class="result-content">

      <div class="result-meta">

        <span class="result-category">
          ${category}
        </span>

        ${
          subject
            ? `
              <span class="result-subject">
                ${subject}
              </span>
            `
            : ""
        }

        ${
          level
            ? `
              <span class="result-level">
                ${level}
              </span>
            `
            : ""
        }

      </div>


      <h2 class="result-title">

        <a
          href="${escapeHtml(url)}"
        >
          ${title}
        </a>

      </h2>


      <p class="result-description">
        ${description}
      </p>


      <div class="result-actions">

        <a
          class="open-result"
          href="${escapeHtml(url)}"
        >
          Open
        </a>


        <button
          type="button"
          class="save-result"
          data-url="${escapeHtml(url)}"
          data-title="${title}"
        >
          Save
        </button>


        <button
          type="button"
          class="share-result"
          data-url="${escapeHtml(url)}"
          data-title="${title}"
        >
          Share
        </button>

      </div>

    </div>

  `;


  /* SAVE */

  const saveButton =
    article.querySelector(
      ".save-result"
    );

  if (saveButton) {

    saveButton.addEventListener(
      "click",
      () => {

        saveResult({
          title:
            item.title || "",
          url:
            item.url || ""
        });

      }
    );

  }


  /* SHARE */

  const shareButton =
    article.querySelector(
      ".share-result"
    );

  if (shareButton) {

    shareButton.addEventListener(
      "click",
      () => {

        shareResult({
          title:
            item.title || "",
          url:
            item.url || ""
        });

      }
    );

  }


  return article;

}


/* =========================================================
   RENDER RESULTS
========================================================= */

function renderResults(items, append = false) {

  if (!resultsContainer) return;


  if (!append) {

    clearResults();

  }


  if (!items.length) {

    return;

  }


  const fragment =
    document.createDocumentFragment();


  for (const item of items) {

    fragment.appendChild(
      createResultCard(item)
    );

  }


  resultsContainer.appendChild(
    fragment
  );

}


/* =========================================================
   UPDATE RESULT COUNT
========================================================= */

function updateResultCount(total) {

  if (!resultCount) return;

  resultCount.textContent =
    `${Number(total || 0).toLocaleString()} results`;

}


/* =========================================================
   SEARCH API
========================================================= */

async function searchAPI(
  query,
  page = 1
) {

  const params =
    new URLSearchParams();

  params.set(
    "q",
    query
  );

  params.set(
    "page",
    page
  );

  params.set(
    "limit",
    currentLimit
  );


  if (
    categoryFilter &&
    categoryFilter.value
  ) {

    params.set(
      "category",
      categoryFilter.value
    );

  }


  if (
    typeFilter &&
    typeFilter.value
  ) {

    params.set(
      "type",
      typeFilter.value
    );

  }


  const response =
    await fetch(
      `${SEARCH_API}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Accept":
            "application/json"
        }
      }
    );


  if (!response.ok) {

    throw new Error(
      `Search request failed: ${response.status}`
    );

  }


  return response.json();

}


/* =========================================================
   PERFORM SEARCH
========================================================= */

async function performSearch(
  query = null,
  page = 1,
  append = false
) {

  if (isSearching) return;


  const value =
    normalize(
      query !== null
        ? query
        : searchInput?.value
    );


  if (!value) {

    currentQuery = "";

    currentPage = 1;

    hasMore = false;

    clearResults();

    updateResultCount(0);

    setLoading(false);

    setEmpty(false);

    setError(false);

    if (loadMoreButton) {

      loadMoreButton.classList.add(
        "hidden"
      );

    }

    return;

  }


  if (
    value.length > 200
  ) {

    setError(
      true,
      "Search query is too long."
    );

    return;

  }


  currentQuery =
    value;

  currentPage =
    page;

  isSearching =
    true;


  setError(false);

  setEmpty(false);

  setLoading(true);


  if (!append) {

    clearResults();

  }


  try {

    const data =
      await searchAPI(
        value,
        page
      );


    if (!data.success) {

      throw new Error(
        data.error ||
        "Search failed."
      );

    }


    const items =
      Array.isArray(
        data.results
      )
        ? data.results
        : [];


    renderResults(
      items,
      append
    );


    updateResultCount(
      data.total
    );


    hasMore =
      Boolean(
        data.hasMore
      );


    if (
      loadMoreButton
    ) {

      loadMoreButton.classList.toggle(
        "hidden",
        !hasMore
      );

    }


    if (
      !items.length &&
      !append
    ) {

      setEmpty(true);

    }


    saveSearchHistory(
      value
    );


  } catch (error) {

    console.error(
      "LetsStudy Search Error:",
      error
    );


    if (!append) {

      clearResults();

    }


    setError(
      true,
      "Unable to search right now. Please try again."
    );


  } finally {

    setLoading(false);

    isSearching = false;

  }

}


/* =========================================================
   LOAD MORE
========================================================= */

async function loadMore() {

  if (!hasMore) return;

  await performSearch(
    currentQuery,
    currentPage + 1,
    true
  );

}


/* =========================================================
   SEARCH BUTTON
========================================================= */

if (searchButton) {

  searchButton.addEventListener(
    "click",
    () => {

      performSearch();

    }
  );

}


/* =========================================================
   ENTER KEY
========================================================= */

if (searchInput) {

  searchInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        performSearch();

      }

    }
  );

}


/* =========================================================
   CLEAR BUTTON
========================================================= */

if (clearButton) {

  clearButton.addEventListener(
    "click",
    () => {

      if (searchInput) {

        searchInput.value = "";

        searchInput.focus();

      }

      currentQuery = "";

      currentPage = 1;

      hasMore = false;

      clearResults();

      updateResultCount(0);

      setEmpty(false);

      setError(false);

      hideSuggestions();

    }
  );

}


/* =========================================================
   FILTERS
========================================================= */

if (categoryFilter) {

  categoryFilter.addEventListener(
    "change",
    () => {

      if (
        currentQuery
      ) {

        performSearch(
          currentQuery,
          1,
          false
        );

      }

    }
  );

}


if (typeFilter) {

  typeFilter.addEventListener(
    "change",
    () => {

      if (
        currentQuery
      ) {

        performSearch(
          currentQuery,
          1,
          false
        );

      }

    }
  );

}


/* =========================================================
   LOAD MORE BUTTON
========================================================= */

if (loadMoreButton) {

  loadMoreButton.addEventListener(
    "click",
    loadMore
  );

}


/* =========================================================
   SUGGESTIONS
========================================================= */

function showSuggestions(items) {

  if (!suggestions) return;


  suggestions.innerHTML = "";


  if (
    !items ||
    !items.length
  ) {

    suggestions.classList.add(
      "hidden"
    );

    return;

  }


  for (
    const item of items
  ) {

    const button =
      document.createElement("button");

    button.type =
      "button";

    button.className =
      "search-suggestion";

    button.textContent =
      item;

    button.addEventListener(
      "click",
      () => {

        if (searchInput) {

          searchInput.value =
            item;

        }

        hideSuggestions();

        performSearch(item);

      }
    );

    suggestions.appendChild(
      button
    );

  }


  if (
    suggestions.children.length
  ) {

    suggestions.classList.remove(
      "hidden"
    );

  }

}


/* =========================================================
   HIDE SUGGESTIONS
========================================================= */

function hideSuggestions() {

  if (!suggestions) return;

  suggestions.classList.add(
    "hidden"
  );

}


/* =========================================================
   DYNAMIC SUGGESTIONS FROM SEARCH INDEX
========================================================= */

let suggestionTimer = null;

async function getSuggestions(query) {

  const q =
    normalize(query);

  if (
    q.length < 2
  ) {

    hideSuggestions();

    return;

  }


  /*
  Suggestions are generated from real
  searchIndex data through the Search API.
  */

  try {

    const data =
      await searchAPI(
        q,
        1
      );


    const items =
      Array.isArray(
        data.results
      )
        ? data.results
            .map(
              item =>
                item.title
            )
            .filter(Boolean)
            .slice(0, 6)
        : [];


    const unique =
      [...new Set(items)];


    showSuggestions(
      unique
    );


  } catch (error) {

    console.error(
      "Suggestion error:",
      error
    );

    hideSuggestions();

  }

}


if (searchInput) {

  searchInput.addEventListener(
    "input",
    () => {

      clearTimeout(
        suggestionTimer
      );


      const value =
        searchInput.value;


      if (
        !normalize(value)
      ) {

        hideSuggestions();

        return;

      }


      suggestionTimer =
        setTimeout(
          () => {

            getSuggestions(
              value
            );

          },
          350
        );

    }
  );

}


/* =========================================================
   CLOSE SUGGESTIONS OUTSIDE
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (
      suggestions &&
      searchInput &&
      !suggestions.contains(
        event.target
      ) &&
      event.target !== searchInput
    ) {

      hideSuggestions();

    }

  }
);


/* =========================================================
   VOICE SEARCH
========================================================= */

if (
  voiceButton &&
  (
    "SpeechRecognition" in window ||
    "webkitSpeechRecognition" in window
  )
) {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  const recognition =
    new SpeechRecognition();


  recognition.lang =
    document.documentElement
      .lang ||
    "en-US";


  recognition.interimResults =
    false;


  recognition.maxAlternatives =
    1;


  voiceButton.addEventListener(
    "click",
    () => {

      try {

        recognition.start();

      } catch (error) {

        console.error(
          error
        );

      }

    }
  );


  recognition.addEventListener(
    "result",
    event => {

      const transcript =
        event.results[0][0]
          .transcript;


      if (searchInput) {

        searchInput.value =
          transcript;

      }


      performSearch(
        transcript
      );

    }
  );


  recognition.addEventListener(
    "error",
    error => {

      console.error(
        "Voice search error:",
        error
      );

    }
  );

} else if (voiceButton) {

  voiceButton.disabled =
    true;

  voiceButton.title =
    "Voice search is not supported by this browser.";

}


/* =========================================================
   SAVE SEARCH HISTORY
========================================================= */

function saveSearchHistory(
  query
) {

  const q =
    normalize(query);

  if (!q) return;


  try {

    const key =
      "letsStudySearchHistory";


    const old =
      JSON.parse(
        localStorage.getItem(
          key
        ) || "[]"
      );


    const filtered =
      old.filter(
        item =>
          item !== q
      );


    filtered.unshift(q);


    const limited =
      filtered.slice(
        0,
        20
      );


    localStorage.setItem(
      key,
      JSON.stringify(
        limited
      )
    );

  } catch (error) {

    console.error(
      "History error:",
      error
    );

  }

}


/* =========================================================
   GET SEARCH HISTORY
========================================================= */

function getSearchHistory() {

  try {

    return JSON.parse(
      localStorage.getItem(
        "letsStudySearchHistory"
      ) || "[]"
    );

  } catch {

    return [];

  }

}


/* =========================================================
   SAVE RESULT
========================================================= */

function saveResult(item) {

  try {

    const key =
      "letsStudySavedResults";


    const old =
      JSON.parse(
        localStorage.getItem(
          key
        ) || "[]"
      );


    const exists =
      old.some(
        saved =>
          saved.url === item.url
      );


    if (!exists) {

      old.push({

        title:
          item.title,

        url:
          item.url,

        savedAt:
          new Date().toISOString()

      });


      localStorage.setItem(
        key,
        JSON.stringify(old)
      );

    }


    alert(
      exists
        ? "Already saved."
        : "Saved successfully."
    );


  } catch (error) {

    console.error(
      "Save error:",
      error
    );

  }

}


/* =========================================================
   SHARE RESULT
========================================================= */

async function shareResult(item) {

  const title =
    item.title ||
    "LetsStudy Pro";


  const url =
    item.url ||
    window.location.href;


  if (
    navigator.share
  ) {

    try {

      await navigator.share({

        title,

        text:
          `Check this on LetsStudy Pro: ${title}`,

        url

      });

      return;

    } catch (error) {

      if (
        error.name ===
        "AbortError"
      ) {

        return;

      }

    }

  }


  try {

    await navigator.clipboard.writeText(
      url
    );

    alert(
      "Link copied."
    );

  } catch {

    prompt(
      "Copy this link:",
      url
    );

  }

}


/* =========================================================
   URL QUERY SUPPORT
========================================================= */

/* =========================================================
   URL QUERY SUPPORT
========================================================= */

function getInitialQuery() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  return (
    params.get("q") ||
    params.get("query") ||
    ""
  ).trim();

}


/* =========================================================
   UPDATE URL QUERY
========================================================= */

function updateURL(query) {

  const url =
    new URL(
      window.location.href
    );

  if (query) {

    url.searchParams.set(
      "q",
      query
    );

  } else {

    url.searchParams.delete("q");

  }

  window.history.replaceState(
    {},
    "",
    url
  );

}


/* =========================================================
   SEARCH STATE
========================================================= */

let currentQuery = "";
let currentPage = 1;
let currentCategory = "all";
let currentType = "all";
let isSearching = false;


/* =========================================================
   ELEMENTS
========================================================= */

const searchInput =
  document.getElementById("searchInput");

const searchButton =
  document.getElementById("searchButton");

const clearButton =
  document.getElementById("clearButton");

const voiceButton =
  document.getElementById("voiceButton");

const results =
  document.getElementById("results");

const loading =
  document.getElementById("loading");

const noResults =
  document.getElementById("noResults");

const resultCount =
  document.getElementById("resultCount");

const suggestions =
  document.getElementById("suggestions");

const loadMoreButton =
  document.getElementById("loadMoreButton");


/* =========================================================
   SAFE ELEMENT HELPERS
========================================================= */

function showElement(element) {

  if (element) {
    element.classList.remove("hidden");
  }

}


function hideElement(element) {

  if (element) {
    element.classList.add("hidden");
  }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   NORMALIZE
========================================================= */

function normalize(value) {

  return String(value || "")
    .toLowerCase()
    .trim();

}


/* =========================================================
   GET RESULT URL
========================================================= */

function getResultURL(item) {

  if (item.url) {
    return item.url;
  }

  if (item.publicUrl) {
    return item.publicUrl;
  }

  if (item.link) {
    return item.link;
  }

  const collection =
    item.collection ||
    "";

  const documentId =
    item.documentId ||
    item.id ||
    "";

  if (!collection || !documentId) {
    return "#";
  }

  const pages = {

    courses:
      "course.html",

    resources:
      "resource.html",

    scholarships:
      "scholarship.html",

    careers:
      "career.html",

    marketplace:
      "product.html",

    lessons:
      "lesson.html",

    videos:
      "video.html",

    businesses:
      "business.html",

    services:
      "service.html",

    posts:
      "community.html"

  };

  const page =
    pages[collection];

  if (!page) {
    return "#";
  }

  return `${page}?id=${encodeURIComponent(
    documentId
  )}`;

}


/* =========================================================
   GET IMAGE
========================================================= */

function getResultImage(item) {

  return (
    item.image ||
    item.imageUrl ||
    item.thumbnail ||
    item.coverImage ||
    "/assets/images/og-default.jpg"
  );

}


/* =========================================================
   GET TITLE
========================================================= */

function getResultTitle(item) {

  return (
    item.title ||
    item.name ||
    "Untitled"
  );

}


/* =========================================================
   GET DESCRIPTION
========================================================= */

function getResultDescription(item) {

  return (
    item.description ||
    item.shortDescription ||
    item.summary ||
    item.searchableText ||
    ""
  );

}


/* =========================================================
   GET TYPE LABEL
========================================================= */

function getTypeLabel(item) {

  return (
    item.type ||
    item.collection ||
    "Result"
  );

}


/* =========================================================
   RENDER RESULT
========================================================= */

function renderResult(item) {

  const title =
    escapeHTML(
      getResultTitle(item)
    );

  const description =
    escapeHTML(
      getResultDescription(item)
    );

  const image =
    escapeHTML(
      getResultImage(item)
    );

  const type =
    escapeHTML(
      getTypeLabel(item)
    );

  const category =
    escapeHTML(
      item.category || ""
    );

  const url =
    escapeHTML(
      getResultURL(item)
    );

  const documentId =
    escapeHTML(
      item.documentId ||
      item.id ||
      ""
    );

  return `
    <article
      class="search-result-card"
      data-document-id="${documentId}"
      data-collection="${escapeHTML(
        item.collection || ""
      )}"
    >

      <div class="search-result-image">

        <img
          src="${image}"
          alt="${title}"
          loading="lazy"
          onerror="this.src='/assets/images/og-default.jpg'"
        >

      </div>

      <div class="search-result-content">

        <div class="search-result-meta">

          <span class="result-type">
            ${type}
          </span>

          ${
            category
              ? `
                <span class="result-category">
                  ${category}
                </span>
              `
              : ""
          }

        </div>

        <h3>
          ${title}
        </h3>

        ${
          description
            ? `
              <p>
                ${description}
              </p>
            `
            : ""
        }

        <div class="search-result-actions">

          <a
            class="open-result"
            href="${url}"
          >
            Open
          </a>

          <button
            type="button"
            class="save-result"
            data-id="${documentId}"
            data-collection="${escapeHTML(
              item.collection || ""
            )}"
          >
            Save
          </button>

          <button
            type="button"
            class="share-result"
            data-url="${url}"
            data-title="${title}"
          >
            Share
          </button>

        </div>

      </div>

    </article>
  `;

}


/* =========================================================
   RENDER RESULTS
========================================================= */

function renderResults(items, append = false) {

  if (!results) {
    return;
  }

  if (!append) {
    results.innerHTML = "";
  }

  if (!Array.isArray(items) || !items.length) {

    if (!append) {
      hideElement(results);
      showElement(noResults);
    }

    return;
  }

  hideElement(noResults);
  showElement(results);

  const html =
    items
      .map(renderResult)
      .join("");

  if (append) {
    results.insertAdjacentHTML(
      "beforeend",
      html
    );
  } else {
    results.innerHTML = html;
  }

}


/* =========================================================
   API URL
========================================================= */

function buildSearchURL(query, page) {

  const params =
    new URLSearchParams();

  params.set(
    "q",
    query
  );

  params.set(
    "page",
    String(page)
  );

  params.set(
    "limit",
    "20"
  );

  if (
    currentCategory &&
    currentCategory !== "all"
  ) {

    params.set(
      "category",
      currentCategory
    );

  }

  if (
    currentType &&
    currentType !== "all"
  ) {

    params.set(
      "type",
      currentType
    );

  }

  return `/api/search?${params.toString()}`;

}


/* =========================================================
   SEARCH API
========================================================= */

async function performSearch(
  query,
  options = {}
) {

  query =
    String(query || "")
      .trim();

  if (!query) {

    clearSearchResults();

    return;

  }

  if (isSearching) {
    return;
  }

  isSearching = true;

  currentQuery =
    query;

  if (!options.append) {
    currentPage = 1;
  }

  updateURL(query);

  hideElement(noResults);
  showElement(loading);

  if (!options.append) {
    hideElement(results);
  }

  try {

    const response =
      await fetch(
        buildSearchURL(
          query,
          currentPage
        ),
        {
          method: "GET",
          headers: {
            "Accept":
              "application/json"
          }
        }
      );

    if (!response.ok) {

      throw new Error(
        `Search request failed: ${response.status}`
      );

    }

    const data =
      await response.json();

    /*
     API may return:
       results
       items
       data
    */

    const items =
      Array.isArray(data.results)
        ? data.results
        : Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.data)
            ? data.data
            : [];

    renderResults(
      items,
      Boolean(options.append)
    );

    updateResultCount(
      data.total ??
      data.count ??
      items.length
    );

    updatePagination(
      data
    );

    saveRecentSearch(query);

  } catch (error) {

    console.error(
      "LetsStudy Search Error:",
      error
    );

    if (!options.append) {

      if (results) {
        results.innerHTML = `
          <div class="search-error">
            <h3>
              Search temporarily unavailable
            </h3>

            <p>
              Please try again.
            </p>

            <button
              type="button"
              onclick="retrySearch()"
            >
              Try Again
            </button>
          </div>
        `;

        showElement(results);
      }

    }

  } finally {

    hideElement(loading);

    isSearching = false;

  }

}


/* =========================================================
   RETRY
========================================================= */

function retrySearch() {

  if (currentQuery) {

    performSearch(
      currentQuery
    );

  }

}


/* =========================================================
   RESULT COUNT
========================================================= */

function updateResultCount(count) {

  if (!resultCount) {
    return;
  }

  const number =
    Number(count);

  if (
    Number.isFinite(number)
  ) {

    resultCount.textContent =
      `${number.toLocaleString()} result${
        number === 1 ? "" : "s"
      }`;

  } else {

    resultCount.textContent = "";

  }

}


/* =========================================================
   PAGINATION
========================================================= */

function updatePagination(data) {

  if (!loadMoreButton) {
    return;
  }

  const hasMore =
    data.hasMore === true ||
    data.hasNextPage === true;

  if (hasMore) {

    showElement(
      loadMoreButton
    );

  } else {

    hideElement(
      loadMoreButton
    );

  }

}


/* =========================================================
   LOAD MORE
========================================================= */

async function loadMore() {

  if (!currentQuery) {
    return;
  }

  currentPage++;

  await performSearch(
    currentQuery,
    {
      append: true
    }
  );

}


/* =========================================================
   CLEAR SEARCH
========================================================= */

function clearSearchResults() {

  currentQuery = "";
  currentPage = 1;

  if (searchInput) {
    searchInput.value = "";
  }

  updateURL("");

  hideElement(loading);
  hideElement(noResults);
  hideElement(loadMoreButton);

  if (results) {
    results.innerHTML = "";
    hideElement(results);
  }

  updateResultCount(0);

}


/* =========================================================
   INPUT
========================================================= */

if (searchInput) {

  searchInput.addEventListener(
    "input",
    () => {

      const value =
        searchInput.value.trim();

      if (clearButton) {

        if (value) {
          showElement(clearButton);
        } else {
          hideElement(clearButton);
        }

      }

      showSuggestions(
        value
      );

    }
  );


  searchInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter"
      ) {

        event.preventDefault();

        const query =
          searchInput.value.trim();

        if (query) {

          performSearch(
            query
          );

        }

      }

    }
  );

}


/* =========================================================
   SEARCH BUTTON
========================================================= */

if (searchButton) {

  searchButton.addEventListener(
    "click",
    () => {

      const query =
        searchInput
          ? searchInput.value.trim()
          : "";

      if (query) {

        performSearch(
          query
        );

      }

    }
  );

}


/* =========================================================
   CLEAR BUTTON
========================================================= */

if (clearButton) {

  clearButton.addEventListener(
    "click",
    clearSearchResults
  );

}


/* =========================================================
   LOAD MORE BUTTON
========================================================= */

if (loadMoreButton) {

  loadMoreButton.addEventListener(
    "click",
    loadMore
  );

}


/* =========================================================
   CATEGORY FILTER
========================================================= */

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "[data-search-category]"
      );

    if (!button) {
      return;
    }

    currentCategory =
      button.dataset.searchCategory ||
      "all";

    document
      .querySelectorAll(
        "[data-search-category]"
      )
      .forEach(item => {

        item.classList.remove(
          "active"
        );

      });

    button.classList.add(
      "active"
    );

    if (currentQuery) {

      performSearch(
        currentQuery
      );

    }

  }
);


/* =========================================================
   TYPE FILTER
========================================================= */

document.addEventListener(
  "click",
  event => {

    const button =
      event.target.closest(
        "[data-search-type]"
      );

    if (!button) {
      return;
    }

    currentType =
      button.dataset.searchType ||
      "all";

    document
      .querySelectorAll(
        "[data-search-type]"
      )
      .forEach(item => {

        item.classList.remove(
          "active"
        );

      });

    button.classList.add(
      "active"
    );

    if (currentQuery) {

      performSearch(
        currentQuery
      );

    }

  }
);


/* =========================================================
   RESULT ACTIONS
========================================================= */

document.addEventListener(
  "click",
  async event => {

    const saveButton =
      event.target.closest(
        ".save-result"
      );

    if (saveButton) {

      await saveResult(
        saveButton.dataset.id,
        saveButton.dataset.collection
      );

      return;
    }

    const shareButton =
      event.target.closest(
        ".share-result"
      );

    if (shareButton) {

      await shareResult(
        shareButton.dataset.url,
        shareButton.dataset.title
      );

    }

  }
);


/* =========================================================
   SAVE RESULT
========================================================= */

async function saveResult(
  documentId,
  collection
) {

  if (!documentId) {
    return;
  }

  const saved =
    JSON.parse(
      localStorage.getItem(
        "letsstudy_saved_results"
      ) || "[]"
    );

  const exists =
    saved.some(
      item =>
        item.documentId === documentId &&
        item.collection === collection
    );

  if (!exists) {

    saved.push({

      documentId,
      collection,

      savedAt:
        new Date().toISOString()

    });

    localStorage.setItem(
      "letsstudy_saved_results",
      JSON.stringify(saved)
    );

  }

}


/* =========================================================
   SHARE RESULT
========================================================= */

async function shareResult(
  url,
  title
) {

  if (!url || url === "#") {
    return;
  }

  const absoluteURL =
    new URL(
      url,
      window.location.origin
    ).href;

  if (
    navigator.share
  ) {

    try {

      await navigator.share({

        title:
          title ||
          "LetsStudy Pro",

        url:
          absoluteURL

      });

      return;

    } catch (error) {

      if (
        error.name ===
        "AbortError"
      ) {

        return;

      }

    }

  }

  try {

    await navigator.clipboard.writeText(
      absoluteURL
    );

    alert(
      "Link copied."
    );

  } catch (error) {

    window.prompt(
      "Copy this link:",
      absoluteURL
    );

  }

}


/* =========================================================
   RECENT SEARCHES
========================================================= */

function saveRecentSearch(query) {

  query =
    String(query || "")
      .trim();

  if (!query) {
    return;
  }

  let history =
    JSON.parse(
      localStorage.getItem(
        "letsstudy_search_history"
      ) || "[]"
    );

  history =
    history.filter(
      item =>
        normalize(item) !==
        normalize(query)
    );

  history.unshift(
    query
  );

  history =
    history.slice(
      0,
      10
    );

  localStorage.setItem(
    "letsstudy_search_history",
    JSON.stringify(history)
  );

}


/* =========================================================
   SUGGESTIONS
========================================================= */

function showSuggestions(query) {

  if (!suggestions) {
    return;
  }

  query =
    String(query || "")
      .trim();

  if (!query) {

    suggestions.innerHTML = "";

    suggestions.classList.add(
      "hidden"
    );

    return;

  }

  const history =
    JSON.parse(
      localStorage.getItem(
        "letsstudy_search_history"
      ) || "[]"
    );

  const matches =
    history.filter(
      item =>
        normalize(item)
          .includes(
            normalize(query)
          )
    );

  if (!matches.length) {

    suggestions.innerHTML = "";

    suggestions.classList.add(
      "hidden"
    );

    return;

  }

  suggestions.innerHTML =
    matches
      .slice(0, 6)
      .map(
        item => `
          <button
            type="button"
            class="search-suggestion"
            data-query="${escapeHTML(item)}"
          >
            🔎 ${escapeHTML(item)}
          </button>
        `
      )
      .join("");

  if (
    suggestions.children.length
  ) {

    suggestions.classList.remove(
      "hidden"
    );

  }

}


/* =========================================================
   SUGGESTION CLICK
========================================================= */

/* =========================================================
   SUGGESTION CLICK
========================================================= */

document.addEventListener(
  "click",
  event => {

    const suggestion =
      event.target.closest(
        ".search-suggestion"
      );

    if (!suggestion) {
      return;
    }

    const query =
      suggestion.dataset.query ||
      suggestion.textContent
        .replace(/^🔎\s*/, "")
        .trim();

    if (!query) {
      return;
    }

    if (searchInput) {
      searchInput.value = query;
    }

    if (clearButton) {
      clearButton.classList.remove("hidden");
    }

    if (suggestions) {
      suggestions.innerHTML = "";
      suggestions.classList.add("hidden");
    }

    performSearch(query);

  }
);


/* =========================================================
   CLOSE SUGGESTIONS WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
  "click",
  event => {

    if (!suggestions || !searchInput) {
      return;
    }

    if (
      !suggestions.contains(event.target) &&
      event.target !== searchInput
    ) {

      suggestions.classList.add(
        "hidden"
      );

    }

  }
);


/* =========================================================
   VOICE SEARCH
========================================================= */

if (voiceButton) {

  voiceButton.addEventListener(
    "click",
    startVoiceSearch
  );

}


function startVoiceSearch() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {

    alert(
      "Voice search is not supported in this browser."
    );

    return;
  }

  const recognition =
    new SpeechRecognition();

  recognition.lang =
    document.documentElement.lang ||
    "en-US";

  recognition.interimResults = false;

  recognition.continuous = false;

  recognition.maxAlternatives = 1;


  recognition.onstart = () => {

    if (voiceButton) {

      voiceButton.classList.add(
        "listening"
      );

      voiceButton.setAttribute(
        "aria-label",
        "Listening..."
      );

    }

  };


  recognition.onresult = event => {

    const transcript =
      event.results?.[0]?.[0]?.transcript
        ?.trim();

    if (!transcript) {
      return;
    }

    if (searchInput) {

      searchInput.value =
        transcript;

    }

    if (clearButton) {

      clearButton.classList.remove(
        "hidden"
      );

    }

    performSearch(
      transcript
    );

  };


  recognition.onerror = event => {

    console.error(
      "Voice search error:",
      event.error
    );

  };


  recognition.onend = () => {

    if (voiceButton) {

      voiceButton.classList.remove(
        "listening"
      );

      voiceButton.setAttribute(
        "aria-label",
        "Voice search"
      );

    }

  };


  try {

    recognition.start();

  } catch (error) {

    console.error(
      "Unable to start voice search:",
      error
    );

  }

}


/* =========================================================
   KEYBOARD SHORTCUT
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    /*
     Ctrl + K
     or
     /
    */

    if (
      (
        event.ctrlKey ||
        event.metaKey
      ) &&
      event.key.toLowerCase() === "k"
    ) {

      event.preventDefault();

      searchInput?.focus();

      return;
    }


    if (
      event.key === "/" &&
      document.activeElement !== searchInput &&
      !["INPUT", "TEXTAREA"].includes(
        document.activeElement?.tagName
      )
    ) {

      event.preventDefault();

      searchInput?.focus();

    }

  }
);


/* =========================================================
   CLEAR SEARCH
========================================================= */

if (clearButton) {

  clearButton.addEventListener(
    "click",
    () => {

      if (searchInput) {
        searchInput.value = "";
      }

      currentQuery = "";

      currentPage = 1;

      updateURL("");

      if (results) {

        results.innerHTML = "";

        results.classList.add(
          "hidden"
        );

      }

      if (noResults) {

        noResults.classList.add(
          "hidden"
        );

      }

      if (loading) {

        loading.classList.add(
          "hidden"
        );

      }

      if (loadMoreButton) {

        loadMoreButton.classList.add(
          "hidden"
        );

      }

      if (suggestions) {

        suggestions.innerHTML = "";

        suggestions.classList.add(
          "hidden"
        );

      }

      if (resultCount) {

        resultCount.textContent =
          "";

      }

      clearButton.classList.add(
        "hidden"
      );

      searchInput?.focus();

    }
  );

}


/* =========================================================
   SEARCH FORM
========================================================= */

const searchForm =
  document.getElementById(
    "searchForm"
  );

if (searchForm) {

  searchForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const query =
        searchInput
          ?.value
          ?.trim() ||
        "";

      if (!query) {
        return;
      }

      performSearch(
        query
      );

    }
  );

}


/* =========================================================
   LOAD MORE
========================================================= */

if (loadMoreButton) {

  loadMoreButton.addEventListener(
    "click",
    async () => {

      if (
        !currentQuery ||
        isSearching
      ) {

        return;

      }

      await loadMore();

    }
  );

}


/* =========================================================
   FILTER BUTTONS
========================================================= */

document.addEventListener(
  "click",
  event => {

    const categoryButton =
      event.target.closest(
        "[data-search-category]"
      );

    if (categoryButton) {

      currentCategory =
        categoryButton.dataset.searchCategory ||
        "all";

      document
        .querySelectorAll(
          "[data-search-category]"
        )
        .forEach(button => {

          button.classList.remove(
            "active"
          );

        });

      categoryButton.classList.add(
        "active"
      );

      if (currentQuery) {

        currentPage = 1;

        performSearch(
          currentQuery
        );

      }

      return;
    }


    const typeButton =
      event.target.closest(
        "[data-search-type]"
      );

    if (typeButton) {

      currentType =
        typeButton.dataset.searchType ||
        "all";

      document
        .querySelectorAll(
          "[data-search-type]"
        )
        .forEach(button => {

          button.classList.remove(
            "active"
          );

        });

      typeButton.classList.add(
        "active"
      );

      if (currentQuery) {

        currentPage = 1;

        performSearch(
          currentQuery
        );

      }

    }

  }
);


/* =========================================================
   SAVE RESULT
========================================================= */

document.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        ".save-result"
      );

    if (!button) {
      return;
    }

    const documentId =
      button.dataset.id;

    const collection =
      button.dataset.collection;

    if (!documentId) {
      return;
    }

    try {

      let saved =
        JSON.parse(
          localStorage.getItem(
            "letsstudy_saved_results"
          ) || "[]"
        );

      const exists =
        saved.some(
          item =>
            item.documentId === documentId &&
            item.collection === collection
        );


      if (exists) {

        saved =
          saved.filter(
            item =>
              !(
                item.documentId === documentId &&
                item.collection === collection
              )
          );

        button.textContent =
          "Save";

      } else {

        saved.push({

          documentId,
          collection,

          savedAt:
            new Date().toISOString()

        });

        button.textContent =
          "Saved ✓";

      }


      localStorage.setItem(
        "letsstudy_saved_results",
        JSON.stringify(saved)
      );

    } catch (error) {

      console.error(
        "Save result error:",
        error
      );

    }

  }
);


/* =========================================================
   SHARE RESULT
========================================================= */

document.addEventListener(
  "click",
  async event => {

    const button =
      event.target.closest(
        ".share-result"
      );

    if (!button) {
      return;
    }

    const url =
      button.dataset.url;

    const title =
      button.dataset.title ||
      "LetsStudy Pro";

    if (!url || url === "#") {
      return;
    }

    const absoluteURL =
      new URL(
        url,
        window.location.origin
      ).href;


    if (
      navigator.share
    ) {

      try {

        await navigator.share({

          title,

          url:
            absoluteURL

        });

        return;

      } catch (error) {

        if (
          error.name ===
          "AbortError"
        ) {

          return;

        }

      }

    }


    try {

      await navigator.clipboard.writeText(
        absoluteURL
      );

      button.textContent =
        "Copied ✓";

      setTimeout(
        () => {

          button.textContent =
            "Share";

        },
        1500
      );

    } catch (error) {

      window.prompt(
        "Copy this link:",
        absoluteURL
      );

    }

  }
);


/* =========================================================
   RECENT SEARCH HISTORY
========================================================= */

function saveRecentSearch(query) {

  query =
    String(query || "")
      .trim();

  if (!query) {
    return;
  }

  let history = [];

  try {

    history =
      JSON.parse(
        localStorage.getItem(
          "letsstudy_search_history"
        ) || "[]"
      );

  } catch {

    history = [];

  }


  history =
    history.filter(
      item =>
        normalize(item) !==
        normalize(query)
    );


  history.unshift(
    query
  );


  history =
    history.slice(
      0,
      10
    );


  localStorage.setItem(
    "letsstudy_search_history",
    JSON.stringify(history)
  );

}


/* =========================================================
   SHOW SEARCH SUGGESTIONS
========================================================= */

function showSuggestions(query) {

  if (!suggestions) {
    return;
  }

  query =
    String(query || "")
      .trim();


  if (!query) {

    suggestions.innerHTML = "";

    suggestions.classList.add(
      "hidden"
    );

    return;

  }


  let history = [];

  try {

    history =
      JSON.parse(
        localStorage.getItem(
          "letsstudy_search_history"
        ) || "[]"
      );

  } catch {

    history = [];

  }


  const matches =
    history.filter(
      item =>
        normalize(item)
          .includes(
            normalize(query)
          )
    );


  if (!matches.length) {

    suggestions.innerHTML = "";

    suggestions.classList.add(
      "hidden"
    );

    return;

  }


  suggestions.innerHTML =
    matches
      .slice(0, 6)
      .map(
        item => `
          <button
            type="button"
            class="search-suggestion"
            data-query="${escapeHTML(item)}"
          >
            🔎
            ${escapeHTML(item)}
          </button>
        `
      )
      .join("");


  suggestions.classList.remove(
    "hidden"
  );

}


/* =========================================================
   INPUT SUGGESTIONS
========================================================= */

if (searchInput) {

  searchInput.addEventListener(
    "input",
    () => {

      const query =
        searchInput.value.trim();

      if (clearButton) {

        if (query) {

          clearButton.classList.remove(
            "hidden"
          );

        } else {

          clearButton.classList.add(
            "hidden"
          );

        }

      }

      showSuggestions(
        query
      );

    }
  );

}


/* =========================================================
   URL QUERY SUPPORT
========================================================= */

function getInitialQuery() {

  const params =
    new URLSearchParams(
      window.location.search
    );

  return (
    params.get("q") ||
    params.get("query") ||
    ""
  ).trim();

}


/* =========================================================
   UPDATE URL
========================================================= */

function updateURL(query) {

  const url =
    new URL(
      window.location.href
    );

  if (query) {

    url.searchParams.set(
      "q",
      query
    );

  } else {

    url.searchParams.delete(
      "q"
    );

  }

  window.history.replaceState(
    {},
    "",
    url
  );

}


/* =========================================================
   INITIALIZE SEARCH PAGE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const initialQuery =
      getInitialQuery();


    if (
      initialQuery &&
      searchInput
    ) {

      searchInput.value =
        initialQuery;


      if (clearButton) {

        clearButton.classList.remove(
          "hidden"
        );

      }


      performSearch(
        initialQuery
      );

    }

  }
);


/* =========================================================
   GLOBAL LETSSTUDY SEARCH API
========================================================= */

window.LetsStudySearch = {

  search(query) {

    return performSearch(
      query
    );

  },

  clear() {

    clearSearchResults();

  },

  retry() {

    retrySearch();

  },

  loadMore() {

    return loadMore();

  },

  save(
    documentId,
    collection
  ) {

    return saveResult(
      documentId,
      collection
    );

  },

  share(
    url,
    title
  ) {

    return shareResult(
      url,
      title
    );

  }

};


/* =========================================================
   SEARCH PAGE READY
========================================================= */

console.log(
  "LetsStudy Pro Search initialized successfully."
);