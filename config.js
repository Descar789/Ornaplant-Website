import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-analytics.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';

// Safe to commit — Firestore rules are the real security layer
const firebaseConfig = {
  apiKey: 'AIzaSyB6xbNgGGkWYwkjfzKqx79ls-_FECkAoNs',
  authDomain: 'ornaplant-3ea0c.firebaseapp.com',
  databaseURL: 'https://ornaplant-3ea0c-default-rtdb.firebaseio.com',
  projectId: 'ornaplant-3ea0c',
  storageBucket: 'ornaplant-3ea0c.firebasestorage.app',
  messagingSenderId: '187305718735',
  appId: '1:187305718735:web:14608f41405aef8b6d98ba',
  measurementId: 'G-SH5VPP4HT3'
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const rtdb = getDatabase(app);
export const auth = getAuth(app);
export const WHATSAPP_NUMBER = '527351024413';
