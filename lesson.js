/* =========================================================
   LETSSTUDY PRO
   LESSON.JS
   Lesson Viewer + Access + Progress
   ========================================================= */

import {
  doc,
  getDoc,
  setDoc,
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

const LESSON_CONFIG = {

  lessons:
    "lessons",

  courses:
    "courses",

  enrollments:
    "enrollments",

  progress:
    "progress"

};


/* =========================================================
   HELPERS
   ========================================================= */

const $ = id =>
  document.getElementById(id);


function params(){

  return new URLSearchParams(
    window.location.search
  );

}


function getLessonId(){

  return (
    params().get("lessonId") ||
    params().get("id")
  );

}


function getCourseId(){

  return (
    params().get("courseId") ||
    document.body.dataset.courseId ||
    null
  );

}


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


function toast(
  text
){

  if(
    typeof window.showToast ===
    "function"
  ){

    window.showToast(
      text
    );

  }else{

    alert(text);

  }

}


/* =========================================================
   LOAD LESSON
   ========================================================= */

async function loadLesson(){

  const lessonId =
    getLessonId();


  const courseId =
    getCourseId();


  if(!lessonId){

    showError(
      "Lesson not found."
    );

    return;

  }


  try{

    showLoading();


    const lessonRef =
      doc(
        db,
        LESSON_CONFIG.lessons,
        lessonId
      );


    const snapshot =
      await getDoc(
        lessonRef
      );


    if(
      !snapshot.exists()
    ){

      showError(
        "This lesson does not exist."
      );

      return;

    }


    const lesson = {

      id:
        snapshot.id,

      ...snapshot.data()

    };


    window.currentLesson =
      lesson;


    const finalCourseId =
      courseId ||
      lesson.courseId ||
      null;


    if(
      finalCourseId
    ){

      window.currentCourseId =
        finalCourseId;

    }


    const allowed =
      await checkAccess(
        lesson,
        finalCourseId
      );


    if(!allowed){

      return;

    }


    renderLesson(
      lesson
    );


    await loadProgress(
      finalCourseId,
      lessonId
    );


  }catch(error){

    console.error(
      "Lesson loading error:",
      error
    );


    showError(
      "Unable to load this lesson."
    );

  }

}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading(){

  const title =
    $("lessonTitle");


  if(title){

    title.textContent =
      "Loading lesson...";

  }


  const content =
    $("lessonContent");


  if(content){

    content.innerHTML = `
      <div class="lesson-loading">
        Loading lesson...
      </div>
    `;

  }

}


/* =========================================================
   ERROR
   ========================================================= */

function showError(
  text
){

  const content =
    $("lessonContent");


  if(content){

    content.innerHTML = `
      <div class="lesson-error">

        <div class="lesson-error-icon">
          ⚠️
        </div>

        <h2>
          ${escapeHTML(text)}
        </h2>

        <a
          href="courses.html"
          class="btn btn-primary"
        >
          Back to Courses
        </a>

      </div>
    `;

  }

}


/* =========================================================
   CHECK ACCESS
   ========================================================= */

async function checkAccess(
  lesson,
  courseId
){

  const user =
    auth.currentUser;


  /*
   Free lessons can be viewed
   without authentication.
  */

  if(
    lesson.free === true ||
    lesson.isFree === true
  ){

    return true;

  }


  /*
   User must login for protected lessons.
  */

  if(!user){

    sessionStorage.setItem(
      "letsStudyReturnUrl",
      window.location.href
    );


    showError(
      "Please login to access this lesson."
    );


    setTimeout(
      function(){

        window.location.href =
          "auth.html";

      },
      1000
    );


    return false;

  }


  /*
   Course ID is required for enrollment.
  */

  if(!courseId){

    showError(
      "Course information is missing."
    );

    return false;

  }


  try{

    const enrollmentRef =
      doc(
        db,
        LESSON_CONFIG.enrollments,
        `${user.uid}_${courseId}`
      );


    const snapshot =
      await getDoc(
        enrollmentRef
      );


    if(
      !snapshot.exists()
    ){

      showError(
        "You are not enrolled in this course."
      );


      setTimeout(
        function(){

          window.location.href =
            "course.html?id=" +
            encodeURIComponent(
              courseId
            );

        },
        1200
      );


      return false;

    }


    return true;

  }catch(error){

    console.error(
      "Access check error:",
      error
    );


    showError(
      "Unable to verify your course access."
    );


    return false;

  }

}


/* =========================================================
   RENDER LESSON
   ========================================================= */

function renderLesson(
  lesson
){

  const title =
    lesson.title ||
    "Untitled Lesson";


  document.title =
    title +
    " | LetsStudy Pro";


  const titleElement =
    $("lessonTitle");


  if(titleElement){

    titleElement.textContent =
      title;

  }


  const description =
    $("lessonDescription");


  if(description){

    description.textContent =
      lesson.description ||
      "";

  }


  const content =
    $("lessonContent");


  if(!content){

    return;

  }


  /*
   If the page already contains
   a video/PDF container, don't
   destroy the layout.
  */

  const media =
    $("lessonMedia");


  if(media){

    renderMedia(
      media,
      lesson
    );

  }else{

    content.innerHTML = `
      <div
        id="lessonMedia"
        class="lesson-media"
      ></div>

      <div
        class="lesson-text"
        id="lessonText"
      ></div>
    `;


    renderMedia(
      $("lessonMedia"),
      lesson
    );

  }


  renderText(
    lesson
  );


  const completeButton =
    $("completeLessonBtn");


  if(completeButton){

    completeButton.onclick =
      function(){

        completeLesson();

      };

  }


  const nextButton =
    $("nextLessonBtn");


  if(nextButton){

    nextButton.onclick =
      function(){

        goNextLesson();

      };

  }

}


/* =========================================================
   RENDER MEDIA
   ========================================================= */

function renderMedia(
  container,
  lesson
){

  if(!container){

    return;

  }


  const video =
    lesson.videoUrl ||
    lesson.video ||
    lesson.videoURL;


  const pdf =
    lesson.pdfUrl ||
    lesson.pdf ||
    lesson.fileUrl;


  const image =
    lesson.image ||
    lesson.thumbnail;


  if(video){

    const safeVideo =
      escapeHTML(
        video
      );


    container.innerHTML = `
      <div class="video-wrapper">

        <video
          id="lessonVideo"
          controls
          playsinline
          preload="metadata"
        >
          <source
            src="${safeVideo}"
            type="video/mp4"
          >

          Your browser does not support video.
        </video>

      </div>
    `;


    return;

  }


  if(pdf){

    const safePdf =
      escapeHTML(
        pdf
      );


    container.innerHTML = `
      <div class="pdf-wrapper">

        <iframe
          src="${safePdf}"
          title="Lesson PDF"
          loading="lazy"
        ></iframe>

        <a
          href="${safePdf}"
          target="_blank"
          rel="noopener"
          class="btn btn-primary"
        >
          Open PDF
        </a>

      </div>
    `;


    return;

  }


  if(image){

    container.innerHTML = `
      <img
        src="${escapeHTML(image)}"
        alt="${escapeHTML(
          lesson.title || "Lesson"
        )}"
        class="lesson-image"
      >
    `;


    return;

  }


  container.innerHTML = `
    <div class="lesson-no-media">
      📚
      <p>
        This lesson has no media file.
      </p>
    </div>
  `;

}


/* =========================================================
   RENDER TEXT
   ========================================================= */

function renderText(
  lesson
){

  const container =
    $("lessonText");


  if(!container){

    return;

  }


  const text =
    lesson.content ||
    lesson.body ||
    lesson.notes ||
    "";


  if(!text){

    container.innerHTML =
      "";

    return;

  }


  /*
   The content should ideally
   be stored as plain text.
  */

  container.textContent =
    text;

}


/* =========================================================
   LOAD PROGRESS
   ========================================================= */

async function loadProgress(
  courseId,
  lessonId
){

  const user =
    auth.currentUser;


  if(
    !user ||
    !courseId
  ){

    return;

  }


  try{

    const progressRef =
      doc(
        db,
        LESSON_CONFIG.progress,
        `${user.uid}_${courseId}`
      );


    const snapshot =
      await getDoc(
        progressRef
      );


    if(
      !snapshot.exists()
    ){

      return;

    }


    const data =
      snapshot.data();


    const completed =
      (
        data.completedLessons ||
        []
      ).includes(
        lessonId
      );


    updateCompletedUI(
      completed
    );


    updateProgress(
      Number(
        data.percentage ||
        0
      )
    );


  }catch(error){

    console.error(
      "Progress loading error:",
      error
    );

  }

}


/* =========================================================
   COMPLETE LESSON
   ========================================================= */

async function completeLesson(){

  const user =
    auth.currentUser;


  const lesson =
    window.currentLesson;


  const courseId =
    window.currentCourseId ||
    getCourseId();


  if(!user){

    toast(
      "Please login first."
    );

    return;

  }


  if(
    !lesson ||
    !courseId
  ){

    toast(
      "Lesson information is missing."
    );

    return;

  }


  try{

    const progressRef =
      doc(
        db,
        LESSON_CONFIG.progress,
        `${user.uid}_${courseId}`
      );


    const snapshot =
      await getDoc(
        progressRef
      );


    let completedLessons =
      [];


    if(
      snapshot.exists()
    ){

      completedLessons =
        snapshot.data()
          .completedLessons ||
        [];

    }


    if(
      !completedLessons.includes(
        lesson.id
      )
    ){

      completedLessons.push(
        lesson.id
      );

    }


    const total =
      Number(
        window.courseLessonCount ||
        0
      );


    /*
     If total lesson count is
     unavailable, keep progress
     as completed indicator.
    */

    let percentage =
      100;


    if(total > 0){

      percentage =
        Math.min(
          100,
          Math.round(
            (
              completedLessons.length /
              total
            ) * 100
          )
        );

    }


    await setDoc(
      progressRef,
      {

        userId:
          user.uid,

        courseId,

        completedLessons,

        percentage,

        updatedAt:
          serverTimestamp()

      },
      {
        merge:true
      }
    );


    updateCompletedUI(
      true
    );


    updateProgress(
      percentage
    );


    toast(
      "Lesson completed!"
    );


  }catch(error){

    console.error(
      "Complete lesson error:",
      error
    );


    toast(
      "Unable to save progress."
    );

  }

}


/* =========================================================
   COMPLETED UI
   ========================================================= */

function updateCompletedUI(
  completed
){

  const button =
    $("completeLessonBtn");


  if(button){

    button.textContent =
      completed
        ? "✓ Completed"
        : "Mark as Complete";


    button.classList.toggle(
      "completed",
      completed
    );

  }

}


/* =========================================================
   PROGRESS UI
   ========================================================= */

function updateProgress(
  percentage
){

  document
    .querySelectorAll(
      "[data-course-progress]"
    )
    .forEach(
      element => {

        element.textContent =
          percentage +
          "%";

      }
    );


  document
    .querySelectorAll(
      "[data-progress-bar]"
    )
    .forEach(
      element => {

        element.style.width =
          percentage +
          "%";

      }
    );

}


/* =========================================================
   NEXT LESSON
   ========================================================= */

function goNextLesson(){

  const courseId =
    window.currentCourseId ||
    getCourseId();


  if(!courseId){

    return;

  }


  /*
   The next lesson ID can be
   supplied directly by course page.
  */

  const nextLessonId =
    document.body.dataset.nextLesson;


  if(nextLessonId){

    window.location.href =
      "lesson.html?courseId=" +
      encodeURIComponent(
        courseId
      ) +
      "&lessonId=" +
      encodeURIComponent(
        nextLessonId
      );

    return;

  }


  toast(
    "This is the last lesson or the next lesson is not available."
  );

}


/* =========================================================
   VIDEO PROGRESS
   ========================================================= */

function initVideoProgress(){

  const video =
    $("lessonVideo");


  if(!video){

    return;

  }


  let savedSeconds =
    0;


  video.addEventListener(
    "timeupdate",
    function(){

      const duration =
        video.duration;


      if(
        !duration ||
        !isFinite(duration)
      ){

        return;

      }


      const percentage =
        Math.round(
          (
            video.currentTime /
            duration
          ) * 100
        );


      const progress =
        Math.min(
          99,
          percentage
        );


      const element =
        $("lessonVideoProgress");


      if(element){

        element.textContent =
          progress +
          "%";

      }


      /*
       Automatically complete
       the lesson when video reaches
       90%.
      */

      if(
        percentage >= 90 &&
        !savedSeconds
      ){

        savedSeconds =
          1;

        completeLesson();

      }

    }
  );

}


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    window.currentUser =
      user || null;


    if(
      user &&
      window.currentLesson
    ){

      await loadProgress(

        window.currentCourseId ||
        getCourseId(),

        window.currentLesson.id

      );

    }

  }
);


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function(){

    loadLesson();

    /*
     Wait for the lesson
     renderer to create video.
    */

    setTimeout(
      initVideoProgress,
      700
    );

  }
);


/* =========================================================
   GLOBAL API
   ========================================================= */

window.LetsStudyLesson = {

  loadLesson,

  checkAccess,

  completeLesson,

  loadProgress,

  updateProgress,

  goNextLesson

};


console.log(
  "LetsStudy Pro Lesson System ready."
);