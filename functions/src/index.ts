
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";

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
    createMission, // Unified naming
    acceptBooking,
    completeRegistration,
    generateWelcomeMessage
};

// Aliases for backward compatibility during transition
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

export const onMissionCreated = functions.firestore
  .document("missions/{missionId}")
  .onCreate(async (snap, context) => {
    const mission = snap.data();
    if (mission.status !== 'searching') return;
    console.log(`[Matching] Mission ${context.params.missionId} created. Triggering provider search...`);
    // Future: Call matchProvidersByRadius here
  });
