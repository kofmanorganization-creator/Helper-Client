
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * TRIGGER DISTRIBUTION NUCLÉAIRE
 * Déclenché dès qu'une mission est créée dans Firestore.
 */
export const dispatchMissionTrigger = onDocumentCreated(
  {
    region: "europe-west1",
    document: "missions/{missionId}",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const missionId = event.params.missionId;
    const missionData = snap.data();
    const db = admin.firestore();

    console.info(`[Dispatch] Traitement mission : ${missionId}`);

    try {
      // 1. Filtrer uniquement les missions en recherche
      if (missionData.status !== 'searching') return;

      // 2. Trouver les prestataires (Simulation de matching géographique)
      // En production, on utiliserait une geo-query ou un algo de scoring
      const providersSnap = await db.collection("users")
        .where("role", "==", "provider")
        .where("status", "==", "active")
        .limit(10) // Envoyer aux 10 premiers pour la démo
        .get();

      if (providersSnap.empty) {
        console.warn(`[Dispatch] Aucun prestataire disponible pour : ${missionId}`);
        return;
      }

      const batch = db.batch();

      // 3. Écrire dans l'Inbox de chaque prestataire ciblé
      providersSnap.docs.forEach((pDoc) => {
        const inboxRef = db.collection("users").doc(pDoc.id).collection("inbox").doc(missionId);
        batch.set(inboxRef, {
          missionId: missionId,
          serviceCategoryId: missionData.serviceCategoryId,
          status: "pending",
          payout: missionData.providerPayout || 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      // 4. Log centralisé de distribution
      const dispatchRef = db.collection("mission_dispatch").doc(missionId);
      batch.set(dispatchRef, {
        targetCount: providersSnap.size,
        dispatchedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "sent"
      });

      await batch.commit();
      console.info(`[Dispatch] Mission ${missionId} distribuée à ${providersSnap.size} prestataires.`);

    } catch (error) {
      console.error(`[Dispatch] Erreur fatale distribution mission ${missionId}:`, error);
    }
  }
);
