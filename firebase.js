// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyA8iojh3A-ToO-1f16zA3AY51O--BjZbyM",
    authDomain: "copymaster-bf2a4.firebaseapp.com",
    projectId: "copymaster-bf2a4",
    storageBucket: "copymaster-bf2a4.firebasestorage.app",
    messagingSenderId: "846065794108",
    appId: "1:846065794108:web:77b67ec810cdcf1f6c9739",
    measurementId: "G-NBYZVDD4YM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
