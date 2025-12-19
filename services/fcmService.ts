
import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { db, messaging } from "../lib/firebase";

// Clé VAPID publique (Placeholder - À remplacer par la vraie clé du projet Firebase)
const VAPID_KEY = "BFH7f6eUuE9l8zU1S8mQp_LpT9H7_U0H0pXm9S9m_Y1_0X0P9M_Y1_0X0P9M";

export async function registerClientFCM(uid: string) {
  if (!messaging) return;

  try {
    // Demander la permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn("Permission de notification refusée.");
      return;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (!token) {
      console.warn("Impossible d'obtenir le token FCM.");
      return;
    }

    console.log("FCM Token généré :", token);

    // Enregistrer le token dans Firestore pour cet utilisateur
    await setDoc(
      doc(db, "users", uid),
      {
        fcmTokens: {
          [token]: true,
        },
        lastLogin: new Date().toISOString()
      },
      { merge: true }
    );
    
    console.log("FCM Token synchronisé avec Firestore.");
  } catch (error) {
    console.error("Erreur lors de l'enregistrement FCM :", error);
  }
}

export function listenClientNotifications() {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("📩 Notification Client reçue :", payload);
    // Ici, vous pourriez déclencher une notification visuelle personnalisée dans l'UI
    if (payload.notification) {
      new Notification(payload.notification.title || "Helper", {
        body: payload.notification.body,
        icon: "/favicon.ico"
      });
    }
  });
}
