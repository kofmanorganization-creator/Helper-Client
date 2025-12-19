
import { SERVICES_PRICING_RULES, COMMISSION_RATE } from '../constants';
import { BookingState, PricingRule } from '../types';

export class PricingEngineFirebase {
  async getPricingRuleForCategory(categoryId: string): Promise<PricingRule | null> {
    const rule = SERVICES_PRICING_RULES.find(p => p.serviceCategoryId === categoryId);
    return rule ? rule.rules : null;
  }

  async getPrice(state: Partial<BookingState>): Promise<number | 'quotation' | null> {
    if (!state.serviceCategory) return null;

    let basePrice: number | 'quotation' | null = null;
    const rules = await this.getPricingRuleForCategory(state.serviceCategory.id);

    if (state.selectedVariantKey === 'custom' && state.customQuantity) {
        if (state.serviceCategory.id === 'cat_apart') {
            basePrice = 45000 + (Math.max(0, state.customQuantity - 4) * 15000);
        } else {
            basePrice = 'quotation';
        }
    } else if (state.selectedVariantKey && rules) {
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

    if (typeof basePrice === 'number' && state.scheduledDateTime) {
        if (state.scheduledDateTime.getHours() >= 18) {
            basePrice += 5000;
        }
    }

    return basePrice;
  }

  computeCommission(price: number | 'quotation' | null): number | null {
    if (typeof price !== 'number') return null;
    return price * COMMISSION_RATE;
  }
  
  computePayout(price: number | 'quotation' | null): number | null {
    if (typeof price !== 'number') return null;
    const commission = this.computeCommission(price);
    return commission !== null ? price - commission : null;
  }
}
