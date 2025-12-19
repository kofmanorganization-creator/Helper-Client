import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { SERVICES_CATEGORIES } from "../constants";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * VERSION OPTIMISÉE POUR GOOGLE CLOUD FUNCTIONS V2
 * Assure la cohérence des données entre les collections 'missions' (live) et 'bookings' (historique).
 * Aligné sur la région europe-west1 pour une latence minimale en Afrique de l'Ouest.
 */
export const createMission = onCall(
  { region: "europe-west1", timeoutSeconds: 30 },
  async (request) => {
    try {
      const auth = request.auth;
      const data = request.data;

      if (!auth) {
        throw new HttpsError("unauthenticated", "Utilisateur non connecté");
      }

      console.log(`[CREATE_MISSION] Traitement pour UID: ${auth.uid}`);

      // 1. Enrichissement des données côté serveur pour éviter les champs vides dans l'UI
      const category = SERVICES_CATEGORIES.find(c => c.id === data.serviceCategoryId);
      const serviceName = category?.name || data.serviceName || "Service Helper";

      // 2. Normalisation stricte du payload
      const missionData: any = {
        clientId: auth.uid,
        serviceName: serviceName,
        serviceCategoryId: data.serviceCategoryId ?? null,
        address: (data.address || "").trim() || null,
        paymentMethod: data.paymentMethod ?? "cash",
        paymentStatus: data.paymentMethod === 'cash' ? 'CASH_PENDING' : 'INITIATED',

        scheduledAt: (data.scheduledAt || data.scheduledDateTime)
          ? admin.firestore.Timestamp.fromDate(new Date(data.scheduledAt || data.scheduledDateTime))
          : null,

        selectedVariantKey: data.selectedVariantKey ?? null,
        customQuantity: typeof data.customQuantity === "number" ? data.customQuantity : null,
        surfaceArea: typeof data.surfaceArea === "number" ? data.surfaceArea : null,

        // On accepte le prix calculé par le client comme base, mais on pourrait le recalculer ici pour plus de sécurité
        totalAmount: typeof data.totalAmount === "number" ? data.totalAmount : 
                     (typeof data.price === "number" ? data.price : 0),

        status: data.paymentMethod === 'cash' ? "searching" : "pending_payment",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        provider: null,
      };

      // 🔒 Sécurité Firestore : Supprimer les clés 'undefined' qui font échouer l'écriture
      Object.keys(missionData).forEach(
        (key) => missionData[key] === undefined && delete missionData[key]
      );

      const db = admin.firestore();
      const missionId = db.collection("missions").doc().id;
      missionData.id = missionId;

      const batch = db.batch();
      const missionRef = db.collection("missions").doc(missionId);
      const bookingRef = db.collection("bookings").doc(missionId); // Mirroring vers l'historique

      batch.set(missionRef, missionData);
      batch.set(bookingRef, missionData);

      await batch.commit();

      console.log(`[CREATE_MISSION] Succès. ID: ${missionId}`);

      return {
        success: true,
        missionId: missionId,
        status: missionData.status,
      };
    } catch (error: any) {
      console.error("🔥 createMission CRITICAL ERROR", error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError(
        "internal",
        "Erreur serveur lors de la création de la mission."
      );
    }
  }
);