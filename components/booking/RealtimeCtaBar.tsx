
import React from 'react';
import { BookingState, PaymentMethod } from '../../types';
import { ArrowRight, Lock } from 'lucide-react';

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

  // Calcul du prix affiché dans le CTA (avec remise de 5% si Mobile Money à l'étape 4)
  const MOBILE_MONEY_METHODS = ['wave', 'mtn', 'orange', 'moov'];
  const hasDiscount = step === 4 && selectedMethod && MOBILE_MONEY_METHODS.includes(selectedMethod);
  const displayPrice = (typeof price === 'number' && hasDiscount) 
    ? price * 0.95 
    : price;

  switch (step) {
    case 1:
      isEnabled = !!bookingState.serviceCategory;
      break;
    case 2:
      isEnabled = price !== null;
      buttonText = price === 'quotation' ? 'Demander un devis' : 'Continuer';
      break;
    case 3:
       isEnabled = !!bookingState.scheduledDateTime && !!bookingState.address;
       break;
    case 4:
       buttonText = `CONFIRMER ET PAYER`;
       isEnabled = !!selectedMethod; // CTA activé seulement si un moyen de paiement est sélectionné
       break;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-slate-900/50 backdrop-blur-lg border-t border-slate-700/50 p-4">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex flex-col">
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            {step === 4 ? 'Total à régler' : 'Prix estimé'}
          </p>
          <div className="flex flex-col">
            <p className={`font-bold text-white transition-all ${step === 4 ? 'text-2xl' : 'text-xl'}`}>
                {displayPrice === null && '...'}
                {displayPrice === 'quotation' && 'Sur devis'}
                {typeof displayPrice === 'number' && `${Math.round(displayPrice).toLocaleString('fr-FR')} XOF`}
            </p>
            {hasDiscount && (
                <span className="text-[9px] text-yellow-400 font-bold">-5% inclus</span>
            )}
          </div>
        </div>
        <button
          onClick={onNext}
          disabled={!isEnabled || isLoading}
          className={`px-6 py-4 rounded-xl flex items-center font-bold transition-all duration-300
            ${isEnabled && !isLoading ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20 active:scale-95' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
          `}
        >
          {isLoading ? (
            <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <>
              <span className="mr-2 uppercase tracking-tight">{buttonText}</span>
              {step === 4 ? <Lock size={16} /> : <ArrowRight size={20} />}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RealtimeCtaBar;
