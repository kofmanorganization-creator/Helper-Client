
import { useEffect, useState, useCallback, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { User } from "../types";

/**
 * HOOK useUserProfile.ts (Version 4.0 - GHOST PROTOCOL)
 * Architecture anti-Accès Restreint :
 * Stoppe l'écoute si "permission-denied" est reçu (STOP RETRY).
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  
  // Utilisation d'un ref pour le désabonnement afin de pouvoir le couper depuis l'erreur
  const unsubscribeProfileRef = useRef<(() => void) | null>(null);

  const refresh = useCallback(() => {
    // Force un rechargement complet via App.tsx
    window.location.href = window.location.origin;
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setProfile(null);
        setError("NOT_AUTHENTICATED");
        setLoading(false);
        if (unsubscribeProfileRef.current) unsubscribeProfileRef.current();
        return;
      }

      setLoading(true);
      setError(null);

      const userDocRef = doc(db, "users", user.uid);
      
      // On snapshot avec gestion d'erreur Ghost
      unsubscribeProfileRef.current = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            setProfile({ uid: user.uid, ...data } as User);
            setError(null);
            setLoading(false);
            console.info("[GhostProtocol] Profil validé.");
          } else {
            // Le document n'existe pas encore
            setError("PROFILE_NOT_READY");
            setLoading(false);
          }
        },
        (err) => {
          // ☢️ [GhostProtocol] permission-denied → STOP RETRY IMMÉDIAT
          if (err.code === "permission-denied") {
            console.error("[GhostProtocol] Accès interdit au profil. Désactivation du listener.");
            if (unsubscribeProfileRef.current) {
              unsubscribeProfileRef.current();
              unsubscribeProfileRef.current = null;
            }
            setError("PROFILE_FORBIDDEN");
          } else {
            console.error("[GhostProtocol] Erreur inattendue:", err);
            setError("UNKNOWN_ERROR");
          }
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfileRef.current) unsubscribeProfileRef.current();
    };
  }, [retryTrigger]);

  return { profile, loading, error, refresh };
}
