
import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Booking } from '../types';

/**
 * HOOK useMission.ts (Version ANTI-GhostProtocol v3.2 - DISPATCH READY)
 * Gère les états sans speculative reads bloquantes.
 */
export const useMission = (missionId: string | null) => {
  const [mission, setMission] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthReady(!!user);
    });
    return () => unsubscribe();
  }, []);

  const sync = useCallback(async () => {
    if (!missionId || !isAuthReady) return;

    try {
      setError(null);
      setLoading(true);

      const missionRef = doc(db, 'missions', missionId);
      const bookingRef = doc(db, 'bookings', missionId);

      // Tente de récupérer le document
      // Note: Firestore Rules autorisent 'get' si Authentifié même si Doc absent
      // Mais lancent Permission-Denied si Doc présent et UID incorrect.
      let snap;
      try {
          snap = await getDoc(missionRef);
          if (!snap.exists()) {
            snap = await getDoc(bookingRef);
          }
      } catch (err: any) {
          if (err.code === 'permission-denied') {
              // On a tenté de lire une mission qui existe mais on n'a pas les droits.
              // C'est un état terminal pour le client/provider.
              console.error(`[Helper-Sync] Accès interdit à la mission : ${missionId}`);
              setError("PERMISSION_DENIED");
              setLoading(false);
              return;
          }
          throw err;
      }

      if (snap.exists()) {
        console.info(`[Helper-Sync] Document chargé : ${missionId}`);
        setMission({ id: snap.id, ...snap.data() } as Booking);
        setLoading(false);
        return;
      }

      // CAS : Document absent (not-found)
      if (retryCount < 3) {
        console.warn(`[Helper-Sync] Propagation serveur, retry ${retryCount + 1}/3...`);
        timerRef.current = setTimeout(() => setRetryCount(prev => prev + 1), 2000);
      } else {
        setError("MISSION_NOT_FOUND");
        setLoading(false);
      }

    } catch (err: any) {
      console.error("[Helper-Sync] Erreur système:", err);
      setError("SYNC_ERROR");
      setLoading(false);
    }
  }, [missionId, retryCount, isAuthReady]);

  useEffect(() => {
    sync();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [sync]);

  // Listener temps réel (uniquement si le doc a été trouvé initialement)
  useEffect(() => {
    if (!mission || !missionId || !isAuthReady) return;

    const status = mission.status?.toLowerCase() || '';
    const colName = ['assigned', 'arrived', 'in_progress', 'completed_wait', 'completed', 'reviewed', 'scanned'].includes(status) 
      ? 'bookings' 
      : 'missions';

    const unsubscribe = onSnapshot(doc(db, colName, missionId), (snap) => {
      if (snap.exists()) {
        setMission({ id: snap.id, ...snap.data() } as Booking);
      }
    }, (err) => {
        if (err.code === 'permission-denied') {
            console.error("[Helper-Sync] Listener Permission Denied.");
            setError("PERMISSION_DENIED");
        }
    });

    return () => unsubscribe();
  }, [mission?.status, missionId, isAuthReady]);

  return { 
    mission, 
    loading: loading && !error, 
    error,
    retry: () => { setRetryCount(0); setLoading(true); setError(null); }
  };
};
