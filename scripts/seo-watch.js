const fs = require("fs");

const SITE_URL = process.env.SITE_URL || "https://letsstudy.pro";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";

const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

const report = {
  site: SITE_URL,
  checkedAt: new Date().toISOString(),
  sitemap: SITEMAP_URL,
  urlsFound: 0,
  urlsChecked: 0,
  healthy: 0,
  redirects: 0,
  errors: 0,
  indexNowSubmitted: 0,
  brokenUrls: [],
  redirectsList: [],
  submittedUrls: []
};

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent": "LetsStudyPro-SEO-Bot/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return await response.text();
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*(.*?)\s*<\/loc>/g)]
    .map(match => match[1].trim())
    .filter(Boolean);
}

async function getSitemapUrls(sitemapUrl, visited = new Set()) {
  if (visited.has(sitemapUrl)) return [];

  visited.add(sitemapUrl);

  try {
    const xml = await fetchText(sitemapUrl);
    const locs = extractLocs(xml);

    const sitemapChildren = locs.filter(
      url =>
        url.endsWith(".xml") ||
        url.includes("sitemap")
    );

    const pageUrls = locs.filter(
      url =>
        !url.endsWith(".xml") &&
        !url.includes("sitemap")
    );

    let results = [...pageUrls];

    for (const child of sitemapChildren) {
      const childUrls = await getSitemapUrls(child, visited);
      results.push(...childUrls);
    }

    return [...new Set(results)];
  } catch (error) {
    console.error(`Sitemap error: ${sitemapUrl}`);
    console.error(error.message);
    return [];
  }
}

async function checkUrl(url) {
  try {
    const start = Date.now();

    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent": "LetsStudyPro-SEO-Bot/1.0"
      }
    });

    const elapsed = Date.now() - start;

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");

      report.redirects++;

      report.redirectsList.push({
        url,
        status: response.status,
        location,
        responseTimeMs: elapsed
      });

      return;
    }

    if (response.status >= 200 && response.status < 300) {
      report.healthy++;

      console.log(`OK ${response.status} ${url} ${elapsed}ms`);
      return;
    }

    report.errors++;

    report.brokenUrls.push({
      url,
      status: response.status,
      responseTimeMs: elapsed
    });

    console.log(`ERROR ${response.status} ${url}`);
  } catch (error) {
    report.errors++;

    report.brokenUrls.push({
      url,
      error: error.message
    });

    console.log(`ERROR ${url}: ${error.message}`);
  }
}

async function submitIndexNow(urls) {
  if (!INDEXNOW_KEY) {
    console.log("INDEXNOW_KEY not configured.");
    return;
  }

  if (!urls.length) {
    console.log("No URLs to submit to IndexNow.");
    return;
  }

  const chunks = [];

  for (let i = 0; i < urls.length; i += 10000) {
    chunks.push(urls.slice(i, i + 10000));
  }

  for (const chunk of chunks) {
    const body = {
      host: new URL(SITE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: chunk
    };

    try {
      const response = await fetch(
        "https://api.indexnow.org/indexnow",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          },
          body: JSON.stringify(body)
        }
      );

      console.log(
        `IndexNow response: ${response.status}`
      );

      if (response.ok) {
        report.indexNowSubmitted += chunk.length;
        report.submittedUrls.push(...chunk);
      }
    } catch (error) {
      console.error(
        `IndexNow error: ${error.message}`
      );
    }
  }
}

async function main() {
  console.log("======================================");
  console.log("LetsStudy Pro SEO Watcher");
  console.log("======================================");

  console.log(`Site: ${SITE_URL}`);
  console.log(`Sitemap: ${SITEMAP_URL}`);

  const urls = await getSitemapUrls(SITEMAP_URL);

  report.urlsFound = urls.length;

  console.log(`URLs found: ${urls.length}`);

  if (!urls.length) {
    console.error(
      "No URLs found. Check sitemap.xml."
    );

    process.exitCode = 1;
    return;
  }

  /*
   * Check every URL.
   *
   * For very large sites you can change this
   * to a smaller batch.
   */
  for (const url of urls) {
    report.urlsChecked++;
    await checkUrl(url);
  }

  /*
   * Submit healthy URLs to IndexNow.
   *
   * IndexNow is intended for URLs that are
   * added, updated or deleted.
   */
  const healthyUrls = urls.filter(
    url =>
      !report.brokenUrls.some(item => item.url === url)
  );

  await submitIndexNow(healthyUrls);

  fs.writeFileSync(
    "seo-report.json",
    JSON.stringify(report, null, 2)
  );

  console.log("");
  console.log("======================================");
  console.log("SEO SUMMARY");
  console.log("======================================");
  console.log(`URLs found: ${report.urlsFound}`);
  console.log(`URLs checked: ${report.urlsChecked}`);
  console.log(`Healthy: ${report.healthy}`);
  console.log(`Redirects: ${report.redirects}`);
  console.log(`Errors: ${report.errors}`);
  console.log(
    `IndexNow submitted: ${report.indexNowSubmitted}`
  );

  if (report.errors > 0) {
    console.log("");
    console.log("Broken URLs:");

    for (const item of report.brokenUrls.slice(0, 50)) {
      console.log(
        `${item.status || "ERROR"} ${item.url}`
      );
    }
  }

  console.log("======================================");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});