
import { SERVICES_PRICING_RULES, COMMISSION_RATE } from "./constants";
import { BookingState } from "./types";

export class PricingEngineServer {
  /**
   * Calcule le prix final côté serveur.
   * Retourne un nombre, 'quotation' ou null.
   */
  getPrice(state: Partial<BookingState>): number | 'quotation' | null {
    if (!state.serviceCategory) return null;

    let price: number | 'quotation' | null = null;
    const catId = state.serviceCategory.id;

    // Récupération de la règle de tarification correspondante
    const rule = SERVICES_PRICING_RULES.find(r => r.serviceCategoryId === catId);
    if (!rule) return null;

    // 1. Logique de calcul par variante ou quantité
    if (state.selectedVariantKey === 'custom' && typeof state.customQuantity === 'number') {
        if (catId === 'cat_apart') {
            // Exemple : 45000 de base pour 4p + 15000 par pièce supplémentaire
            price = 45000 + (Math.max(0, state.customQuantity - 4) * 15000);
        } else {
            price = 'quotation';
        }
    } else if (state.selectedVariantKey) {
        // Recherche de l'option sélectionnée dans les règles
        const option = rule.rules.options.find(o => o.key === state.selectedVariantKey);
        price = option ? option.price : null;
    } else if (rule.rules.type === 'surface' && typeof state.surfaceArea === 'number') {
        // Logique par surface
        const option = rule.rules.options.find(opt => {
          if (opt.thresholds) return state.surfaceArea! >= opt.thresholds[0] && state.surfaceArea! <= opt.thresholds[1];
          return false;
        });
        price = option ? option.price : null;
    }

    // 2. Application des surcharges (ex: Nuit)
    if (typeof price === 'number' && state.scheduledDateTime) {
        try {
            const hour = state.scheduledDateTime.getHours();
            if (hour >= 18) {
                price += 5000; // Surcharge fixe de nuit
            }
        } catch (e) {
            console.warn("[PricingEngine] Erreur calcul surcharge heure:", e);
        }
    }

    return price;
  }

  /**
   * Calcule la commission Helper.
   */
  computeCommission(price: number | 'quotation' | null): number {
    if (typeof price !== 'number') return 0;
    const rate = COMMISSION_RATE || 0.25;
    return Math.round(price * rate);
  }
}
