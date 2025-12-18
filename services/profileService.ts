import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, auth, functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';

// Redefining types if they are not strictly shared or to ensure compatibility
export interface UserPreferences {
  pushNotifications: boolean;
  emailNotifications: boolean;
  aiSuggestions: boolean;
  dataSaver: boolean;
  language: string;
}

export interface PaymentMethodDetails {
  id: string;
  type: 'card' | 'mobile_money';
  provider: string;
  identifier: string;
  expiry?: string;
  isDefault: boolean;
}

export interface SecuritySession {
  id: string;
  device: string;
  lastActive: string;
  location: string;
  isCurrent: boolean;
}

const DEFAULT_PREFS: UserPreferences = {
  pushNotifications: true,
  emailNotifications: false,
  aiSuggestions: true,
  dataSaver: false,
  language: 'Français (FR)'
};

class ProfileService {
  
  private get userId() {
    return auth.currentUser?.uid;
  }

  // --- PREFERENCES ---
  async getPreferences(): Promise<UserPreferences> {
    if (!this.userId) return DEFAULT_PREFS;
    const snap = await getDoc(doc(db, 'users', this.userId, 'settings', 'preferences'));
    if (snap.exists()) {
        return snap.data() as UserPreferences;
    }
    return DEFAULT_PREFS;
  }

  async updatePreferences(newPrefs: UserPreferences): Promise<void> {
    if (!this.userId) return;
    await setDoc(doc(db, 'users', this.userId, 'settings', 'preferences'), newPrefs, { merge: true });
  }

  // --- PAYMENTS ---
  async getPaymentMethods(): Promise<PaymentMethodDetails[]> {
    if (!this.userId) return [];
    const snap = await getDocs(collection(db, 'users', this.userId, 'payment_methods'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentMethodDetails));
  }

  async addPaymentMethod(method: Omit<PaymentMethodDetails, 'id'>): Promise<PaymentMethodDetails> {
    if (!this.userId) throw new Error("Not authenticated");
    
    // Call Cloud Function to verify securely
    const addPmFn = httpsCallable(functions, 'addPaymentMethod');
    const res = await addPmFn({ ...method });
    const { id } = res.data as { id: string };

    return { ...method, id };
  }

  async deletePaymentMethod(id: string): Promise<void> {
    if (!this.userId) return;
    await deleteDoc(doc(db, 'users', this.userId, 'payment_methods', id));
  }

  async setDefaultPaymentMethod(id: string): Promise<void> {
    if (!this.userId) return;
    const methods = await this.getPaymentMethods();
    const batch = writeBatch(db);
    
    methods.forEach(m => {
        const docRef = doc(db, 'users', this.userId!, 'payment_methods', m.id);
        batch.update(docRef, { isDefault: m.id === id });
    });
    
    await batch.commit();
  }

  // --- SECURITY ---
  async getSessions(): Promise<SecuritySession[]> {
    if (!this.userId) return [];
    // Mocking sessions as this usually requires server-side token management
    return [
      { id: 'sess_1', device: 'Current Device', lastActive: 'Maintenant', location: 'Unknown', isCurrent: true }
    ];
  }

  async requestDataExport(): Promise<string> {
    // Trigger Cloud Function
    return "https://example.com/data-export-pending";
  }

  async deleteAccount(): Promise<void> {
    if (!auth.currentUser) return;
    await auth.currentUser.delete();
    window.location.reload();
  }

  // --- SUPPORT ---
  async createTicket(subject: string, message: string): Promise<string> {
    const createTicketFn = httpsCallable(functions, 'createSupportTicket');
    const res = await createTicketFn({ subject, message });
    return (res.data as any).ticketId;
  }
}

export const profileService = new ProfileService();