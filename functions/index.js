const {
  onRequest
} = require("firebase-functions/v2/https");

const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

const {
  indexDocument,
  removeFromIndex,
  indexCollection,
  indexAllCollections,
  SEARCHABLE_COLLECTIONS
} = require("./search-indexer");

const {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted
} = require("firebase-functions/v2/firestore");

const SITE_URL = "https://letsstudy.pro";

const COLLECTIONS = {
  scholarships: "scholarships",
  careers: "careers",
  courses: "courses",
  resources: "resources",
  marketplace: "marketplace"
};

const PAGE_URLS = {
  scholarships: "scholarship.html",
  careers: "career.html",
  courses: "course.html",
  resources: "resource.html",
  marketplace: "product.html"
};

const DEFAULT_IMAGE =
  `${SITE_URL}/assets/images/og-default.jpg`;


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(value = "") {

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================
   CLEAN DESCRIPTION
========================================= */

function cleanDescription(value = "") {

  return String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);

}


/* =========================================
   FIND DOCUMENT BY SLUG
========================================= */

async function findBySlug(
  collectionName,
  slug
) {

  const collection =
    db.collection(collectionName);

  const result =
    await collection
      .where("slug", "==", slug)
      .limit(1)
      .get();

  if (!result.empty) {

    return result.docs[0];

  }

  /*
   -----------------------------------------
   Fallback:
   allow document ID as slug
   -----------------------------------------
  */

  const direct =
    await collection
      .doc(slug)
      .get();

  if (direct.exists) {

    return direct;

  }

  return null;

}


/* =========================================
   DYNAMIC OPEN GRAPH SHARE FUNCTION
========================================= */

exports.sharePreview = onRequest(
  {
    region: "africa-south1"
  },

  async (req, res) => {

    try {

      /*
       URL:

       /share/scholarships/my-scholarship
       /share/careers/software-engineer
       /share/courses/web-development
       */

      const parts =
        req.path
          .split("/")
          .filter(Boolean);

      if (
        parts.length < 3 ||
        parts[0] !== "share"
      ) {

        return res
          .status(400)
          .send("Invalid share URL.");

      }

      const type =
        parts[1];

      const slug =
        decodeURIComponent(
          parts.slice(2).join("/")
        );

      if (!COLLECTIONS[type]) {

        return res
          .status(404)
          .send("Content type not found.");

      }

      const collection =
        COLLECTIONS[type];

      const doc =
        await findBySlug(
          collection,
          slug
        );

      if (!doc) {

        return res
          .status(404)
          .send(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Content Not Found | LetsStudy Pro</title>
              </head>
              <body>
                <h1>Content Not Found</h1>
              </body>
            </html>
          `);

      }

      const data =
        doc.data();

      /*
       ======================================
       CONTENT DATA
       ======================================
      */

      const title =
        data.title ||
        data.name ||
        "LetsStudy Pro";

      const description =
        cleanDescription(
          data.shortDescription ||
          data.description ||
          data.summary ||
          `Discover this ${type} on LetsStudy Pro.`
        );

      const image =
        data.image ||
        data.imageUrl ||
        data.thumbnail ||
        data.coverImage ||
        DEFAULT_IMAGE;

      const canonicalUrl =
        `${SITE_URL}/${PAGE_URLS[type]}?slug=${encodeURIComponent(
          data.slug || slug
        )}`;

      const safeTitle =
        escapeHtml(title);

      const safeDescription =
        escapeHtml(description);

      const safeImage =
        escapeHtml(image);

      const safeCanonicalUrl =
        escapeHtml(canonicalUrl);

      /*
       ======================================
       CACHE
       ======================================
      */

      res.set(
        "Cache-Control",
        "public, max-age=300"
      );

      /*
       ======================================
       HTML
       ======================================
      */

      return res
        .status(200)
        .send(`
<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<title>
${safeTitle} | LetsStudy Pro
</title>

<meta
  name="description"
  content="${safeDescription}"
>

<meta
  name="robots"
  content="index, follow"
>

<link
  rel="canonical"
  href="${safeCanonicalUrl}"
>


<!-- =====================================
     OPEN GRAPH
===================================== -->

<meta
  property="og:type"
  content="article"
>

<meta
  property="og:site_name"
  content="LetsStudy Pro"
>

<meta
  property="og:title"
  content="${safeTitle}"
>

<meta
  property="og:description"
  content="${safeDescription}"
>

<meta
  property="og:image"
  content="${safeImage}"
>

<meta
  property="og:image:secure_url"
  content="${safeImage}"
>

<meta
  property="og:image:type"
  content="image/jpeg"
>

<meta
  property="og:image:width"
  content="1200"
>

<meta
  property="og:image:height"
  content="630"
>

<meta
  property="og:url"
  content="${safeCanonicalUrl}"
>


<!-- =====================================
     TWITTER / X
===================================== -->

<meta
  name="twitter:card"
  content="summary_large_image"
>

<meta
  name="twitter:title"
  content="${safeTitle}"
>

<meta
  name="twitter:description"
  content="${safeDescription}"
>

<meta
  name="twitter:image"
  content="${safeImage}"
>


<!-- =====================================
     MOBILE
===================================== -->

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
>

</head>


<body>

<h1>
${safeTitle}
</h1>

<p>
${safeDescription}
</p>


<script>

window.location.replace(
  ${JSON.stringify(canonicalUrl)}
);

</script>

</body>

</html>
        `);

    } catch (error) {

      console.error(
        "Open Graph error:",
        error
      );

      return res
        .status(500)
        .send(
          "Unable to generate share preview."
        );

    }

  }
);