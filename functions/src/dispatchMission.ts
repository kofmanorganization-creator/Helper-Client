
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
  // On récupère les prestataires actifs
  const snap = await db.collection("providers")
    .where("status", "==", "ACTIVE")
    .get();

  return snap.docs
    .map(d => ({ id: d.id, ...d.data() as any }))
    .filter(p => p.location && distanceKm(missionLoc, p.location) <= radiusKm);
}

/**
 * SOLUTION NUCLÉAIRE HELPER - DISTRIBUTION DES COMMANDES
 * Déclenché à la création d'une mission.
 */
export const dispatchMissionToProviders = functions.region("europe-west1").firestore
  .document("missions/{missionId}")
  .onCreate(async (snap, ctx) => {
    const mission = snap.data();
    const missionId = ctx.params.missionId;

    if (!mission?.location) {
      console.error("[DISPATCH] Mission sans localisation");
      // Fallback Admin même sans loc pour visibilité
      await db.collection("admin_inbox")
        .doc("missions")
        .collection("items")
        .doc(missionId)
        .set({
          missionId,
          status: "CREATED_NO_LOC",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      return;
    }

    console.log(`[DISPATCH] Début distribution pour mission ${missionId}`);

    // 1) Écrire dans la boîte Admin (toujours)
    await db.collection("admin_inbox")
      .doc("missions")
      .collection("items")
      .doc(missionId)
      .set({
        missionId,
        status: "CREATED",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    // 2) Recherche progressive (5 → 10 → 20 km)
    const radii = [5, 10, 20];
    let providers: any[] = [];

    const missionLoc: LatLng = mission.location;

    for (const r of radii) {
      providers = await findProviders(missionLoc, r);
      if (providers.length > 0) break;
    }

    // 3) Aucun prestataire → fallback Admin
    if (providers.length === 0) {
      await snap.ref.update({
        dispatchStatus: "NO_PROVIDER_FOUND",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.warn("[DISPATCH] Aucun prestataire trouvé dans un rayon de 20km");
      return;
    }

    // 4) Distribution ciblée (inbox prestataire)
    const batch = db.batch();
    providers.forEach(p => {
      const ref = db
        .collection("provider_inbox")
        .doc(p.id)
        .collection("missions")
        .doc(missionId);

      batch.set(ref, {
        missionId,
        serviceName: mission.serviceName || "Service Helper",
        status: "PENDING",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    batch.update(snap.ref, {
      dispatchStatus: "SENT",
      dispatchedToCount: providers.length,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();
    console.log(`[DISPATCH] Mission ${missionId} envoyée à ${providers.length} prestataires`);
  });
