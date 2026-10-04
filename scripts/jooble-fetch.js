const fs = require("fs");

const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

const JOOBLE_KEYWORDS = process.env.JOOBLE_KEYWORDS || "jobs";
const JOOBLE_LOCATION = process.env.JOOBLE_LOCATION || "Tanzania";

if (!JOOBLE_API_KEY) {
  throw new Error("JOOBLE_API_KEY secret is missing.");
}

if (!FIREBASE_PROJECT_ID) {
  throw new Error("FIREBASE_PROJECT_ID is missing.");
}

if (!FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT secret is missing.");
}

const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);

let accessToken = null;

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };

  const crypto = require("crypto");

  function base64url(obj) {
    return Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  }

  const unsignedToken =
    `${base64url(header)}.${base64url(payload)}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);

  const signature = signer
    .sign(serviceAccount.private_key, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${unsignedToken}.${signature}`;

  const response = await fetch(
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body:
        `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${encodeURIComponent(jwt)}`
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google OAuth failed: ${error}`);
  }

  const data = await response.json();

  accessToken = data.access_token;

  return accessToken;
}

async function joobleRequest(page = 1) {
  const url =
    `https://jooble.org/api/${JOOBLE_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      keywords: JOOBLE_KEYWORDS,
      location: JOOBLE_LOCATION,
      page
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Jooble API failed (${response.status}): ${error}`
    );
  }

  return await response.json();
}

function cleanText(value) {
  if (!value) return "";

  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function makeCareerId(item) {
  const sourceId =
    item.id ||
    item.jobId ||
    item.link ||
    item.url ||
    `${item.title}-${item.company}-${item.location}`;

  return cryptoHash(String(sourceId));
}

function cryptoHash(value) {
  const crypto = require("crypto");

  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex")
    .substring(0, 24);
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  return {
    stringValue: String(value)
  };
}

function makeFirestoreDocument(job) {
  const now = new Date().toISOString();

  const careerId = makeCareerId(job);

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
    "";

  const description =
    cleanText(
      job.description ||
      job.snippet ||
      ""
    );

  const category =
    job.category ||
    "Jobs";

  const salary =
    job.salary ||
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
    careerId: toFirestoreValue(careerId),

    title: toFirestoreValue(title),

    company: toFirestoreValue(company),

    companyName: toFirestoreValue(company),

    location: toFirestoreValue(location),

    type: toFirestoreValue(type),

    jobType: toFirestoreValue(type),

    category: toFirestoreValue(category),

    field: toFirestoreValue(category),

    description: toFirestoreValue(description),

    salary: toFirestoreValue(salary),

    applicationUrl: toFirestoreValue(applicationUrl),

    url: toFirestoreValue(applicationUrl),

    source: toFirestoreValue("Jooble"),

    sourceJobId: toFirestoreValue(
      String(sourceJobId)
    ),

    status: toFirestoreValue("active"),

    featured: toFirestoreValue(false),

    updatedAt: {
      timestampValue: now
    },

    createdAt: {
      timestampValue: now
    }
  };
}

async function saveToFirestore(careerId, fields) {
  const token = await getAccessToken();

  const documentUrl =
    `https://firestore.googleapis.com/v1/projects/` +
    `${FIREBASE_PROJECT_ID}/databases/(default)/documents/careers/${careerId}`;

  const response = await fetch(documentUrl, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      fields
    })
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Firestore failed for ${careerId}: ${error}`
    );
  }

  return await response.json();
}

async function main() {
  console.log("======================================");
  console.log("LetsStudy Pro - Jooble Jobs Sync");
  console.log("======================================");

  console.log(
    `Keywords: ${JOOBLE_KEYWORDS}`
  );

  console.log(
    `Location: ${JOOBLE_LOCATION}`
  );

  const jobs = [];

  for (let page = 1; page <= 3; page++) {
    console.log(
      `Fetching Jooble page ${page}...`
    );

    const result =
      await joobleRequest(page);

    const pageJobs =
      result.jobs ||
      result.results ||
      [];

    console.log(
      `Jobs received: ${pageJobs.length}`
    );

    jobs.push(...pageJobs);

    if (pageJobs.length === 0) {
      break;
    }
  }

  const uniqueJobs = new Map();

  for (const job of jobs) {
    const careerId =
      makeCareerId(job);

    uniqueJobs.set(
      careerId,
      job
    );
  }

  console.log(
    `Unique jobs: ${uniqueJobs.size}`
  );

  let saved = 0;
  let failed = 0;

  for (const [careerId, job] of uniqueJobs) {
    try {
      const fields =
        makeFirestoreDocument(job);

      await saveToFirestore(
        careerId,
        fields
      );

      saved++;

      console.log(
        `Saved: ${job.title || "Untitled"}`
      );

    } catch (error) {
      failed++;

      console.error(
        `Failed: ${careerId}`
      );

      console.error(
        error.message
      );
    }
  }

  const report = {
    source: "Jooble",
    keywords: JOOBLE_KEYWORDS,
    location: JOOBLE_LOCATION,
    fetched: jobs.length,
    unique: uniqueJobs.size,
    saved,
    failed,
    timestamp: new Date().toISOString()
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
  console.log("======================================");
  console.log("SYNC COMPLETE");
  console.log("======================================");
  console.log(`Fetched: ${jobs.length}`);
  console.log(`Unique: ${uniqueJobs.size}`);
  console.log(`Saved: ${saved}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});