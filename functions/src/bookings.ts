
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

export const lockMission = functions.region("europe-west1").https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth requise");
  
  const { missionId } = data;
  const providerId = context.auth.uid;
  const db = admin.firestore();

  return await db.runTransaction(async (transaction) => {
    const mainMissionRef = db.collection("bookings").doc(missionId);
    const mainSnap = await transaction.get(mainMissionRef);

    if (!mainSnap.exists || mainSnap.data()?.status !== "searching") {
      throw new functions.https.HttpsError("failed-precondition", "Mission déjà prise ou expirée.");
    }

    const providerSnap = await transaction.get(db.collection("users").doc(providerId));
    const pData = providerSnap.data();

    // Verrouillage de la mission maître
    transaction.update(mainMissionRef, {
      status: "assigned",
      providerId: providerId,
      provider: {
        id: providerId,
        name: `${pData?.firstName} ${pData?.lastName}`,
        photoUrl: pData?.photoUrl || "",
        phone: pData?.phone || ""
      }
    });

    // Mise à jour de l'inbox du gagnant
    transaction.update(db.collection("provider_inbox").doc(providerId).collection("missions").doc(missionId), {
      status: "assigned"
    });

    return { success: true };
  });
});

export const completeMissionWithQR = functions.region("europe-west1").https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Auth requise");
  
  const { missionId } = data; // Appelé par le CLIENT après scan
  const db = admin.firestore();

  const missionRef = db.collection("bookings").doc(missionId);
  await missionRef.update({
    status: "completed",
    paymentStatus: "PAID",
    completedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});
