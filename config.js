import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    storageBucket: 'gs://mdrive-e7b27.appspot.com',
    apiKey: "AIzaSyDHEhqrrOVRmBuNJyCCbUkh_gIZ-S8Hk_A",
    authDomain: "mdrive-e7b27.firebaseapp.com",
    projectId: "mdrive-e7b27",
    messagingSenderId: "538117856319",
    appId: "1:538117856319:web:e88ba0191e2981e7b1ac8a",
    measurementId: "G-X3PVFC5NXP"
};

const app = initializeApp(firebaseConfig);
// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);



