"use strict";

const fs = require("fs");
const path = require("path");

const SITE_URL = (
  process.env.SITE_URL || "https://letsstudy.pro"
).replace(/\/+$/, "");

const REPORT_DIR = path.join(process.cwd(), "reports");
const REPORT_FILE = path.join(
  REPORT_DIR,
  "global-indexing-report.json"
);

const USER_AGENT =
  "LetsStudy-Pro-Global-Indexing-Monitor/1.0";

function now() {
  return new Date().toISOString();
}

function createEngineResult(name, status, extra = {}) {
  return {
    engine: name,
    status,
    indexedPages:
      extra.indexedPages !== undefined
        ? extra.indexedPages
        : null,
    submittedPages:
      extra.submittedPages !== undefined
        ? extra.submittedPages
        : null,
    message: extra.message || "",
    checkedAt: now()
  };
}

async function checkUrl(url) {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 20000);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "*/*"
      }
    });

    return {
      url,
      status: response.status,
      ok: response.ok,
      finalUrl: response.url,
      contentType:
        response.headers.get("content-type") || null
    };
  } catch (error) {
    return {
      url,
      status: 0,
      ok: false,
      finalUrl: null,
      contentType: null,
      error: error.message
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkSitemap(url) {
  const result = await checkUrl(url);

  return {
    ...result,
    available: result.ok
  };
}

function getSearchEngineStatus() {
  return {
    Google: createEngineResult(
      "Google",
      process.env.GOOGLE_SERVICE_ACCOUNT_JSON
        ? "configured"
        : "api_credentials_required",
      {
        message:
          "Google Search Console API will provide official indexing data when configured."
      }
    ),

    Bing: createEngineResult(
      "Bing",
      process.env.BING_API_KEY
        ? "configured"
        : "api_credentials_required",
      {
        message:
          "Bing Webmaster API will provide data when configured."
      }
    ),

    Yandex: createEngineResult(
      "Yandex",
      process.env.YANDEX_API_KEY
        ? "configured"
        : "api_credentials_required",
      {
        message:
          "Yandex Webmaster API credentials are required for official data."
      }
    ),

    Naver: createEngineResult(
      "Naver",
      process.env.NAVER_API_KEY
        ? "configured"
        : "api_credentials_required",
      {
        message:
          "Naver Search Advisor/API credentials are required."
      }
    ),

    Baidu: createEngineResult(
      "Baidu",
      process.env.BAIDU_API_KEY
        ? "configured"
        : "api_credentials_required",
      {
        message:
          "Baidu Webmaster credentials are required."
      }
    ),

    Seznam: createEngineResult(
      "Seznam",
      "no_public_count_api",
      {
        message:
          "No configured official indexed-page count API."
      }
    ),

    DuckDuckGo: createEngineResult(
      "DuckDuckGo",
      "no_public_count_api",
      {
        message:
          "No public official indexed-page count API."
      }
    ),

    Yahoo: createEngineResult(
      "Yahoo",
      "bing_dependency",
      {
        message:
          "Yahoo search results are primarily dependent on Bing."
      }
    ),

    Brave: createEngineResult(
      "Brave",
      "no_public_count_api",
      {
        message:
          "No configured public indexed-page count API."
      }
    ),

    Ecosia: createEngineResult(
      "Ecosia",
      "no_direct_count_api",
      {
        message:
          "No direct public indexed-page count API configured."
      }
    ),

    Mojeek: createEngineResult(
      "Mojeek",
      "engine_specific",
      {
        message:
          "Engine-specific indexing data required."
      }
    )
  };
}

async function main() {
  console.log("");
  console.log("==============================================");
  console.log(" LETSSTUDY PRO GLOBAL INDEXING MONITOR");
  console.log("==============================================");
  console.log(`Website: ${SITE_URL}`);
  console.log(`Started: ${now()}`);
  console.log("");

  fs.mkdirSync(REPORT_DIR, {
    recursive: true
  });

  const urls = {
    homepage: `${SITE_URL}/`,
    robots: `${SITE_URL}/robots.txt`,
    sitemap: `${SITE_URL}/sitemap.xml`,
    pagesSitemap:
      `${SITE_URL}/sitemap-pages-1.xml`,
    firestoreSitemap:
      `${SITE_URL}/sitemap-firestore-1.xml`
  };

  console.log("Checking website resources...");

  const website = {};

  for (const [name, url] of Object.entries(urls)) {
    console.log(`Checking ${name}: ${url}`);

    website[name] = await checkSitemap(url);
  }

  console.log("");
  console.log("Checking search engines...");

  const searchEngines = getSearchEngineStatus();

  for (const [name, data] of Object.entries(
    searchEngines
  )) {
    console.log(
      `${name}: ${data.status}`
    );
  }

  const availableSitemaps = Object.values(
    website
  ).filter((item) => item.available).length;

  const failedChecks = Object.values(
    website
  ).filter((item) => !item.available).length;

  const report = {
    project: "LetsStudy Pro",

    website: SITE_URL,

    monitor: {
      name:
        "LetsStudy Pro - Global Search Engine Indexing Monitor",
      version: "1.0.0"
    },

    checkedAt: now(),

    summary: {
      searchEnginesChecked:
        Object.keys(searchEngines).length,

      websiteResourcesChecked:
        Object.keys(website).length,

      availableResources:
        availableSitemaps,

      failedResources:
        failedChecks,

      note:
        "Indexed-page numbers are only reported when obtained from an official search-engine API or webmaster source. No numbers are invented."
    },

    searchEngines,

    website,

    sitemaps: {
      main:
        `${SITE_URL}/sitemap.xml`,

      pages:
        `${SITE_URL}/sitemap-pages-1.xml`,

      firestore:
        `${SITE_URL}/sitemap-firestore-1.xml`
    },

    environment: {
      nodeVersion: process.version,
      platform: process.platform
    },

    errors: []
  };

  if (failedChecks > 0) {
    for (const [name, result] of Object.entries(
      website
    )) {
      if (!result.available) {
        report.errors.push({
          type: "website_resource",
          resource: name,
          url: result.url,
          status: result.status,
          error: result.error || null
        });
      }
    }
  }

  fs.writeFileSync(
    REPORT_FILE,
    JSON.stringify(report, null, 2),
    "utf8"
  );

  console.log("");
  console.log("==============================================");
  console.log(" GLOBAL INDEXING REPORT CREATED");
  console.log("==============================================");
  console.log(`Report: ${REPORT_FILE}`);
  console.log("");

  console.log(
    `Search engines: ${Object.keys(searchEngines).length}`
  );

  console.log(
    `Website resources: ${Object.keys(website).length}`
  );

  console.log(
    `Available resources: ${availableSitemaps}`
  );

  console.log(
    `Failed resources: ${failedChecks}`
  );

  console.log("");
  console.log(
    "The monitor completed successfully."
  );
}

main().catch((error) => {
  console.error("");
  console.error(
    "GLOBAL INDEXING MONITOR ERROR"
  );
  console.error(error);

  process.exitCode = 1;
});