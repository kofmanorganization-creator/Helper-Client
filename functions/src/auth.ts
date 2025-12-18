import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";

const RegistrationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().length(10, "Phone must be 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const completeRegistration = functions.region("europe-west1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "User must be authenticated via OTP first.");
    }

    const parsed = RegistrationSchema.safeParse(data);
    if (!parsed.success) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid registration payload.", parsed.error.format());
    }

    const { uid } = context.auth;
    const { firstName, lastName, phone, password } = parsed.data;

    const email = `+225${phone}@helper.app`;
    try {
        await admin.auth().updateUser(uid, {
            email: email,
            password: password,
            displayName: `${firstName} ${lastName}`,
            emailVerified: true,
        });
    } catch (error) {
        console.error("Error updating auth user:", error);
        throw new functions.https.HttpsError("internal", "Could not update user credentials.");
    }
    
    const userDoc = {
        uid,
        firstName,
        lastName,
        phone,
        email,
        photoUrl: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=0D8ABC&color=fff`,
        role: 'client',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        onboardingDone: false
    };

    try {
        await admin.firestore().collection("users").doc(uid).set(userDoc, { merge: true });
    } catch (error) {
        console.error("Error creating firestore profile:", error);
        await admin.auth().updateUser(uid, { email: undefined, password: undefined });
        throw new functions.https.HttpsError("internal", "Could not save user profile.");
    }

    return { success: true };
});

export const sendOtp = functions.region("europe-west1").https.onCall(async (data, context) => {
  throw new functions.https.HttpsError('unimplemented', 'Use client SDK.');
});

export const verifyOtp = functions.region("europe-west1").https.onCall(async (data, context) => {
  throw new functions.https.HttpsError('unimplemented', 'Use client SDK.');
});