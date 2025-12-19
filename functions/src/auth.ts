
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { z } from "zod";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const RegistrationSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(10),
});

/**
 * Finalise l'inscription (Callable).
 * Utilisé par le client juste après l'auth.
 */
export const completeRegistration = functions.region("europe-west1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Auth requis.");
    }

    const parsed = RegistrationSchema.safeParse(data);
    if (!parsed.success) {
        throw new functions.https.HttpsError("invalid-argument", "Données invalides.");
    }

    const { uid } = context.auth;
    const { firstName, lastName, phone } = parsed.data;
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    try {
        const db = admin.firestore();
        console.log(`[AUTH-CALL] Finalisation profil Firestore pour : ${uid}`);

        // On utilise doc().set({ ... }, { merge: true }) pour être idempotent
        // Si le trigger onCreate a déjà créé le doc, on ne fait que merger les noms
        await db.collection("users").doc(uid).set({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: cleanPhone,
            photoUrl: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=007DFF&color=fff`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { success: true };
    } catch (error: any) {
        console.error("[AUTH-CALL] Erreur lors de la finalisation :", error);
        // On ne throw pas d'erreur interne car le trigger onCreate assurera la survie du doc
        return { success: false, error: "Initialisation asynchrone en cours." };
    }
});
