import { PaymentMethod } from '../types';

/**
 * Simulates initializing a payment with a Mobile Money provider.
 * @returns A promise that resolves with a mock transaction reference.
 */
export const initPayment = async (amount: number, phone: string, method: PaymentMethod): Promise<{ success: boolean; reference: string }> => {
  console.log(`Initializing ${method} payment of ${amount} XOF to ${phone}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (!phone || phone.length < 5) {
    console.error("Payment failed: Invalid phone number.");
    return { success: false, reference: '' };
  }
  
  const reference = `HELPER_${method.toUpperCase()}_${Date.now()}`;
  console.log(`Payment initiated. Reference: ${reference}`);
  return { success: true, reference };
};

/**
 * Simulates verifying a payment status.
 * @returns A promise that resolves to true, mocking a successful payment.
 */
export const verifyPayment = async (reference: string): Promise<boolean> => {
  console.log(`Verifying payment for reference: ${reference}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`Payment successful for ${reference}`);
  return true;
};

// In a real backend, you would have a webhook endpoint.
// This function simulates the logic that would run on that endpoint.
export const callbackWebhook = (payload: any) => {
  console.log("Received payment callback webhook:", payload);
  // Here you would update the command status in Firestore to 'confirmed'.
};
