
import React from 'react';
import { BookingState, PaymentMethod } from '../../types';
import { ArrowRight, Lock, CheckCircle2, Loader2 } from 'lucide-react';

interface RealtimeCtaBarProps {
  bookingState: BookingState;
  selectedMethod?: PaymentMethod | null;
  onNext: () => void;
  isLoading?: boolean;
}

const RealtimeCtaBar: React.FC<RealtimeCtaBarProps> = ({ bookingState, selectedMethod, onNext, isLoading }) => {
  const { step, price } = bookingState;

  let buttonText = 'Continuer';
  let isEnabled = false;

  switch (step) {
    case 1:
      isEnabled = !!bookingState.serviceCategory;
      break;
    case 2:
      // On autorise à avancer même si le prix est 'quotation' ou en cours de calcul (si service choisi)
      isEnabled = !!bookingState.selectedVariantKey && !isLoading;
      buttonText = price === 'quotation' ? 'Demander un devis' : 'Continuer';
      break;
    case 3:
       isEnabled = !!bookingState.scheduledDateTime && !!bookingState.address;
       break;
    case 4:
       buttonText = `Confirmer`;
       // Étape 4 : Activé si on a un mode de paiement, quel que soit le statut de chargement (le bouton gère son propre loading)
       isEnabled = !!selectedMethod; 
       break;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 p-4 z-50">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
            {step === 4 ? 'Total Mission' : 'Estimation'}
          </p>
          <div className="flex items-baseline">
            {isLoading && step < 4 ? (
               <span className="text-xl font-bold text-slate-600 animate-pulse">Calcul...</span>
            ) : (
                <p className={`font-black text-white transition-all ${step === 4 ? 'text-2xl' : 'text-xl'}`}>
                    {price === null && '---'}
                    {price === 'quotation' && 'Sur devis'}
                    {typeof price === 'number' && `${Math.round(price).toLocaleString('fr-FR')} F`}
                </p>
            )}
          </div>
        </div>
        <button
          onClick={onNext}
          disabled={!isEnabled || isLoading}
          className={`px-8 py-4 rounded-2xl flex items-center font-bold transition-all duration-300
            ${isEnabled && !isLoading ? 'bg-primary-600 text-white shadow-xl shadow-primary-500/20 active:scale-95 hover:bg-primary-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}
          `}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              <span className="mr-2 uppercase tracking-tighter text-sm">{buttonText}</span>
              {step === 4 ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RealtimeCtaBar;
