
import { analytics } from '../lib/firebase';
import { logEvent } from 'firebase/analytics';

/**
 * Tracks OTP flow events in Firebase Analytics for observability.
 * @param status The status of the OTP event.
 */
export const trackOtp = (status: "sent" | "verified" | "failed") => {
  if (!analytics) {
    console.log(`Analytics not available. Skipped event: otp_flow, status: ${status}`);
    return;
  };
  logEvent(analytics, "otp_flow", { status });
};
