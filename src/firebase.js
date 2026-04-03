// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyAi--QR-HmfSsGzjLpeNnauP2AUNkCOhFc",
  authDomain: "devlogs-65bfa.firebaseapp.com",
  projectId: "devlogs-65bfa",
  storageBucket: "devlogs-65bfa.firebasestorage.app",
  messagingSenderId: "943147514217",
  appId: "1:943147514217:web:c4dd415f6507ffc8d525f8"
};
const app = initializeApp(firebaseConfig);