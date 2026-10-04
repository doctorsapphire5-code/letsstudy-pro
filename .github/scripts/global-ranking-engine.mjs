import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const ignored = [
  ".git",
  ".github",
  "node_modules",
  "functions",
  "admin",
  "private",
  "test",
  "tests"
];

const excludedFiles = [
  "404.html",
  "404",
  "error.html"
];

const htmlFiles = [];

function shouldIgnore(file) {
  return ignored.some(dir =>
    file.split(path.sep).includes(dir)
  );
}

function scan(dir) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);

    if (shouldIgnore(full)) continue;

    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      scan(full);
      continue;
    }

    if (
      stat.isFile() &&
      item.endsWith(".html") &&
      !excludedFiles.includes(item)
    ) {
      htmlFiles.push(full);
    }
  }
}

scan(ROOT);

let total = 0;
let optimized = 0;
let missingTitle = 0;
let missingDescription = 0;
let missingCanonical = 0;
let missingH1 = 0;
let missingAlt = 0;
let shortContent = 0;
let noInternalLinks = 0;

const issues = [];
const changed = [];

function getAttr(html, tag, attr) {
  const regex = new RegExp(
    `<${tag}[^>]*\\s${attr}\\s*=\\s*["'][^"']*["'][^>]*>`,
    "i"
  );

  return regex.test(html);
}

function textContent(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

for (const file of htmlFiles) {
  total++;

  const relative = path.relative(ROOT, file);
  let html = fs.readFileSync(file, "utf8");
  const original = html;

  const titleMatch = html.match(
    /<title[^>]*>([\s\S]*?)<\/title>/i
  );

  const title = titleMatch
    ? titleMatch[1].replace(/\s+/g, " ").trim()
    : "";

  if (!title) {
    missingTitle++;
    issues.push(`${relative}: missing title`);
  }

  const description = getAttr(
    html,
    "meta",
    "name"
  )
    ? /<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["'][^>]*>/i.test(html)
    : false;

  if (!description) {
    missingDescription++;
    issues.push(`${relative}: missing meta description`);
  }

  if (
    !/<link[^>]+rel=["']canonical["'][^>]*>/i.test(html)
  ) {
    missingCanonical++;
    issues.push(`${relative}: missing canonical`);
  }

  if (!/<h1\b[^>]*>/i.test(html)) {
    missingH1++;
    issues.push(`${relative}: missing H1`);
  }

  const images = html.match(/<img\b[^>]*>/gi) || [];

  for (const img of images) {
    if (!/\balt\s*=/i.test(img)) {
      missingAlt++;
      issues.push(`${relative}: image missing ALT`);
    }
  }

  const internalLinks =
    html.match(/href=["'][^"'#]*(?:\.html|\/)["']/gi) || [];

  if (internalLinks.length === 0) {
    noInternalLinks++;
    issues.push(`${relative}: no internal links`);
  }

  const contentLength = textContent(html).length;

  if (contentLength < 500) {
    shortContent++;
    issues.push(
      `${relative}: short content (${contentLength} characters)`
    );
  }

  /*
   * Safe optimization:
   * Add lang only when completely missing.
   */
  if (!/<html[^>]+lang=/i.test(html)) {
    html = html.replace(
      /<html\b/i,
      '<html lang="en"'
    );
  }

  /*
   * Add viewport only when missing.
   */
  if (
    !/<meta[^>]+name=["']viewport["']/i.test(html) &&
    /<head\b/i.test(html)
  ) {
    html = html.replace(
      /<head\b[^>]*>/i,
      match =>
        `${match}\n<meta name="viewport" content="width=device-width, initial-scale=1.0">`
    );
  }

  /*
   * Add Organization/WebSite schema to homepage only.
   */
  const isHomepage =
    relative === "index.html" ||
    relative === "index-auth.html";

  if (
    isHomepage &&
    !/application\/ld\+json/i.test(html) &&
    /<\/head>/i.test(html)
  ) {
    const schema = `
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "LetsStudy Pro",
      "url": "https://letsstudy.pro",
      "description": "Global digital learning and growth ecosystem."
    },
    {
      "@type": "WebSite",
      "name": "LetsStudy Pro",
      "url": "https://letsstudy.pro",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://letsstudy.pro/search.html?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
</script>
`;

    html = html.replace(
      /<\/head>/i,
      `${schema}\n</head>`
    );
  }

  if (html !== original) {
    fs.writeFileSync(file, html, "utf8");
    optimized++;
    changed.push(relative);
  }
}

const score = Math.max(
  0,
  Math.round(
    100 -
    (
      missingTitle +
      missingDescription +
      missingCanonical +
      missingH1 +
      missingAlt +
      noInternalLinks
    ) / Math.max(total, 1) * 100
  )
);

const report = `
LETSSTUDY PRO GLOBAL RANKING REPORT
===================================

Generated: ${new Date().toISOString()}

TOTAL HTML PAGES: ${total}
PAGES OPTIMIZED: ${optimized}

GLOBAL SEO SCORE: ${score}/100

ISSUES
------

Missing titles: ${missingTitle}
Missing descriptions: ${missingDescription}
Missing canonical: ${missingCanonical}
Missing H1: ${missingH1}
Images missing ALT: ${missingAlt}
Short-content pages: ${shortContent}
Pages without internal links: ${noInternalLinks}

CHANGED PAGES
-------------

${changed.length
  ? changed.join("\n")
  : "No pages changed."}

DETAILED ISSUES
---------------

${issues.length
  ? issues.join("\n")
  : "No major SEO issues detected."}
`;

fs.writeFileSync(
  "global-ranking-report.txt",
  report.trim() + "\n"
);

fs.writeFileSync(
  ".ranking-changed-urls.txt",
  changed.join("\n") +
  (changed.length ? "\n" : "")
);

console.log(report);
