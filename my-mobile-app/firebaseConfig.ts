import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAuth } from 'firebase/auth'; // Uncomment if you need Authentication

// TODO: Replace the following with your app's Firebase project configuration
// You can find these values in the Firebase Console after clicking "Register app"
const firebaseConfig = {
  apiKey: "AIzaSyBhBRchVcBGI01Pjfh73DMCRxZfMwcz8e8",
  authDomain: "mmm1-d495f.firebaseapp.com",
  databaseURL: "https://mmm1-d495f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mmm1-d495f",
  storageBucket: "mmm1-d495f.firebasestorage.app",
  messagingSenderId: "247050343364",
  appId: "1:247050343364:web:e43ea6657673c00b5d4a91",
  measurementId: "G-ZPCLQC869R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
// export const auth = getAuth(app); // Uncomment if using Auth
