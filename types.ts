

import { Timestamp } from 'firebase/firestore';

export type FirestoreTimestamp = Timestamp;

export type ServiceCategory = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

export type PricingRule = {
  type: 'fixed' | 'surface' | 'level' | 'recurring';
  unit?: 'm²' | 'monthly';
  options: { key: string; label: string; price: number | 'quotation'; thresholds?: number[] }[];
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
  customQuantity: number | null;
  surfaceArea: number;
  frequency: string | null;
  scheduledDateTime: Date | null;
  address: string | null;
  price: number | 'quotation' | null;
  commission: number | null;
  payout: number | null;
};

export type PaymentMethod = 'mtn' | 'orange' | 'moov' | 'wave' | 'card' | 'cash';

export interface User {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl: string;
  isPremium: boolean;
}

// --- CHAT TYPES ---

export interface Message {
  id: string;
  senderId: string; // 'user' or 'provider'
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

// --- MISSION & MATCHING TYPES ---

export type MissionStatus = 
  | 'searching'      // Dynamic Matching in progress
  | 'assigned'       // Provider found
  | 'arrived'        // Provider at location
  | 'in_progress'    // Job started
  | 'completed_wait' // Job done, waiting for QR Scan
  | 'scanned'        // QR Scanned, Payment processing
  | 'reviewed'       // Final state
  | 'pending'        // Just created, before searching
  | 'pending_payment'// Payment initiated, waiting for webhook confirmation
  | 'completed'      // Reviewed or just finished
  | 'cancelled';     // Cancelled by user or provider

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

export interface Mission {
  id: string;
  serviceName: string;
  status: MissionStatus;
  provider: Provider | null;
  etaMinutes: number | null;
  price: number;
  qrToken?: string;
}

export interface Booking {
  id: string;
  clientId: string;
  serviceName: string;
  scheduledAt: FirestoreTimestamp;
  status: MissionStatus;
  totalAmount: number;
  provider?: Provider | null;
  address: string;
  serviceCategoryName?: string;
}
