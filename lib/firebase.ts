
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from "firebase/messaging";

// 1️⃣ CONFIGURATION FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCMwLCWdSSmQgGIZ1Q1zhBEODcT7MuaR3c",
  authDomain: "gen-lang-client-0631513185.firebaseapp.com",
  projectId: "gen-lang-client-0631513185",
  storageBucket: "gen-lang-client-0631513185.firebasestorage.app",
  messagingSenderId: "907449227534",
  appId: "1:907449227534:web:c4d3ffe914c452aadcdf5f",
  measurementId: "G-5121P6LS6F"
};

// 2️⃣ INIT APP
const app = initializeApp(firebaseConfig);

// 3️⃣ INIT AUTH
export const auth = getAuth(app);

// Activation de la persistance
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("🔒 Persistence d'authentification activée"))
  .catch((err) => console.error("❌ Erreur persistence:", err));

// 4️⃣ SERVICES
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'europe-west1');
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;
