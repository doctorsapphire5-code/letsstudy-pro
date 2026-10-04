import fs from "fs";
import path from "path";
import * as cheerio from "cheerio";

const ROOT = process.cwd();
const DOMAIN = "https://letsstudy.pro";

const EXCLUDED_DIRS = new Set([
  ".git",
  ".github",
  "node_modules",
  "functions",
  "scripts",
  "admin",
  "private",
  "test",
  "tests"
]);

const EXCLUDED_FILES = new Set([
  "404.html",
  "404.htm",
  "auth-admin.html",
  "login.html"
]);

const NOINDEX_PATTERNS = [
  /auth/i,
  /admin/i,
  /private/i,
  /dashboard/i,
  /checkout/i,
  /cart/i,
  /account/i,
  /profile/i
];

function walk(dir) {
  const results = [];

  for (const entry of fs.readdirSync(dir, {
    withFileTypes: true
  })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...walk(fullPath));
    } else if (
      entry.isFile() &&
      /\.html?$/i.test(entry.name) &&
      !EXCLUDED_FILES.has(entry.name)
    ) {
      results.push(fullPath);
    }
  }

  return results;
}

function cleanText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\s*[\r\n]+\s*/g, " ")
    .trim();
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getUrl(file) {
  let relative = path.relative(ROOT, file).replaceAll("\\", "/");

  if (relative === "index.html") {
    return `${DOMAIN}/`;
  }

  if (relative.endsWith("/index.html")) {
    relative = relative.replace(/\/index\.html$/i, "/");
  } else {
    relative = relative.replace(/\.html?$/i, ".html");
  }

  return `${DOMAIN}/${relative}`;
}

function shouldExcludeFromSitemap($, file) {
  const relative = path
    .relative(ROOT, file)
    .replaceAll("\\", "/");

  if (relative.startsWith(".")) return true;

  const robots = $('meta[name="robots"]')
    .attr("content");

  if (robots && /noindex/i.test(robots)) {
    return true;
  }

  if (
    NOINDEX_PATTERNS.some(pattern =>
      pattern.test(relative)
    )
  ) {
    return true;
  }

  return false;
}

const files = walk(ROOT);

let changedFiles = [];
let fixedFiles = [];
let sitemapUrls = [];

for (const file of files) {
  let original = fs.readFileSync(file, "utf8");

  const $ = cheerio.load(original, {
    decodeEntities: false
  });

  let changed = false;

  // ---------------------------------------------------
  // TITLE
  // Only add if completely missing.
  // Existing title is NEVER overwritten.
  // ---------------------------------------------------
  let title = $("title").first().text().trim();

  if (!title) {
    const h1 = cleanText(
      $("h1").first().text() || ""
    );

    const filename = path
      .basename(file, path.extname(file))
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase());

    let generatedTitle =
      h1 ||
      (filename === "Index"
        ? "LetsStudy Pro - Global Digital Learning & Growth Ecosystem"
        : `${filename} | LetsStudy Pro`);

    $("head").append(
      `\n<title>${escapeHtml(generatedTitle)}</title>\n`
    );

    changed = true;
  }

  // ---------------------------------------------------
  // META DESCRIPTION
  // Only add if missing.
  // Existing descriptions are NEVER overwritten.
  // ---------------------------------------------------
  const description = $('meta[name="description"]');

  if (!description.length) {
    let sourceText = cleanText(
      $("h1, h2, p")
        .slice(0, 8)
        .map((_, el) => $(el).text())
        .get()
        .join(" ")
    );

    sourceText = sourceText
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 155);

    if (!sourceText) {
      sourceText =
        "Learn, build, work and grow with LetsStudy Pro, a global digital learning and growth ecosystem.";
    }

    $("head").append(
      `\n<meta name="description" content="${escapeHtml(sourceText)}">\n`
    );

    changed = true;
  }

  // ---------------------------------------------------
  // CANONICAL
  // Only add if missing.
  // ---------------------------------------------------
  const canonical = $('link[rel="canonical"]');

  if (!canonical.length) {
    $("head").append(
      `\n<link rel="canonical" href="${getUrl(file)}">\n`
    );

    changed = true;
  }

  // ---------------------------------------------------
  // VIEWPORT
  // Only add if missing.
  // ---------------------------------------------------
  if (!$('meta[name="viewport"]').length) {
    $("head").prepend(
      `<meta name="viewport" content="width=device-width, initial-scale=1">\n`
    );

    changed = true;
  }

  // ---------------------------------------------------
  // OG TITLE
  // ---------------------------------------------------
  if (!$('meta[property="og:title"]').length) {
    const pageTitle =
      $("title").first().text().trim() ||
      "LetsStudy Pro";

    $("head").append(
      `\n<meta property="og:title" content="${escapeHtml(pageTitle)}">\n`
    );

    changed = true;
  }

  // ---------------------------------------------------
  // OG URL
  // ---------------------------------------------------
  if (!$('meta[property="og:url"]').length) {
    $("head").append(
      `\n<meta property="og:url" content="${getUrl(file)}">\n`
    );

    changed = true;
  }

  // ---------------------------------------------------
  // OG TYPE
  // ---------------------------------------------------
  if (!$('meta[property="og:type"]').length) {
    $("head").append(
      `\n<meta property="og:type" content="website">\n`
    );

    changed = true;
  }

  // ---------------------------------------------------
  // TWITTER CARD
  // ---------------------------------------------------
  if (!$('meta[name="twitter:card"]').length) {
    $("head").append(
      `\n<meta name="twitter:card" content="summary_large_image">\n`
    );

    changed = true;
  }

  // ---------------------------------------------------
  // Organization / Website structured data
  // Only add if page has no JSON-LD at all.
  // ---------------------------------------------------
  if (!$('script[type="application/ld+json"]').length) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "LetsStudy Pro",
      "url": DOMAIN,
      "description":
        "Global Digital Learning & Growth Ecosystem",
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${DOMAIN}/search.html?q={search_term_string}`,
        "query-input":
          "required name=search_term_string"
      }
    };

    $("head").append(
      `\n<script type="application/ld+json">${JSON.stringify(schema)}</script>\n`
    );

    changed = true;
  }

  // ---------------------------------------------------
  // Save only if modified
  // ---------------------------------------------------
  if (changed) {
    fs.writeFileSync(
      file,
      $.html(),
      "utf8"
    );

    changedFiles.push(getUrl(file));
    fixedFiles.push(
      path.relative(ROOT, file)
    );
  }

  // ---------------------------------------------------
  // Sitemap
  // ---------------------------------------------------
  if (!shouldExcludeFromSitemap($, file)) {
    sitemapUrls.push({
      url: getUrl(file),
      file
    });
  }
}

// Remove duplicates
sitemapUrls = [
  ...new Map(
    sitemapUrls.map(item => [item.url, item])
  ).values()
];

sitemapUrls.sort((a, b) =>
  a.url.localeCompare(b.url)
);

// -----------------------------------------------------
// Generate sitemap.xml
// -----------------------------------------------------
const today =
  new Date().toISOString().split("T")[0];

const xmlUrls = sitemapUrls
  .map(({ url, file }) => {
    let lastmod = today;

    try {
      const stat = fs.statSync(file);
      lastmod = stat.mtime
        .toISOString()
        .split("T")[0];
    } catch {}

    return `  <url>
    <loc>${escapeHtml(url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url === `${DOMAIN}/` ? "1.0" : "0.7"}</priority>
  </url>`;
  })
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlUrls}
</urlset>
`;

const sitemapPath =
  path.join(ROOT, "sitemap.xml");

const oldSitemap =
  fs.existsSync(sitemapPath)
    ? fs.readFileSync(sitemapPath, "utf8")
    : "";

if (oldSitemap !== sitemap) {
  fs.writeFileSync(
    sitemapPath,
    sitemap,
    "utf8"
  );

  console.log(
    `Sitemap updated: ${sitemapUrls.length} URLs`
  );
} else {
  console.log("Sitemap unchanged.");
}

// -----------------------------------------------------
// Output changed URLs
// -----------------------------------------------------
fs.writeFileSync(
  ".seo-changed-urls.txt",
  [...new Set(changedFiles)].join("\n") +
  (changedFiles.length ? "\n" : ""),
  "utf8"
);

console.log("");
console.log("====================================");
console.log("LetsStudy Pro SEO Auto Fix");
console.log("====================================");
console.log(`HTML pages scanned: ${files.length}`);
console.log(`Pages fixed: ${fixedFiles.length}`);
console.log(`Sitemap URLs: ${sitemapUrls.length}`);
console.log("");

if (fixedFiles.length) {
  console.log("Fixed pages:");

  for (const file of fixedFiles) {
    console.log(` - ${file}`);
  }
}

console.log("");
console.log("Changed URLs:");

for (const url of [
  ...new Set(changedFiles)
]) {
  console.log(` - ${url}`);
}
