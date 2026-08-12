import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  increment,
  serverTimestamp
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   SLUG GENERATOR
========================================================= */

export function createSlug(title) {

  return String(title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

}


/* =========================================================
   CREATE FULL URL
========================================================= */

export function createPageUrl(
  path,
  slug
) {

  const cleanPath =
    String(path || "")
      .replace(/^\/+/, "");


  return new URL(
    `${cleanPath}?id=${encodeURIComponent(slug)}`,
    window.location.origin
  ).href;

}


/* =========================================================
   GET PAGE BY SLUG
========================================================= */

export async function getPageBySlug(
  db,
  slug
) {

  if (!slug) {
    return null;
  }


  const q =
    query(
      collection(
        db,
        "pageLinks"
      ),
      where(
        "slug",
        "==",
        slug
      )
    );


  const snapshot =
    await getDocs(q);


  if (
    snapshot.empty
  ) {

    return null;

  }


  const pageDoc =
    snapshot.docs[0];


  return {

    id:
      pageDoc.id,

    ...pageDoc.data()

  };

}


/* =========================================================
   GET PAGE BY DOCUMENT ID
========================================================= */

export async function getPageById(
  db,
  id
) {

  if (!id) {
    return null;
  }


  const ref =
    doc(
      db,
      "pageLinks",
      id
    );


  const snapshot =
    await getDoc(ref);


  if (
    !snapshot.exists()
  ) {

    return null;

  }


  return {

    id:
      snapshot.id,

    ...snapshot.data()

  };

}


/* =========================================================
   GET PAGE
   SUPPORTS BOTH:
   ?id=SLUG
   AND
   ?id=DOCUMENT_ID
========================================================= */

export async function getPage(
  db,
  identifier
) {

  if (!identifier) {
    return null;
  }


  /* Try document ID */

  const byId =
    await getPageById(
      db,
      identifier
    );


  if (byId) {
    return byId;
  }


  /* Try slug */

  return await getPageBySlug(
    db,
    identifier
  );

}


/* =========================================================
   CREATE PAGE LINK
========================================================= */

export async function createPageLink(
  db,
  {
    title,
    pageType = "page",
    path = "index.html",
    description = "",
    image = "",
    status = "published"
  }
) {

  if (!title) {

    throw new Error(
      "Page title is required."
    );

  }


  const slug =
    createSlug(title);


  if (!slug) {

    throw new Error(
      "Could not create a valid slug."
    );

  }


  /*
   * Check duplicate slug
   */

  const existing =
    await getPageBySlug(
      db,
      slug
    );


  if (existing) {

    return existing;

  }


  /*
   * Create URL
   */

  const shareUrl =
    createPageUrl(
      path,
      slug
    );


  /*
   * Save
   */

  const pageRef =
    await addDoc(
      collection(
        db,
        "pageLinks"
      ),
      {

        title,

        slug,

        pageType,

        path,

        shareUrl,

        description,

        image,

        status,

        views: 0,

        shares: 0,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


  return {

    id:
      pageRef.id,

    title,

    slug,

    pageType,

    path,

    shareUrl,

    description,

    image,

    status,

    views: 0,

    shares: 0

  };

}


/* =========================================================
   UPDATE PAGE LINK
========================================================= */

export async function updatePageLink(
  db,
  id,
  {
    title,
    pageType,
    path,
    description,
    image,
    status
  }
) {

  const slug =
    createSlug(title);


  const shareUrl =
    createPageUrl(
      path,
      slug
    );


  await updateDoc(
    doc(
      db,
      "pageLinks",
      id
    ),
    {

      title,

      slug,

      pageType,

      path,

      shareUrl,

      description,

      image,

      status,

      updatedAt:
        serverTimestamp()

    }
  );


  return {

    id,

    title,

    slug,

    pageType,

    path,

    shareUrl,

    description,

    image,

    status

  };

}


/* =========================================================
   TRACK VIEW
========================================================= */

export async function trackPageView(
  db,
  id
) {

  if (!id) {
    return;
  }


  try {

    await updateDoc(
      doc(
        db,
        "pageLinks",
        id
      ),
      {

        views:
          increment(1)

      }
    );

  } catch (error) {

    console.warn(
      "View tracking failed:",
      error
    );

  }

}


/* =========================================================
   TRACK SHARE
========================================================= */

export async function trackPageShare(
  db,
  id
) {

  if (!id) {
    return;
  }


  try {

    await updateDoc(
      doc(
        db,
        "pageLinks",
        id
      ),
      {

        shares:
          increment(1)

      }
    );

  } catch (error) {

    console.warn(
      "Share tracking failed:",
      error
    );

  }

}


/* =========================================================
   COPY LINK
========================================================= */

export async function copyPageLink(
  url
) {

  try {

    await navigator.clipboard.writeText(
      url
    );

    return true;

  } catch (error) {

    const input =
      document.createElement(
        "input"
      );


    input.value =
      url;


    document.body.appendChild(
      input
    );


    input.select();


    document.execCommand(
      "copy"
    );


    input.remove();


    return true;

  }

}


/* =========================================================
   NATIVE SHARE
========================================================= */

export async function sharePage(
  {
    title,
    text = "",
    url
  }
) {

  if (
    navigator.share
  ) {

    await navigator.share({

      title,

      text,

      url

    });


    return true;

  }


  await copyPageLink(
    url
  );


  return false;

}


/* =========================================================
   WHATSAPP SHARE
========================================================= */

export function whatsappShare(
  {
    title,
    url
  }
) {

  const message =
    `📚 ${title}\n\n` +
    `View on LetsStudy Pro:\n` +
    `${url}`;


  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(
      message
    )}`;


  window.open(
    whatsappUrl,
    "_blank",
    "noopener,noreferrer"
  );

}