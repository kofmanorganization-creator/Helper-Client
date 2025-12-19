import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

import { createSupportTicket } from "./support";
import { addPaymentMethod, paymentWebhook } from "./payments";
import { acceptBooking } from "./bookings";
import { createMission } from "./missions/createMission";
import { completeRegistration } from "./auth";
import { generateWelcomeMessage } from "./ai";

export { 
    createSupportTicket, 
    addPaymentMethod, 
    paymentWebhook,
    createMission,
    acceptBooking,
    completeRegistration,
    generateWelcomeMessage
};

// Alias pour la compatibilité avec l'ancien code client si nécessaire
export const createBooking = createMission;

export const onUserCreateTrigger = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  const uid = user.uid;
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
    }
  } catch (error) {
    console.error(`[TRIGGER AUTH] Error:`, error);
  }
});

/**
 * TRIGGER FIRESTORE V2
 * Aligné sur europe-west1
 */
export const onMissionCreated = onDocumentCreated(
  {
    region: "europe-west1", // ✅ ALIGNEMENT TOTAL
    document: "missions/{missionId}",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const mission = snap.data();
    if (mission.status !== 'searching') return;
    console.log(`[Matching] Mission ${event.params.missionId} active. Démarrage de la recherche prestataire...`);
  }
);
