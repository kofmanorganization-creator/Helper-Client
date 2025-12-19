
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { z } from "zod";
import { PricingEngineServer } from "./pricingEngine";
import { SERVICES_CATEGORIES } from "./constants";

// Ensure Firebase Admin is initialized once in this scope
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Schema for incoming booking requests.
 * Ensures data integrity before processing.
 */
const BookingPayloadSchema = z.object({
  serviceCategoryId: z.string().min(1, "Service ID required"),
  selectedVariantKey: z.string().nullable().optional(),
  customQuantity: z.number().nullable().optional(),
  surfaceArea: z.number().optional().default(50),
  scheduledDateTime: z.string().min(1, "Date string required"),
  address: z.string().min(2, "Address required"),
  paymentMethod: z.string().min(1, "Payment method required"),
});

/**
 * Cloud Function to securely create a booking and calculate its final price.
 */
export const createBooking = functions.region("europe-west1").https.onCall(async (data, context) => {
  console.log("[createBooking] Incoming request processing...");

  // 1. Authenticate user
  if (!context.auth) {
    console.warn("[createBooking] Unauthorized access attempt.");
    throw new functions.https.HttpsError("unauthenticated", "Authentication is required.");
  }
  
  const uid = context.auth.uid;

  try {
    // 2. Validate payload with Zod
    const parsed = BookingPayloadSchema.safeParse(data);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map(i => `${i.path}: ${i.message}`).join(", ");
      console.error("[createBooking] Zod validation failed:", errorMsg);
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

    // 3. Find service category
    const serviceCategory = SERVICES_CATEGORIES.find(c => c.id === serviceCategoryId);
    if (!serviceCategory) {
      console.error("[createBooking] Service category not found:", serviceCategoryId);
      throw new functions.https.HttpsError("not-found", "The selected service does not exist.");
    }

    // 4. Parse date and check validity
    const dateObj = new Date(scheduledDateTime);
    if (isNaN(dateObj.getTime())) {
      console.error("[createBooking] Invalid date provided:", scheduledDateTime);
      throw new functions.https.HttpsError("invalid-argument", "Invalid date format.");
    }

    // 5. Calculate price on the server (Source of Truth)
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
      console.warn("[createBooking] Pricing logic returned null or quotation:", serverPrice);
      throw new functions.https.HttpsError("failed-precondition", "This specific request requires a manual quotation.");
    }

    // 6. Calculate amounts
    const commission = pricingEngine.computeCommission(serverPrice) || 0;
    const payout = serverPrice - commission;

    // 7. Store in Firestore
    const db = admin.firestore();
    const bookingRef = db.collection("bookings").doc();

    const isCash = paymentMethod === 'cash';
    const initialStatus = isCash ? 'PENDING_ASSIGNMENT' : 'AWAITING_PAYMENT';
    const paymentStatus = isCash ? 'CASH_PENDING' : 'INITIATED';

    const bookingData = {
      id: bookingRef.id,
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
    };

    await bookingRef.set(bookingData);
    console.log(`[createBooking] Success: Booking ${bookingRef.id} created for user ${uid}`);
    
    // Return serializable object
    return { 
      success: true, 
      bookingId: bookingRef.id, 
      status: initialStatus 
    };

  } catch (error: any) {
    console.error("[createBooking] Fatal Error:", error);

    // Re-throw HttpsErrors directly to preserve status codes and messages
    if (error instanceof functions.https.HttpsError) {
        throw error;
    }
    
    // Fallback for unexpected system errors
    throw new functions.https.HttpsError(
      "internal", 
      `Server error: ${error.message || "Unknown cause"}`
    );
  }
});

/**
 * Cloud Function for providers to accept an unassigned booking.
 */
export const acceptBooking = functions.region("europe-west1").https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  
  const { bookingId } = data;
  if (!bookingId) throw new functions.https.HttpsError("invalid-argument", "Missing bookingId.");

  const db = admin.firestore();
  const providerUid = context.auth.uid;

  try {
    // 1. Verify provider role
    const providerSnap = await db.collection("users").doc(providerUid).get();
    const providerData = providerSnap.data();

    if (!providerData || (providerData.role !== 'provider' && providerData.role !== 'partner' && providerData.role !== 'admin')) {
       throw new functions.https.HttpsError("permission-denied", "Only verified providers can accept missions.");
    }

    const bookingRef = db.collection("bookings").doc(bookingId);

    // 2. Atomic transaction to avoid race conditions
    return await db.runTransaction(async (transaction) => {
      const bSnap = await transaction.get(bookingRef);
      if (!bSnap.exists) throw new functions.https.HttpsError("not-found", "Booking no longer exists.");

      const bData = bSnap.data();
      if (bData?.status !== 'PENDING_ASSIGNMENT') {
        throw new functions.https.HttpsError("failed-precondition", "This mission is no longer available.");
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

      console.log(`[Matching] Booking ${bookingId} assigned to provider ${providerUid}`);
      return { success: true };
    });
  } catch (error: any) {
    console.error("[acceptBooking] Error during assignment:", error);
    if (error instanceof functions.https.HttpsError) throw error;
    throw new functions.https.HttpsError("internal", "Failed to assign mission.");
  }
});
