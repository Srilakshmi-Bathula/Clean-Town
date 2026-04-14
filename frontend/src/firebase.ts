import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB8xCOycQCOHz3DkuyDEDgsN_ZVY0vd_94",
  authDomain: "cleantown-72c4e.firebaseapp.com",
  projectId: "cleantown-72c4e",
  storageBucket: "cleantown-72c4e.firebasestorage.app",
  messagingSenderId: "434085939844",
  appId: "1:434085939844:web:3acca818b1413da437d0d1",
  measurementId: "G-6TLCHGTLVP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// Analytics only runs in the browser
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export default app;
