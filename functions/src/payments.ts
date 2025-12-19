
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { z } from "zod";

const PayoutSchema = z.object({
  operator: z.string().min(2),
  msisdn: z.string().min(8)
});

// FIX: Explicitly use v1 region and https
export const verifyPayoutNumber = functions.region("europe-west1").https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required");

  const parsed = PayoutSchema.safeParse(data);
  if (!parsed.success) throw new functions.https.HttpsError("invalid-argument", "Invalid payload");
  
  return { ok: true };
});

// FIX: Explicitly use v1 region and https
export const addPaymentMethod = functions.region("europe-west1").https.onCall(async (data, ctx) => {
  if (!ctx.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required");
  
  const { type, provider, token, phone, identifier } = data;
  const db = admin.firestore();
  
  const pmRef = db.collection("users").doc(ctx.auth.uid).collection("payment_methods").doc();
  await pmRef.set({
    type,
    provider,
    identifier: identifier || phone || "xxxx",
    token: token || null,
    phone: phone || null,
    isDefault: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return { id: pmRef.id, ok: true };
});

// FIX: Explicitly use v1 region and https
export const paymentWebhook = functions.region("europe-west1").https.onRequest(async (req, res) => {
  const db = admin.firestore();
  try {
    const { transactionId, status } = req.body;

    if (status === 'SUCCESS') {
        const bookingsQuery = db.collection('bookings').where('paymentDetails.transactionId', '==', transactionId).limit(1);
        const snapshot = await bookingsQuery.get();

        if (snapshot.empty) {
            res.status(404).send({ error: 'Booking not found' });
            return;
        }

        const bookingDoc = snapshot.docs[0];
        
        if (bookingDoc.data().status !== 'pending_payment') {
            res.status(200).send({ message: 'Webhook ignored, booking already processed.' });
            return;
        }

        await bookingDoc.ref.update({
            status: 'searching',
            'paymentDetails.status': 'confirmed',
            'paymentDetails.webhookTimestamp': admin.firestore.FieldValue.serverTimestamp()
        });
    }
    
    res.status(200).send({ status: 'received' });
  } catch (error) {
    res.status(500).send({ error: 'Internal server error' });
  }
});
