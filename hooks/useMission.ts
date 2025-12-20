
import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Booking } from '../types';

export const useMission = (missionId: string | null) => {
  const [mission, setMission] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'client' | 'provider' | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uSnap = await getDoc(doc(db, 'users', user.uid));
        setRole(uSnap.data()?.role || 'client');
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!missionId || !role || !auth.currentUser) return;

    setLoading(true);
    const userId = auth.currentUser.uid;
    
    // GHOST ROUTING
    const docRef = role === 'provider' 
      ? doc(db, 'provider_inbox', userId, 'missions', missionId)
      : doc(db, 'bookings', missionId);

    unsubRef.current = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setMission({ id: snap.id, ...snap.data() } as Booking);
        setError(null);
      } else {
        setError("NOT_FOUND");
      }
      setLoading(false);
    }, (err) => {
      if (err.code === 'permission-denied') {
        console.error("[Ghost] Accès bloqué -> Stop Retry");
        setError("FORBIDDEN");
        if (unsubRef.current) unsubRef.current();
      }
      setLoading(false);
    });

    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [missionId, role]);

  return { mission, loading, error };
};
