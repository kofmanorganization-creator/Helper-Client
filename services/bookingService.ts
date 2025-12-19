
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../lib/firebase';
import { Booking, BookingState, PaymentMethod } from '../types';

export const subscribeToUserBookings = (callback: (bookings: Booking[]) => void) => {
  const user = auth.currentUser;
  if (!user) {
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, 'bookings'), 
    where('clientId', '==', user.uid),
    orderBy('scheduledAt', 'desc')
  );
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const bookings: Booking[] = [];
    querySnapshot.forEach((doc) => {
      bookings.push({ id: doc.id, ...doc.data() } as Booking);
    });
    callback(bookings);
  }, (error) => {
    console.error("[BookingService] Subscription error:", error);
    callback([]);
  });
  return unsubscribe;
};

export const subscribeToSingleBooking = (bookingId: string, callback: (booking: Booking | null) => void) => {
  const docRef = doc(db, 'bookings', bookingId);
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Booking);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`[BookingService] Error reading booking ${bookingId}:`, error);
    callback(null);
  });
  return unsubscribe;
};

/**
 * Unified Mission Creation Service.
 * Aligns with the 'createMission' backend function.
 */
export const createBooking = async (state: BookingState, paymentMethod: PaymentMethod): Promise<{ success: boolean; bookingId: string }> => {
    if (!auth.currentUser) throw new Error("Veuillez vous connecter pour commander.");

    // Calling 'createMission' which is the production-grade entry point
    const createMissionFn = httpsCallable(functions, 'createMission');

    const payload = {
        serviceCategoryId: state.serviceCategory?.id,
        selectedVariantKey: state.selectedVariantKey || null,
        customQuantity: state.customQuantity || null,
        surfaceArea: state.surfaceArea || 50,
        scheduledDateTime: state.scheduledDateTime?.toISOString(),
        address: state.address || "",
        paymentMethod: paymentMethod,
    };
    
    try {
        console.log("[BookingService] Calling createMission...");
        const result = await createMissionFn(payload);
        const data = result.data as { success: boolean; missionId: string; bookingId?: string };
        
        const missionId = data.missionId || data.bookingId;
        if (!data || !data.success || !missionId) {
            console.error("[BookingService] Response validation failed:", data);
            throw new Error("Échec de la création de la mission côté serveur.");
        }
        
        return { success: true, bookingId: missionId };
    } catch (error: any) {
        console.error("[BookingService] Fatal Error during createMission call:", error);
        
        // Capture detailed error messages from Cloud Functions
        const detail = error.details ? ` (${JSON.stringify(error.details)})` : "";
        const message = error.message || "Erreur technique lors de la commande.";
        
        throw new Error(`${message}${detail}`);
    }
};
