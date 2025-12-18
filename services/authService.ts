
import { httpsCallable } from 'firebase/functions';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User as FirebaseUser, 
  UserCredential,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, functions, db } from '../lib/firebase';

export interface RegisterData {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
}

class AuthService {
  private _currentUser: FirebaseUser | null = null;

  constructor() {
    auth.onAuthStateChanged(user => {
      this._currentUser = user;
    });
  }

  /**
   * Connexion avec téléphone et code à 6 chiffres.
   */
  async loginWithPhonePassword(phone: string, password: string): Promise<UserCredential> {
    const email = `+225${phone}@helper.app`;
    return signInWithEmailAndPassword(auth, email, password);
  }

  /**
   * Inscription directe (Email virtuel + Password) suivie de la création du profil Firestore.
   */
  async register(data: RegisterData): Promise<void> {
    const { firstName, lastName, phone, password } = data;
    const email = `+225${phone}@helper.app`;

    try {
      // 1. Création du compte Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 2. Mise à jour du DisplayName (Auth)
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`
      });

      // 3. Création du profil Firestore
      const userDoc = {
        uid,
        firstName,
        lastName,
        phone,
        email,
        photoUrl: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=0D8ABC&color=fff`,
        role: 'client',
        isPremium: false,
        createdAt: serverTimestamp(),
        onboardingDone: false,
        status: 'active'
      };

      await setDoc(doc(db, 'users', uid), userDoc);
      
      // 4. Notification AI (Optionnel)
      try {
        const generateMsgFn = httpsCallable(functions, 'generateWelcomeMessage');
        await generateMsgFn({ firstName });
      } catch (e) {
        console.warn("AI welcome notification skipped");
      }

    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("Ce numéro de téléphone est déjà associé à un compte.");
      }
      throw error;
    }
  }

  async updateLocation(commune: string, coords?: {lat: number, lng: number}): Promise<void> {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        commune,
        gpsCoordinates: coords || null,
        lastLocationUpdate: serverTimestamp(),
        onboardingDone: true
      });
    } catch (error) {
      console.error("Error updating location:", error);
    }
  }

  async getWelcomeMessage(firstName: string): Promise<string> {
    try {
        const generateMsgFn = httpsCallable(functions, 'generateWelcomeMessage');
        const res = await generateMsgFn({ firstName }) as { data: { text: string } };
        return res.data.text;
    } catch (e) {
        return `Bienvenue sur Helper, ${firstName} !`;
    }
  }

  async logout() {
    await signOut(auth);
    this._currentUser = null;
  }
  
  getCurrentUser() {
      return auth.currentUser || this._currentUser;
  }
}

export const authService = new AuthService();
