"use strict";

/*
=========================================================
LETSSTUDY PRO SEARCH
=========================================================
*/

const form =
  document.getElementById("searchForm");

const input =
  document.getElementById("searchInput");

const results =
  document.getElementById("searchResults");

const loading =
  document.getElementById("searchLoading");

const empty =
  document.getElementById("searchEmpty");

const errorBox =
  document.getElementById("searchError");

const title =
  document.getElementById("searchTitle");

const summary =
  document.getElementById("searchSummary");


/*
=========================================================
ESCAPE NOT REQUIRED
=========================================================

We use textContent instead of innerHTML for Firebase data.
=========================================================
*/


function clearStates() {

  loading.style.display = "none";

  empty.style.display = "none";

  errorBox.style.display = "none";

}


function showLoading() {

  clearStates();

  results.innerHTML = "";

  loading.style.display = "block";

}


function showEmpty() {

  clearStates();

  results.innerHTML = "";

  empty.style.display = "block";

}


function showError(message) {

  clearStates();

  results.innerHTML = "";

  errorBox.textContent =
    message ||
    "Unable to complete your search.";

  errorBox.style.display = "block";

}


/*
=========================================================
SEARCH API
=========================================================
*/

async function performSearch(query) {

  const cleanQuery =
    String(query || "").trim();


  if (!cleanQuery) {

    title.textContent =
      "Search LetsStudy Pro";

    summary.textContent =
      "Find courses, resources, careers, scholarships and more.";

    clearStates();

    results.innerHTML = "";

    return;

  }


  showLoading();


  title.textContent =
    `Search results for "${cleanQuery}"`;


  try {

    const response =
      await fetch(
        `/api/search?q=${encodeURIComponent(cleanQuery)}`,
        {
          method: "GET",
          headers: {
            "Accept": "application/json"
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        `Search API returned ${response.status}`
      );

    }


    const data =
      await response.json();


    /*
     API should return:

     {
       success: true,
       results: [...]
     }
    */

    const items =
      Array.isArray(data.results)
        ? data.results
        : [];


    clearStates();


    /*
     Dynamic count.
    */

    const count =
      typeof data.total === "number"
        ? data.total
        : items.length;


    summary.textContent =
      `${count} result${count === 1 ? "" : "s"} found`;


    if (items.length === 0) {

      showEmpty();

      return;

    }


    renderResults(items);


  } catch (error) {

    console.error(
      "LetsStudy Pro Search Error:",
      error
    );


    showError(
      "Search is temporarily unavailable. Please try again."
    );

  }

}


/*
=========================================================
RENDER RESULTS
=========================================================
*/

function renderResults(items) {

  results.innerHTML = "";


  items.forEach(item => {

    const link =
      document.createElement("a");

    link.className =
      "search-result";


    /*
     URL comes from Firebase/Search API.
    */

    link.href =
      item.url || "#";


    const image =
      document.createElement("img");

    image.className =
      "search-result-image";

    image.src =
      item.image ||
      "/assets/images/og-default.jpg";

    image.alt =
      item.title || "LetsStudy Pro";

    image.loading =
      "lazy";


    const content =
      document.createElement("div");

    content.className =
      "search-result-content";


    const type =
      document.createElement("span");

    type.className =
      "search-result-type";

    type.textContent =
      item.type ||
      item.collection ||
      "Content";


    const itemTitle =
      document.createElement("h2");

    itemTitle.className =
      "search-result-title";

    itemTitle.textContent =
      item.title ||
      item.documentId ||
      "Untitled";


    const description =
      document.createElement("p");

    description.className =
      "search-result-description";

    description.textContent =
      item.description ||
      "";


    const meta =
      document.createElement("div");

    meta.className =
      "search-result-meta";

    meta.textContent =
      item.category ||
      item.collection ||
      "";


    content.appendChild(type);

    content.appendChild(itemTitle);

    content.appendChild(description);

    content.appendChild(meta);


    link.appendChild(image);

    link.appendChild(content);


    results.appendChild(link);

  });

}


/*
=========================================================
FORM
=========================================================
*/

form.addEventListener(
  "submit",
  event => {

    event.preventDefault();


    const query =
      input.value.trim();


    if (!query) {

      input.focus();

      return;

    }


    const url =
      new URL(
        window.location.href
      );


    url.searchParams.set(
      "q",
      query
    );


    window.history.pushState(
      {},
      "",
      url
    );


    performSearch(query);

  }
);


/*
=========================================================
INITIAL SEARCH
=========================================================
*/

const params =
  new URLSearchParams(
    window.location.search
  );


const initialQuery =
  params.get("q");


if (initialQuery) {

  input.value =
    initialQuery;

  performSearch(
    initialQuery
  );

}