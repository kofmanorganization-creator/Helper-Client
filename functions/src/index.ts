
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

import { createSupportTicket } from "./support";
import { addPaymentMethod, paymentWebhook } from "./payments";
import { createBooking, acceptBooking } from "./bookings";
import { completeRegistration } from "./auth";
import { generateWelcomeMessage } from "./ai";

// Re-export des fonctions Callables
export { 
    createSupportTicket, 
    addPaymentMethod, 
    paymentWebhook,
    createBooking, 
    acceptBooking,
    completeRegistration,
    generateWelcomeMessage
};

/**
 * TRIGGER AUTH : Création automatique du profil Firestore
 */
export const onUserCreateTrigger = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  const uid = user.uid;
  
  console.log(`[TRIGGER AUTH] Initialisation profil pour : ${uid}`);

  try {
    const userRef = db.collection("users").doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        uid: uid,
        email: user.email || `u${uid}@helper.ci`,
        role: "client",
        status: "active",
        isPremium: false,
        onboardingDone: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[TRIGGER AUTH] Profil créé avec succès pour ${uid}`);
    }
  } catch (error) {
    console.error(`[TRIGGER AUTH] Erreur création profil ${uid}:`, error);
  }
});

/**
 * TRIGGER FIRESTORE : Logique de Matching
 */
export const onBookingCreated = functions.firestore
  .document("bookings/{bookingId}")
  .onCreate(async (snap, context) => {
    const booking = snap.data();
    if (booking.status !== 'PENDING_ASSIGNMENT') return;
    console.log(`[MATCHING LOGIC] Nouvelle mission ${context.params.bookingId} - Notification des prestataires proches...`);
    // Ici on pourrait ajouter l'envoi de notifications push via FCM
  });
