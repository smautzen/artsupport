import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBmPAxEj3iWrz38eLkrZKKqoIOIDziS5Io",
    authDomain: "art-support-4eddd.firebaseapp.com",
    projectId: "art-support-4eddd",
    storageBucket: "art-support-4eddd.firebasestorage.app",
    messagingSenderId: "619102398846",
    appId: "1:619102398846:web:673ceab120dddb1a752b2f",
    measurementId: "G-570CMCP9C2"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default app;

export { db };
