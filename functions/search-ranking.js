"use strict";

/* =========================================================
   LETSSTUDY PRO — SEARCH RANKING ENGINE
   Uses ONLY real indexed Firebase data.
========================================================= */


/* =========================================================
   NORMALIZE
========================================================= */

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}


/* =========================================================
   ARRAY NORMALIZER
========================================================= */

function normalizeArray(value) {

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(item => normalize(item))
    .filter(Boolean);

}


/* =========================================================
   CALCULATE SCORE
========================================================= */

function calculateScore(data = {}, query = "") {

  const q = normalize(query);

  if (!q) {
    return 0;
  }


  /* -------------------------------------------------------
     FIELDS
  ------------------------------------------------------- */

  const title =
    normalize(
      data.title ||
      data.name
    );

  const description =
    normalize(
      data.description ||
      data.summary ||
      data.shortDescription
    );

  const searchableText =
    normalize(
      data.searchableText
    );

  const category =
    normalize(
      data.category
    );

  const type =
    normalize(
      data.type
    );

  const subject =
    normalize(
      data.subject ||
      data.subjectName
    );

  const level =
    normalize(
      data.level ||
      data.form ||
      data.className
    );

  const keywords =
    normalizeArray(
      data.keywords
    );


  let score = 0;


  /* =======================================================
     EXACT TITLE
  ======================================================= */

  if (title === q) {
    score += 100;
  }


  /* =======================================================
     TITLE
  ======================================================= */

  if (
    title &&
    title.includes(q)
  ) {
    score += 60;
  }


  /* =======================================================
     KEYWORDS
  ======================================================= */

  for (const keyword of keywords) {

    if (keyword === q) {
      score += 40;
    }

    else if (
      keyword.includes(q)
    ) {
      score += 25;
    }

  }


  /* =======================================================
     SEARCHABLE TEXT
  ======================================================= */

  if (
    searchableText &&
    searchableText.includes(q)
  ) {
    score += 30;
  }


  /* =======================================================
     DESCRIPTION
  ======================================================= */

  if (
    description &&
    description.includes(q)
  ) {
    score += 10;
  }


  /* =======================================================
     CATEGORY
  ======================================================= */

  if (
    category &&
    category.includes(q)
  ) {
    score += 30;
  }


  /* =======================================================
     TYPE
  ======================================================= */

  if (
    type &&
    type.includes(q)
  ) {
    score += 20;
  }


  /* =======================================================
     SUBJECT
  ======================================================= */

  if (
    subject &&
    subject.includes(q)
  ) {
    score += 30;
  }


  /* =======================================================
     LEVEL / FORM
  ======================================================= */

  if (
    level &&
    level.includes(q)
  ) {
    score += 30;
  }


  /* =======================================================
     WORD-BY-WORD MATCH
  ======================================================= */

  const words =
    q.split(/\s+/)
      .filter(Boolean);


  for (const word of words) {

    if (
      title.includes(word)
    ) {
      score += 15;
    }

    if (
      keywords.some(
        keyword =>
          keyword.includes(word)
      )
    ) {
      score += 12;
    }

    if (
      searchableText.includes(word)
    ) {
      score += 8;
    }

    if (
      description.includes(word)
    ) {
      score += 4;
    }

    if (
      subject.includes(word)
    ) {
      score += 8;
    }

    if (
      level.includes(word)
    ) {
      score += 8;
    }

  }


  /* =======================================================
     POPULARITY
     ONLY REAL STORED VALUES
  ======================================================= */

  const popularity =
    Number(
      data.views ??
      data.viewCount ??
      data.popularity ??
      0
    );


  if (
    Number.isFinite(popularity) &&
    popularity > 0
  ) {

    score += Math.min(
      10,
      Math.log10(
        popularity + 1
      ) * 3
    );

  }


  /* =======================================================
     FRESHNESS
     ONLY REAL FIREBASE DATES
  ======================================================= */

  const timestamp =
    data.updatedAt ||
    data.createdAt;


  if (timestamp) {

    let date = null;


    if (
      timestamp.toDate &&
      typeof timestamp.toDate === "function"
    ) {

      date =
        timestamp.toDate();

    }

    else if (
      timestamp instanceof Date
    ) {

      date =
        timestamp;

    }

    else {

      const parsed =
        new Date(timestamp);

      if (
        !Number.isNaN(
          parsed.getTime()
        )
      ) {
        date = parsed;
      }

    }


    if (date) {

      const days =
        (
          Date.now() -
          date.getTime()
        ) /
        86400000;


      if (
        days >= 0 &&
        days <= 7
      ) {
        score += 10;
      }

      else if (
        days > 7 &&
        days <= 30
      ) {
        score += 7;
      }

      else if (
        days > 30 &&
        days <= 90
      ) {
        score += 4;
      }

    }

  }


  return Math.round(
    score * 100
  ) / 100;

}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  calculateScore
};