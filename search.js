const searchInput =
  document.getElementById(
    "siteSearch"
  );

const searchBtn =
  document.getElementById(
    "searchBtn"
  );

const searchResults =
  document.getElementById(
    "searchResults"
  );


const searchablePages = [

  {
    title:
      "Online Courses",

    description:
      "Learn through online courses and educational resources.",

    url:
      "courses.html"
  },

  {
    title:
      "Scholarships",

    description:
      "Discover scholarships and study opportunities.",

    url:
      "scholarships.html"
  },

  {
    title:
      "Career",

    description:
      "Explore careers, skills and professional opportunities.",

    url:
      "career.html"
  },

  {
    title:
      "Marketplace",

    description:
      "Discover educational products and services.",

    url:
      "marketplace.html"
  },

  {
    title:
      "Community",

    description:
      "Join discussions and connect with other learners.",

    url:
      "community.html"
  },

  {
    title:
      "Premium",

    description:
      "Access LetsStudy Pro Premium learning features.",

    url:
      "premium.html"
  }

];


function performSearch(){

  const query =
    searchInput.value
      .trim()
      .toLowerCase();


  if(!query){

    searchResults.innerHTML = `
      <p>
        Enter something to search.
      </p>
    `;

    return;

  }


  const results =
    searchablePages.filter(
      page => {

        const text =
          (
            page.title +
            " " +
            page.description
          ).toLowerCase();

        return text.includes(
          query
        );

      }
    );


  if(!results.length){

    searchResults.innerHTML = `
      <div class="no-results">
        <h3>
          No results found
        </h3>

        <p>
          Try another search term.
        </p>
      </div>
    `;

    return;

  }


  searchResults.innerHTML =
    results
      .map(
        page => `

          <article
            class="search-result"
          >

            <h3>
              <a href="${page.url}">
                ${page.title}
              </a>
            </h3>

            <p>
              ${page.description}
            </p>

          </article>

        `
      )
      .join("");

}


searchBtn?.addEventListener(
  "click",
  performSearch
);


searchInput?.addEventListener(
  "keydown",
  event => {

    if(
      event.key === "Enter"
    ){

      performSearch();

    }

  }
);