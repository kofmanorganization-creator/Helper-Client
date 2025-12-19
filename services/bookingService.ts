
import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../lib/firebase';
import { Booking, BookingState, PaymentMethod } from '../types';

/**
 * Subscribes to the bookings of the currently authenticated user.
 */
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
    console.error("Error fetching bookings:", error);
    callback([]);
  });

  return unsubscribe;
};

/**
 * Subscribes to a single booking document for real-time updates.
 */
export const subscribeToSingleBooking = (bookingId: string, callback: (booking: Booking | null) => void) => {
  const docRef = doc(db, 'bookings', bookingId);
  
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Booking);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Error fetching booking ${bookingId}:`, error);
    callback(null);
  });

  return unsubscribe;
};


/**
 * Calls the secure Cloud Function to create a new booking.
 */
export const createBooking = async (state: BookingState, paymentMethod: PaymentMethod): Promise<{ success: boolean; bookingId: string }> => {
    if (!auth.currentUser) throw new Error("Veuillez vous connecter pour commander.");

    const createBookingFn = httpsCallable(functions, 'createBooking');

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
        const result = await createBookingFn(payload);
        const data = result.data as { success: boolean; bookingId: string };
        
        if (!data.success) {
            throw new Error("Le serveur a refusé la création de la mission.");
        }
        
        return data;
    } catch (error: any) {
        console.error("Critical Error in createBooking service:", error);
        // On renvoie un message lisible
        const message = error.details?.message || error.message || "Erreur technique lors de la commande.";
        throw new Error(message);
    }
};
