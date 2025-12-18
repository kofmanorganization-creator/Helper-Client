
import React, { useState, useRef, useEffect } from 'react';
import { SERVICES_CATEGORIES } from '../../constants';
import { ServiceCategory } from '../../types';
import { Sparkles, ArrowUpRight, Search, X } from 'lucide-react';

interface ServiceHubPageProps {
  onSelectService: (category: ServiceCategory) => void;
  selectedCategory: ServiceCategory | null;
}

const ServiceHubPage: React.FC<ServiceHubPageProps> = ({ onSelectService, selectedCategory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredServices = SERVICES_CATEGORIES.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelectSuggestion = (category: ServiceCategory) => {
    onSelectService(category);
    setSearchTerm(category.name);
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  return (
    <div className="animate-fade-in p-6 pt-24 space-y-8 pb-32">
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-2">
            <span className="p-1.5 rounded-lg bg-primary-500/10 text-primary-400">
              <Sparkles size={16} />
            </span>
            <span className="text-primary-400 text-xs font-bold tracking-wider uppercase">Nouvelle Mission</span>
          </div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-tight">
            Quel service<br/>recherchez-vous ?
          </h1>
        </div>
      </div>

      <div className="relative z-20" ref={wrapperRef}>
        <div className="relative group">
          <div className="absolute inset-0 bg-primary-500/5 rounded-2xl blur-md group-focus-within:bg-primary-500/10 transition-colors"></div>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
          
          <input
            type="text"
            placeholder="Rechercher un service..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="relative w-full bg-slate-800/90 border border-slate-700/50 rounded-2xl py-4 pl-12 pr-10 text-white placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50 outline-none backdrop-blur-md transition-all z-10"
          />
          
          {searchTerm && (
            <button 
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white z-20 transition-colors"
            >
              <X size={18} />
            </button>
          )}

          {showSuggestions && searchTerm.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-30 animate-fade-in">
              {filteredServices.length > 0 ? (
                <ul className="max-h-60 overflow-y-auto no-scrollbar">
                  {filteredServices.map((category) => (
                    <li key={category.id}>
                      <button
                        onClick={() => handleSelectSuggestion(category)}
                        className="w-full text-left px-4 py-3 hover:bg-slate-700/50 flex items-center space-x-3 transition-colors group border-b border-slate-700/50 last:border-0"
                      >
                        <span className="text-xl group-hover:scale-110 transition-transform">{category.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">
                            {category.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[200px]">
                            {category.description}
                          </p>
                        </div>
                        <ArrowUpRight size={14} className="ml-auto text-slate-600 group-hover:text-primary-400 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-slate-500 text-sm">
                  Aucun résultat pour "{searchTerm}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredServices.length > 0 ? (
          filteredServices.map((category) => {
            const isSelected = selectedCategory?.id === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onSelectService(category)}
                className={`
                  group relative flex flex-col items-start justify-between p-4 rounded-3xl transition-all duration-500 border min-h-[140px]
                  ${isSelected 
                    ? 'bg-primary-600/20 border-primary-500 shadow-[0_0_30px_-10px_rgba(99,102,241,0.5)]' 
                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600'
                  }
                  backdrop-blur-xl overflow-hidden
                `}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-primary-500/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 ${isSelected ? 'opacity-100' : 'group-hover:opacity-50'}`} />
                
                <div className="flex justify-between w-full">
                    <div className={`
                    relative z-10 w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-inner transition-transform duration-500
                    ${isSelected 
                        ? 'bg-primary-500 text-white scale-110 rotate-3 shadow-lg shadow-primary-500/40' 
                        : 'bg-slate-900/50 text-slate-300 group-hover:scale-105 group-hover:text-white'
                    }
                    `}>
                    {category.icon}
                    </div>
                    
                    <div className={`transition-all duration-300 ${isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
                        <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                            <ArrowUpRight size={12} className="text-white" />
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-left w-full mt-3">
                  <h3 className={`font-bold text-sm leading-tight transition-colors duration-300 ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                    {category.name}
                  </h3>
                  <p className={`text-[10px] mt-0.5 line-clamp-2 transition-colors duration-300 ${isSelected ? 'text-primary-200' : 'text-slate-500 group-hover:text-slate-400'}`}>
                    {category.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute inset-0 rounded-3xl border border-primary-400/50 pointer-events-none animate-pulse"></div>
                )}
              </button>
            );
          })
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center py-10 text-slate-500">
            <Search size={32} className="mb-2 opacity-50" />
            <p>Aucun service trouvé.</p>
          </div>
        )}
      </div>
      
      <div className="text-center">
          <p className="text-xs text-slate-500 font-medium">
            Plus de 15,000 missions réalisées avec succès.
          </p>
      </div>
    </div>
  );
};

export default ServiceHubPage;
