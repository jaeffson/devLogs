// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAi--QR-HmfSsGzjLpeNnauP2AUNkCOhFc",
  authDomain: "devlogs-65bfa.firebaseapp.com",
  projectId: "devlogs-65bfa",
  storageBucket: "devlogs-65bfa.firebasestorage.app",
  messagingSenderId: "943147514217",
  appId: "1:943147514217:web:c4dd415f6507ffc8d525f8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);