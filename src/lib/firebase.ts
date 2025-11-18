// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB1N0n9PBjFvi9UipgvmHx13cTHi_MTQI8",
  authDomain: "face-recoginition-de3f4.firebaseapp.com",
  projectId: "face-recoginition-de3f4",
  storageBucket: "face-recoginition-de3f4.firebasestorage.app",
  messagingSenderId: "1009143893192",
  appId: "1:1009143893192:web:1e848ab8e7394a188269fd",
  measurementId: "G-1SMDNZJW48"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;

