const admin = require("firebase-admin");

const db = admin.firestore();

/*
=========================================================
LETSSTUDY PRO — SEARCH INDEXER
=========================================================

Source collections are controlled here.

IMPORTANT:
- No document IDs are hardcoded.
- No titles are hardcoded.
- No result counts are hardcoded.
- Source document data is read dynamically.
- Private collections are NOT indexed.
*/

const SEARCHABLE_COLLECTIONS = [
  "scholarships",
  "careers",
  "courses",
  "resources",
  "marketplace",

  "modules",
  "module",
  "lessons",
  "assignments",
  "quizzes",
  "quizQuestions",

  "career",

  "videos",
  "videoCategories",
  "playlists",

  "businesses",
  "business_ads",
  "services",
  "freelancees",

  "posts",
  "communityPosts",
  "communityTopics",
  "communityCategories",

  "studyGroups",
  "groups",
  "announcements",
  "reviews",
  "courseFAQs",
  "certificateTemplates"
];


/*
=========================================================
PRIVATE COLLECTIONS
=========================================================
*/

const PRIVATE_COLLECTIONS = new Set([
  "admins",
  "users",
  "profiles",
  "userSettings",
  "systemSettings",

  "payments",
  "orders",
  "carts",
  "cart",
  "wallets",
  "withdrawals",
  "subscriptions",
  "premiumMembers",

  "privateMeetings",
  "notifications",
  "reports",
  "bannedUsers",
  "blocks",
  "connections",

  "supportTickets",
  "supportReplies",

  "affiliateTransactions",
  "affiliatepayments",

  "automationIntegrations",
  "automationScheduleActivity",

  "emailCompaigns",
  "smsCompaigns",
  "whatsappCompaigns",
  "marketingOrders"
]);


/*
=========================================================
CONVERT FIRESTORE VALUES TO SEARCHABLE TEXT
=========================================================
*/

function valueToText(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (
    value instanceof admin.firestore.Timestamp
  ) {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {

    return value
      .map(valueToText)
      .filter(Boolean)
      .join(" ");
  }

  if (typeof value === "object") {

    return Object.values(value)
      .map(valueToText)
      .filter(Boolean)
      .join(" ");
  }

  return "";
}


/*
=========================================================
NORMALIZE SEARCH TEXT
=========================================================
*/

function normalizeText(value) {

  return valueToText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}


/*
=========================================================
GET FIRST AVAILABLE FIELD
=========================================================
*/

function firstField(data, fields) {

  for (const field of fields) {

    if (
      data[field] !== undefined &&
      data[field] !== null &&
      data[field] !== ""
    ) {

      return data[field];
    }
  }

  return "";
}


/*
=========================================================
GENERATE PUBLIC URL
=========================================================

Priority:
1. Existing URL from Firebase
2. Known LetsStudy Pro page route using REAL document ID
3. Empty string

No fake URL is created.
=========================================================
*/

function getPublicUrl(
  collection,
  documentId,
  data
) {

  const existingUrl = firstField(
    data,
    [
      "url",
      "publicUrl",
      "pageUrl",
      "link",
      "href"
    ]
  );

  if (existingUrl) {
    return String(existingUrl);
  }


  const pageMap = {

    scholarships:
      "scholarship.html",

    careers:
      "career.html",

    career:
      "career.html",

    courses:
      "course.html",

    resources:
      "resource.html",

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
      "post.html",

    communityPosts:
      "community-post.html"
  };


  const page = pageMap[collection];

  if (!page) {
    return "";
  }


  /*
   REAL Firestore Document ID
  */

  return `/${page}?id=${encodeURIComponent(
    documentId
  )}`;
}


/*
=========================================================
BUILD SEARCH DOCUMENT
=========================================================
*/

function buildSearchDocument(
  collection,
  snapshot
) {

  const data = snapshot.data() || {};

  const documentId = snapshot.id;


  /*
   Explicitly disabled documents
  */

  if (data.searchable === false) {
    return null;
  }


  /*
   TITLE
  */

  const title = firstField(
    data,
    [
      "title",
      "name",
      "courseTitle",
      "resourceTitle",
      "lessonTitle",
      "careerTitle",
      "scholarshipTitle",
      "productName",
      "businessName"
    ]
  );


  /*
   DESCRIPTION
  */

  const description = firstField(
    data,
    [
      "description",
      "shortDescription",
      "summary",
      "excerpt",
      "details",
      "content"
    ]
  );


  /*
   CATEGORY
  */

  const category = firstField(
    data,
    [
      "category",
      "categoryName",
      "subject",
      "topic",
      "field"
    ]
  );


  /*
   KEYWORDS
  */

  const keywords = firstField(
    data,
    [
      "keywords",
      "tags",
      "searchKeywords"
    ]
  );


  /*
   IMAGE
  */

  const image = firstField(
    data,
    [
      "image",
      "imageUrl",
      "thumbnail",
      "thumbnailUrl",
      "coverImage",
      "photo"
    ]
  );


  /*
   TYPE
  */

  const type =
    firstField(
      data,
      [
        "type",
        "contentType",
        "resourceType"
      ]
    ) ||
    collection;


  /*
   SEARCHABLE TEXT
  */

  const searchableText =
    normalizeText(
      [
        title,
        description,
        category,
        keywords,

        data.subject,
        data.topic,
        data.form,
        data.level,
        data.class,
        data.course,
        data.module,
        data.lesson,
        data.content,

        documentId
      ]
        .map(valueToText)
        .filter(Boolean)
        .join(" ")
    );


  /*
   SEARCH INDEX DOCUMENT
  */

  const searchDocument = {

    collection,

    documentId,

    title:
      valueToText(title) ||
      documentId,

    description:
      valueToText(description),

    searchableText,

    category:
      valueToText(category),

    type:
      valueToText(type),

    keywords:
      valueToText(keywords),

    image:
      valueToText(image),

    url:
      getPublicUrl(
        collection,
        documentId,
        data
      ),

    searchable: true,

    indexedAt:
      admin.firestore.FieldValue
        .serverTimestamp()
  };


  /*
   Preserve original timestamps
   when available.
  */

  if (data.createdAt) {

    searchDocument.createdAt =
      data.createdAt;
  }


  if (data.updatedAt) {

    searchDocument.updatedAt =
      data.updatedAt;
  }


  return searchDocument;
}


/*
=========================================================
INDEX ONE DOCUMENT
=========================================================
*/

async function indexDocument(
  collection,
  snapshot
) {

  if (
    !SEARCHABLE_COLLECTIONS.includes(
      collection
    )
  ) {

    return {
      indexed: false,
      reason: "collection_not_allowed"
    };
  }


  if (
    PRIVATE_COLLECTIONS.has(
      collection
    )
  ) {

    return {
      indexed: false,
      reason: "private_collection"
    };
  }


  const documentId = snapshot.id;

  const indexId =
    `${collection}__${documentId}`;


  const indexRef =
    db
      .collection("searchIndex")
      .doc(indexId);


  const searchDocument =
    buildSearchDocument(
      collection,
      snapshot
    );


  /*
   searchable:false
   means remove it from index.
  */

  if (!searchDocument) {

    await indexRef.delete();

    return {
      indexed: false,
      deletedFromIndex: true
    };
  }


  await indexRef.set(
    searchDocument,
    {
      merge: true
    }
  );


  return {
    indexed: true,
    collection,
    documentId
  };
}


/*
=========================================================
DELETE ONE DOCUMENT FROM INDEX
=========================================================
*/

async function removeFromIndex(
  collection,
  documentId
) {

  const indexId =
    `${collection}__${documentId}`;


  await db
    .collection("searchIndex")
    .doc(indexId)
    .delete();


  return {
    deleted: true,
    collection,
    documentId
  };
}


/*
=========================================================
INDEX ONE COLLECTION
=========================================================
*/

async function indexCollection(
  collection
) {

  if (
    !SEARCHABLE_COLLECTIONS.includes(
      collection
    )
  ) {

    throw new Error(
      `Collection is not searchable: ${collection}`
    );
  }


  const snapshot =
    await db
      .collection(collection)
      .get();


  let indexed = 0;
  let skipped = 0;

  let batch =
    db.batch();

  let operations = 0;


  for (
    const document of snapshot.docs
  ) {

    const indexId =
      `${collection}__${document.id}`;


    const indexRef =
      db
        .collection("searchIndex")
        .doc(indexId);


    const searchDocument =
      buildSearchDocument(
        collection,
        document
      );


    if (!searchDocument) {

      batch.delete(indexRef);

      skipped++;

    } else {

      batch.set(
        indexRef,
        searchDocument,
        {
          merge: true
        }
      );

      indexed++;
    }


    operations++;


    /*
     Firestore batch limit is 500.
     Keep below the limit.
    */

    if (operations >= 450) {

      await batch.commit();

      batch =
        db.batch();

      operations = 0;
    }
  }


  if (operations > 0) {

    await batch.commit();
  }


  return {

    collection,

    documentsFound:
      snapshot.size,

    indexed,

    skipped
  };
}


/*
=========================================================
INDEX ALL SEARCHABLE COLLECTIONS
=========================================================
*/

async function indexAllCollections() {

  const results = [];


  for (
    const collection
    of SEARCHABLE_COLLECTIONS
  ) {

    try {

      const result =
        await indexCollection(
          collection
        );


      results.push(result);


      console.log(
        "Search indexing completed:",
        result
      );

    } catch (error) {

      console.error(
        `Search indexing failed for ${collection}:`,
        error
      );


      results.push({

        collection,

        error:
          error.message
      });
    }
  }


  return results;
}


/*
=========================================================
EXPORT
=========================================================
*/

module.exports = {

  SEARCHABLE_COLLECTIONS,

  PRIVATE_COLLECTIONS,

  buildSearchDocument,

  indexDocument,

  removeFromIndex,

  indexCollection,

  indexAllCollections
};