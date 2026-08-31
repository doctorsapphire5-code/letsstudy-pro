"use strict";

const admin = require("firebase-admin");

const db = admin.firestore();

/* =========================================================
   SEARCHABLE COLLECTIONS
   Only collections intended for public search.
========================================================= */

const SEARCHABLE_COLLECTIONS = [
  "courses",
  "resources",
  "lessons",
  "videos",
  "scholarships",
  "careers",
  "businesses",
  "freelancees",
  "services",
  "posts",
  "communityPosts",
  "studyGroups"
];


/* =========================================================
   HELPERS
========================================================= */

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function firstValue(data, fields) {

  for (const field of fields) {

    const value = data[field];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }

  }

  return null;
}


function toKeywords(data) {

  const possible = [
    data.keywords,
    data.tags,
    data.searchKeywords,
    data.subjects,
    data.categories
  ];

  const output = [];

  for (const value of possible) {

    if (Array.isArray(value)) {

      for (const item of value) {

        if (
          item !== null &&
          item !== undefined
        ) {
          output.push(
            cleanText(item)
          );
        }

      }

    }

    else if (
      value !== null &&
      value !== undefined &&
      String(value).trim()
    ) {

      output.push(
        cleanText(value)
      );

    }

  }

  return [
    ...new Set(
      output
        .map(normalize)
        .filter(Boolean)
    )
  ];

}


/* =========================================================
   CREATE SEARCHABLE TEXT
========================================================= */

function createSearchableText(data) {

  const fields = [
    data.title,
    data.name,
    data.description,
    data.shortDescription,
    data.summary,
    data.content,
    data.text,
    data.category,
    data.type,
    data.subject,
    data.subjectName,
    data.level,
    data.form,
    data.className,
    data.courseName,
    data.moduleName,
    data.lessonName,
    data.keywords,
    data.tags
  ];

  const values = [];

  for (const value of fields) {

    if (Array.isArray(value)) {

      values.push(
        ...value
          .map(cleanText)
          .filter(Boolean)
      );

    }

    else if (
      value !== undefined &&
      value !== null
    ) {

      values.push(
        cleanText(value)
      );

    }

  }

  return normalize(
    values.join(" ")
  );

}


/* =========================================================
   GENERATE PUBLIC URL
   Uses actual Firebase document ID.
========================================================= */

function generateUrl(
  collection,
  documentId,
  data
) {

  if (data.url) {
    return String(data.url);
  }

  if (data.publicUrl) {
    return String(data.publicUrl);
  }

  if (data.link) {
    return String(data.link);
  }

  const pageMap = {

    courses:
      "course.html",

    resources:
      "resource.html",

    lessons:
      "lesson.html",

    videos:
      "video.html",

    scholarships:
      "scholarship.html",

    careers:
      "career.html",

    businesses:
      "business.html",

    freelancees:
      "freelancer.html",

    services:
      "service.html",

    posts:
      "post.html",

    communityPosts:
      "community-post.html",

    studyGroups:
      "study-group.html"

  };

  const page =
    pageMap[collection];

  if (!page) {
    return null;
  }

  return `https://letsstudy.pro/${page}?id=${encodeURIComponent(documentId)}`;
}


/* =========================================================
   DETERMINE TYPE
========================================================= */

function determineType(
  collection,
  data
) {

  if (data.type) {
    return String(data.type);
  }

  if (data.contentType) {
    return String(data.contentType);
  }

  return collection
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .trim()
    .toLowerCase();

}


/* =========================================================
   INDEX ONE DOCUMENT
========================================================= */

async function indexDocument(
  collection,
  snapshot
) {

  if (!snapshot || !snapshot.exists) {
    return null;
  }

  if (
    !SEARCHABLE_COLLECTIONS.includes(
      collection
    )
  ) {
    return null;
  }

  const data =
    snapshot.data() || {};

  const documentId =
    snapshot.id;


  /* -------------------------------------------------------
     Optional searchable flag
     
     If explicitly false, remove from search.
  ------------------------------------------------------- */

  if (
    data.searchable === false ||
    data.isPublic === false ||
    data.public === false
  ) {

    await removeFromIndex(
      collection,
      documentId
    );

    return null;
  }


  const title =
    firstValue(
      data,
      [
        "title",
        "name",
        "courseName",
        "lessonName",
        "videoTitle"
      ]
    ) || "Untitled";


  const description =
    firstValue(
      data,
      [
        "description",
        "shortDescription",
        "summary",
        "excerpt"
      ]
    ) || "";


  const category =
    firstValue(
      data,
      [
        "category",
        "categoryName",
        "subject",
        "subjectName"
      ]
    );


  const subject =
    firstValue(
      data,
      [
        "subject",
        "subjectName"
      ]
    );


  const level =
    firstValue(
      data,
      [
        "level",
        "form",
        "className",
        "educationLevel"
      ]
    );


  const image =
    firstValue(
      data,
      [
        "image",
        "imageUrl",
        "thumbnail",
        "thumbnailUrl",
        "coverImage"
      ]
    );


  const keywords =
    toKeywords(data);


  const searchableText =
    createSearchableText(data);


  const type =
    determineType(
      collection,
      data
    );


  const url =
    generateUrl(
      collection,
      documentId,
      data
    );


  /* -------------------------------------------------------
     Keep REAL Firebase dates.
  ------------------------------------------------------- */

  const indexData = {

    collection,

    documentId,

    title:
      cleanText(title),

    description:
      cleanText(description),

    searchableText,

    category:
      category
        ? cleanText(category)
        : null,

    type,

    subject:
      subject
        ? cleanText(subject)
        : null,

    level:
      level
        ? cleanText(level)
        : null,

    keywords,

    image:
      image
        ? String(image)
        : null,

    url,

    searchable: true,

    sourcePath:
      `${collection}/${documentId}`,

    indexedAt:
      admin.firestore.FieldValue.serverTimestamp()

  };


  /* -------------------------------------------------------
     Preserve source timestamps if available.
  ------------------------------------------------------- */

  if (data.createdAt) {
    indexData.createdAt =
      data.createdAt;
  }

  if (data.updatedAt) {
    indexData.updatedAt =
      data.updatedAt;
  }


  /* -------------------------------------------------------
     Preserve useful real statistics.
  ------------------------------------------------------- */

  if (
    data.views !== undefined
  ) {
    indexData.views =
      Number(data.views) || 0;
  }

  if (
    data.viewCount !== undefined
  ) {
    indexData.viewCount =
      Number(data.viewCount) || 0;
  }


  /* -------------------------------------------------------
     Deterministic index document ID.
     
     Prevents duplicate index records.
  ------------------------------------------------------- */

  const indexId =
    `${collection}__${documentId}`;


  await db
    .collection("searchIndex")
    .doc(indexId)
    .set(
      indexData,
      {
        merge: true
      }
    );


  console.log(
    `INDEXED: ${collection}/${documentId}`
  );


  return {
    collection,
    documentId,
    indexId
  };

}


/* =========================================================
   REMOVE FROM SEARCH INDEX
========================================================= */

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


  console.log(
    `REMOVED FROM INDEX: ${collection}/${documentId}`
  );


  return {
    collection,
    documentId,
    indexId
  };

}


/* =========================================================
   INDEX ONE COLLECTION
========================================================= */

async function indexCollection(
  collection
) {

  if (
    !SEARCHABLE_COLLECTIONS.includes(
      collection
    )
  ) {

    throw new Error(
      `Collection "${collection}" is not searchable.`
    );

  }


  const snapshot =
    await db
      .collection(collection)
      .get();


  let indexed = 0;
  let skipped = 0;
  let errors = 0;


  for (const doc of snapshot.docs) {

    try {

      const result =
        await indexDocument(
          collection,
          doc
        );


      if (result) {
        indexed++;
      }
      else {
        skipped++;
      }

    } catch (error) {

      errors++;

      console.error(
        `INDEX ERROR ${collection}/${doc.id}:`,
        error
      );

    }

  }


  return {
    collection,
    total:
      snapshot.size,
    indexed,
    skipped,
    errors
  };

}


/* =========================================================
   INDEX ALL SEARCHABLE COLLECTIONS
========================================================= */

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

    } catch (error) {

      results.push({

        collection,

        total: 0,

        indexed: 0,

        skipped: 0,

        errors: 1,

        error:
          error.message

      });

    }

  }


  return results;

}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

  SEARCHABLE_COLLECTIONS,

  indexDocument,

  removeFromIndex,

  indexCollection,

  indexAllCollections

};