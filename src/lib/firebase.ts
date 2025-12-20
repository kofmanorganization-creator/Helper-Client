import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCMwLCWdSSmQgGIZ1Q1zhBEODcT7MuaR3c",
  authDomain: "gen-lang-client-0631513185.firebaseapp.com",
  projectId: "gen-lang-client-0631513185",
  storageBucket: "gen-lang-client-0631513185.firebasestorage.app",
  messagingSenderId: "907449227534",
  appId: "1:907449227534:web:c4d3ffe914c452aadcdf5f",
  measurementId: "G-5121P6LS6F"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// ✅ OBLIGATOIRE : Utiliser europe-west1 pour toutes les appels Cloud Functions
export const functions = getFunctions(app, 'europe-west1');
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;