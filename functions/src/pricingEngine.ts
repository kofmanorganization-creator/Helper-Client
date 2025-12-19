
import { SERVICES_PRICING_RULES, COMMISSION_RATE } from "./constants";
import { BookingState, PricingRule } from "./types";

class PricingFirestoreService {
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
    if (!state || !state.serviceCategory) return null;

    let basePrice: number | 'quotation' | null = null;
    const categoryId = state.serviceCategory.id;

    // Logique Custom
    if (state.selectedVariantKey === 'custom' && state.customQuantity) {
        const qty = state.customQuantity;
        if (categoryId === 'cat_apart') {
            if(qty === 1) basePrice = 10000;
            else if(qty === 2) basePrice = 20000;
            else if(qty === 3) basePrice = 30000;
            else basePrice = 45000 + (Math.max(0, qty - 4) * 15000);
        }
        else if (categoryId === 'cat_villa') {
             basePrice = 65000 + (Math.max(0, qty - 120) * 500);
        }
        else if (categoryId === 'cat_gaz') basePrice = qty * 6000;
        else if (['cat_brico', 'cat_plomberie', 'cat_elec', 'cat_cours'].includes(categoryId)) basePrice = qty * 5000;
        else if (categoryId === 'cat_peinture') basePrice = qty * 2500;
        else basePrice = 'quotation';
    }
    // Logique Standard
    else if (state.selectedVariantKey) {
        const rules = this.getPricingRuleForCategory(categoryId);
        if (rules) {
            if (rules.type === 'surface' && state.surfaceArea) {
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

    // Majoration Nuit
    if (typeof basePrice === 'number' && state.scheduledDateTime) {
        try {
            const dateObj = (state.scheduledDateTime instanceof Date) ? state.scheduledDateTime : new Date(state.scheduledDateTime);
            if (!isNaN(dateObj.getTime())) {
                const hour = dateObj.getHours();
                if (hour >= 18) {
                    const address = state.address || "";
                    const surcharge = Math.min(10000, 5000 + (address.length * 100));
                    return basePrice + surcharge;
                }
            }
        } catch (e) { 
            console.error("Pricing Surcharge Error calculation", e); 
        }
    }

    return basePrice;
  }

  computeCommission(price: number | 'quotation' | null): number | null {
    if (typeof price !== 'number') return null;
    return price * COMMISSION_RATE;
  }
}
