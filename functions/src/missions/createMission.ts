
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { PricingEngineServer } from "../pricingEngine";
import { SERVICES_CATEGORIES } from "../constants";

if (!admin.apps.length) {
  admin.initializeApp();
}

export const createAndDispatchMission = functions.region("europe-west1").https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth requise");

  const { serviceCategoryId, selectedVariantKey, address, scheduledDateTime, paymentMethod } = data;
  const db = admin.firestore();
  const pricingEngine = new PricingEngineServer();

  try {
    const category = SERVICES_CATEGORIES.find(c => c.id === serviceCategoryId);
    if (!category) throw new functions.https.HttpsError("not-found", "Catégorie inconnue");

    const price = pricingEngine.getPrice(data) || 0;
    const finalPrice = price === 'quotation' ? 0 : price;

    // 1. Créer la mission MAÎTRE (Source de vérité Client)
    const missionRef = db.collection("bookings").doc();
    const missionData = {
      clientId: context.auth.uid,
      serviceName: category.name,
      status: "searching",
      address,
      totalAmount: finalPrice,
      paymentMethod,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await missionRef.set(missionData);

    // 2. Trouver Prestataires (Simulation Matching Géo)
    const providersSnap = await db.collection("users")
      .where("role", "==", "provider")
      .where("status", "==", "active")
      .limit(5)
      .get();

    // 3. Distribution BATCH dans les Inboxes Privées
    const batch = db.batch();
    providersSnap.forEach(p => {
      const ref = db.collection("provider_inbox").doc(p.id).collection("missions").doc(missionRef.id);
      batch.set(ref, {
        ...missionData,
        missionId: missionRef.id,
        status: "PENDING",
      });
    });

    // 4. Notification Admin
    batch.set(db.collection("admin_inbox").doc("missions").collection("items").doc(missionRef.id), {
      missionId: missionRef.id,
      status: "CREATED",
    });

    await batch.commit();

    return { success: true, missionId: missionRef.id };
  } catch (error: any) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});
