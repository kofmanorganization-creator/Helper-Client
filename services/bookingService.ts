import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../lib/firebase';
import { Booking, BookingState, PaymentMethod } from '../types';

/**
 * Abonnement en temps réel aux réservations de l'utilisateur.
 */
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
    console.error("[BookingService] Subscription Error:", err);
  });
};

/**
 * Abonnement à une mission spécifique (Dashboard Live).
 */
export const subscribeToSingleBooking = (id: string, callback: (b: Booking | null) => void) => {
  return onSnapshot(doc(db, 'missions', id), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() } as Booking);
    } else {
      // Fallback vers bookings si pas encore dans missions
      onSnapshot(doc(db, 'bookings', id), (snap2) => {
        if (snap2.exists()) callback({ id: snap2.id, ...snap2.data() } as Booking);
      });
    }
  }, (err) => {
    console.error(`[BookingService] Error reading mission ${id}:`, err);
  });
};

/**
 * Création d'une mission via Cloud Function.
 * 🔥 REGION ALIGNÉE : europe-west1 via l'import de 'functions'
 */
export const createBooking = async (state: BookingState, method: PaymentMethod): Promise<{ success: boolean, bookingId: string }> => {
  if (!auth.currentUser) throw new Error("Veuillez vous connecter pour commander.");
  
  // ✅ APPEL À LA CLOUD FUNCTION (Région europe-west1 héritée de lib/firebase.ts)
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

  if (!payload.serviceCategoryId || !payload.scheduledDateTime || !payload.address) {
    throw new Error("Informations de réservation incomplètes.");
  }

  try {
    console.log("[BookingService] Envoi createMission vers europe-west1...", payload);
    const result = await createMissionFn(payload);
    const data = result.data as any;
    
    if (data && data.success && data.missionId) {
      return { success: true, bookingId: data.missionId };
    }
    
    throw new Error("Le serveur n'a pas renvoyé d'identifiant de mission.");
  } catch (error: any) {
    console.error("[BookingService] Erreur appel Cloud Function:", error);
    throw new Error(error.message || "Erreur lors du traitement de votre commande.");
  }
};
