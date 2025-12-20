
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { HelperProWorker, HelperProContract } from '../types';

class HelperProService {
  
  // --- WORKERS MANAGEMENT ---

  subscribeToCandidates(callback: (workers: HelperProWorker[]) => void) {
    const q = query(collection(db, 'helper_pro_workers'), where('status', 'in', ['pending', 'pre_approved']));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as HelperProWorker)));
    });
  }

  subscribeToCertifiedWorkers(callback: (workers: HelperProWorker[]) => void) {
    const q = query(collection(db, 'helper_pro_workers'), where('status', '==', 'certified'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as HelperProWorker)));
    });
  }

  async updateWorkerStatus(id: string, status: HelperProWorker['status']) {
    const ref = doc(db, 'helper_pro_workers', id);
    await updateDoc(ref, { 
      status, 
      certifiedAt: status === 'certified' ? serverTimestamp() : null 
    });
  }

  // --- CONTRACTS MANAGEMENT ---

  subscribeToContracts(callback: (contracts: HelperProContract[]) => void) {
    const q = query(collection(db, 'helper_pro_contracts'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as HelperProContract)));
    });
  }

  async assignWorkerToContract(contractId: string, worker: HelperProWorker) {
    const contractRef = doc(db, 'helper_pro_contracts', contractId);
    await updateDoc(contractRef, {
      workerId: worker.id,
      workerName: `${worker.firstName} ${worker.lastName}`,
      status: 'active',
      updatedAt: serverTimestamp()
    });
  }

  async triggerReplacement(contractId: string) {
    const contractRef = doc(db, 'helper_pro_contracts', contractId);
    await updateDoc(contractRef, {
      workerId: null,
      workerName: null,
      status: 'pending', // Re-search needed
      replacementRequestedAt: serverTimestamp()
    });
  }

  // --- ANALYTICS MOCK ---
  getStats() {
    return {
      activeMaids: 42,
      monthlyRevenue: 2450000,
      totalCommission: 367500,
      replacementRate: '4.2%',
      clientSatisfaction: 4.8
    };
  }
}

export const helperProService = new HelperProService();
