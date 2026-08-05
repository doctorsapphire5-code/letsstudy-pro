/* =========================================================
   LETSSTUDY PRO
   COURSE.JS
   Course Details + Lessons + Enrollment + Progress + Cart
   ========================================================= */

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  setDoc,
  serverTimestamp,
  updateDoc
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

const COURSE_CONFIG = {

  coursesCollection:
    "courses",

  lessonsCollection:
    "lessons",

  enrollmentsCollection:
    "enrollments",

  progressCollection:
    "progress",

  defaultImage:
    "https://placehold.co/800x450?text=LetsStudy+Pro"

};


/* =========================================================
   HELPERS
   ========================================================= */

const $ =
  id =>
    document.getElementById(id);


function getCourseId(){

  const params =
    new URLSearchParams(
      window.location.search
    );


  return (
    params.get("id") ||
    params.get("courseId") ||
    document.body.dataset.courseId ||
    null
  );

}


function escapeHTML(
  value
){

  if(value === null ||
     value === undefined){

    return "";

  }


  return String(value)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


function money(
  value
){

  const price =
    Number(
      value || 0
    );


  return new Intl.NumberFormat(
    "en-TZ",
    {
      style:"currency",
      currency:"TZS",
      maximumFractionDigits:0
    }
  ).format(
    price
  );

}


function notify(
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
   LOAD COURSE
   ========================================================= */

async function loadCourse(){

  const courseId =
    getCourseId();


  if(!courseId){

    showEmpty(
      "Course not found."
    );

    return;

  }


  try{

    showLoading();


    const courseRef =
      doc(
        db,
        COURSE_CONFIG.coursesCollection,
        courseId
      );


    const snapshot =
      await getDoc(
        courseRef
      );


    if(
      !snapshot.exists()
    ){

      showEmpty(
        "This course does not exist."
      );

      return;

    }


    const course = {

      id:
        snapshot.id,

      ...snapshot.data()

    };


    window.currentCourse =
      course;


    renderCourse(
      course
    );


    await loadLessons(
      courseId
    );


    await checkEnrollment(
      courseId
    );


  }catch(error){

    console.error(
      "Course loading error:",
      error
    );


    showEmpty(
      "Unable to load course."
    );

  }

}


/* =========================================================
   LOADING
   ========================================================= */

function showLoading(){

  const title =
    $("courseTitle");


  if(title){

    title.textContent =
      "Loading course...";

  }


  const content =
    $("courseContent");


  if(content){

    content.innerHTML = `
      <div class="course-loading">
        Loading course information...
      </div>
    `;

  }

}


/* =========================================================
   EMPTY
   ========================================================= */

function showEmpty(
  text
){

  const content =
    $("courseContent");


  if(content){

    content.innerHTML = `
      <div class="course-empty">
        <div class="course-empty-icon">
          📚
        </div>

        <h2>
          ${escapeHTML(text)}
        </h2>

        <a
          href="courses.html"
          class="btn btn-primary"
        >
          Browse Courses
        </a>
      </div>
    `;

  }

}


/* =========================================================
   RENDER COURSE
   ========================================================= */

function renderCourse(
  course
){

  const title =
    course.title ||
    course.name ||
    "Untitled Course";


  const description =
    course.description ||
    "No course description available.";


  const instructor =
    course.instructorName ||
    course.instructor ||
    "LetsStudy Pro";


  const category =
    course.category ||
    "Education";


  const image =
    course.image ||
    course.thumbnail ||
    COURSE_CONFIG.defaultImage;


  const price =
    Number(
      course.price || 0
    );


  const rating =
    Number(
      course.rating || 0
    );


  const students =
    Number(
      course.students ||
      course.enrolled ||
      0
    );


  document.title =
    title +
    " | LetsStudy Pro";


  const titleElement =
    $("courseTitle");


  if(titleElement){

    titleElement.textContent =
      title;

  }


  const descriptionElement =
    $("courseDescription");


  if(descriptionElement){

    descriptionElement.textContent =
      description;

  }


  const instructorElement =
    $("courseInstructor");


  if(instructorElement){

    instructorElement.textContent =
      instructor;

  }


  const categoryElement =
    $("courseCategory");


  if(categoryElement){

    categoryElement.textContent =
      category;

  }


  const imageElement =
    $("courseImage");


  if(imageElement){

    imageElement.src =
      image;

    imageElement.alt =
      title;

  }


  const priceElement =
    $("coursePrice");


  if(priceElement){

    priceElement.textContent =
      price <= 0
        ? "Free"
        : money(price);

  }


  const ratingElement =
    $("courseRating");


  if(ratingElement){

    ratingElement.textContent =
      rating > 0
        ? rating.toFixed(1)
        : "New";

  }


  const studentsElement =
    $("courseStudents");


  if(studentsElement){

    studentsElement.textContent =
      students +
      " students";

  }


  const addButton =
    $("addToCartBtn");


  if(addButton){

    addButton.onclick =
      () => addCourseToCart(
        course
      );

  }


  const enrollButton =
    $("enrollBtn");


  if(enrollButton){

    enrollButton.onclick =
      () => enrollCourse(
        course
      );

  }


  const content =
    $("courseContent");


  if(content){

    content.dataset.loaded =
      "true";

  }

}


/* =========================================================
   LOAD LESSONS
   ========================================================= */

async function loadLessons(
  courseId
){

  const container =
    $("lessonsList");


  if(!container){

    return;

  }


  try{

    const lessonsRef =
      collection(
        db,
        COURSE_CONFIG.lessonsCollection
      );


    let snapshot;


    try{

      const lessonQuery =
        query(
          lessonsRef,
          where(
            "courseId",
            "==",
            courseId
          ),
          orderBy(
            "order",
            "asc"
          )
        );


      snapshot =
        await getDocs(
          lessonQuery
        );


    }catch(error){

      console.warn(
        "Ordered lesson query failed. Loading without order.",
        error
      );


      const lessonQuery =
        query(
          lessonsRef,
          where(
            "courseId",
            "==",
            courseId
          )
        );


      snapshot =
        await getDocs(
          lessonQuery
        );

    }


    const lessons =
      snapshot.docs
        .map(
          docSnap => ({

            id:
              docSnap.id,

            ...docSnap.data()

          })
        )
        .sort(
          (a,b) =>
            Number(a.order || 0) -
            Number(b.order || 0)
        );


    window.currentLessons =
      lessons;


    renderLessons(
      lessons
    );


    updateLessonCount(
      lessons.length
    );


  }catch(error){

    console.error(
      "Lessons error:",
      error
    );


    container.innerHTML = `
      <div class="course-empty">
        Lessons are currently unavailable.
      </div>
    `;

  }

}


/* =========================================================
   RENDER LESSONS
   ========================================================= */

function renderLessons(
  lessons
){

  const container =
    $("lessonsList");


  if(!container){

    return;

  }


  if(!lessons.length){

    container.innerHTML = `
      <div class="course-empty">
        <div>📖</div>
        <p>No lessons available yet.</p>
      </div>
    `;

    return;

  }


  container.innerHTML =
    lessons
      .map(
        (lesson,index) => {

          const title =
            lesson.title ||
            `Lesson ${index + 1}`;


          const duration =
            lesson.duration ||
            "";


          const locked =
            lesson.free === true
              ? false
              : true;


          return `
            <div
              class="lesson-item"
              data-lesson-id="${escapeHTML(lesson.id)}"
            >

              <div class="lesson-number">
                ${index + 1}
              </div>

              <div class="lesson-info">

                <strong>
                  ${escapeHTML(title)}
                </strong>

                ${
                  duration
                    ? `<span>${escapeHTML(duration)}</span>`
                    : ""
                }

              </div>

              <div class="lesson-action">

                ${
                  locked
                    ? "🔒"
                    : "▶️"
                }

              </div>

            </div>
          `;

        }
      )
      .join("");


  container
    .querySelectorAll(
      ".lesson-item"
    )
    .forEach(
      element => {

        element.addEventListener(
          "click",
          function(){

            openLesson(
              element.dataset.lessonId
            );

          }
        );

      }
    );

}


/* =========================================================
   LESSON COUNT
   ========================================================= */

function updateLessonCount(
  count
){

  $$safe(
    "[data-lesson-count]"
  )
    .forEach(
      element => {

        element.textContent =
          count;

      }
    );

}


/* =========================================================
   SAFE QUERY SELECTOR ALL
   ========================================================= */

function $$safe(
  selector
){

  return document.querySelectorAll(
    selector
  );

}


/* =========================================================
   OPEN LESSON
   ========================================================= */

function openLesson(
  lessonId
){

  const courseId =
    getCourseId();


  if(!lessonId){

    return;

  }


  window.location.href =
    "learning.html" +
    "?courseId=" +
    encodeURIComponent(
      courseId
    ) +
    "&lessonId=" +
    encodeURIComponent(
      lessonId
    );

}


/* =========================================================
   CHECK ENROLLMENT
   ========================================================= */

async function checkEnrollment(
  courseId
){

  const user =
    auth.currentUser;


  if(!user){

    return false;

  }


  try{

    const enrollmentRef =
      doc(
        db,
        COURSE_CONFIG.enrollmentsCollection,
        `${user.uid}_${courseId}`
      );


    const snapshot =
      await getDoc(
        enrollmentRef
      );


    const enrolled =
      snapshot.exists();


    updateEnrollmentUI(
      enrolled
    );


    return enrolled;

  }catch(error){

    console.error(
      "Enrollment check error:",
      error
    );

    return false;

  }

}


/* =========================================================
   ENROLL
   ========================================================= */

async function enrollCourse(
  course
){

  const user =
    auth.currentUser;


  if(!user){

    sessionStorage.setItem(
      "letsStudyReturnUrl",
      window.location.href
    );


    window.location.href =
      "auth.html";


    return;

  }


  const courseId =
    course.id;


  try{

    const enrollmentRef =
      doc(
        db,
        COURSE_CONFIG.enrollmentsCollection,
        `${user.uid}_${courseId}`
      );


    const existing =
      await getDoc(
        enrollmentRef
      );


    if(existing.exists()){

      window.location.href =
        "learning.html?courseId=" +
        encodeURIComponent(
          courseId
        );

      return;

    }


    await setDoc(
      enrollmentRef,
      {

        userId:
          user.uid,

        courseId:
          courseId,

        courseTitle:
          course.title ||
          course.name ||
          "",

        status:
          "active",

        progress:
          0,

        enrolledAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


    updateEnrollmentUI(
      true
    );


    notify(
      "You are now enrolled in this course."
    );


    setTimeout(
      function(){

        window.location.href =
          "learning.html?courseId=" +
          encodeURIComponent(
            courseId
          );

      },
      700
    );


  }catch(error){

    console.error(
      "Enrollment error:",
      error
    );


    notify(
      "Unable to enroll in this course."
    );

  }

}


/* =========================================================
   ENROLLMENT UI
   ========================================================= */

function updateEnrollmentUI(
  enrolled
){

  const enrollButton =
    $("enrollBtn");


  const cartButton =
    $("addToCartBtn");


  if(enrollButton){

    if(enrolled){

      enrollButton.textContent =
        "Continue Learning";

      enrollButton.onclick =
        function(){

          window.location.href =
            "learning.html?courseId=" +
            encodeURIComponent(
              getCourseId()
            );

        };

    }else{

      enrollButton.textContent =
        "Enroll Now";

    }

  }


  if(enrolled &&
     cartButton){

    cartButton.style.display =
      "none";

  }

}


/* =========================================================
   ADD COURSE TO CART
   ========================================================= */

function addCourseToCart(
  course
){

  if(
    typeof window.addToCart ===
    "function"
  ){

    const added =
      window.addToCart({

        id:
          course.id,

        title:
          course.title ||
          course.name,

        price:
          course.price || 0,

        image:
          course.image ||
          course.thumbnail,

        type:
          "course"

      });


    if(added){

      const button =
        $("addToCartBtn");


      if(button){

        button.textContent =
          "Added to Cart";

      }

    }


    return;

  }


  /* Fallback */

  let cart = [];


  try{

    cart =
      JSON.parse(
        localStorage.getItem(
          "letsStudyCart"
        )
      ) || [];

  }catch{

    cart = [];

  }


  const exists =
    cart.some(
      item =>
        item.id ===
        course.id
    );


  if(exists){

    notify(
      "Course is already in your cart."
    );

    return;

  }


  cart.push({

    id:
      course.id,

    title:
      course.title ||
      course.name ||
      "Course",

    price:
      Number(
        course.price || 0
      ),

    image:
      course.image ||
      course.thumbnail ||
      "",

    type:
      "course",

    quantity:
      1

  });


  localStorage.setItem(
    "letsStudyCart",
    JSON.stringify(
      cart
    )
  );


  notify(
    "Course added to cart."
  );

}


/* =========================================================
   COURSE PROGRESS
   ========================================================= */

async function getCourseProgress(
  courseId
){

  const user =
    auth.currentUser;


  if(
    !user ||
    !courseId
  ){

    return 0;

  }


  try{

    const progressRef =
      doc(
        db,
        COURSE_CONFIG.progressCollection,
        `${user.uid}_${courseId}`
      );


    const snapshot =
      await getDoc(
        progressRef
      );


    if(!snapshot.exists()){

      return 0;

    }


    return Number(
      snapshot.data().percentage ||
      snapshot.data().progress ||
      0
    );

  }catch(error){

    console.error(
      "Progress error:",
      error
    );


    return 0;

  }

}


/* =========================================================
   SAVE LESSON PROGRESS
   ========================================================= */

async function saveLessonProgress(
  courseId,
  lessonId,
  completed
){

  const user =
    auth.currentUser;


  if(
    !user ||
    !courseId ||
    !lessonId
  ){

    return false;

  }


  try{

    const progressRef =
      doc(
        db,
        COURSE_CONFIG.progressCollection,
        `${user.uid}_${courseId}`
      );


    const old =
      await getDoc(
        progressRef
      );


    let completedLessons =
      [];


    if(old.exists()){

      completedLessons =
        old.data()
          .completedLessons ||
        [];

    }


    if(
      completed &&
      !completedLessons.includes(
        lessonId
      )
    ){

      completedLessons.push(
        lessonId
      );

    }


    if(
      !completed &&
      completedLessons.includes(
        lessonId
      )
    ){

      completedLessons =
        completedLessons.filter(
          id =>
            id !== lessonId
        );

    }


    const totalLessons =
      (
        window.currentLessons ||
        []
      ).length;


    const percentage =
      totalLessons
        ? Math.round(
            (
              completedLessons.length /
              totalLessons
            ) * 100
          )
        : 0;


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


    updateProgressUI(
      percentage
    );


    return true;

  }catch(error){

    console.error(
      "Save progress error:",
      error
    );


    return false;

  }

}


/* =========================================================
   UPDATE PROGRESS UI
   ========================================================= */

function updateProgressUI(
  percentage
){

  $$safe(
    "[data-course-progress]"
  )
    .forEach(
      element => {

        element.textContent =
          percentage +
          "%";

      }
    );


  $$safe(
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
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    window.currentUser =
      user || null;


    if(user){

      const courseId =
        getCourseId();


      if(courseId){

        await checkEnrollment(
          courseId
        );


        const progress =
          await getCourseProgress(
            courseId
          );


        updateProgressUI(
          progress
        );

      }

    }

  }
);


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function(){

    loadCourse();

  }
);


/* ===============================================
   GLOBAL COURSE API
   =============================================== */

window.LetsStudyCourse = {

  loadCourse,

  loadLessons,

  enrollCourse,

  addCourseToCart,

  checkEnrollment,

  getCourseProgress,

  saveLessonProgress,

  updateProgressUI,

  openLesson

};


/* ===============================================
   COURSE PAGE READY
   =============================================== */

console.log(
  "LetsStudy Pro Course System ready."
);