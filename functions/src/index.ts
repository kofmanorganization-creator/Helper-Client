

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { createSupportTicket } from "./support";
import { verifyPayoutNumber, addPaymentMethod, paymentWebhook } from "./payments";
import { createBooking } from "./bookings";
import { completeRegistration } from "./auth";
import { generateWelcomeMessage } from "./ai";
import { logOtpAttempt } from "./otpGuard";

admin.initializeApp();

// Export functions for deployment
export { 
    createSupportTicket, 
    verifyPayoutNumber, 
    addPaymentMethod, 
    paymentWebhook,
    createBooking, 
    completeRegistration,
    generateWelcomeMessage,
    logOtpAttempt
};

// --- TRIGGERS ---

// onUserCreate: Automatically set default role 'client'
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  const userRef = db.collection("users").doc(user.uid);
  await userRef.set({
    email: user.email || null,
    phone: user.phoneNumber || null,
    role: "client",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
});
