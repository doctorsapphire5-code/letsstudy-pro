!/usr/bin/env node
/**
 * LetsStudy Pro - IndexNow submitter
 * Node.js 20+ (uses built-in fetch)
 *
 * Usage:
 *   node scripts/indexnow-submit.js --urls https://letsstudy.pro/a.html,https://letsstudy.pro/b.html
 *   node scripts/indexnow-submit.js --file changed-urls.txt
 *   node scripts/indexnow-submit.js --sitemap https://letsstudy.pro/sitemap.xml
 *
 * Environment:
 *   INDEXNOW_KEY (optional; defaults to the public key file value)
 *   INDEXNOW_HOST (optional; defaults to letsstudy.pro)
 */

const fs = require("fs");
const path = require("path");

const HOST = process.env.INDEXNOW_HOST || "letsstudy.pro";
const KEY =
  process.env.INDEXNOW_KEY ||
  fs.readFileSync(
    path.join(__dirname, "..", "a75ed703511a493da02d2bfeb893824f.txt"),
    "utf8"
  ).trim();

const API = "https://api.indexnow.org/indexnow";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const MAX_BATCH = 10000;

function usage() {
  console.log(`
LetsStudy Pro IndexNow

Options:
  --urls URL1,URL2,...       Submit comma-separated URLs
  --file FILE                Submit URLs from a text file (one per line)
  --sitemap URL               Read URLs from a sitemap XML
  --all-sitemap URL           Alias of --sitemap
  --help                      Show this help

Examples:
  node scripts/indexnow-submit.js --urls https://letsstudy.pro/,https://letsstudy.pro/courses.html
  node scripts/indexnow-submit.js --file changed-urls.txt
  node scripts/indexnow-submit.js --sitemap https://letsstudy.pro/sitemap.xml
`);
}

function uniqueValidUrls(urls) {
  const seen = new Set();
  const result = [];

  for (const raw of urls) {
    const value = String(raw || "").trim();
    if (!value || value.startsWith("#")) continue;

    try {
      const u = new URL(value);
      if (u.protocol !== "https:") continue;
      if (u.hostname !== HOST) continue;
      if (!seen.has(u.href)) {
        seen.add(u.href);
        result.push(u.href);
      }
    } catch {
      // Ignore invalid lines.
    }
  }

  return result;
}

async function readSitemap(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Sitemap request failed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const matches = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)];
  return matches.map((m) => m[1].trim());
}

async function submitBatch(urls) {
  const body = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls,
  };

  const response = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`IndexNow ${response.status}: ${text || response.statusText}`);
  }

  console.log(`IndexNow: submitted ${urls.length} URL(s) — HTTP ${response.status}`);
  if (text) console.log(text);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    usage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  let urls = [];

  const urlsIndex = args.indexOf("--urls");
  if (urlsIndex !== -1 && args[urlsIndex + 1]) {
    urls.push(...args[urlsIndex + 1].split(","));
  }

  const fileIndex = args.indexOf("--file");
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    const content = fs.readFileSync(args[fileIndex + 1], "utf8");
    urls.push(...content.split(/\r?\n/));
  }

  const sitemapIndex = args.indexOf("--sitemap") !== -1
    ? args.indexOf("--sitemap")
    : args.indexOf("--all-sitemap");

  if (sitemapIndex !== -1 && args[sitemapIndex + 1]) {
    urls.push(...await readSitemap(args[sitemapIndex + 1]));
  }

  urls = uniqueValidUrls(urls);

  if (!urls.length) {
    throw new Error("No valid https://letsstudy.pro URLs were found.");
  }

  console.log(`Preparing ${urls.length} unique URL(s)...`);

  for (let i = 0; i < urls.length; i += MAX_BATCH) {
    await submitBatch(urls.slice(i, i + MAX_BATCH));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});