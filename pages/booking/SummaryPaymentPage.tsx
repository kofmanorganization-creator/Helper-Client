
import React, { useEffect } from 'react';
import { BookingState, PaymentMethod } from '../../types';
import { Wallet, Banknote, ShieldCheck, CheckCircle2, Clock, Info, AlertCircle } from 'lucide-react';

interface SummaryPaymentPageProps {
  bookingState: BookingState;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  selectedMethod: PaymentMethod | null;
}

const SummaryPaymentPage: React.FC<SummaryPaymentPageProps> = ({ bookingState, onSelectPaymentMethod, selectedMethod }) => {
  const { serviceCategory, pricingRule, selectedVariantKey, price, scheduledDateTime, address } = bookingState;

  // Auto-sélection du Cash au montage de la page
  useEffect(() => {
    onSelectPaymentMethod('cash');
  }, []);

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

  const paymentMethods = [
    { id: 'wave', name: 'Wave', icon: <div className="w-8 h-8 rounded bg-[#1dc4ff] flex items-center justify-center text-white font-bold text-[10px]">W</div>, available: false },
    { id: 'orange', name: 'Orange Money', icon: <div className="w-8 h-8 rounded bg-orange-500 flex items-center justify-center text-white font-bold text-[10px]">OM</div>, available: false },
    { id: 'cash', name: 'Espèces (Cash)', icon: <Banknote className="text-green-400" size={24} />, available: true },
  ];

  return (
    <div className="animate-fade-in relative pb-8 space-y-6">

      <div className="relative w-full h-64 overflow-hidden shadow-2xl">
          <div className="absolute inset-0">
             <img 
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1200&auto=format&fit=crop" 
                alt="Confirmation" 
                className="w-full h-full object-cover" 
             />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 to-slate-900"></div>

          <div className="absolute bottom-0 left-0 w-full p-6 z-10">
              <h1 className="text-3xl font-bold text-white tracking-tight">Récapitulatif</h1>
              <p className="text-slate-200 text-sm mt-1 flex items-center font-medium opacity-90">
                <ShieldCheck size={14} className="mr-1.5 text-green-400" />
                Vérifiez les détails avant de confirmer.
              </p>
          </div>
      </div>

      <div className="px-6 space-y-6">

        {/* Détails Mission */}
        <div className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-2xl backdrop-blur-sm space-y-4">
            <div className="flex items-start justify-between pb-4 border-b border-slate-700/30">
                <div>
                    <h3 className="text-lg font-bold text-white">{serviceCategory?.name}</h3>
                    <p className="text-xs text-primary-400 font-bold uppercase tracking-tight">{getVariantLabel()}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-xl">
                    {serviceCategory?.icon}
                </div>
            </div>
            
            <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center">
                        <Clock size={12} className="mr-2" /> Rendez-vous
                    </span>
                    <span className="text-slate-200 font-bold">
                        {scheduledDateTime?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })} à {scheduledDateTime?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' })}
                    </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center">
                        <AlertCircle size={12} className="mr-2" /> Lieu
                    </span>
                    <span className="text-slate-200 font-bold truncate max-w-[150px]">
                        {address}
                    </span>
                </div>
            </div>
        </div>
        
        {/* Prix Total */}
        <div className="bg-primary-500/10 border border-primary-500/20 p-5 rounded-2xl">
            <div className="flex justify-between items-center">
                <p className="text-slate-300 text-sm font-bold">Total à régler</p> 
                <p className="text-2xl font-black text-white">
                    {typeof price === 'number' ? `${price.toLocaleString('fr-FR')} F` : price}
                </p>
            </div>
        </div>

        {/* Moyens de Paiement */}
        <div className="space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center px-1">
                <Wallet size={16} className="mr-2 text-primary-400" />
                Mode de règlement
            </h3>

            <div className="space-y-2">
            {paymentMethods.map(method => {
                const isSelected = selectedMethod === method.id;
                const isAvailable = method.available;

                return (
                    <button
                      key={method.id}
                      onClick={() => isAvailable && onSelectPaymentMethod(method.id as PaymentMethod)}
                      disabled={!isAvailable}
                      className={`
                          w-full p-4 rounded-xl border flex items-center transition-all duration-300
                          ${isSelected 
                              ? 'bg-primary-500/20 border-primary-500 shadow-lg shadow-primary-500/10' 
                              : isAvailable 
                                ? 'bg-slate-800/40 border-slate-700'
                                : 'bg-slate-800/20 border-slate-800 opacity-30 grayscale cursor-not-allowed'
                          }
                      `}
                    >
                        <div className="mr-4">{method.icon}</div>
                        <div className="text-left flex-1">
                            <span className={`block font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                {method.name}
                            </span>
                            {!isAvailable && <span className="text-[9px] text-slate-600 font-bold uppercase">Indisponible</span>}
                        </div>
                        {isSelected && <CheckCircle2 size={18} className="text-primary-500" />}
                    </button>
                );
            })}
            </div>

            <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl flex items-start space-x-3">
                <Info size={16} className="text-primary-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                    En choisissant <span className="text-white font-bold">Espèces</span>, vous réglerez directement le prestataire à la fin de la mission. Une fois le travail validé, scannez le QR Code du prestataire pour confirmer la fin de mission.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPaymentPage;
