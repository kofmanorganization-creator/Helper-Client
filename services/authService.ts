
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser, 
  UserCredential,
  updateProfile,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../lib/firebase';

export interface RegisterData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
}

/**
 * SERVICE AUTHENTIFICATION (Helper)
 * Architecture PRODUCTION GRADE : 
 * Le client AUTHENTIFIE uniquement.
 * Le serveur (Cloud Functions + Triggers) INITIALISE le profil Firestore.
 * Le client ATTEND l'existence du document pour rediriger.
 */
class AuthService {
  constructor() {
    setPersistence(auth, browserLocalPersistence).catch(console.error);
  }

  private getStandardPhone(phone: string): string {
    if (!phone) return "";
    const clean = phone.replace(/\D/g, '');
    return clean.length >= 10 ? clean.slice(-10) : clean;
  }

  private getVirtualEmail(phone: string): string {
    const standard = this.getStandardPhone(phone);
    return `u${standard}@helper.ci`.toLowerCase();
  }

  /**
   * Connexion sécurisée
   * ✅ AUCUNE écriture Firestore côté client.
   * ✅ Force le rafraîchissement du token pour les custom claims.
   */
  async loginWithPhonePassword(phone: string, password: string): Promise<UserCredential> {
    const standardPhone = this.getStandardPhone(phone);
    const email = this.getVirtualEmail(standardPhone);
    
    try {
      console.log(`[AUTH] Tentative de connexion : ${email}`);
      const userCredential = await signInWithEmailAndPassword(auth, email, password.trim());
      
      // Force le rafraîchissement du token pour récupérer les custom claims (rôles, etc.)
      await userCredential.user.getIdToken(true);
      
      console.log("[AUTH] Login réussi. Attente de synchronisation du profil serveur.");
      return userCredential;
    } catch (error: any) {
      console.error("[AUTH] Erreur Connexion:", error.code);
      this.handleAuthError(error);
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   * ✅ Appel à la Cloud Function complèteRegistration.
   * ✅ AUCUNE création de document users/{uid} directe.
   */
  async register(data: RegisterData): Promise<FirebaseUser> {
    const { firstName, lastName, phone, password } = data;
    const standardPhone = this.getStandardPhone(phone);
    const email = this.getVirtualEmail(standardPhone);

    try {
      console.log(`[AUTH] Création du compte : ${email}`);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password.trim());
      const user = userCredential.user;

      // Mise à jour du DisplayName natif Firebase
      await updateProfile(user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`
      });

      // Délégation de la création du profil métier au serveur
      await this.triggerProfileInitialization(firstName, lastName, standardPhone);

      // Rafraîchissement pour confirmer l'état sécurisé
      await user.getIdToken(true);

      return user;
    } catch (error: any) {
      console.error("[AUTH] Erreur Inscription:", error.code);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("Ce numéro est déjà associé à un compte Helper.");
      }
      throw new Error("Impossible de créer le compte. Vérifiez votre connexion.");
    }
  }

  /**
   * Trigger d'initialisation via Cloud Function (Callable)
   */
  private async triggerProfileInitialization(firstName: string, lastName: string, phone: string) {
    try {
      console.log("[AUTH] Signalement au serveur (completeRegistration)...");
      const initFn = httpsCallable(functions, 'completeRegistration');
      await initFn({ firstName, lastName, phone });
    } catch (e) {
      // Si l'appel échoue, le trigger Firestore natif onCreate servira de secours.
      console.warn("[AUTH] Latence serveur détectée. Le trigger système prendra le relais.");
    }
  }

  private handleAuthError(error: any): never {
    const code = error.code;
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      throw new Error("Numéro ou code secret incorrect.");
    }
    throw new Error("Erreur technique. Vérifiez votre connexion.");
  }

  /**
   * Mise à jour de la localisation (Une fois le profil synchronisé)
   * ✅ Utilise updateDoc car le document doit déjà exister.
   */
  async updateLocation(commune: string): Promise<void> {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        commune,
        onboardingDone: true,
        updatedAt: serverTimestamp()
      });
      console.log("[AUTH] Commune mise à jour avec succès.");
    } catch (e) {
      console.error("[AUTH] Erreur updateLocation (document non trouvé) :", e);
      throw new Error("Profil en cours de création. Réessayez dans un instant.");
    }
  }

  async logout() {
    await signOut(auth);
  }

  async getWelcomeMessage(firstName: string): Promise<string> {
    try {
      const welcomeFn = httpsCallable(functions, 'generateWelcomeMessage');
      const res = await welcomeFn({ firstName });
      return (res.data as any).text;
    } catch (e) {
      return `Heureux de vous voir, ${firstName} !`;
    }
  }
}

export const authService = new AuthService();
