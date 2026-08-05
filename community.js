/* =========================================================
   LETSSTUDY PRO
   COMMUNITY.JS
   Posts + Likes + Comments + Firebase Auth + Firestore
   ========================================================= */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  auth,
  db
} from "./firebase.js";


/* =========================================================
   CONFIG
   ========================================================= */

const COMMUNITY_CONFIG = {

  postsCollection:
    "communityPosts",

  usersCollection:
    "users",

  commentsCollection:
    "comments",

  loginPage:
    "auth.html",

  profilePage:
    "profile.html",

  dashboardPage:
    "dashboard.html"

};


/* =========================================================
   STATE
   ========================================================= */

let currentUser =
  null;

let posts =
  [];

let activeCommentPost =
  null;


/* =========================================================
   HELPERS
   ========================================================= */

const $ =
  id =>
    document.getElementById(id);


function escapeHTML(
  value
){

  return String(
    value ?? ""
  )
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


function showMessage(
  message,
  type = "info"
){

  if(
    typeof window.showToast ===
    "function"
  ){

    window.showToast(
      message
    );

    return;

  }


  const box =
    $("communityMessage");


  if(box){

    box.textContent =
      message;

    box.className =
      "community-message " +
      type;

    box.style.display =
      "block";


    setTimeout(
      () => {

        box.style.display =
          "none";

      },
      3000
    );

  }

}


/* =========================================================
   FORMAT DATE
   ========================================================= */

function formatDate(
  timestamp
){

  if(!timestamp){

    return "Just now";

  }


  try{

    const date =
      timestamp.toDate
        ? timestamp.toDate()
        : new Date(
            timestamp
          );


    return new Intl.DateTimeFormat(
      "en-TZ",
      {
        dateStyle:
          "medium",

        timeStyle:
          "short"
      }
    ).format(
      date
    );

  }catch{

    return "Just now";

  }

}


/* =========================================================
   GET USER PROFILE
   ========================================================= */

async function getUserProfile(
  uid
){

  try{

    const userRef =
      doc(
        db,
        COMMUNITY_CONFIG.usersCollection,
        uid
      );


    const snapshot =
      await getDoc(
        userRef
      );


    if(
      snapshot.exists()
    ){

      return snapshot.data();

    }

  }catch(error){

    console.error(
      "Profile error:",
      error
    );

  }


  return {};

}


/* =========================================================
   LOAD POSTS
   ========================================================= */

async function loadPosts(){

  const container =
    $("communityPosts");


  try{

    if(container){

      container.innerHTML = `
        <div class="community-loading">
          Loading community...
        </div>
      `;

    }


    const postsRef =
      collection(
        db,
        COMMUNITY_CONFIG.postsCollection
      );


    const postsQuery =
      query(
        postsRef,
        orderBy(
          "createdAt",
          "desc"
        ),
        limit(50)
      );


    const snapshot =
      await getDocs(
        postsQuery
      );


    posts =
      snapshot.docs.map(
        item => ({

          id:
            item.id,

          ...item.data()

        })
      );


    renderPosts();


  }catch(error){

    console.error(
      "Posts loading error:",
      error
    );


    /*
     If index is not ready,
     try a simple query.
    */

    try{

      const fallback =
        await getDocs(
          collection(
            db,
            COMMUNITY_CONFIG.postsCollection
          )
        );


      posts =
        fallback.docs
          .map(
            item => ({

              id:
                item.id,

              ...item.data()

            })
          )
          .sort(
            (
              a,
              b
            ) =>
              getMillis(
                b.createdAt
              ) -
              getMillis(
                a.createdAt
              )
          )
          .slice(
            0,
            50
          );


      renderPosts();


    }catch(fallbackError){

      console.error(
        fallbackError
      );


      if(container){

        container.innerHTML = `
          <div class="community-error">
            Unable to load community posts.
          </div>
        `;

      }

    }

  }

}


/* =========================================================
   TIMESTAMP TO MILLISECONDS
   ========================================================= */

function getMillis(
  timestamp
){

  if(!timestamp){

    return 0;

  }


  try{

    if(
      typeof timestamp.toMillis ===
      "function"
    ){

      return timestamp.toMillis();

    }


    if(
      typeof timestamp.toDate ===
      "function"
    ){

      return timestamp.toDate()
        .getTime();

    }


    return new Date(
      timestamp
    ).getTime();

  }catch{

    return 0;

  }

}


/* =========================================================
   RENDER POSTS
   ========================================================= */

function renderPosts(){

  const container =
    $("communityPosts");


  if(!container){

    return;

  }


  if(
    !posts.length
  ){

    container.innerHTML = `
      <div class="community-empty">

        <div>
          💬
        </div>

        <h2>
          No posts yet
        </h2>

        <p>
          Be the first to start a discussion.
        </p>

      </div>
    `;

    return;

  }


  container.innerHTML =
    posts
      .map(
        post =>
          renderPost(
            post
          )
      )
      .join("");


  bindPostEvents();

}


/* =========================================================
   RENDER SINGLE POST
   ========================================================= */

function renderPost(
  post
){

  const likes =
    Array.isArray(
      post.likes
    )
      ? post.likes
      : [];


  const liked =
    currentUser &&
    likes.includes(
      currentUser.uid
    );


  const commentsCount =
    Number(
      post.commentsCount || 0
    );


  const owner =
    post.userId ===
    currentUser?.uid;


  return `
    <article
      class="community-post"
      data-post-id="${escapeHTML(
        post.id
      )}"
    >

      <div class="post-header">

        <div class="post-avatar">

          <img
            src="${
              escapeHTML(
                post.userPhoto ||
                "https://ui-avatars.com/api/?name=" +
                encodeURIComponent(
                  post.userName ||
                  "User"
                )
              )
            }"
            alt="User"
          >

        </div>


        <div class="post-user">

          <strong>
            ${escapeHTML(
              post.userName ||
              "LetsStudy User"
            )}
          </strong>

          <small>
            ${escapeHTML(
              formatDate(
                post.createdAt
              )
            )}
          </small>

        </div>


        ${
          owner
            ? `
              <button
                type="button"
                class="post-delete"
                data-delete-post="${escapeHTML(
                  post.id
                )}"
              >
                Delete
              </button>
            `
            : ""
        }

      </div>


      <div class="post-body">

        ${
          post.title
            ? `
              <h3>
                ${escapeHTML(
                  post.title
                )}
              </h3>
            `
            : ""
        }


        <p>
          ${escapeHTML(
            post.content ||
            ""
          )}
        </p>


        ${
          post.image
            ? `
              <img
                class="post-image"
                src="${escapeHTML(
                  post.image
                )}"
                alt="Post image"
                loading="lazy"
              >
            `
            : ""
        }

      </div>


      <div class="post-actions">

        <button
          type="button"
          class="${
            liked
              ? "liked"
              : ""
          }"
          data-like-post="${escapeHTML(
            post.id
          )}"
        >
          ${
            liked
              ? "❤️"
              : "🤍"
          }

          <span>
            ${likes.length}
          </span>
        </button>


        <button
          type="button"
          data-comment-post="${escapeHTML(
            post.id
          )}"
        >
          💬

          <span>
            ${commentsCount}
          </span>
        </button>

      </div>


      <div
        class="post-comments"
        id="comments-${escapeHTML(
          post.id
        )}"
        style="display:none;"
      ></div>

    </article>
  `;

}


/* =========================================================
   CREATE POST
   ========================================================= */

async function createPost(){

  if(!currentUser){

    showMessage(
      "Please login to create a post.",
      "error"
    );

    return;

  }


  const title =
    $("postTitle")
      ?.value
      .trim() ||
    "";


  const content =
    $("postContent")
      ?.value
      .trim() ||
    "";


  const image =
    $("postImage")
      ?.value
      .trim() ||
    "";


  if(!content){

    showMessage(
      "Write something before posting.",
      "error"
    );

    return;

  }


  const button =
    $("publishPostBtn");


  try{

    if(button){

      button.disabled =
        true;

      button.textContent =
        "Posting...";

    }


    const profile =
      await getUserProfile(
        currentUser.uid
      );


    const name =
      currentUser.displayName ||
      profile.displayName ||
      currentUser.email?.split("@")[0] ||
      "LetsStudy User";


    await addDoc(
      collection(
        db,
        COMMUNITY_CONFIG.postsCollection
      ),
      {

        userId:
          currentUser.uid,

        userName:
          name,

        userPhoto:
          currentUser.photoURL ||
          profile.photoURL ||
          "",

        title:
          title,

        content:
          content,

        image:
          image,

        likes:
          [],

        commentsCount:
          0,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    clearPostForm();


    showMessage(
      "Post published successfully."
    );


    await loadPosts();


  }catch(error){

    console.error(
      "Create post error:",
      error
    );


    showMessage(
      "Unable to publish post.",
      "error"
    );

  }finally{

    if(button){

      button.disabled =
        false;

      button.textContent =
        "Publish";

    }

  }

}


/* =========================================================
   CLEAR POST FORM
   ========================================================= */

function clearPostForm(){

  const title =
    $("postTitle");


  const content =
    $("postContent");


  const image =
    $("postImage");


  if(title){

    title.value =
      "";

  }


  if(content){

    content.value =
      "";

  }


  if(image){

    image.value =
      "";

  }

}


/* =========================================================
   LIKE POST
   ========================================================= */

async function toggleLike(
  postId
){

  if(!currentUser){

    showMessage(
      "Login to like posts.",
      "error"
    );

    return;

  }


  try{

    const postRef =
      doc(
        db,
        COMMUNITY_CONFIG.postsCollection,
        postId
      );


    const snapshot =
      await getDoc(
        postRef
      );


    if(
      !snapshot.exists()
    ){

      return;

    }


    const post =
      snapshot.data();


    const likes =
      Array.isArray(
        post.likes
      )
        ? post.likes
        : [];


    const alreadyLiked =
      likes.includes(
        currentUser.uid
      );


    await updateDoc(
      postRef,
      {

        likes:
          alreadyLiked
            ? arrayRemove(
                currentUser.uid
              )
            : arrayUnion(
                currentUser.uid
              )

      }
    );


    await loadPosts();

  }catch(error){

    console.error(
      "Like error:",
      error
    );


    showMessage(
      "Unable to update like.",
      "error"
    );

  }

}


/* =========================================================
   DELETE POST
   ========================================================= */

async function deletePost(
  postId
){

  if(!currentUser){

    return;

  }


  const post =
    posts.find(
      item =>
        item.id ===
        postId
    );


  if(!post){

    return;

  }


  if(
    post.userId !==
    currentUser.uid
  ){

    showMessage(
      "You can only delete your own posts.",
      "error"
    );

    return;

  }


  const confirmed =
    confirm(
      "Delete this post?"
    );


  if(!confirmed){

    return;

  }


  try{

    await deleteDoc(
      doc(
        db,
        COMMUNITY_CONFIG.postsCollection,
        postId
      )
    );


    showMessage(
      "Post deleted."
    );


    await loadPosts();

  }catch(error){

    console.error(
      "Delete post error:",
      error
    );


    showMessage(
      "Unable to delete post.",
      "error"
    );

  }

}


/* =========================================================
   LOAD COMMENTS
   ========================================================= */

async function loadComments(
  postId
){

  const container =
    $(
      "comments-" +
      postId
    );


  if(!container){

    return;

  }


  container.style.display =
    "block";


  container.innerHTML = `
    <div>
      Loading comments...
    </div>
  `;


  try{

    const commentsRef =
      collection(
        db,
        COMMUNITY_CONFIG.postsCollection,
        postId,
        COMMUNITY_CONFIG.commentsCollection
      );


    const snapshot =
      await getDocs(
        commentsRef
      );


    const comments =
      snapshot.docs
        .map(
          item => ({

            id:
              item.id,

            ...item.data()

          })
        )
        .sort(
          (
            a,
            b
          ) =>
            getMillis(
              a.createdAt
            ) -
            getMillis(
              b.createdAt
            )
        );


    renderComments(
      postId,
      comments
    );


  }catch(error){

    console.error(
      "Comments error:",
      error
    );


    container.innerHTML = `
      <div>
        Unable to load comments.
      </div>
    `;

  }

}


/* =========================================================
   RENDER COMMENTS
   ========================================================= */

function renderComments(
  postId,
  comments
){

  const container =
    $(
      "comments-" +
      postId
    );


  if(!container){

    return;

  }


  container.innerHTML = `

    <div class="comments-list">

      ${
        comments.length
          ? comments
              .map(
                comment => `

                  <div
                    class="comment"
                  >

                    <strong>
                      ${escapeHTML(
                        comment.userName ||
                        "User"
                      )}
                    </strong>

                    <p>
                      ${escapeHTML(
                        comment.content ||
                        ""
                      )}
                    </p>

                    <small>
                      ${escapeHTML(
                        formatDate(
                          comment.createdAt
                        )
                      )}
                    </small>

                  </div>

                `
              )
              .join("")
          : `
              <p>
                No comments yet.
              </p>
            `
      }

    </div>


    ${
      currentUser
        ? `
          <div class="comment-form">

            <input
              type="text"
              id="comment-input-${escapeHTML(
                postId
              )}"
              placeholder="Write a comment..."
            >

            <button
              type="button"
              data-submit-comment="${escapeHTML(
                postId
              )}"
            >
              Comment
            </button>

          </div>
        `
        : `
          <p>
            Login to comment.
          </p>
        `
    }

  `;


  const submit =
    container.querySelector(
      "[data-submit-comment]"
    );


  if(submit){

    submit.addEventListener(
      "click",
      () => {

        addComment(
          postId
        );

      }
    );

  }

}


/* =========================================================
   ADD COMMENT
   ========================================================= */

async function addComment(
  postId
){

  if(!currentUser){

    showMessage(
      "Login to comment.",
      "error"
    );

    return;

  }


  const input =
    $(
      "comment-input-" +
      postId
    );


  if(!input){

    return;

  }


  const content =
    input.value.trim();


  if(!content){

    showMessage(
      "Write a comment first.",
      "error"
    );

    return;

  }


  try{

    const profile =
      await getUserProfile(
        currentUser.uid
      );


    const name =
      currentUser.displayName ||
      profile.displayName ||
      currentUser.email?.split("@")[0] ||
      "LetsStudy User";


    const commentsRef =
      collection(
        db,
        COMMUNITY_CONFIG.postsCollection,
        postId,
        COMMUNITY_CONFIG.commentsCollection
      );


    await addDoc(
      commentsRef,
      {

        userId:
          currentUser.uid,

        userName:
          name,

        content:
          content,

        createdAt:
          serverTimestamp()

      }
    );


    const postRef =
      doc(
        db,
        COMMUNITY_CONFIG.postsCollection,
        postId
      );


    const postSnapshot =
      await getDoc(
        postRef
      );


    const oldCount =
      Number(
        postSnapshot.data()
          ?.commentsCount ||
        0
      );


    await updateDoc(
      postRef,
      {

        commentsCount:
          oldCount + 1,

        updatedAt:
          serverTimestamp()

      }
    );


    input.value =
      "";


    await loadComments(
      postId
    );


    await loadPosts();


  }catch(error){

    console.error(
      "Comment error:",
      error
    );


    showMessage(
      "Unable to add comment.",
      "error"
    );

  }

}


/* =========================================================
   BIND POST EVENTS
   ========================================================= */

function bindPostEvents(){

  document
    .querySelectorAll(
      "[data-like-post]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            toggleLike(
              button.dataset.likePost
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-comment-post]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            loadComments(
              button.dataset.commentPost
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-delete-post]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            deletePost(
              button.dataset.deletePost
            );

          }
        );

      }
    );

}