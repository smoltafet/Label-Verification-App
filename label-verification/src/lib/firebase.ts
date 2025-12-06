import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAKgKjW2iWqFStAY8QkhdL93xvIgOugjN4",
  authDomain: "label-varification.firebaseapp.com",
  projectId: "label-varification",
  storageBucket: "label-varification.firebasestorage.app",
  messagingSenderId: "490771790404",
  appId: "1:490771790404:web:2a1fc93a50ceeea398da11",
  measurementId: "G-R0Z9548SVN"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const firestore = getFirestore(app);
