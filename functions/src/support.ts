import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { z } from "zod";

const db = admin.firestore();

const TicketSchema = z.object({
  subject: z.string().min(3),
  message: z.string().min(5)
});

export const createSupportTicket = functions.region("europe-west1").https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth required");
  
  const parsed = TicketSchema.safeParse(data);
  if (!parsed.success) throw new functions.https.HttpsError("invalid-argument", "Invalid ticket payload");

  const ticketRef = db.collection("support_tickets").doc();
  await ticketRef.set({
    userId: context.auth.uid,
    subject: parsed.data.subject,
    message: parsed.data.message,
    status: "open",
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { ticketId: ticketRef.id, ok: true };
});