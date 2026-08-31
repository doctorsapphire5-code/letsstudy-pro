const admin = require("firebase-admin");

const db = admin.firestore();

/*
 * Public/searchable Firebase collections.
 * These are the real collections identified in the LetsStudy Pro database.
 *
 * IMPORTANT:
 * This is only a security allow-list.
 * Documents, IDs, titles, URLs and counts are NEVER hardcoded.
 */
const SEARCHABLE_COLLECTIONS = [
  "courses",
  "modules",
  "module",
  "lessons",
  "assignments",
  "quizzes",
  "quizQuestions",
  "resources",
  "scholarships",
  "career",
  "careers",
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
 * Private collections are deliberately NOT included.
 */

function cleanValue(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "string") return value;

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .map(cleanValue)
      .filter(Boolean)
      .join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value)
      .map(cleanValue)
      .filter(Boolean)
      .join(" ");
  }

  return "";
}

function firstValue(data, fields) {
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

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function detectType(collection, data) {
  return (
    firstValue(data, ["type", "contentType", "resourceType"]) ||
    collection
  );
}

function buildPublicUrl(collection, documentId, data) {
  /*
   * Prefer a URL explicitly stored in Firebase.
   */
  const storedUrl = firstValue(data, [
    "url",
    "publicUrl",
    "link",
    "pageUrl"
  ]);

  if (storedUrl) return String(storedUrl);

  /*
   * Otherwise create a route from the REAL document ID.
   */
  const routes = {
    courses: `/course.html?id=${encodeURIComponent(documentId)}`,
    resources: `/resource.html?id=${encodeURIComponent(documentId)}`,
    lessons: `/lesson.html?id=${encodeURIComponent(documentId)}`,
    scholarships: `/scholarship.html?id=${encodeURIComponent(documentId)}`,
    careers: `/career.html?id=${encodeURIComponent(documentId)}`,
    career: `/career.html?id=${encodeURIComponent(documentId)}`,
    videos: `/video.html?id=${encodeURIComponent(documentId)}`,
    jobs: `/job.html?id=${encodeURIComponent(documentId)}`,
    businesses: `/business.html?id=${encodeURIComponent(documentId)}`,
    services: `/service.html?id=${encodeURIComponent(documentId)}`,
    posts: `/post.html?id=${encodeURIComponent(documentId)}`,
    communityPosts: `/community-post.html?id=${encodeURIComponent(documentId)}`
  };

  return routes[collection] || "";
}

function createSearchDocument(snapshot) {
  const data = snapshot.data() || {};
  const collection = snapshot.ref.parent.id;
  const documentId = snapshot.id;

  /*
   * If the source explicitly says searchable:false,
   * do not put it into the public index.
   */
  if (data.searchable === false) {
    return null;
  }

  const title = firstValue(data, [
    "title",
    "name",
    "courseTitle",
    "resourceTitle",
    "lessonTitle",
    "careerTitle",
    "scholarshipTitle"
  ]);

  const description = firstValue(data, [
    "description",
    "summary",
    "shortDescription",
    "excerpt",
    "details"
  ]);

  const category = firstValue(data, [
    "category",
    "categoryName",
    "subject",
    "topic"
  ]);

  const keywords = firstValue(data, [
    "keywords",
    "tags",
    "searchKeywords"
  ]);

  const image = firstValue(data, [
    "image",
    "imageUrl",
    "thumbnail",
    "thumbnailUrl",
    "coverImage",
    "photo"
  ]);

  /*
   * Build searchable text dynamically from the actual document.
   */
  const searchableText = normalizeText(
    [
      title,
      description,
      category,
      keywords,
      data.subject,
      data.topic,
      data.form,
      data.level,
      data.type,
      data.content
    ]
      .map(cleanValue)
      .filter(Boolean)
      .join(" ")
  );

  const result = {
    collection,
    documentId,

    title: cleanValue(title) || documentId,
    description: cleanValue(description),

    searchableText,

    category: cleanValue(category),
    type: detectType(collection, data),

    keywords: cleanValue(keywords),

    image: cleanValue(image),

    url: buildPublicUrl(
      collection,
      documentId,
      data
    ),

    searchable: true,

    indexedAt:
      admin.firestore.FieldValue.serverTimestamp()
  };

  /*
   * Preserve timestamps when available.
   */
  if (data.createdAt) {
    result.createdAt = data.createdAt;
  }

  if (data.updatedAt) {
    result.updatedAt = data.updatedAt;
  }

  return result;
}

/*
 * Use deterministic searchIndex document IDs.
 *
 * This prevents duplicates when the same source document
 * is indexed more than once.
 */
function indexDocument(snapshot) {
  const collection = snapshot.ref.parent.id;
  const documentId = snapshot.id;

  const indexId =
    `${collection}__${documentId}`;

  const indexRef =
    db.collection("searchIndex").doc(indexId);

  const searchDocument =
    createSearchDocument(snapshot);

  if (!searchDocument) {
    return indexRef.delete();
  }

  return indexRef.set(
    searchDocument,
    { merge: true }
  );
}

async function indexCollection(collectionName) {
  if (!SEARCHABLE_COLLECTIONS.includes(collectionName)) {
    throw new Error(
      `Collection not allowed: ${collectionName}`
    );
  }

  const snapshot =
    await db.collection(collectionName).get();

  let indexed = 0;
  let skipped = 0;

  let batch = db.batch();
  let batchCount = 0;

  for (const document of snapshot.docs) {
    const searchDocument =
      createSearchDocument(document);

    const indexId =
      `${collectionName}__${document.id}`;

    const indexRef =
      db.collection("searchIndex").doc(indexId);

    if (!searchDocument) {
      batch.delete(indexRef);
      batchCount++;
      skipped++;
    } else {
      batch.set(
        indexRef,
        searchDocument,
        { merge: true }
      );

      batchCount++;
      indexed++;
    }

    if (batchCount >= 450) {
      await batch.commit();

      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  return {
    collection: collectionName,
    documentsFound: snapshot.size,
    indexed,
    skipped
  };
}

async function indexAllCollections() {
  const results = [];

  for (const collection of SEARCHABLE_COLLECTIONS) {
    try {
      const result =
        await indexCollection(collection);

      results.push(result);

      console.log(
        `Indexed ${collection}:`,
        result
      );
    } catch (error) {
      console.error(
        `Failed indexing ${collection}`,
        error
      );

      results.push({
        collection,
        error: error.message
      });
    }
  }

  return results;
}

module.exports = {
  SEARCHABLE_COLLECTIONS,
  createSearchDocument,
  indexDocument,
  indexCollection,
  indexAllCollections
};