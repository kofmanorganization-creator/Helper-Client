
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { User } from "../types";

/**
 * HOOK OFFICIEL useUserProfile.ts
 * Architecture ANTI-GhostProtocol :
 * 1. Détecte l'état Auth.
 * 2. Tente un chargement UNIQUE du profil Firestore.
 * 3. En cas de permission-denied ou document absent, renvoie une erreur explicite SANS retry.
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setProfile(null);
        setError("NOT_AUTHENTICATED");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          console.warn("[GhostProtocol] Profil non prêt — attente backend");
          setError("PROFILE_NOT_READY");
          setLoading(false);
          return;
        }

        const data = snap.data();
        setProfile({ uid: user.uid, ...data } as User);
        console.info("[AUTH] Profil utilisateur chargé");
        setLoading(false);
      } catch (e: any) {
        if (e.code === "permission-denied") {
          console.error("[GhostProtocol] permission-denied → STOP RETRY");
          setError("PROFILE_FORBIDDEN");
        } else {
          console.error("[GhostProtocol] Erreur inconnue lors du chargement du profil:", e);
          setError("UNKNOWN_ERROR");
        }
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return { profile, loading, error };
}
