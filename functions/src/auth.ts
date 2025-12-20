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
 * Enrichit le profil utilisateur créé par le trigger Auth.
 */
export const completeRegistration = functions.region("europe-west1").https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Utilisateur non authentifié.");
    }

    const parsed = RegistrationSchema.safeParse(data);
    if (!parsed.success) {
        throw new functions.https.HttpsError("invalid-argument", "Données d'inscription invalides.");
    }

    const { uid } = context.auth;
    const { firstName, lastName, phone } = parsed.data;
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    try {
        const db = admin.firestore();
        const userRef = db.collection("users").doc(uid);

        console.log(`[AUTH-CALL] Finalisation profil métier pour : ${uid}`);

        // On utilise set avec merge: true pour ne pas écraser les champs créés par le trigger Auth (comme le rôle)
        await userRef.set({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: cleanPhone,
            photoUrl: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=007DFF&color=fff`,
            onboardingDone: false, // Sera passé à true après le choix de la commune
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { success: true };
    } catch (error: any) {
        console.error("[AUTH-CALL] Erreur lors de la finalisation :", error);
        throw new functions.https.HttpsError("internal", "Erreur lors de la mise à jour du profil.");
    }
});
