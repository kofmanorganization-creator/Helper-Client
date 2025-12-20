
import { collection, query, where, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../lib/firebase';
import { Booking, BookingState, PaymentMethod } from '../types';

export const subscribeToSingleBooking = (id: string, callback: (b: Booking | null) => void) => {
  if (!id) return () => {};

  let unsubscribe: (() => void) | null = null;
  let isChecking = true;
  let retryCount = 0;
  const MAX_RETRIES = 3; // Réduit à 3 pour éviter la fatigue système

  const startLiveListener = (collectionName: 'missions' | 'bookings') => {
    if (!isChecking) return;
    
    if (unsubscribe) unsubscribe();

    unsubscribe = onSnapshot(doc(db, collectionName, id), (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as Booking);
      }
    }, (err) => {
      console.warn(`[Helper-Sync] Listener Error for ${id} in ${collectionName}:`, err.message);
      if (err.code === 'permission-denied') {
        isChecking = false; // 🛑 Arrêt immédiat
      }
    });
  };

  const pollExistence = async () => {
    if (!isChecking) return;

    try {
      const snap = await getDoc(doc(db, 'missions', id));
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as Booking);
        startLiveListener('missions');
        return;
      }

      const bSnap = await getDoc(doc(db, 'bookings', id));
      if (bSnap.exists()) {
        callback({ id: bSnap.id, ...bSnap.data() } as Booking);
        startLiveListener('bookings');
        return;
      }

      // Retry limité pour not-found
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(pollExistence, 2000);
      } else {
        isChecking = false;
        callback(null);
      }

    } catch (e: any) {
      if (e.code === 'permission-denied') {
        console.error("[Helper-Sync] Permission refusée durant le polling. Arrêt.");
        isChecking = false; // 🛑 Arrêt immédiat
        callback(null);
      } else if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(pollExistence, 2000);
      }
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
  
  const q = query(
    collection(db, 'bookings'), 
    where('clientId', '==', user.uid), 
    orderBy('scheduledAt', 'desc')
  );
  
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
  }, (err) => {
    if (err.code !== 'permission-denied') {
      console.error("[BookingService] Erreur liste:", err.message);
    }
  });
};

export const createBooking = async (state: BookingState, method: PaymentMethod): Promise<{ success: boolean, bookingId: string }> => {
  if (!auth.currentUser) throw new Error("Veuillez vous connecter.");
  
  const createMissionFn = httpsCallable(functions, 'createMission');
  
  const payload = {
    serviceCategoryId: state.serviceCategory?.id || null,
    selectedVariantKey: state.selectedVariantKey || null,
    selectedExtras: state.selectedExtras || [],
    customQuantity: state.customQuantity || null,
    surfaceArea: state.surfaceArea || 50,
    scheduledDateTime: state.scheduledDateTime ? state.scheduledDateTime.toISOString() : null,
    address: (state.address || "").trim(),
    paymentMethod: method
  };

  try {
    const result = await createMissionFn(payload);
    const data = result.data as any;
    
    if (data && data.success && (data.missionId || data.bookingId)) {
      return { success: true, bookingId: data.missionId || data.bookingId };
    }
    
    throw new Error(data?.message || "Échec de création serveur.");
  } catch (error: any) {
    console.error("[BookingService] Error creating mission:", error);
    throw error;
  }
};
