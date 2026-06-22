import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDnSo-iAW71nHXQqUjVmgzfSIpwE48Q0Jc",
  authDomain: "bitcoin-dca-tracker-cd0fd.firebaseapp.com",
  projectId: "bitcoin-dca-tracker-cd0fd",
  storageBucket: "bitcoin-dca-tracker-cd0fd.firebasestorage.app",
  messagingSenderId: "199605594744",
  appId: "1:199605594744:web:353d7e62d5b71705529b8d",
  measurementId: "G-CRMWHEKFR4"
};

// ป้องกันการ Initialize ซ้ำซ้อนใน Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();