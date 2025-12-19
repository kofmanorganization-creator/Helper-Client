import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * SOLUTION DÉFINITIVE (PRODUCTION GRADE)
 * Aligné sur europe-west1 avec normalisation stricte.
 */
export const createMission = onCall(
  {
    region: "europe-west1", // ✅ ALIGNEMENT TOTAL
    timeoutSeconds: 30,
  },
  async ({ data, auth }) => {
    try {
      if (!auth) {
        throw new HttpsError("unauthenticated", "Utilisateur non connecté");
      }

      // ✅ NORMALISATION STRICTE
      const mission: Record<string, any> = {
        clientId: auth.uid,
        serviceCategoryId: data.serviceCategoryId ?? null,
        selectedVariantKey: data.selectedVariantKey ?? null,
        customQuantity: typeof data.customQuantity === "number" ? data.customQuantity : null,
        surfaceArea: typeof data.surfaceArea === "number" ? data.surfaceArea : null,
        scheduledAt: data.scheduledDateTime
          ? admin.firestore.Timestamp.fromDate(new Date(data.scheduledDateTime))
          : null,
        address: data.address ?? null,
        paymentMethod: data.paymentMethod ?? "cash",
        status: "searching",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // 🔒 ANTI-UNDEFINED (OBLIGATOIRE)
      Object.keys(mission).forEach(
        (key) => mission[key] === undefined && delete mission[key]
      );

      const db = admin.firestore();
      const ref = db.collection("missions").doc();

      await ref.set(mission);

      return {
        success: true,
        missionId: ref.id,
        status: mission.status,
      };
    } catch (error: any) {
      console.error("🔥 createMission FATAL", error);

      if (error instanceof HttpsError) throw error;

      throw new HttpsError(
        "internal",
        "Erreur serveur lors de la création de la mission"
      );
    }
  }
);
