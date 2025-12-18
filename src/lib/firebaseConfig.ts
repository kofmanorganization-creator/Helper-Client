import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCMwLCWdSSmQgGIZ1Q1zhBEODcT7MuaR3c",
  authDomain: "gen-lang-client-0631513185.firebaseapp.com",
  projectId: "gen-lang-client-0631513185",
  storageBucket: "gen-lang-client-0631513185.appspot.com",
  messagingSenderId: "907449227534",
  appId: "1:907449227534:web:c4d3ffe914c452aadcdf5f",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
