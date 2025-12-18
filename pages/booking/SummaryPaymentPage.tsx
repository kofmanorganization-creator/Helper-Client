
import React, { useMemo } from 'react';
import { BookingState, PaymentMethod } from '../../types';
import { Wallet, CreditCard, Banknote, Sparkles, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

interface SummaryPaymentPageProps {
  bookingState: BookingState;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  selectedMethod: PaymentMethod | null;
}

const SummaryPaymentPage: React.FC<SummaryPaymentPageProps> = ({ bookingState, onSelectPaymentMethod, selectedMethod }) => {
  const { serviceCategory, pricingRule, selectedVariantKey, price, scheduledDateTime, address } = bookingState;

  const getVariantLabel = () => {
    if(!pricingRule || !selectedVariantKey) return 'N/A';
    if(pricingRule.type === 'surface') {
        const option = pricingRule.options.find(opt => {
            if (opt.thresholds) return bookingState.surfaceArea >= opt.thresholds[0] && bookingState.surfaceArea <= opt.thresholds[1];
            return false;
        });
        return `${option?.label} (${bookingState.surfaceArea} m²)`;
    }
    if (selectedVariantKey === 'custom') return `Personnalisé (${bookingState.customQuantity})`;
    return pricingRule.options.find(o => o.key === selectedVariantKey)?.label || 'N/A';
  }

  // --- LOGIQUE DE PAIEMENT & REMISE ---
  
  // Liste des méthodes éligibles à la remise Mobile Money
  const MOBILE_MONEY_METHODS = ['wave', 'mtn', 'orange', 'moov'];

  const paymentMethods = [
    { id: 'wave', name: 'Wave', icon: <div className="w-8 h-8 rounded bg-[#1dc4ff] flex items-center justify-center text-white font-bold text-xs">W</div>, isPromo: true },
    { id: 'orange', name: 'Orange Money', icon: <div className="w-8 h-8 rounded bg-orange-500 flex items-center justify-center text-white font-bold text-xs">OM</div>, isPromo: true },
    { id: 'mtn', name: 'MTN MoMo', icon: <div className="w-8 h-8 rounded bg-yellow-400 flex items-center justify-center text-slate-900 font-bold text-xs">Mo</div>, isPromo: true },
    { id: 'moov', name: 'Moov Money', icon: <div className="w-8 h-8 rounded bg-blue-700 flex items-center justify-center text-white font-bold text-xs">MM</div>, isPromo: true },
    { id: 'cash', name: 'Espèces (Cash)', icon: <Banknote className="text-green-400" size={32} />, isPromo: false },
  ];

  // Calcul du prix final
  const { finalPrice, discountAmount, hasDiscount } = useMemo(() => {
      if (typeof price !== 'number') return { finalPrice: price, discountAmount: 0, hasDiscount: false };

      const isEligible = selectedMethod && MOBILE_MONEY_METHODS.includes(selectedMethod);
      
      if (isEligible) {
          const discount = Math.round(price * 0.05); // 5% de remise
          return {
              finalPrice: price - discount,
              discountAmount: discount,
              hasDiscount: true
          };
      }
      return { finalPrice: price, discountAmount: 0, hasDiscount: false };
  }, [price, selectedMethod]);


  return (
    <div className="animate-fade-in relative pb-8 space-y-6">

      {/* --- HERO HEADER IMMERSIF --- */}
      <div className="relative w-full h-72 overflow-hidden shadow-2xl shadow-slate-900/80 group">
          <div className="absolute inset-0">
             <img 
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1200&auto=format&fit=crop" 
                alt="Paiement Sécurisé" 
                className="w-full h-full object-cover transition-transform duration-10000 ease-linear scale-100 group-hover:scale-110" 
             />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/20 to-slate-900"></div>

          <div className="absolute bottom-0 left-0 w-full p-6 z-10">
              <div className="flex items-center space-x-2 mb-1">
                 <span className="bg-primary-500/30 backdrop-blur-md border border-primary-500/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Étape 4
                 </span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-xl">
                Récapitulatif
              </h1>
              <p className="text-slate-200 text-sm mt-1 drop-shadow-md flex items-center font-medium opacity-90">
                <ShieldCheck size={14} className="mr-1.5 inline text-green-400" />
                Vérifiez et procédez au paiement sécurisé.
              </p>
          </div>
      </div>

      <div className="px-6 space-y-6 -mt-2">

        {/* --- CARTE RÉCAPITULATIVE --- */}
        <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl backdrop-blur-sm space-y-4 shadow-lg">
            <div className="flex items-start justify-between pb-4 border-b border-slate-700/50">
                <div>
                    <h3 className="text-lg font-bold text-white">{serviceCategory?.name}</h3>
                    <p className="text-sm text-primary-400">{getVariantLabel()}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-xl">
                    {serviceCategory?.icon}
                </div>
            </div>
            
            <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-slate-400">
                        <Clock size={14} className="mr-2" /> Date
                    </span>
                    <span className="text-slate-200 font-medium text-right">
                        {scheduledDateTime?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} <br/>
                        <span className="text-slate-400 text-xs">à {scheduledDateTime?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' })}</span>
                    </span>
                </div>
                <div className="flex items-start justify-between text-sm">
                    <span className="flex items-center text-slate-400 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-2 ml-1"></div> Lieu
                    </span>
                    <span className="text-slate-200 font-medium text-right max-w-[60%] truncate">
                        {address}
                    </span>
                </div>
            </div>
        </div>
        
        {/* --- DÉTAIL DU PRIX & REMISE --- */}
        <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl backdrop-blur-sm space-y-3 shadow-lg">
            <h3 className="font-semibold text-white mb-2 text-sm uppercase tracking-wider opacity-80">Facturation</h3>
            
            <div className="flex justify-between text-slate-300">
                <p>Sous-total</p> 
                <p className="font-medium">{typeof price === 'number' ? `${price.toLocaleString('fr-FR')} F` : price}</p>
            </div>
            
            {/* Discount Line */}
            {hasDiscount && (
                <div className="flex justify-between items-center bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center text-yellow-400">
                        <Sparkles size={14} className="mr-2" />
                        <span className="text-sm font-bold">Remise Mobile Money (5%)</span>
                    </div>
                    <p className="font-bold text-yellow-400">-{discountAmount.toLocaleString('fr-FR')} F</p>
                </div>
            )}
            
            <div className="border-t border-slate-700/50 my-2"></div>
            
            <div className="flex justify-between items-end">
                <p className="text-white text-lg font-bold">Total à payer</p> 
                <div className="text-right">
                     {hasDiscount && typeof price === 'number' && (
                        <p className="text-xs text-slate-500 line-through mb-0.5">{price.toLocaleString('fr-FR')} F</p>
                     )}
                     <p className="text-2xl font-bold text-primary-400">
                        {typeof finalPrice === 'number' ? `${finalPrice.toLocaleString('fr-FR')} F` : finalPrice}
                     </p>
                </div>
            </div>
        </div>

        {/* --- SÉLECTION MÉTHODE DE PAIEMENT --- */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white flex items-center">
                    <Wallet size={18} className="mr-2 text-primary-400" />
                    Méthode de paiement
                </h3>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                    Sécurisé SSL
                </span>
            </div>

            {/* Promo Banner */}
            {!hasDiscount && (
                <div className="text-xs bg-gradient-to-r from-yellow-500/20 to-transparent text-yellow-200 p-3 rounded-xl border-l-4 border-yellow-500 flex items-center">
                    <Sparkles size={14} className="mr-2 text-yellow-400 animate-pulse" />
                    Payez par Mobile Money et économisez 5% immédiatement !
                </div>
            )}

            <div className="grid grid-cols-1 gap-3">
            {paymentMethods.map(method => {
                const isSelected = selectedMethod === method.id;
                return (
                    <button
                    key={method.id}
                    onClick={() => onSelectPaymentMethod(method.id as PaymentMethod)}
                    className={`
                        relative w-full p-4 rounded-xl border flex items-center transition-all duration-300 group overflow-hidden
                        ${isSelected 
                            ? 'bg-primary-500/10 border-primary-500 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]' 
                            : 'bg-slate-800/40 border-slate-700 hover:bg-slate-800/80 hover:border-slate-600'
                        }
                    `}
                    >
                    <div className="mr-4 transition-transform group-hover:scale-110 duration-300">
                        {method.icon}
                    </div>
                    
                    <div className="text-left flex-1">
                        <span className={`block font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {method.name}
                        </span>
                        {method.id === 'cash' && (
                            <span className="text-[10px] text-slate-500">Paiement à la fin de la prestation</span>
                        )}
                        {method.isPromo && (
                             <span className="text-[10px] text-yellow-400 font-medium flex items-center">
                                -5% appliqué
                             </span>
                        )}
                    </div>

                    {/* Badge Promo Doré */}
                    {method.isPromo && !isSelected && (
                        <div className="absolute top-0 right-0 bg-yellow-500 text-slate-900 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg shadow-sm">
                            -5%
                        </div>
                    )}

                    <div className={`w-6 h-6 rounded-full border-2 ml-3 flex items-center justify-center transition-all ${isSelected ? 'border-primary-500 bg-primary-500 scale-110' : 'border-slate-600'}`}>
                        {isSelected && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    </button>
                );
            })}
            </div>

            {/* Input Phone Conditional */}
            {selectedMethod && selectedMethod !== 'cash' && selectedMethod !== 'card' && (
                <div className="pt-2 animate-fade-in-up">
                    <label className="text-xs text-slate-400 ml-1 mb-1 block">Numéro Mobile Money</label>
                    <div className="flex bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500/50 transition-all">
                        <div className="bg-slate-700/50 px-4 py-3 text-slate-300 text-sm border-r border-slate-700 flex items-center">
                            +225
                        </div>
                        <input 
                            type="tel" 
                            placeholder="07 XX XX XX XX" 
                            className="w-full bg-transparent p-3 text-white outline-none placeholder-slate-500"
                            autoFocus
                        />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 flex items-center">
                        <ShieldCheck size={10} className="mr-1" />
                        Vous recevrez une demande de débit sur votre téléphone.
                    </p>
                </div>
            )}

            {selectedMethod === 'cash' && (
                 <div className="pt-2 animate-fade-in-up p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-200 text-xs text-center">
                    ⚠️ Prévoyez le montant exact. Le prestataire pourrait ne pas avoir de monnaie.
                 </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SummaryPaymentPage;
