import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";

export const firebaseConfig = {
  apiKey: "AIzaSyB-_fpHtrXzYKTuqt8WtATBjRhI8vkeCO4",
  authDomain: "rfid-20fe4.firebaseapp.com",
  databaseURL: "https://rfid-20fe4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rfid-20fe4",
  storageBucket: "rfid-20fe4.firebasestorage.app",
  messagingSenderId: "548096531777",
  appId: "1:548096531777:web:647a063507afb27c8195c0"
};

export const isFirebaseConfigured = true;

let app: FirebaseApp | null = null;
let db: Database | null = null;

export function getDb(): Database {
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  if (!db) {
    db = getDatabase(app);
  }
  return db;
}
