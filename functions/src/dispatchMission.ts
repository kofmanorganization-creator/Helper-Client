
import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

type LatLng = { lat: number; lng: number };

function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) *
      Math.cos(b.lat * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function findProviders(missionLoc: LatLng, radiusKm: number) {
  const snap = await db.collection("providers")
    .where("status", "==", "ACTIVE")
    .get();

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() as any }))
    .filter(p => p.location && distanceKm(missionLoc, p.location) <= radiusKm);
}

/**
 * TRIGGER DE DISTRIBUTION (Ecoute sur bookings/)
 */
export const dispatchMissionToProviders = functions.region("europe-west1").firestore
  .document("bookings/{missionId}")
  .onCreate(async (snap, ctx) => {
    const mission = snap.data();
    const missionId = ctx.params.missionId;

    if (mission?.status !== "searching") return;

    // 1) Écrire dans la boîte Admin
    await db.collection("admin_inbox")
      .doc("missions")
      .collection("items")
      .doc(missionId)
      .set({
        missionId,
        status: "CREATED",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // 2) Recherche progressive
    const missionLoc: LatLng = mission.location || { lat: 5.3484, lng: -4.0305 };
    const providers = await findProviders(missionLoc, 20); // Rayon direct 20km pour démo

    if (providers.length === 0) return;

    // ☢️ ACTION 2 — DUPLICATION CONTRÔLÉE VERS PROVIDER_INBOX
    const batch = db.batch();
    providers.forEach(p => {
      const providerInboxRef = db.collection("provider_inbox")
        .doc(p.id)
        .collection("missions")
        .doc(missionId);

      batch.set(providerInboxRef, {
        missionId,
        service: mission.serviceName || "Service Helper",
        location: mission.address || "Adresse non spécifiée",
        scheduledAt: mission.scheduledAt,
        status: "PENDING",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    console.log(`[DISPATCH] Mission ${missionId} clonée vers ${providers.length} inboxes.`);
  });
