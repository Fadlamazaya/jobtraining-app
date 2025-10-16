// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNQInhFZDD4bznrJPIaX2AqcF4ncS59kk",
  authDomain: "jt-db-1e666.firebaseapp.com",
  projectId: "jt-db-1e666",
  storageBucket: "jt-db-1e666.firebasestorage.app",
  messagingSenderId: "543145504557",
  appId: "1:543145504557:web:ace3c4cba9233bcf722da4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);
