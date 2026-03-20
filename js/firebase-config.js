// Firebase configuration and initialization
// Requires firebase-app-compat.js and firebase-database-compat.js loaded via script tags

const firebaseConfig = {
  apiKey: "AIzaSyA158asrrevDpz0RWE547Qte1OimhdH4_E",
  authDomain: "music-bingo-fbe1c.firebaseapp.com",
  databaseURL: "https://music-bingo-fbe1c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "music-bingo-fbe1c",
  storageBucket: "music-bingo-fbe1c.firebasestorage.app",
  messagingSenderId: "218112519886",
  appId: "1:218112519886:web:4869d5bc3de68336f8ea9f"
};

firebase.initializeApp(firebaseConfig);
window.db = firebase.database();
