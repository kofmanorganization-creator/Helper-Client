
import React, { useState } from 'react';
import { BookingState } from '../../types';
import { Settings2, Check, Heart, UserCheck, Star, ShieldCheck, Info } from 'lucide-react';

interface VariantSelectorPageProps {
  bookingState: BookingState;
  onSelectVariant: (key: string) => void;
  onSurfaceChange: (surface: number) => void;
  onCustomChange: (quantity: number) => void;
  onExtrasChange?: (extras: string[]) => void;
}

const CATEGORY_IMAGES: Record<string, string> = {
  'cat_apart': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop',
  'cat_villa': 'https://images.unsplash.com/photo-1613490493576-2f046b14890c?q=80&w=1200&auto=format&fit=crop',
  'cat_bureau': 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop',
  'cat_jardin': 'https://images.unsplash.com/photo-1558904541-efa843a96f01?q=80&w=1200&auto=format&fit=crop',
  'cat_helper_pro': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1200&auto=format&fit=crop',
  'default': 'https://images.unsplash.com/photo-1581578731117-104f2a417954?q=80&w=1200&auto=format&fit=crop'
};

const VariantSelectorPage: React.FC<VariantSelectorPageProps> = ({ 
  bookingState, 
  onSelectVariant, 
  onSurfaceChange, 
  onCustomChange,
  onExtrasChange 
}) => {
  const { serviceCategory, pricingRule, selectedVariantKey, surfaceArea, customQuantity, selectedExtras = [] } = bookingState;

  if (!serviceCategory || !pricingRule) return null;

  const heroImage = CATEGORY_IMAGES[serviceCategory.id] || CATEGORY_IMAGES['default'];

  const handleToggleExtra = (extraKey: string) => {
    if (!onExtrasChange) return;
    const newExtras = selectedExtras.includes(extraKey)
        ? selectedExtras.filter(k => k !== extraKey)
        : [...selectedExtras, extraKey];
    onExtrasChange(newExtras);
  };

  const selectedOption = pricingRule.options.find(o => o.key === selectedVariantKey);

  // LOGIQUE HELPER PRO : Flux Mensuel Dédié
  if (pricingRule.type === 'helper_pro') {
    return (
      <div className="animate-fade-in space-y-8 pb-12">
        <div className="relative w-full h-80 overflow-hidden shadow-2xl">
            <img src={heroImage} className="w-full h-full object-cover" alt={serviceCategory.name} />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900"></div>
            <div className="absolute bottom-0 left-0 w-full p-8 z-10">
                <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/50 text-amber-200 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] w-fit mb-4">
                    Offre Premium Mensuelle
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter leading-none">Contrat Helper Pro</h1>
            </div>
        </div>

        <div className="px-6 space-y-8">
            {/* 1. SERVICE PRINCIPAL (OBLIGATOIRE) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Service Principal</h3>
                    <span className="text-[10px] text-red-400 font-black uppercase">Requis</span>
                </div>
                <div className="grid gap-3">
                    {pricingRule.options.map(option => {
                        const isSelected = selectedVariantKey === option.key;
                        return (
                            <button
                                key={option.key}
                                onClick={() => onSelectVariant(option.key)}
                                className={`p-5 rounded-3xl border text-left transition-all relative overflow-hidden group
                                    ${isSelected ? 'bg-primary-500/10 border-primary-500 shadow-xl' : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'}
                                `}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white text-lg">{option.label}</h4>
                                        <p className="text-xs text-slate-500 mt-1">Forfait mensuel • Helper certifiée</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-primary-400 font-black text-sm">{option.price.toLocaleString()} F</p>
                                        <p className="text-[10px] text-slate-600 font-bold uppercase">/ mois</p>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. EXTRAS (CUMULABLES) */}
            {selectedOption && selectedOption.extras && selectedOption.extras.length > 0 && (
                <div className="space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Options supplémentaires</h3>
                        <span className="text-[10px] text-primary-400 font-bold uppercase tracking-widest">Cumulables</span>
                    </div>
                    <div className="grid gap-3">
                        {selectedOption.extras.map(extra => {
                            const isSelected = selectedExtras.includes(extra.key);
                            return (
                                <button
                                    key={extra.key}
                                    onClick={() => handleToggleExtra(extra.key)}
                                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all
                                        ${isSelected ? 'bg-primary-500/20 border-primary-500' : 'bg-slate-800/20 border-slate-800 hover:border-slate-700'}
                                    `}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                                            {isSelected ? <Check size={16} /> : <Heart size={16} />}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{extra.label}</p>
                                            <p className="text-[10px] text-slate-600 font-bold">+{extra.price.toLocaleString()} F /mois</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Garanties Helper Pro */}
            <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-700/50 space-y-4">
                <div className="flex items-center space-x-3 text-amber-500">
                    <ShieldCheck size={20} />
                    <span className="text-sm font-black uppercase tracking-widest">Garanties Helper Pro</span>
                </div>
                <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <div className="mt-1"><UserCheck size={16} className="text-primary-400" /></div>
                        <p className="text-[11px] text-slate-400 leading-relaxed"><span className="text-slate-200 font-bold">Sélection Elite :</span> Enquête de moralité, tests psychotechniques et vérification du casier judiciaire.</p>
                    </div>
                    <div className="flex items-start space-x-3">
                        <div className="mt-1"><Star size={16} className="text-primary-400" /></div>
                        <p className="text-[11px] text-slate-400 leading-relaxed"><span className="text-slate-200 font-bold">Remplacement garanti :</span> Helper s'engage à remplacer votre prestataire sous 48h en cas d'absence ou d'insatisfaction.</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-3 text-slate-500 bg-slate-800/20 p-4 rounded-2xl">
                <Info size={16} />
                <p className="text-[10px] font-medium leading-relaxed italic">Helper agit en tant qu'employeur légal. Vous n'avez aucune démarche administrative à effectuer.</p>
            </div>
        </div>
      </div>
    );
  }

  // LOGIQUE STANDARD (Nettoyage, Bricolage, etc.)
  return (
    <div className="animate-fade-in space-y-6 relative pb-12">
      <div className="relative w-full h-72 overflow-hidden shadow-2xl">
          <img src={heroImage} className="w-full h-full object-cover" alt={serviceCategory.name} />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900"></div>
          <div className="absolute bottom-0 left-0 w-full p-8 z-10">
              <h1 className="text-4xl font-black text-white tracking-tighter">{serviceCategory.name}</h1>
          </div>
      </div>

      <div className="px-6 space-y-6">
        {pricingRule.type === 'surface' && (
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl backdrop-blur-md">
            <label className="text-sm font-black text-slate-500 uppercase tracking-widest flex justify-between mb-6">
                <span>Surface à traiter</span>
                <span className="text-primary-400 font-black">{surfaceArea} {pricingRule.unit}</span>
            </label>
            <input
                type="range" min="10" max="250" step="10" value={surfaceArea}
                onChange={(e) => onSurfaceChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500 mb-2"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-600 uppercase">
                <span>10 m²</span>
                <span>250 m²</span>
            </div>
          </div>
        )}

        <div className="grid gap-4">
            {pricingRule.options.map(option => {
                const isSelected = selectedVariantKey === option.key;
                return (
                    <button
                        key={option.key}
                        onClick={() => onSelectVariant(option.key)}
                        className={`w-full text-left p-5 rounded-2xl border transition-all flex justify-between items-center group
                            ${isSelected ? 'bg-primary-500/20 border-primary-500' : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'}
                        `}
                    >
                        <div>
                            <h4 className={`font-bold transition-colors ${isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{option.label}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Intervention ponctuelle</p>
                        </div>
                        <span className="text-lg font-black text-primary-400">
                            {option.price === 'quotation' ? 'Devis' : `${option.price.toLocaleString()} F`}
                        </span>
                    </button>
                );
            })}

            <button onClick={() => onSelectVariant('custom')} className={`w-full text-left p-5 rounded-2xl border border-dashed transition-all flex justify-between items-center group
                ${selectedVariantKey === 'custom' ? 'bg-slate-800 border-primary-500' : 'bg-transparent border-slate-700 hover:border-slate-500'}
            `}>
                <div className="flex items-center space-x-4">
                    <div className="p-2 bg-slate-800 rounded-xl"><Settings2 size={20} className="text-slate-500 group-hover:text-primary-400" /></div>
                    <div>
                        <h4 className="font-bold text-slate-300">Sur mesure</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Quantité personnalisée</p>
                    </div>
                </div>
                {selectedVariantKey === 'custom' && customQuantity && <span className="bg-primary-500 px-3 py-1 rounded-full text-[10px] font-black text-white">{customQuantity}</span>}
            </button>
        </div>
      </div>
    </div>
  );
};

export default VariantSelectorPage;
