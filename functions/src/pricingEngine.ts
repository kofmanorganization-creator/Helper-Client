
import { SERVICES_PRICING_RULES, COMMISSION_RATE } from "./constants";
import { BookingState, PricingRule } from "./types";

/**
 * Service to handle pricing rules retrieval from static constants.
 */
class PricingFirestoreService {
  getLocalPricingRule(categoryId: string): PricingRule | null {
    const rule = SERVICES_PRICING_RULES.find(p => p.serviceCategoryId === categoryId);
    return rule ? rule.rules : null;
  }
}

/**
 * Server-side Pricing Engine. 
 * Must match the logic in the client-side pricing engine for consistency.
 */
export class PricingEngineServer {
  private firestoreService: PricingFirestoreService;

  constructor() {
    this.firestoreService = new PricingFirestoreService();
  }

  getPricingRuleForCategory(categoryId: string): PricingRule | null {
    return this.firestoreService.getLocalPricingRule(categoryId);
  }

  /**
   * Calculates the price for a given booking state.
   */
  getPrice(state: Partial<BookingState>): number | 'quotation' | null {
    if (!state || !state.serviceCategory) return null;

    let basePrice: number | 'quotation' | null = null;
    const categoryId = state.serviceCategory.id;

    // 1. Custom quantity logic
    if (state.selectedVariantKey === 'custom' && typeof state.customQuantity === 'number') {
        const qty = state.customQuantity;
        if (categoryId === 'cat_apart') {
            if (qty <= 1) basePrice = 10000;
            else if (qty === 2) basePrice = 20000;
            else if (qty === 3) basePrice = 30000;
            else basePrice = 45000 + (Math.max(0, qty - 4) * 15000);
        } else if (categoryId === 'cat_villa') {
             basePrice = 65000 + (Math.max(0, qty - 120) * 500);
        } else if (categoryId === 'cat_gaz') {
             basePrice = qty * 6000;
        } else if (['cat_brico', 'cat_plomberie', 'cat_elec', 'cat_cours'].includes(categoryId)) {
             basePrice = qty * 5000;
        } else if (categoryId === 'cat_peinture') {
             basePrice = qty * 2500;
        } else {
             basePrice = 'quotation';
        }
    } 
    // 2. Standard variant logic
    else if (state.selectedVariantKey) {
        const rules = this.getPricingRuleForCategory(categoryId);
        if (rules) {
            if (rules.type === 'surface' && typeof state.surfaceArea === 'number') {
                const area = state.surfaceArea;
                const option = rules.options.find(opt => {
                    if (opt.thresholds) return area >= opt.thresholds[0] && area <= opt.thresholds[1];
                    return false;
                });
                basePrice = option ? option.price : null;
            } else {
                const option = rules.options.find(opt => opt.key === state.selectedVariantKey);
                basePrice = option ? option.price : null;
            }
        }
    }

    // 3. Evening surcharge (night shift)
    if (typeof basePrice === 'number' && state.scheduledDateTime) {
        try {
            const dateObj = (state.scheduledDateTime instanceof Date) 
                ? state.scheduledDateTime 
                : new Date(state.scheduledDateTime);
                
            if (!isNaN(dateObj.getTime())) {
                const hour = dateObj.getHours();
                // Apply surcharge if appointment is at 18:00 or later
                if (hour >= 18) {
                    const addressLength = (state.address || "").length;
                    const surcharge = Math.min(10000, 5000 + (addressLength * 100));
                    return basePrice + surcharge;
                }
            }
        } catch (e) { 
            console.error("[PricingEngineServer] Error calculating surcharge:", e); 
        }
    }

    return basePrice;
  }

  /**
   * Calculates the platform commission based on the total price.
   */
  computeCommission(price: number | 'quotation' | null): number | null {
    if (typeof price !== 'number') return null;
    return Math.round(price * COMMISSION_RATE);
  }
}
