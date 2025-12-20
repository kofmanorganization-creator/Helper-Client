
import { Timestamp } from 'firebase/firestore';

export type FirestoreTimestamp = Timestamp;

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date | FirestoreTimestamp;
  isRead: boolean;
}

export interface ChatSession {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
}

export type ServiceCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPremium?: boolean;
};

export type PricingRule = {
  type: 'fixed' | 'surface' | 'level' | 'recurring' | 'helper_pro';
  unit?: 'm²' | 'monthly';
  options: { 
    key: string; 
    label: string; 
    price: number | 'quotation'; 
    thresholds?: number[];
    extras?: { key: string; label: string; price: number }[];
  }[];
};

export type ServicePricing = {
  serviceCategoryId: string;
  rules: PricingRule;
};

export type BookingState = {
  step: number;
  serviceCategory: ServiceCategory | null;
  pricingRule: PricingRule | null;
  selectedVariantKey: string | null;
  selectedExtras: string[];
  customQuantity: number | null;
  surfaceArea: number;
  frequency: string | null;
  scheduledDateTime: Date | null;
  address: string | null;
  price: number | 'quotation' | null;
  commission: number | null;
  payout: number | null;
};

export type PaymentMethod = 'wave' | 'orange' | 'mtn' | 'card' | 'cash';

export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl: string;
  isPremium: boolean;
  role?: 'client' | 'admin' | 'provider';
  commune?: string;
}

// --- HELPER PRO SPECIFIC ---

export interface HelperProWorker {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  commune: string;
  status: 'pending' | 'pre_approved' | 'certified' | 'rejected';
  scoreMoralite: number;
  scorePsy: number;
  phone: string;
  certifiedAt?: FirestoreTimestamp;
}

export interface HelperProContract {
  id: string;
  clientId: string;
  clientName: string;
  workerId: string | null;
  workerName: string | null;
  serviceKey: string;
  extras: string[];
  monthlyPrice: number;
  commissionPct: number;
  status: 'pending' | 'active' | 'replaced' | 'terminated';
  createdAt: FirestoreTimestamp;
  nextPaymentAt: FirestoreTimestamp;
}

export type MissionStatus = 
  | 'AWAITING_PAYMENT'    
  | 'PENDING_ASSIGNMENT'  
  | 'ASSIGNED'            
  | 'ARRIVED'             
  | 'IN_PROGRESS'         
  | 'COMPLETED_WAIT'      
  | 'COMPLETED'           
  | 'CANCELLED'           
  | 'searching'
  | 'assigned'
  | 'arrived'
  | 'in_progress'
  | 'completed_wait'
  | 'scanned'
  | 'reviewed'
  | 'pending'
  | 'pending_payment'
  | 'completed'
  | 'cancelled';

export interface Provider {
  id: string;
  name: string;
  photoUrl: string;
  rating: number;
  jobsCount: number;
  vehicle?: string;
  phone: string;
  lat: number;
  lng: number;
}

export interface Booking {
  id: string;
  clientId: string;
  serviceName: string;
  scheduledAt: FirestoreTimestamp;
  status: MissionStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'CASH_PENDING' | 'PAID' | 'FAILED' | 'INITIATED';
  totalAmount: number;
  provider?: Provider | null;
  address: string;
  serviceCategoryName?: string;
  isRecurring?: boolean;
  extras?: string[];
  pricingType?: 'hourly' | 'monthly';
}
