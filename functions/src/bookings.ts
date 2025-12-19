
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { z } from "zod";
import { PricingEngineServer } from "./pricingEngine";
import { SERVICES_CATEGORIES } from "./constants";

// Initialisation globale pour éviter les erreurs d'instance
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const BookingPayloadSchema = z.object({
  serviceCategoryId: z.string().min(1, "Catégorie requise"),
  selectedVariantKey: z.string().nullable(),
  customQuantity: z.number().nullable(),
  surfaceArea: z.number().optional().default(50),
  scheduledDateTime: z.string().datetime(), // Validation ISO string
  address: z.string().min(2, "Adresse trop courte"),
  paymentMethod: z.enum(["wave", "orange", "mtn", "card", "cash"]),
});

export const createBooking = functions.region("europe-west1").https.onCall(async (data, context) => {
  // 1. Vérification Auth
  if (!context.auth) {
    console.error("[createBooking] Non authentifié");
    throw new functions.https.HttpsError("unauthenticated", "Vous devez être connecté.");
  }
  
  console.log(`[createBooking] Reçu de ${context.auth.uid}:`, JSON.stringify(data));

  try {
    // 2. Validation des entrées
    const parsed = BookingPayloadSchema.safeParse(data);
    if (!parsed.success) {
      const issues = parsed.error.issues.map(i => `${i.path}: ${i.message}`).join(", ");
      console.error("[createBooking] Erreur validation Zod:", issues);
      throw new functions.https.HttpsError("invalid-argument", `Données invalides: ${issues}`);
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

    // 3. Recherche catégorie
    const serviceCategory = SERVICES_CATEGORIES.find(c => c.id === serviceCategoryId);
    if (!serviceCategory) {
      console.error("[createBooking] Catégorie introuvable:", serviceCategoryId);
      throw new functions.https.HttpsError("not-found", "Service introuvable.");
    }

    const dateObj = new Date(scheduledDateTime);
    if (isNaN(dateObj.getTime())) {
      throw new functions.https.HttpsError("invalid-argument", "Date/Heure invalide.");
    }

    // 4. Calcul du prix (Côté Serveur pour sécurité)
    const pricingEngine = new PricingEngineServer();
    const serverPrice = pricingEngine.getPrice({
      serviceCategory,
      selectedVariantKey,
      customQuantity,
      surfaceArea,
      scheduledDateTime: dateObj,
      address,
    });

    if (serverPrice === null || serverPrice === 'quotation') {
      console.warn("[createBooking] Prix invalide ou devis requis:", serverPrice);
      throw new functions.https.HttpsError("failed-precondition", "Ce service nécessite une tarification manuelle.");
    }

    const commission = pricingEngine.computeCommission(serverPrice) || 0;
    const db = admin.firestore();
    const bookingRef = db.collection("bookings").doc();

    // 5. Logique Status
    const isCash = paymentMethod === 'cash';
    const initialStatus = isCash ? 'PENDING_ASSIGNMENT' : 'AWAITING_PAYMENT';
    const paymentStatus = isCash ? 'CASH_PENDING' : 'INITIATED';

    const bookingData = {
      id: bookingRef.id,
      clientId: context.auth.uid,
      serviceName: serviceCategory.name,
      serviceCategoryId: serviceCategory.id,
      address: address,
      scheduledAt: admin.firestore.Timestamp.fromDate(dateObj),
      status: initialStatus,
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      totalAmount: serverPrice,
      commissionAmount: commission,
      providerPayout: serverPrice - commission,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 6. Sauvegarde Firestore
    await bookingRef.set(bookingData);
    console.log("[createBooking] Mission créée avec succès ID:", bookingRef.id);
    
    return { 
      success: true, 
      bookingId: bookingRef.id, 
      status: initialStatus 
    };

  } catch (error: any) {
    console.error("[createBooking] Erreur Fatale Serveur:", error);
    
    // Si c'est déjà une HttpsError, on la relance telle quelle
    if (error instanceof functions.https.HttpsError) throw error;
    
    // Sinon on enveloppe proprement pour éviter le code 'internal' générique sans info
    throw new functions.https.HttpsError(
      "internal", 
      error.message || "Une erreur imprévue est survenue sur le serveur."
    );
  }
});

export const acceptBooking = functions.region("europe-west1").https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth requis.");
  
  const { bookingId } = data;
  if (!bookingId) throw new functions.https.HttpsError("invalid-argument", "ID Mission manquant.");

  const db = admin.firestore();
  const providerUid = context.auth.uid;

  try {
    const providerSnap = await db.collection("users").doc(providerUid).get();
    const providerData = providerSnap.data();

    if (!providerData || (providerData.role !== 'provider' && providerData.role !== 'partner')) {
       throw new functions.https.HttpsError("permission-denied", "Seuls les prestataires qualifiés peuvent accepter.");
    }

    const bookingRef = db.collection("bookings").doc(bookingId);

    return await db.runTransaction(async (transaction) => {
      const bSnap = await transaction.get(bookingRef);
      if (!bSnap.exists) throw new functions.https.HttpsError("not-found", "Mission introuvable.");

      const bData = bSnap.data();
      if (bData?.status !== 'PENDING_ASSIGNMENT') {
        throw new functions.https.HttpsError("failed-precondition", "Mission déjà prise ou expirée.");
      }

      transaction.update(bookingRef, {
        status: 'ASSIGNED',
        providerId: providerUid,
        provider: {
          id: providerUid,
          name: `${providerData.firstName} ${providerData.lastName}`,
          photoUrl: providerData.photoUrl || "",
          rating: providerData.rating || 5,
          phone: providerData.phone || ""
        },
        assignedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`[MATCHING] Mission ${bookingId} assignée à ${providerUid}`);
      return { success: true };
    });
  } catch (error: any) {
    console.error("[acceptBooking] Erreur:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Échec de l'acceptation de mission.");
  }
});
