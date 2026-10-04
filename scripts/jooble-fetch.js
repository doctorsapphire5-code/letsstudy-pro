const fs = require("fs");
const crypto = require("crypto");

const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID;

const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET;

const GOOGLE_REFRESH_TOKEN =
  process.env.GOOGLE_REFRESH_TOKEN;

const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  "let-s-study-pro-course";

const JOOBLE_KEYWORDS =
  process.env.JOOBLE_KEYWORDS || "jobs";

const JOOBLE_LOCATION =
  process.env.JOOBLE_LOCATION || "Tanzania";

if (!JOOBLE_API_KEY) {
  throw new Error(
    "Missing JOOBLE_API_KEY."
  );
}

if (!GOOGLE_CLIENT_ID) {
  throw new Error(
    "Missing GOOGLE_CLIENT_ID."
  );
}

if (!GOOGLE_CLIENT_SECRET) {
  throw new Error(
    "Missing GOOGLE_CLIENT_SECRET."
  );
}

if (!GOOGLE_REFRESH_TOKEN) {
  throw new Error(
    "Missing GOOGLE_REFRESH_TOKEN."
  );
}

function makeCareerId(job) {
  const source =
    job.id ||
    job.jobId ||
    job.link ||
    job.url ||
    [
      job.title,
      job.company,
      job.location
    ].join("|");

  const hash = crypto
    .createHash("sha256")
    .update(String(source))
    .digest("hex")
    .substring(0, 24);

  return `jooble_${hash}`;
}

function cleanText(value) {
  if (!value) return "";

  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firestoreValue(value) {
  if (
    value === undefined ||
    value === null
  ) {
    return {
      nullValue: null
    };
  }

  if (typeof value === "boolean") {
    return {
      booleanValue: value
    };
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? {
          integerValue: String(value)
        }
      : {
          doubleValue: value
        };
  }

  return {
    stringValue: String(value)
  };
}

function firestoreTimestamp(date) {
  return {
    timestampValue: date.toISOString()
  };
}

async function getGoogleAccessToken() {
  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded"
      },

      body: new URLSearchParams({
        client_id:
          GOOGLE_CLIENT_ID,

        client_secret:
          GOOGLE_CLIENT_SECRET,

        refresh_token:
          GOOGLE_REFRESH_TOKEN,

        grant_type:
          "refresh_token"
      })
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      `Google OAuth error: ${
        JSON.stringify(data)
      }`
    );
  }

  if (!data.access_token) {
    throw new Error(
      "Google OAuth did not return an access token."
    );
  }

  return data.access_token;
}

async function fetchJoobleJobs(page) {
  const endpoint =
    `https://jooble.org/api/${JOOBLE_API_KEY}`;

  const response = await fetch(
    endpoint,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        keywords:
          JOOBLE_KEYWORDS,

        location:
          JOOBLE_LOCATION,

        page
      })
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      `Jooble API error ${response.status}: ${
        JSON.stringify(data)
      }`
    );
  }

  return data;
}

function normalizeJob(job) {
  const careerId =
    makeCareerId(job);

  const title =
    job.title ||
    job.jobTitle ||
    "Job Opportunity";

  const company =
    job.company ||
    job.companyName ||
    job.organization ||
    "";

  const location =
    job.location ||
    "";

  const type =
    job.type ||
    job.jobType ||
    job.employmentType ||
    "";

  const description =
    cleanText(
      job.description ||
      job.snippet ||
      ""
    );

  const category =
    job.category ||
    job.jobCategory ||
    "Jobs";

  const salary =
    job.salary ||
    job.salaryRange ||
    "";

  const applicationUrl =
    job.link ||
    job.url ||
    "";

  const sourceJobId =
    job.id ||
    job.jobId ||
    applicationUrl ||
    careerId;

  return {
    careerId,
    title,
    company,
    companyName: company,
    location,
    type,
    jobType: type,
    category,
    field: category,
    description,
    salary,
    applicationUrl,
    url: applicationUrl,
    source: "Jooble",
    sourceJobId: String(
      sourceJobId
    ),
    status: "active",
    featured: false
  };
}

function makeFirestoreFields(job) {
  const now =
    new Date();

  return {
    careerId:
      firestoreValue(
        job.careerId
      ),

    title:
      firestoreValue(
        job.title
      ),

    company:
      firestoreValue(
        job.company
      ),

    companyName:
      firestoreValue(
        job.companyName
      ),

    location:
      firestoreValue(
        job.location
      ),

    type:
      firestoreValue(
        job.type
      ),

    jobType:
      firestoreValue(
        job.jobType
      ),

    category:
      firestoreValue(
        job.category
      ),

    field:
      firestoreValue(
        job.field
      ),

    description:
      firestoreValue(
        job.description
      ),

    salary:
      firestoreValue(
        job.salary
      ),

    applicationUrl:
      firestoreValue(
        job.applicationUrl
      ),

    url:
      firestoreValue(
        job.url
      ),

    source:
      firestoreValue(
        job.source
      ),

    sourceJobId:
      firestoreValue(
        job.sourceJobId
      ),

    status:
      firestoreValue(
        job.status
      ),

    featured:
      firestoreValue(
        job.featured
      ),

    updatedAt:
      firestoreTimestamp(
        now
      )
  };
}

async function saveCareer(
  accessToken,
  job
) {
  const url =
    `https://firestore.googleapis.com/v1/projects/` +
    `${FIREBASE_PROJECT_ID}` +
    `/databases/(default)/documents/careers/` +
    `${encodeURIComponent(job.careerId)}`;

  const response = await fetch(
    url,
    {
      method: "PATCH",

      headers: {
        Authorization:
          `Bearer ${accessToken}`,

        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        fields:
          makeFirestoreFields(job)
      })
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      `Firestore ${response.status}: ${
        JSON.stringify(data)
      }`
    );
  }

  return data;
}

async function main() {
  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "LetsStudy Pro - Jooble Admin Sync"
  );
  console.log(
    "======================================"
  );

  console.log(
    `Project: ${FIREBASE_PROJECT_ID}`
  );

  console.log(
    `Location: ${JOOBLE_LOCATION}`
  );

  console.log(
    `Keywords: ${JOOBLE_KEYWORDS}`
  );

  console.log("");

  const allJobs = [];

  for (
    let page = 1;
    page <= 3;
    page++
  ) {
    console.log(
      `Fetching Jooble page ${page}...`
    );

    const result =
      await fetchJoobleJobs(page);

    const jobs =
      result.jobs ||
      result.results ||
      [];

    console.log(
      `Received: ${jobs.length}`
    );

    allJobs.push(
      ...jobs
    );

    if (
      jobs.length === 0
    ) {
      break;
    }
  }

  const unique =
    new Map();

  for (
    const rawJob of allJobs
  ) {
    const job =
      normalizeJob(
        rawJob
      );

    unique.set(
      job.careerId,
      job
    );
  }

  console.log("");
  console.log(
    `Total received: ${allJobs.length}`
  );

  console.log(
    `Unique jobs: ${unique.size}`
  );

  console.log("");

  const accessToken =
    await getGoogleAccessToken();

  console.log(
    "Google authentication successful."
  );

  let saved = 0;
  let failed = 0;

  const errors = [];

  for (
    const job of unique.values()
  ) {
    try {
      await saveCareer(
        accessToken,
        job
      );

      saved++;

      console.log(
        `✓ ${job.careerId} | ${job.title}`
      );
    } catch (error) {
      failed++;

      errors.push({
        careerId:
          job.careerId,

        title:
          job.title,

        error:
          error.message
      });

      console.error(
        `✗ ${job.careerId}`
      );

      console.error(
        error.message
      );
    }
  }

  const report = {
    source: "Jooble",

    project:
      FIREBASE_PROJECT_ID,

    collection:
      "careers",

    keywords:
      JOOBLE_KEYWORDS,

    location:
      JOOBLE_LOCATION,

    fetched:
      allJobs.length,

    unique:
      unique.size,

    saved,

    failed,

    errors,

    completedAt:
      new Date().toISOString()
  };

  fs.writeFileSync(
    "jooble-report.json",
    JSON.stringify(
      report,
      null,
      2
    )
  );

  console.log("");
  console.log(
    "======================================"
  );
  console.log(
    "SYNC COMPLETE"
  );
  console.log(
    "======================================"
  );

  console.log(
    `Fetched: ${allJobs.length}`
  );

  console.log(
    `Unique: ${unique.size}`
  );

  console.log(
    `Saved: ${saved}`
  );

  console.log(
    `Failed: ${failed}`
  );

  console.log(
    "======================================"
  );

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error("");
  console.error(
    "SYNC FAILED"
  );
  console.error(
    error.message
  );

  process.exit(1);
});