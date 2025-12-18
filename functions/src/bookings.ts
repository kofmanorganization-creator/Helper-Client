import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";
import { PricingEngineServer } from "./pricingEngine";
import { SERVICES_CATEGORIES } from "./constants";

const db = admin.firestore();

const BookingPayloadSchema = z.object({
  serviceCategoryId: z.string(),
  selectedVariantKey: z.string().nullable(),
  customQuantity: z.number().nullable(),
  surfaceArea: z.number(),
  scheduledDateTime: z.string().datetime(),
  address: z.string().min(5, "Address is too short"),
  paymentMethod: z.string(),
});

export const createBooking = functions.region("europe-west1").https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  
  const parsed = BookingPayloadSchema.safeParse(data);
  if (!parsed.success) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid booking payload.", parsed.error);
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

  const serviceCategory = SERVICES_CATEGORIES.find(c => c.id === serviceCategoryId);
  if (!serviceCategory) {
    throw new functions.https.HttpsError("not-found", "Service category not found.");
  }

  const pricingEngine = new PricingEngineServer();
  
  const serverPrice = pricingEngine.getPrice({
    serviceCategory,
    selectedVariantKey,
    customQuantity,
    surfaceArea,
    scheduledDateTime: new Date(scheduledDateTime),
    address,
  });

  if (serverPrice === null || serverPrice === 'quotation') {
      throw new functions.https.HttpsError("failed-precondition", "Could not calculate a valid price for this service.");
  }

  const commission = pricingEngine.computeCommission(serverPrice);

  const bookingRef = db.collection("bookings").doc();
  const transactionId = `HLPR-${bookingRef.id.substring(0, 8).toUpperCase()}`;

  await bookingRef.set({
    id: bookingRef.id,
    clientId: context.auth.uid,
    serviceName: serviceCategory.name,
    serviceCategoryName: serviceCategory.name,
    address: address,
    scheduledAt: admin.firestore.Timestamp.fromDate(new Date(scheduledDateTime)),
    status: "pending_payment",
    totalAmount: serverPrice,
    commissionAmount: commission,
    providerPayout: serverPrice - (commission || 0),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    variantDetails: {
        key: selectedVariantKey,
        quantity: customQuantity,
        surface: surfaceArea
    },
    paymentDetails: {
        method: paymentMethod,
        transactionId: transactionId,
        status: 'initiated'
    }
  });

  return { success: true, bookingId: bookingRef.id };
});