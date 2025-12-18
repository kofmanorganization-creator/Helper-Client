import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, CreditCard, Smartphone, Check, Trash2, MoreVertical, Loader2 } from 'lucide-react';
import GlassContainer from '../../components/profile/GlassContainer';
import { profileService, PaymentMethodDetails } from '../../services/profileService';

interface PaymentMethodsPageProps {
  onBack: () => void;
}

const PaymentMethodsPage: React.FC<PaymentMethodsPageProps> = ({ onBack }) => {
  const [methods, setMethods] = useState<PaymentMethodDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    const data = await profileService.getPaymentMethods();
    setMethods(data);
    setLoading(false);
  };

  const handleSetDefault = async (id: string) => {
    const updated = methods.map(m => ({ ...m, isDefault: m.id === id }));
    setMethods(updated); // Optimistic
    await profileService.setDefaultPaymentMethod(id);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm('Supprimer ce moyen de paiement ?')) {
        const updated = methods.filter(m => m.id !== id);
        setMethods(updated);
        await profileService.deletePaymentMethod(id);
    }
  };

  const handleAddFake = async () => {
    setAdding(true);
    // Simulation d'ajout
    await profileService.addPaymentMethod({
        type: 'mobile_money',
        provider: 'MTN MoMo',
        identifier: '05 54 •• •• 00',
        isDefault: false
    });
    await loadMethods();
    setAdding(false);
  };

  const defaultMethod = methods.find(m => m.isDefault);
  const otherMethods = methods.filter(m => !m.isDefault);

  return (
    <div className="animate-fade-in p-6 pb-32 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold text-white">Paiement</h1>
        </div>
        <button 
            onClick={handleAddFake}
            disabled={adding}
            className="p-2 bg-primary-500 rounded-full text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-colors disabled:opacity-50"
        >
          {adding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-500">Chargement...</div>
      ) : (
        <div className="space-y-6">
          {/* Virtual Card Visualization (Default Method) */}
          {defaultMethod && (
            <div className={`relative h-48 rounded-3xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-300 ${defaultMethod.type === 'card' ? 'bg-gradient-to-br from-[#1A1F71] to-[#2a3099]' : 'bg-gradient-to-br from-orange-600 to-orange-800'}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white opacity-10 rounded-full translate-y-1/2 -translate-x-1/3 blur-2xl"></div>
              
              <div className="relative p-6 h-full flex flex-col justify-between z-10">
                <div className="flex justify-between items-start">
                  {defaultMethod.type === 'card' ? <CreditCard className="text-white/80" size={28} /> : <Smartphone className="text-white/80" size={28} />}
                  <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white uppercase border border-white/10">Défaut</span>
                </div>
                
                <div className="space-y-1">
                  <p className="text-white font-mono text-xl tracking-widest drop-shadow-md">
                      {defaultMethod.type === 'card' ? `•••• •••• •••• ${defaultMethod.identifier}` : defaultMethod.identifier}
                  </p>
                  <p className="text-white/60 text-sm font-bold">{defaultMethod.provider}</p>
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-white/60 font-bold uppercase mb-0.5">Titulaire</p>
                    <p className="text-white font-bold text-sm">ALEX CARTER</p>
                  </div>
                  {defaultMethod.expiry && (
                    <div className="text-right">
                        <p className="text-[10px] text-white/60 font-bold uppercase mb-0.5">Exp</p>
                        <p className="text-white font-bold text-sm">{defaultMethod.expiry}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Other Methods List */}
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Autres moyens</h2>
            <div className="space-y-3">
              {otherMethods.map(method => (
                <GlassContainer 
                    key={method.id} 
                    className="p-4 flex items-center justify-between group cursor-pointer"
                    onClick={() => handleSetDefault(method.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg
                        ${method.provider.includes('Orange') ? 'bg-orange-500' : 
                          method.provider.includes('Wave') ? 'bg-[#1DC4FF]' : 
                          method.provider.includes('MTN') ? 'bg-yellow-400 text-black' : 'bg-slate-700'}
                    `}>
                      {method.provider.substring(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-bold">{method.provider}</p>
                      <p className="text-slate-400 text-xs font-mono tracking-wider">{method.identifier}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(method.id, e)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </GlassContainer>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsPage;