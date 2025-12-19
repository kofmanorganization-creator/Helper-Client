
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

// FIX: Explicitly use v1 region and https
export const logOtpAttempt = functions.region("europe-west1").https.onCall(
  async (_, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated to log an OTP attempt.");
    }

    await admin.firestore().collection("otp_logs").add({
      uid: context.auth.uid,
      phone: context.auth.token.phone_number,
      ip: context.rawRequest.ip,
      at: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);
