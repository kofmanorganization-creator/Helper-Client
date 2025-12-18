

import React, { useState, useRef, useEffect } from 'react';
import { SERVICES_CATEGORIES } from '../constants';
import { ServiceCategory, Booking, User } from '../types';
import { Bell, Clock, Star, Shield, Search, X, Sparkles, TrendingUp, ArrowUpRight } from 'lucide-react';
import { subscribeToUserBookings } from '../services/bookingService';

interface HomeProps {
  currentUser: User | null;
  onStartNewBooking: (category?: ServiceCategory) => void;
}

const POPULAR_SERVICES = [
  { 
    id: 'pop_1', 
    name: 'Nettoyage Pro', 
    price: 'dès 15.000F', 
    rating: '4.9', 
    image: 'https://images.unsplash.com/photo-1581578731117-104f2a417954?q=80&w=600&auto=format&fit=crop',
    categoryId: 'cat_apart'
  },
  { 
    id: 'pop_2', 
    name: 'Réparation Clim', 
    price: 'dès 10.000F', 
    rating: '4.8', 
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop',
    categoryId: 'cat_bureau'
  },
  { 
    id: 'pop_3', 
    name: 'Chef à domicile', 
    price: 'Sur devis', 
    rating: '5.0', 
    image: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=600&auto=format&fit=crop',
    categoryId: 'cat_villa'
  },
  { 
    id: 'pop_4', 
    name: 'Soutien Scolaire', 
    price: 'dès 7.500F/h', 
    rating: '4.7', 
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop',
    categoryId: 'cat_cours'
  },
];

const Home: React.FC<HomeProps> = ({ currentUser, onStartNewBooking }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  // Filter for search bar
  const filteredServices = SERVICES_CATEGORIES.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter for home grid (Limit to first 4 for cleanliness)
  const homeGridServices = SERVICES_CATEGORIES.slice(0, 4);

  useEffect(() => {
    // Subscribe to real-time bookings
    const unsubscribe = subscribeToUserBookings((bookings) => {
      const active = bookings.find(b => ['assigned', 'arrived', 'in_progress'].includes(b.status));
      setActiveBooking(active || null);
    });

    // Handle clicks outside search suggestions
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelectService = (category: ServiceCategory) => {
    setSearchTerm(category.name);
    setShowSuggestions(false);
    onStartNewBooking(category);
  };

  const handlePopularClick = (categoryId: string) => {
      const category = SERVICES_CATEGORIES.find(c => c.id === categoryId);
      if (category) onStartNewBooking(category);
  }

  const handleClearSearch = () => {
    setSearchTerm('');
    setShowSuggestions(false);
  };

  const handleMoreServices = () => {
      // Calls startNewBooking without a category to open the Wizard at Step 1 (Service Hub)
      onStartNewBooking();
  }

  const ActiveBookingCard = () => (
    <div className="col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-3xl p-5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2 text-yellow-500">
          <Clock size={16} className="animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider">En cours</span>
        </div>
        <span className="text-xs text-slate-500">
          {activeBooking?.scheduledAt.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center text-xl">
          {SERVICES_CATEGORIES.find(c => c.name === activeBooking?.serviceName)?.icon || '✨'}
        </div>
        <div>
          <h3 className="font-bold text-white">{activeBooking?.serviceName}</h3>
          <p className="text-xs text-slate-400">Prestataire: <span className="text-slate-200">{activeBooking?.provider?.name || 'En recherche...'}</span></p>
        </div>
      </div>
      <div className="mt-4 w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
         <div className="bg-yellow-500 h-full w-2/3 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
      </div>
    </div>
  );

  const NoActiveBookingCard = () => (
     <div className="col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-3xl p-5 backdrop-blur-md text-center">
        <p className="text-sm font-medium text-slate-300">Aucune mission en cours.</p>
        <p className="text-xs text-slate-500 mt-1">Réservez un service pour le voir ici.</p>
     </div>
  );

  if (!currentUser) {
    return null; // or a loading spinner
  }

  return (
    <div className="animate-fade-in pb-32 space-y-8 p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-3">
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-primary-500 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <img 
              src={currentUser?.photoUrl} 
              alt="Profile" 
              className="relative w-12 h-12 rounded-full object-cover border-2 border-slate-800" 
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900"></span>
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold">Bienvenue</p>
            <h1 className="text-xl font-bold text-white">{currentUser?.firstName}</h1>
          </div>
        </div>
        <button className="relative w-10 h-10 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center hover:bg-slate-700/50 transition-colors">
          <Bell size={20} className="text-slate-300" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>
      </div>

      {/* Title & Search Section */}
      <div className="space-y-6">
        <div className="relative">
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary-500/20 rounded-full blur-2xl pointer-events-none"></div>
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

        {/* Search Bar & Suggestions */}
        <div className="relative z-20" ref={wrapperRef}>
            <div className="relative group">
            <div className="absolute inset-0 bg-primary-500/5 rounded-2xl blur-md group-focus-within:bg-primary-500/10 transition-colors"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-400 transition-colors" size={20} />
            
            <input
                type="text"
                placeholder="Rechercher (ex: Plomberie, Gaz...)"
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

            {/* Suggestions Dropdown */}
            {showSuggestions && searchTerm.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-30 animate-fade-in">
                {filteredServices.length > 0 ? (
                    <ul className="max-h-60 overflow-y-auto no-scrollbar">
                    {filteredServices.map((category) => (
                        <li key={category.id}>
                        <button
                            onClick={() => handleSelectService(category)}
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
      </div>

      {/* Services les plus demandés (Carousel) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
            <h2 className="text-white font-bold text-lg flex items-center">
                <TrendingUp size={18} className="mr-2 text-primary-400" />
                Populaires
            </h2>
            <span className="text-xs text-primary-400 font-medium cursor-pointer">Voir tout</span>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar -mx-6 px-6 snap-x">
            {POPULAR_SERVICES.map((service) => (
                <button 
                    key={service.id}
                    onClick={() => handlePopularClick(service.categoryId)}
                    className="relative group w-40 h-56 shrink-0 rounded-3xl overflow-hidden snap-start focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-transform active:scale-95"
                >
                    <img 
                        src={service.image} 
                        alt={service.name} 
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:brightness-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90 group-hover:opacity-80 transition-opacity"></div>
                    
                    <div className="absolute top-3 right-3 bg-slate-900/60 backdrop-blur-md px-2 py-1 rounded-full flex items-center border border-white/10">
                        <Star size={10} className="text-yellow-400 mr-1 fill-yellow-400" />
                        <span className="text-[10px] font-bold text-white">{service.rating}</span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 text-left transform translate-y-0 transition-transform group-hover:-translate-y-1">
                        <h3 className="text-white font-bold text-lg leading-tight mb-1 drop-shadow-md">{service.name}</h3>
                        <p className="text-primary-300 text-xs font-semibold">{service.price}</p>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                </button>
            ))}
        </div>
      </div>

      {/* Categories Grid (Top 4 only) */}
      <div className="space-y-4">
        <h2 className="text-white font-bold text-lg px-1">Catégories</h2>
        <div className="grid grid-cols-2 gap-4">
            {homeGridServices.map((category) => (
                <button
                    key={category.id}
                    onClick={() => handleSelectService(category)}
                    className="group relative aspect-square flex flex-col items-start justify-between p-5 rounded-3xl bg-slate-800/40 border border-slate-700/50 hover:bg-slate-800/60 hover:border-slate-600 backdrop-blur-xl overflow-hidden transition-all duration-300"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500" />
                    
                    <div className="relative z-10 w-12 h-12 rounded-2xl bg-slate-900/50 flex items-center justify-center text-2xl shadow-inner text-slate-300 group-hover:scale-110 group-hover:text-white transition-transform duration-500">
                        {category.icon}
                    </div>

                    <div className="relative z-10 text-left w-full mt-4">
                        <h3 className="font-bold text-lg text-slate-200 group-hover:text-white leading-tight transition-colors duration-300">
                            {category.name}
                        </h3>
                        <p className="text-xs text-slate-500 group-hover:text-slate-400 mt-1 line-clamp-2 transition-colors duration-300">
                            {category.description}
                        </p>
                    </div>
                </button>
            ))}
        </div>
        
        {/* CTA Button - Triggers Service Hub */}
        <button 
            onClick={handleMoreServices}
            className="w-full py-4 rounded-2xl border border-slate-700/50 bg-slate-800/30 text-primary-400 font-bold hover:bg-slate-800/80 hover:text-white hover:border-primary-500/50 transition-all duration-300 flex items-center justify-center group shadow-lg shadow-black/20 backdrop-blur-sm"
        >
            <span className="mr-2 transform group-hover:-translate-x-1 transition-transform opacity-70">&gt;&gt;</span>
            <span className="tracking-wide">Plus de services</span>
            <span className="ml-2 transform group-hover:translate-x-1 transition-transform opacity-70">&lt;&lt;</span>
        </button>
      </div>

      {/* Dashboard Widgets (Active Booking & Stats) */}
      <div className="grid grid-cols-2 gap-4">
        {activeBooking ? <ActiveBookingCard /> : <NoActiveBookingCard />}

        <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-5 backdrop-blur-md flex flex-col justify-between aspect-square">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
            <Shield size={16} />
          </div>
          <div>
            <span className="text-3xl font-bold text-white">100%</span>
            <p className="text-xs text-slate-400">Sécurité</p>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 rounded-3xl p-5 backdrop-blur-md flex flex-col justify-between aspect-square">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
             <Star size={16} />
          </div>
          <div>
            <span className="text-3xl font-bold text-white">4.9</span>
            <p className="text-xs text-slate-400">Avis</p>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default Home;