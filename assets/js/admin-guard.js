import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  auth,
  db
} from "./firebase.js";


const ADMIN_ROLES = [
  "admin",
  "superadmin",
  "super_admin",
  "administrator"
];


const SUPER_ADMIN_ROLES = [
  "superadmin",
  "super_admin"
];


async function protectAdminPage(){

  onAuthStateChanged(
    auth,
    async user => {

      if(!user){

        window.location.replace(
          "auth.html"
        );

        return;

      }


      try{

        const userRef =
          doc(
            db,
            "users",
            user.uid
          );


        const snapshot =
          await getDoc(
            userRef
          );


        if(!snapshot.exists()){

          denyAccess();

          return;

        }


        const data =
          snapshot.data();


        const role =
          String(
            data.role || ""
          ).toLowerCase();


        if(
          !ADMIN_ROLES.includes(
            role
          )
        ){

          denyAccess();

          return;

        }


        window.LetsStudyAdminUser = {

          uid:
            user.uid,

          email:
            user.email,

          role:
            role,

          isSuperAdmin:
            SUPER_ADMIN_ROLES.includes(
              role
            )

        };


        document.documentElement
          .classList
          .add(
            "admin-authorized"
          );


      }catch(error){

        console.error(
          "Admin security error:",
          error
        );

        denyAccess();

      }

    }
  );

}


function denyAccess(){

  document.body.innerHTML = `

    <main style="
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      text-align:center;
      font-family:Arial,sans-serif;
      padding:30px;
    ">

      <div>

        <h1>
          🔒 Access Denied
        </h1>

        <p>
          You are not authorized
          to access this page.
        </p>

        <a href="dashboard.html">
          Return to Dashboard
        </a>

      </div>

    </main>

  `;

}


protectAdminPage();