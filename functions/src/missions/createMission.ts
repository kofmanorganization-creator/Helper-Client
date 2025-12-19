
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { z } from "zod";
import { PricingEngineServer } from "../pricingEngine";
import { SERVICES_CATEGORIES } from "../constants";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const MissionPayloadSchema = z.object({
  serviceCategoryId: z.string().min(1, "ID de service requis"),
  selectedVariantKey: z.string().nullable().optional(),
  customQuantity: z.number().nullable().optional(),
  surfaceArea: z.number().optional().default(50),
  scheduledDateTime: z.string().min(1, "Date requise"),
  address: z.string().min(2, "Adresse requise"),
  paymentMethod: z.string().min(1, "Mode de paiement requis"),
});

/**
 * PRODUCTION-READY: Unified mission creation function.
 * Handles server-side pricing, CASH flows, and initial status.
 */
export const createMission = functions.region("europe-west1").https.onCall(async (data, context) => {
  console.log("[createMission] Incoming request...");

  // 1. Authenticate user
  if (!context.auth) {
    console.warn("[createMission] Access denied: unauthenticated");
    throw new functions.https.HttpsError("unauthenticated", "Vous devez être connecté.");
  }
  
  const uid = context.auth.uid;

  try {
    // 2. Validate payload
    const parsed = MissionPayloadSchema.safeParse(data);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => `${i.path}: ${i.message}`).join(", ");
      console.error("[createMission] Validation failed:", errorMsg);
      throw new functions.https.HttpsError("invalid-argument", errorMsg);
    }

    const {
      serviceCategoryId,
      selectedVariantKey,
      customQuantity,
      surfaceArea,
      scheduledDateTime,
      address,
      paymentMethod,
    } = parsed.data;

    // 3. Service category lookup
    const serviceCategory = SERVICES_CATEGORIES.find(c => c.id === serviceCategoryId);
    if (!serviceCategory) {
      throw new functions.https.HttpsError("not-found", "Service introuvable.");
    }

    // 4. Date parsing
    const dateObj = new Date(scheduledDateTime);
    if (isNaN(dateObj.getTime())) {
      throw new functions.https.HttpsError("invalid-argument", "Format de date invalide.");
    }

    // 5. Server-side Pricing
    const pricingEngine = new PricingEngineServer();
    const serverPrice = pricingEngine.getPrice({
      serviceCategory,
      selectedVariantKey: selectedVariantKey || null,
      customQuantity: customQuantity || null,
      surfaceArea,
      scheduledDateTime: dateObj,
      address,
    });

    if (serverPrice === null || serverPrice === 'quotation') {
      console.warn("[createMission] Pricing returned null/quotation:", serverPrice);
      throw new functions.https.HttpsError("failed-precondition", "Cette demande nécessite un devis manuel.");
    }

    // 6. Platform fees
    const commission = pricingEngine.computeCommission(serverPrice) || 0;
    const payout = serverPrice - commission;

    // 7. Atomic Firestore Write
    const db = admin.firestore();
    const missionRef = db.collection("missions").doc();

    const isCash = paymentMethod === 'cash';
    const initialStatus = isCash ? 'searching' : 'pending_payment';
    const paymentStatus = isCash ? 'CASH_PENDING' : 'INITIATED';

    const missionData = {
      id: missionRef.id,
      clientId: uid,
      serviceName: serviceCategory.name,
      serviceCategoryId: serviceCategory.id,
      address: address,
      scheduledAt: admin.firestore.Timestamp.fromDate(dateObj),
      status: initialStatus,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      totalAmount: serverPrice,
      commissionAmount: commission,
      providerPayout: payout,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      notifiedProviders: []
    };

    const batch = db.batch();
    batch.set(missionRef, missionData);
    
    // BACKWARD COMPATIBILITY: Mirror to 'bookings' collection
    const bookingRef = db.collection("bookings").doc(missionRef.id);
    batch.set(bookingRef, missionData);

    await batch.commit();

    console.log(`[createMission] Success: Mission ${missionRef.id} created for user ${uid}`);
    
    return { 
      success: true, 
      missionId: missionRef.id, 
      status: initialStatus 
    };

  } catch (error: any) {
    console.error("[createMission] Fatal Error:", error);

    // Re-throw HttpsErrors to maintain context
    if (error instanceof functions.https.HttpsError) {
        throw error;
    }
    
    throw new functions.https.HttpsError(
      "internal", 
      `Erreur serveur : ${error.message || "Cause inconnue"}`
    );
  }
});
