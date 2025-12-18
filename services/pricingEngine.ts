
import { SERVICES_PRICING_RULES, COMMISSION_RATE } from '../constants';
import { BookingState, PricingRule } from '../types';

/**
 * Simulates a service to interact with Firestore for pricing.
 * In a real app, this would make async calls to Firestore.
 */
class PricingFirestoreService {
  async getPricingRuleForCategory(categoryId: string): Promise<PricingRule | null> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200)); 

    const rule = SERVICES_PRICING_RULES.find(p => p.serviceCategoryId === categoryId);
    if (rule) {
      return rule.rules;
    }
    // Fallback to local constants if "Firestore" fails
    console.warn(`Firestore lookup failed for ${categoryId}, using local fallback.`);
    return this.getLocalPricingRule(categoryId);
  }

  getLocalPricingRule(categoryId: string): PricingRule | null {
    const rule = SERVICES_PRICING_RULES.find(p => p.serviceCategoryId === categoryId);
    return rule ? rule.rules : null;
  }
}

export class PricingEngineFirebase {
  private firestoreService: PricingFirestoreService;

  constructor() {
    this.firestoreService = new PricingFirestoreService();
  }

  async getPricingRuleForCategory(categoryId: string): Promise<PricingRule | null> {
    return this.firestoreService.getPricingRuleForCategory(categoryId);
  }

  async getPrice(state: Partial<BookingState>): Promise<number | 'quotation' | null> {
    if (!state.serviceCategory) return null;

    let basePrice: number | 'quotation' | null = null;

    // --- LOGIQUE PERSONNALISÉE (CUSTOM) ---
    if (state.selectedVariantKey === 'custom' && state.customQuantity) {
        
        // Logique Appartement : > 4 pièces (+15 000 par pièce)
        if (state.serviceCategory.id === 'cat_apart') {
            const standardPrice = 45000; // Prix pour 4 pièces
            const baseQty = 4;
            
            if (state.customQuantity <= baseQty) {
                // Si l'utilisateur entre 1, 2, 3 ou 4 dans le custom, on renvoie les prix standards
                if(state.customQuantity === 1) basePrice = 10000;
                else if(state.customQuantity === 2) basePrice = 20000;
                else if(state.customQuantity === 3) basePrice = 30000;
                else basePrice = 45000;
            } else {
                const extraRooms = state.customQuantity - baseQty;
                const extraCost = extraRooms * 15000;
                basePrice = standardPrice + extraCost;
            }
        }

        // Logique Villa / Surface : Extrapolation linéaire si > 120m² (exemple: +500F/m²)
        else if (state.serviceCategory.id === 'cat_villa') {
             if (state.customQuantity > 120) {
                 const standardPrice = 65000;
                 const extraSurface = state.customQuantity - 120;
                 basePrice = standardPrice + (extraSurface * 500);
             }
        }
        
        // Logique Gaz : Quantité x Prix B12 (moyenne)
        else if (state.serviceCategory.id === 'cat_gaz') {
            const avgPrice = 6000; // Prix B12
            basePrice = state.customQuantity * avgPrice;
        }

        // Logique Heures (Bricolage, Plomberie, Elec, Jardin, Cours)
        else if (['cat_brico', 'cat_plomberie', 'cat_elec', 'cat_cours'].includes(state.serviceCategory.id)) {
            const hourPrice = 5000; 
            basePrice = state.customQuantity * hourPrice;
        }

        // Logique Peinture (m²)
        else if (state.serviceCategory.id === 'cat_peinture') {
             const meterPrice = 2500;
             basePrice = state.customQuantity * meterPrice;
        }
        else {
             // Par défaut pour les autres cas personnalisés
             basePrice = 'quotation';
        }
    }
    // --- LOGIQUE STANDARD (OPTIONS PRÉDÉFINIES) ---
    else if (state.selectedVariantKey && state.serviceCategory.id === 'cat_villa') {
         // Cas spécial Villa traité comme standard si variant key existe
         const rules = await this.firestoreService.getPricingRuleForCategory(state.serviceCategory.id);
         if (rules && rules.type === 'surface' && state.surfaceArea) {
             const option = rules.options.find(opt => {
                if (opt.thresholds) return state.surfaceArea! >= opt.thresholds[0] && state.surfaceArea! <= opt.thresholds[1];
                return false;
             });
             basePrice = option ? option.price : null;
         }
    }
    else if (state.selectedVariantKey) {
        const rules = await this.firestoreService.getPricingRuleForCategory(state.serviceCategory.id);
        if (rules) {
            // Cas spécifique Surface (utilisation du slider standard)
            if (rules.type === 'surface' && state.surfaceArea && state.selectedVariantKey !== 'custom') {
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

    // --- APPLICATION DE LA MAJORATION NUIT (18H - 20H) ---
    // Si un prix de base existe et n'est pas "sur devis"
    if (typeof basePrice === 'number' && state.scheduledDateTime) {
        const hour = state.scheduledDateTime.getHours();
        
        // Créneau Nuit détecté (18h ou plus)
        if (hour >= 18) {
            // Calculer la surcharge dynamique (Simulée)
            // Logique identique au Frontend pour consistance: Base 5000 + (len * 100), max 10000
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
  
  computePayout(price: number | 'quotation' | null): number | null {
    if (typeof price !== 'number') return null;
    const commission = this.computeCommission(price);
    return commission !== null ? price - commission : null;
  }

  exportSummary(state: BookingState): Record<string, any> {
      let variantLabel = state.pricingRule?.options.find(o => o.key === state.selectedVariantKey)?.label;
      if (state.selectedVariantKey === 'custom') {
          variantLabel = `Personnalisé (${state.customQuantity})`;
      }

      return {
          service: state.serviceCategory?.name,
          variant: variantLabel,
          surface: state.surfaceArea,
          date: state.scheduledDateTime?.toISOString(),
          address: state.address,
          totalPrice: state.price,
          commission: state.commission,
          providerPayout: state.payout,
      };
  }

  toCommandPayload(state: BookingState): Record<string, any> | null {
      if (!state.serviceCategory || !state.price || state.price === 'quotation' || !state.scheduledDateTime || !state.address) {
          return null;
      }
      return {
          serviceCategoryId: state.serviceCategory.id,
          variantKey: state.selectedVariantKey,
          customQuantity: state.customQuantity || 0,
          surfaceArea: state.surfaceArea,
          scheduledAt: state.scheduledDateTime.toISOString(),
          address: state.address,
          totalAmount: state.price,
          commissionAmount: state.commission,
          payoutAmount: state.payout,
          status: 'pending_payment',
      }
  }
}
