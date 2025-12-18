

import { collection, query, where, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../lib/firebase';
import { Booking, BookingState, PaymentMethod } from '../types';

/**
 * Subscribes to the bookings of the currently authenticated user.
 * @param callback A function that will be called with the array of bookings whenever it changes.
 * @returns An unsubscribe function to stop listening for updates.
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
 * @param bookingId The ID of the booking to listen to.
 * @param callback A function that will be called with the booking data whenever it changes.
 * @returns An unsubscribe function to stop listening for updates.
 */
export const subscribeToSingleBooking = (bookingId: string, callback: (booking: Booking | null) => void) => {
  const docRef = doc(db, 'bookings', bookingId);
  
  const unsubscribe = onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Booking);
    } else {
      console.warn(`Booking with ID ${bookingId} not found.`);
      callback(null);
    }
  }, (error) => {
    console.error(`Error fetching booking ${bookingId}:`, error);
    callback(null);
  });

  return unsubscribe;
};


/**
 * Calls the secure Cloud Function to create a new booking and initiate payment.
 * @param state The current booking state from the UI.
 * @param paymentMethod The selected payment method.
 * @returns A promise that resolves with the result of the function call.
 */
export const createBooking = async (state: BookingState, paymentMethod: PaymentMethod): Promise<{ success: boolean; bookingId: string }> => {
    const createBookingFn = httpsCallable(functions, 'createBooking');

    // The client sends its choices, not the price. The backend calculates everything.
    const payload = {
        serviceCategoryId: state.serviceCategory?.id,
        selectedVariantKey: state.selectedVariantKey,
        customQuantity: state.customQuantity,
        surfaceArea: state.surfaceArea,
        scheduledDateTime: state.scheduledDateTime?.toISOString(),
        address: state.address,
        paymentMethod: paymentMethod,
    };
    
    try {
        const result = await createBookingFn(payload);
        return result.data as { success: boolean; bookingId: string };
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error; // Re-throw to be caught by the component
    }
};
