import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../lib/firebase';
import { Booking, BookingState, PaymentMethod } from '../types';

/**
 * SOLUTION ANTI-LAG (Ghost Protocol)
 * Cette fonction surveille une mission spécifique en gérant le lag des permissions Firebase.
 */
export const subscribeToSingleBooking = (id: string, callback: (b: Booking | null) => void) => {
  if (!id) return () => {};

  let unsubscribe: (() => void) | null = null;
  let isChecking = true;
  let retryCount = 0;

  const startLiveListener = (collectionName: 'missions' | 'bookings') => {
    if (!isChecking) return;
    
    if (unsubscribe) unsubscribe();

    unsubscribe = onSnapshot(doc(db, collectionName, id), (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as Booking);
      }
    }, (err) => {
      // Si la permission est refusée (souvent au début), on tente le polling
      if (err.code === 'permission-denied') {
        console.warn(`[GhostProtocol] Permission denied for ${id} in ${collectionName}, retrying poll...`);
        if (retryCount < 10) {
            retryCount++;
            setTimeout(pollExistence, 1500);
        }
      }
    });
  };

  const pollExistence = async () => {
    if (!isChecking) return;
    try {
      // Priorité 1 : Vérifier dans 'missions' (Temps réel/Recherche)
      const snap = await getDoc(doc(db, 'missions', id));
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as Booking);
        startLiveListener('missions');
        return;
      }

      // Priorité 2 : Vérifier dans 'bookings' (Assigné/Historique)
      const bSnap = await getDoc(doc(db, 'bookings', id));
      if (bSnap.exists()) {
        callback({ id: bSnap.id, ...bSnap.data() } as Booking);
        startLiveListener('bookings');
        return;
      }

      // Si pas encore là, on re-poll
      const delay = Math.min(1000 * (retryCount + 1), 5000);
      retryCount++;
      setTimeout(pollExistence, delay);

    } catch (e: any) {
      console.warn(`[GhostProtocol] Poll Error (${id}):`, e.message);
      setTimeout(pollExistence, 2000);
    }
  };

  pollExistence();

  return () => {
    isChecking = false;
    if (unsubscribe) unsubscribe();
  };
};

export const subscribeToUserBookings = (callback: (bookings: Booking[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  
  // Utilisation d'une requête filtrée (nécessite l'index dans firestore.indexes.json)
  const q = query(
    collection(db, 'bookings'), 
    where('clientId', '==', user.uid), 
    orderBy('scheduledAt', 'desc')
  );
  
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
  }, (err) => {
    // On ignore l'erreur si c'est juste un lag de permissions au mount
    if (err.code !== 'permission-denied') {
      console.error("[BookingService] Erreur liste:", err.message);
    }
  });
};

export const createBooking = async (state: BookingState, method: PaymentMethod): Promise<{ success: boolean, bookingId: string }> => {
  if (!auth.currentUser) throw new Error("Veuillez vous connecter.");
  
  // On s'assure d'appeler la fonction 'createMission' déployée sur europe-west1
  const createMissionFn = httpsCallable(functions, 'createMission');
  
  const payload = {
    serviceCategoryId: state.serviceCategory?.id || null,
    selectedVariantKey: state.selectedVariantKey || null,
    customQuantity: state.customQuantity || null,
    surfaceArea: state.surfaceArea || 50,
    scheduledDateTime: state.scheduledDateTime ? state.scheduledDateTime.toISOString() : null,
    address: (state.address || "").trim(),
    paymentMethod: method
  };

  try {
    const result = await createMissionFn(payload);
    const data = result.data as any;
    
    if (data && data.success && data.missionId) {
      return { success: true, bookingId: data.missionId };
    }
    
    throw new Error(data?.message || "Échec de création serveur.");
  } catch (error: any) {
    console.error("[BookingService] Error creating mission:", error);
    throw error;
  }
};