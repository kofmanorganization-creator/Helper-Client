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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from '../lib/firebase';

export interface RegisterData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
}

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

  async loginWithPhonePassword(phone: string, password: string): Promise<UserCredential> {
    const standardPhone = this.getStandardPhone(phone);
    const email = this.getVirtualEmail(standardPhone);
    
    try {
      console.log(`[AUTH] Login: ${email}`);
      const userCredential = await signInWithEmailAndPassword(auth, email, password.trim());
      
      // SÉCURITÉ : Vérifier/Créer le profil Firestore après login réussi
      await this.ensureFirestoreProfile(userCredential.user, standardPhone);
      
      return userCredential;
    } catch (error: any) {
      console.error("[AUTH] Login Error:", error.code);
      this.handleAuthError(error);
    }
  }

  /**
   * Garantit qu'un document Firestore existe pour l'utilisateur.
   * Utilise setDoc avec merge: true pour être non-destructif.
   */
  private async ensureFirestoreProfile(user: FirebaseUser, phone: string) {
    const docRef = doc(db, "users", user.uid);
    try {
      // On tente l'écriture directe car les règles l'autorisent désormais
      await setDoc(docRef, {
          uid: user.uid,
          firstName: user.displayName?.split(' ')[0] || "Utilisateur",
          lastName: user.displayName?.split(' ')[1] || "Helper",
          phone,
          email: user.email,
          role: 'client',
          status: 'active',
          updatedAt: serverTimestamp()
      }, { merge: true });
      console.log("[AUTH] Profil Firestore assuré client-side.");
    } catch (e) {
      console.error("[AUTH] Erreur lors de l'ensureProfile:", e);
    }
  }

  async register(data: RegisterData): Promise<FirebaseUser> {
    const { firstName, lastName, phone, password } = data;
    const standardPhone = this.getStandardPhone(phone);
    const email = this.getVirtualEmail(standardPhone);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password.trim());
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`
      });

      // Initialisation immédiate
      await this.triggerProfileInitialization(user.uid, firstName, lastName, standardPhone);

      return user;
    } catch (error: any) {
      console.error("[AUTH] Register Error:", error.code);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("Ce numéro est déjà utilisé.");
      }
      throw new Error("Erreur lors de la création du compte.");
    }
  }

  private async triggerProfileInitialization(uid: string, firstName: string, lastName: string, phone: string) {
    try {
      const initFn = httpsCallable(functions, 'completeRegistration');
      await initFn({ firstName, lastName, phone });
    } catch (e) {
      // Fallback client-side immédiat pour éviter le blocage
      await setDoc(doc(db, "users", uid), {
          uid,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone,
          email: `u${phone}@helper.ci`,
          role: 'client',
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
      }, { merge: true });
    }
  }

  private handleAuthError(error: any): never {
    const code = error.code;
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      throw new Error("Numéro ou code secret incorrect.");
    }
    throw new Error("Erreur de connexion technique.");
  }

  async updateLocation(commune: string): Promise<void> {
    if (!auth.currentUser) return;
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      commune,
      onboardingDone: true,
      updatedAt: serverTimestamp()
    }, { merge: true });
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
      return `Bienvenue chez Helper, ${firstName} !`;
    }
  }
}

export const authService = new AuthService();