
// This is the server-side version of the pricing engine.
// It's a direct copy of the client-side logic to ensure consistency,
// but it runs in the secure Cloud Functions environment.

import { SERVICES_PRICING_RULES, COMMISSION_RATE } from "./constants";
import { BookingState, PricingRule } from "./types";

// In a real server-side scenario, these constants would be fetched from Firestore
// or a configuration service to allow dynamic updates without redeployment.

class PricingFirestoreService {
  // On the server, we can directly access the constants.
  // This could be replaced with actual Firestore calls if rules were stored there.
  getLocalPricingRule(categoryId: string): PricingRule | null {
    const rule = SERVICES_PRICING_RULES.find(p => p.serviceCategoryId === categoryId);
    return rule ? rule.rules : null;
  }
}

export class PricingEngineServer {
  private firestoreService: PricingFirestoreService;

  constructor() {
    this.firestoreService = new PricingFirestoreService();
  }

  getPricingRuleForCategory(categoryId: string): PricingRule | null {
    return this.firestoreService.getLocalPricingRule(categoryId);
  }

  getPrice(state: Partial<BookingState>): number | 'quotation' | null {
    if (!state.serviceCategory) return null;

    let basePrice: number | 'quotation' | null = null;

    if (state.selectedVariantKey === 'custom' && state.customQuantity) {
        if (state.serviceCategory.id === 'cat_apart') {
            const standardPrice = 45000;
            const baseQty = 4;
            if (state.customQuantity <= baseQty) {
                if(state.customQuantity === 1) basePrice = 10000;
                else if(state.customQuantity === 2) basePrice = 20000;
                else if(state.customQuantity === 3) basePrice = 30000;
                else basePrice = 45000;
            } else {
                basePrice = standardPrice + (state.customQuantity - baseQty) * 15000;
            }
        }
        else if (state.serviceCategory.id === 'cat_villa' && state.customQuantity > 120) {
             basePrice = 65000 + (state.customQuantity - 120) * 500;
        }
        else if (state.serviceCategory.id === 'cat_gaz') {
            basePrice = state.customQuantity * 6000; // B12 price
        }
        else if (['cat_brico', 'cat_plomberie', 'cat_elec', 'cat_cours'].includes(state.serviceCategory.id)) {
            basePrice = state.customQuantity * 5000;
        }
        else if (state.serviceCategory.id === 'cat_peinture') {
             basePrice = state.customQuantity * 2500;
        }
        else {
             basePrice = 'quotation';
        }
    }
    else if (state.selectedVariantKey) {
        const rules = this.getPricingRuleForCategory(state.serviceCategory.id);
        if (rules) {
            if (rules.type === 'surface' && state.surfaceArea) {
                const option = rules.options.find(opt => {
                    if (opt.thresholds) return state.surfaceArea! >= opt.thresholds[0] && state.surfaceArea! <= opt.thresholds[1];
                    return false;
                });
                basePrice = option ? option.price : null;
            } else {
                const option = rules.options.find(opt => opt.key === state.selectedVariantKey);
                basePrice = option ? option.price : null;
            }
        }
    }

    if (typeof basePrice === 'number' && state.scheduledDateTime) {
        const hour = new Date(state.scheduledDateTime).getHours();
        if (hour >= 18) {
            const address = state.address || "";
            const surcharge = Math.min(10000, 5000 + (address.length * 100));
            return basePrice + surcharge;
        }
    }

    return basePrice;
  }

  computeCommission(price: number | 'quotation' | null): number | null {
    if (typeof price !== 'number') return null;
    return price * COMMISSION_RATE;
  }
}
