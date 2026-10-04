const admin = require("firebase-admin");
const fs = require("fs");

const serviceAccount =
  require("../firebase-service-account.json");

admin.initializeApp({
  credential:
    admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const collections = [
  "courses",
  "scholarships",
  "careers",
  "resources",
  "blog"
];

const stateFile =
  "notification-state.json";

function loadState() {

  if (!fs.existsSync(stateFile)) {
    return {};
  }

  return JSON.parse(
    fs.readFileSync(stateFile, "utf8")
  );
}

function saveState(state) {

  fs.writeFileSync(
    stateFile,
    JSON.stringify(state, null, 2)
  );
}

function getTitle(collection) {

  const titles = {
    courses: "New Course Available",
    scholarships: "New Scholarship Available",
    careers: "New Job Opportunity",
    resources: "New Resource Available",
    blog: "New Article Available"
  };

  return titles[collection] ||
    "New LetsStudy Pro Update";
}

function getUrl(collection) {

  const urls = {
    courses: "/courses.html",
    scholarships: "/scholarships.html",
    careers: "/careers.html",
    resources: "/resources.html",
    blog: "/blog.html"
  };

  return urls[collection] ||
    "/";
}

async function sendNotifications() {

  const state = loadState();

  const tokensSnapshot =
    await db.collection("pushTokens").get();

  const tokens =
    tokensSnapshot.docs.map(
      doc => doc.id
    );

  if (!tokens.length) {

    console.log(
      "No subscribed browsers."
    );

    return;
  }

  for (const collection of collections) {

    const snapshot =
      await db.collection(collection).get();

    if (!state[collection]) {

      state[collection] =
        snapshot.docs.map(
          doc => doc.id
        );

      console.log(
        `Initial ${collection} baseline created.`
      );

      continue;
    }

    const oldIds =
      new Set(state[collection]);

    const newDocs =
      snapshot.docs.filter(
        doc => !oldIds.has(doc.id)
      );

    for (const newDoc of newDocs) {

      const id = newDoc.id;
      const data = newDoc.data();

      const title =
        data.title ||
        data.name ||
        data.courseTitle ||
        data.jobTitle ||
        getTitle(collection);

      const body =
        `New ${collection} update is now available on LetsStudy Pro.`;

      const message = {

        notification: {
          title: title,
          body: body
        },

        data: {
          recordId: id,
          collection: collection,
          url: getUrl(collection)
        }
      };

      for (const token of tokens) {

        try {

          await admin
            .messaging()
            .send({
              ...message,
              token: token
            });

          console.log(
            `Sent ${collection}/${id}`
          );

        } catch (error) {

          console.error(
            `Failed ${collection}/${id}:`,
            error.message
          );
        }
      }

      state[collection].push(id);
    }
  }

  saveState(state);

  console.log(
    "Notification scan completed."
  );
}

sendNotifications()
  .catch(error => {

    console.error(error);

    process.exit(1);
  });