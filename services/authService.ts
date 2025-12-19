
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
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
 * Architecture : Le client authentifie, le serveur initialise le profil.
 * Aucune écriture directe dans Firestore/users n'est effectuée ici pour garantir la cohérence.
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
   * Ne tente aucune création de profil, attend que le système serveur (Cloud Functions / Triggers) 
   * synchronise le document utilisateur.
   */
  async loginWithPhonePassword(phone: string, password: string): Promise<UserCredential> {
    const standardPhone = this.getStandardPhone(phone);
    const email = this.getVirtualEmail(standardPhone);
    
    try {
      console.log(`[AUTH] Tentative de connexion : ${email}`);
      const userCredential = await signInWithEmailAndPassword(auth, email, password.trim());
      
      console.log("[AUTH] Login réussi. Le profil sera synchronisé par le serveur.");
      return userCredential;
    } catch (error: any) {
      console.error("[AUTH] Erreur Connexion:", error.code);
      this.handleAuthError(error);
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   * Utilise Firebase Auth pour créer le compte, puis délègue l'initialisation métier au serveur.
   */
  async register(data: RegisterData): Promise<FirebaseUser> {
    const { firstName, lastName, phone, password } = data;
    const standardPhone = this.getStandardPhone(phone);
    const email = this.getVirtualEmail(standardPhone);

    try {
      console.log(`[AUTH] Inscription : ${email}`);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password.trim());
      const user = userCredential.user;

      // Mise à jour du nom dans le profil Auth (natif)
      await updateProfile(user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`
      });

      // Déclenchement de l'initialisation profil via Cloud Function
      await this.triggerProfileInitialization(firstName, lastName, standardPhone);

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
   * Appel à la Cloud Function d'initialisation (completeRegistration)
   * Cette fonction est responsable de créer le document Firestore sécurisé.
   */
  private async triggerProfileInitialization(firstName: string, lastName: string, phone: string) {
    try {
      console.log("[AUTH] Appel de l'initialisation profil serveur...");
      const initFn = httpsCallable(functions, 'completeRegistration');
      await initFn({ firstName, lastName, phone });
    } catch (e) {
      // En cas d'échec de l'appel (timeout ou réseau), on ne tente PAS de setDoc client-side.
      // Le Trigger Auth 'onUserCreateTrigger' en backend servira de filet de sécurité ultime.
      console.warn("[AUTH] Initialisation serveur en attente. Le trigger système prendra le relais.");
    }
  }

  private handleAuthError(error: any): never {
    const code = error.code;
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      throw new Error("Numéro ou code secret incorrect.");
    }
    throw new Error("Erreur de connexion technique. Réessayez plus tard.");
  }

  /**
   * Mise à jour de la commune (uniquement possible si le document existe déjà)
   */
  async updateLocation(commune: string): Promise<void> {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        commune,
        onboardingDone: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (e) {
      console.error("[AUTH] Erreur updateLocation (possible document non encore créé par le serveur):", e);
    }
  }

  async logout() {
    await signOut(auth);
  }

  /**
   * Récupère un message personnalisé via l'IA
   */
  async getWelcomeMessage(firstName: string): Promise<string> {
    try {
      const welcomeFn = httpsCallable(functions, 'generateWelcomeMessage');
      const res = await welcomeFn({ firstName });
      return (res.data as any).text;
    } catch (e) {
      return `Bienvenue chez Helper, ${firstName} !`;
    }
  }
}

export const authService = new AuthService();
