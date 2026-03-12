import firebase from "firebase/compat/app";

// Add the Firebase products that you want to use
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAO-lDaW6uahTirksqDWADxGkaJYze3cNU",
  authDomain: "surezone-firebase-auth.firebaseapp.com",
  projectId: "surezone-firebase-auth",
  storageBucket: "surezone-firebase-auth.firebasestorage.app",
  messagingSenderId: "471431774093",
  appId: "1:471431774093:web:581b7b8ad009ab89a647c4",
  measurementId: "G-39K1YRT909"
};
const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseApp.firestore();
const auth = firebase.auth();
const storage = firebaseApp.storage();

export { db, auth, storage };

// // Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyAO-lDaW6uahTirksqDWADxGkaJYze3cNU",
//   authDomain: "surezone-firebase-auth.firebaseapp.com",
//   projectId: "surezone-firebase-auth",
//   storageBucket: "surezone-firebase-auth.firebasestorage.app",
//   messagingSenderId: "471431774093",
//   appId: "1:471431774093:web:581b7b8ad009ab89a647c4",
//   measurementId: "G-39K1YRT909"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);