
import React, { useEffect } from 'react';
import { BookingState, PaymentMethod } from '../../types';
import { Wallet, Banknote, ShieldCheck, CheckCircle2, Clock, Info, AlertCircle, Calendar, CreditCard } from 'lucide-react';

interface SummaryPaymentPageProps {
  bookingState: BookingState;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  selectedMethod: PaymentMethod | null;
}

const SummaryPaymentPage: React.FC<SummaryPaymentPageProps> = ({ bookingState, onSelectPaymentMethod, selectedMethod }) => {
  const { serviceCategory, pricingRule, selectedVariantKey, selectedExtras, price, scheduledDateTime, address } = bookingState;

  const isHelperPro = serviceCategory?.id === 'cat_helper_pro';

  useEffect(() => {
    onSelectPaymentMethod('cash');
  }, [onSelectPaymentMethod]);

  const getVariantLabel = () => {
    if(!pricingRule || !selectedVariantKey) return 'N/A';
    const option = pricingRule.options.find(o => o.key === selectedVariantKey);
    return option?.label || 'Personnalisé';
  }

  const paymentMethods = [
    { id: 'wave', name: 'Wave Mobile Money', icon: <div className="w-10 h-10 rounded-xl bg-[#1dc4ff] flex items-center justify-center text-white font-black text-xs">W</div>, available: false },
    { id: 'orange', name: 'Orange Money', icon: <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white font-black text-xs">OM</div>, available: false },
    { id: 'cash', name: 'Règlement direct (Cash)', icon: <Banknote className="text-green-400" size={28} />, available: true },
    { id: 'card', name: 'Carte Bancaire', icon: <CreditCard className="text-primary-400" size={28} />, available: false },
  ];

  return (
    <div className="animate-fade-in relative pb-12 space-y-6">

      <div className="relative w-full h-64 overflow-hidden shadow-2xl">
          <div className="absolute inset-0">
             <img 
                src={isHelperPro ? "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=1200&auto=format&fit=crop" : "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1200&auto=format&fit=crop"} 
                alt="Confirmation" 
                className="w-full h-full object-cover opacity-60" 
             />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900"></div>

          <div className="absolute bottom-0 left-0 w-full p-8 z-10">
              <div className="bg-primary-500/20 backdrop-blur-md border border-primary-500/50 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] w-fit mb-3">
                 Récapitulatif Final
              </div>
              <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-2xl leading-none">Votre Demande</h1>
          </div>
      </div>

      <div className="px-6 space-y-8">
        {/* Résumé de l'offre */}
        <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-[2rem] backdrop-blur-xl space-y-6 shadow-xl">
            <div className="flex items-start justify-between pb-6 border-b border-slate-700/30">
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{serviceCategory?.name}</h3>
                    <p className="text-[10px] text-primary-400 font-black uppercase tracking-[0.2em] mt-1">{getVariantLabel()}</p>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-slate-900/80 flex items-center justify-center text-3xl shadow-inner border border-white/5">
                    {serviceCategory?.icon}
                </div>
            </div>
            
            {isHelperPro && selectedExtras && selectedExtras.length > 0 && (
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Options incluses</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedExtras.map(eKey => {
                            const extra = pricingRule?.options.find(o => o.key === selectedVariantKey)?.extras?.find(ex => ex.key === eKey);
                            return (
                                <div key={eKey} className="bg-primary-500/10 border border-primary-500/20 rounded-xl px-3 py-2 flex items-center space-x-2">
                                    <CheckCircle2 size={12} className="text-primary-400" />
                                    <span className="text-[11px] font-bold text-slate-200">{extra?.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center">
                        <Clock size={16} className="mr-3 text-primary-500" /> 
                        {isHelperPro ? 'Début de contrat' : 'Rendez-vous'}
                    </span>
                    <span className="text-slate-200 font-bold text-sm">
                        {scheduledDateTime?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })} à {scheduledDateTime?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' })}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center">
                        <AlertCircle size={16} className="mr-3 text-primary-500" /> Adresse
                    </span>
                    <span className="text-slate-200 font-bold text-sm truncate max-w-[180px]">
                        {address || 'Non spécifié'}
                    </span>
                </div>
                {isHelperPro && (
                   <div className="flex items-center justify-between">
                        <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center">
                            <Calendar size={16} className="mr-3 text-primary-500" /> Engagement
                        </span>
                        <span className="text-green-400 font-black text-[10px] uppercase tracking-widest">Contrat Mensuel • Résiliable</span>
                    </div>
                )}
            </div>
        </div>
        
        {/* Prix Total Dynamique */}
        <div className="bg-gradient-to-br from-indigo-600 via-primary-600 to-primary-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <p className="text-primary-100 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{isHelperPro ? 'Forfait Mensuel' : 'Total Estimation'}</p>
                    <p className="text-4xl font-black text-white tracking-tighter">
                        {typeof price === 'number' ? `${price.toLocaleString('fr-FR')} F` : price}
                    </p>
                </div>
                <div className="bg-white/20 backdrop-blur-xl p-4 rounded-3xl border border-white/30 shadow-lg">
                    <ShieldCheck className="text-white" size={32} />
                </div>
            </div>
        </div>

        {/* Moyens de Paiement Premium */}
        <div className="space-y-4">
            <h3 className="font-black text-white text-[11px] uppercase tracking-[0.3em] flex items-center px-2">
                <Wallet size={18} className="mr-3 text-primary-400" />
                Mode de règlement
            </h3>

            <div className="grid gap-3">
            {paymentMethods.map(method => {
                const isSelected = selectedMethod === method.id;
                const isAvailable = method.available;

                return (
                    <button
                      key={method.id}
                      onClick={() => isAvailable && onSelectPaymentMethod(method.id as PaymentMethod)}
                      disabled={!isAvailable}
                      className={`
                          w-full p-5 rounded-[1.5rem] border flex items-center justify-between transition-all duration-300 relative overflow-hidden
                          ${isSelected 
                              ? 'bg-slate-800 border-primary-500 shadow-xl' 
                              : isAvailable 
                                ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
                                : 'bg-slate-800/20 border-slate-800 opacity-30 grayscale cursor-not-allowed'
                          }
                      `}
                    >
                        <div className="flex items-center">
                            <div className="mr-5">{method.icon}</div>
                            <div className="text-left">
                                <span className={`block font-black text-sm uppercase tracking-wider ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                    {method.name}
                                </span>
                                {!isAvailable && <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Bientôt disponible</span>}
                            </div>
                        </div>
                        {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center shadow-lg animate-fade-in">
                                <CheckCircle2 size={14} className="text-white" />
                            </div>
                        )}
                    </button>
                );
            })}
            </div>

            <div className="mt-8 p-6 bg-slate-800/30 border border-slate-700/30 rounded-3xl flex items-start space-x-4 backdrop-blur-sm">
                <div className="p-2 bg-primary-500/10 rounded-xl text-primary-400 shrink-0">
                    <Info size={18} />
                </div>
                <div className="text-[11px] text-slate-400 leading-relaxed">
                    {isHelperPro ? (
                        <>Helper sécurise l'intégralité du processus. Votre mensualité couvre <span className="text-slate-200 font-bold">le salaire, les charges sociales, l'assurance</span> et le suivi Helper Pro.</>
                    ) : (
                        <>En choisissant le mode <span className="text-slate-200 font-bold">Cash</span>, vous réglez directement le prestataire à la fin de la mission après avoir validé la qualité de l'intervention.</>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryPaymentPage;
