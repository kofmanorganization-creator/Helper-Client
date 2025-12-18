
import React, { useState, useEffect } from 'react';
import { BookingState } from '../../types';
import { PricingEngineFirebase } from '../../services/pricingEngine';
import { Settings2, X, Check, Calculator, Info } from 'lucide-react';

interface VariantSelectorPageProps {
  bookingState: BookingState;
  onSelectVariant: (key: string) => void;
  onSurfaceChange: (surface: number) => void;
  onCustomChange: (quantity: number) => void;
}

// Mapping des images par catégorie pour le Hero Header
const CATEGORY_IMAGES: Record<string, string> = {
  'cat_apart': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop', // Appartement propre/moderne
  'cat_villa': 'https://images.unsplash.com/photo-1613490493576-2f046b14890c?q=80&w=1200&auto=format&fit=crop', // Villa
  'cat_bureau': 'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1200&auto=format&fit=crop', // Bureau
  'cat_jardin': 'https://images.unsplash.com/photo-1558904541-efa843a96f01?q=80&w=1200&auto=format&fit=crop', // Jardin
  'cat_piscine': 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1200&auto=format&fit=crop', // Piscine
  'default': 'https://images.unsplash.com/photo-1581578731117-104f2a417954?q=80&w=1200&auto=format&fit=crop' // Générique
};

const VariantSelectorPage: React.FC<VariantSelectorPageProps> = ({ bookingState, onSelectVariant, onSurfaceChange, onCustomChange }) => {
  const { serviceCategory, pricingRule, selectedVariantKey, surfaceArea, customQuantity } = bookingState;
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [tempCustomValue, setTempCustomValue] = useState<number>(customQuantity || 0);
  const [estimatedPrice, setEstimatedPrice] = useState<number | 'quotation' | null>(null);

  // Instanciation locale pour la prévisualisation dans la modale
  const engine = new PricingEngineFirebase();

  // Effet pour calculer le prix en temps réel dans la modale
  useEffect(() => {
    const calculatePreview = async () => {
        if(!serviceCategory || tempCustomValue <= 0) {
            setEstimatedPrice(null);
            return;
        }
        
        // On simule un état partiel pour demander le prix au moteur
        const price = await engine.getPrice({
            serviceCategory,
            selectedVariantKey: 'custom',
            customQuantity: tempCustomValue
        });
        setEstimatedPrice(price);
    };

    if(isCustomModalOpen) {
        calculatePreview();
    }
  }, [tempCustomValue, isCustomModalOpen, serviceCategory]);


  if (!serviceCategory || !pricingRule) return null;

  const handleOpenCustom = () => {
      // Valeur par défaut intelligente selon le type
      let defaultValue = 1;
      if (serviceCategory.id === 'cat_apart') defaultValue = 5; // Car standard va jusqu'à 4
      if (serviceCategory.id === 'cat_villa') defaultValue = 130; // Car standard max 120
      
      setTempCustomValue(customQuantity || defaultValue);
      setIsCustomModalOpen(true);
  };

  const handleConfirmCustom = () => {
      onCustomChange(tempCustomValue);
      setIsCustomModalOpen(false);
  };

  // Sélection de l'image Hero
  const heroImage = CATEGORY_IMAGES[serviceCategory.id] || CATEGORY_IMAGES['default'];

  return (
    <div className="animate-fade-in space-y-6 relative pb-8">
      
      {/* --- HERO SLIDER IMMERSIF (TOP BLEED) --- */}
      <div className="relative w-full h-72 overflow-hidden shadow-2xl shadow-slate-900/80 group">
          {/* Image de fond avec effet de zoom lent */}
          <div className="absolute inset-0">
             <img 
                src={heroImage} 
                alt={serviceCategory.name} 
                className="w-full h-full object-cover transition-transform duration-10000 ease-linear scale-100 group-hover:scale-110" 
             />
          </div>
          
          {/* Overlay Gradient pour la lisibilité du texte + Header protection */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-900"></div>

          {/* Contenu Texte sur l'image */}
          <div className="absolute bottom-0 left-0 w-full p-6 z-10">
              <div className="flex items-center space-x-2 mb-1">
                 <span className="bg-primary-500/30 backdrop-blur-md border border-primary-500/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Configuration
                 </span>
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-xl">
                {serviceCategory.name}
              </h1>
              <p className="text-slate-200 text-sm mt-1 line-clamp-1 drop-shadow-md flex items-center font-medium">
                <Info size={14} className="mr-1.5 inline text-primary-400" />
                Configurez les détails pour obtenir un prix précis.
              </p>
          </div>
      </div>

      {/* --- CONTENU PRINCIPAL --- */}
      <div className="px-6 space-y-4">
        
        {pricingRule.type === 'surface' && (
          <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-2xl backdrop-blur-sm">
            <label className="text-lg font-semibold text-white flex justify-between">
                <span>Surface ({pricingRule.unit})</span>
                <span className="text-primary-400 font-bold">{surfaceArea} m²</span>
            </label>
            <div className="mt-4">
                <input
                type="range"
                min="10"
                max="150"
                value={surfaceArea}
                onChange={(e) => onSurfaceChange(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>10 m²</span>
                    <span>150 m²</span>
                </div>
            </div>
          </div>
        )}

        {pricingRule.type !== 'surface' && pricingRule.options.map(option => (
          <button
            key={option.key}
            onClick={() => onSelectVariant(option.key)}
            className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 flex justify-between items-center group relative overflow-hidden
              ${selectedVariantKey === option.key 
                ? 'bg-primary-500/20 border-primary-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]' 
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800/80'
              }
            `}
          >
            {/* Effet de sélection */}
            {selectedVariantKey === option.key && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500"></div>
            )}

            <div className="pl-2">
              <h4 className={`font-bold transition-colors ${selectedVariantKey === option.key ? 'text-white' : 'text-slate-200'}`}>{option.label}</h4>
              {pricingRule.unit && <p className="text-xs text-slate-400 capitalize mt-0.5">{pricingRule.unit}</p>}
            </div>
            
            <div className="flex items-center">
                <span className={`text-base font-bold mr-3 transition-colors ${selectedVariantKey === option.key ? 'text-white' : 'text-primary-400'}`}>
                {option.price === 'quotation' ? 'Sur Devis' : `${option.price.toLocaleString('fr-FR')} F`}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedVariantKey === option.key ? 'border-primary-500 bg-primary-500' : 'border-slate-600'}`}>
                    {selectedVariantKey === option.key && <Check size={12} className="text-white" />}
                </div>
            </div>
          </button>
        ))}

        {/* Bouton Personnalisé */}
        <button
            onClick={handleOpenCustom}
            className={`w-full text-left p-4 rounded-2xl border border-dashed transition-all duration-300 flex justify-between items-center group
              ${selectedVariantKey === 'custom' 
                ? 'bg-primary-500/20 border-primary-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]' 
                : 'bg-transparent border-slate-600 hover:border-primary-400/50 hover:bg-slate-800/30'}
            `}
        >
            <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg transition-colors ${selectedVariantKey === 'custom' ? 'bg-primary-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-primary-400'}`}>
                    <Settings2 size={20} />
                </div>
                <div>
                    <h4 className={`font-bold transition-colors ${selectedVariantKey === 'custom' ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                        Autre / Personnalisé
                    </h4>
                    <p className="text-xs text-slate-500 group-hover:text-slate-400">Grands espaces ou besoins spécifiques</p>
                </div>
            </div>
             {selectedVariantKey === 'custom' && customQuantity && (
                 <span className="text-base font-bold text-white bg-slate-700 px-2 py-1 rounded-lg">
                    {customQuantity} {serviceCategory.id === 'cat_apart' ? 'Pièces' : 'Unités'}
                 </span>
             )}
        </button>
      </div>

      {/* MODAL PERSONNALISATION */}
      {isCustomModalOpen && (
        <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center p-4">
            {/* Backdrop Blur */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={() => setIsCustomModalOpen(false)}></div>
            
            {/* Modal Content */}
            <div className="relative w-full bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-6 animate-fade-in-up overflow-hidden">
                {/* Decorative Glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="flex items-center justify-between mb-6 relative z-10">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <Calculator className="mr-2 text-primary-400" size={20} />
                        Configuration
                    </h3>
                    <button onClick={() => setIsCustomModalOpen(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6 relative z-10">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">
                            {serviceCategory.id === 'cat_apart' ? 'Nombre de pièces' : 'Quantité / Surface'}
                        </label>
                        <div className="flex items-center space-x-4">
                            <button 
                                onClick={() => setTempCustomValue(Math.max(1, tempCustomValue - 1))}
                                className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xl hover:bg-slate-700 active:scale-95 transition-all"
                            >
                                -
                            </button>
                            <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl h-12 flex items-center justify-center">
                                <input 
                                    type="number" 
                                    value={tempCustomValue}
                                    onChange={(e) => setTempCustomValue(parseInt(e.target.value) || 0)}
                                    className="bg-transparent text-center text-2xl font-bold text-white outline-none w-full"
                                />
                            </div>
                            <button 
                                onClick={() => setTempCustomValue(tempCustomValue + 1)}
                                className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold text-xl hover:bg-slate-700 active:scale-95 transition-all"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Zone de calcul en temps réel */}
                    <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm text-slate-400">Estimation</span>
                            {serviceCategory.id === 'cat_apart' && tempCustomValue > 4 && (
                                <span className="text-[10px] bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full">
                                    +15 000F / pièce supp.
                                </span>
                            )}
                        </div>
                        <div className="text-3xl font-bold text-white tracking-tight">
                            {estimatedPrice === 'quotation' ? (
                                <span className="text-xl">Sur Devis</span>
                            ) : estimatedPrice ? (
                                <span>{estimatedPrice.toLocaleString('fr-FR')} <span className="text-lg text-slate-500 font-normal">XOF</span></span>
                            ) : (
                                <span className="text-slate-600">...</span>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={handleConfirmCustom}
                        className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/25 flex items-center justify-center transition-all active:scale-95"
                    >
                        <Check size={20} className="mr-2" />
                        Confirmer ce choix
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default VariantSelectorPage;
