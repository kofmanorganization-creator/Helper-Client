
import React, { useState, useRef, useEffect } from 'react';
import { SERVICES_CATEGORIES, TOP_RATED_MAIDS } from '../constants';
import { ServiceCategory, Booking, User } from '../types';
import { Bell, Clock, ArrowUpRight, Crown, Star, Shield, Zap, CheckCircle2, TrendingUp, Sparkles, ArrowRight, Award, MapPin as MapPinIcon } from 'lucide-react';
import { subscribeToUserBookings } from '../services/bookingService';

interface HomeProps {
  currentUser: User | null;
  onStartNewBooking: (category?: ServiceCategory) => void;
}

const POPULAR_SERVICES = [
  { 
    id: 'pop_1', 
    name: 'Nettoyage Premium', 
    price: '15.000F', 
    rating: '4.9', 
    image: 'https://images.unsplash.com/photo-1581578731117-104f2a417954?q=80&w=600&auto=format&fit=crop',
    categoryId: 'cat_apart',
    tag: 'Tendance'
  },
  { 
    id: 'pop_2', 
    name: 'Électricité Express', 
    price: '5.000F', 
    rating: '4.8', 
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=600&auto=format&fit=crop',
    categoryId: 'cat_elec',
    tag: 'Rapide'
  },
  { 
    id: 'pop_3', 
    name: 'Cuisinier Pro', 
    price: 'Sur devis', 
    rating: '5.0', 
    image: 'https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=600&auto=format&fit=crop',
    categoryId: 'cat_helper_pro',
    tag: 'Elite'
  },
];

const Home: React.FC<HomeProps> = ({ currentUser, onStartNewBooking }) => {
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const expressServices = SERVICES_CATEGORIES.filter(c => !c.isPremium).slice(0, 6);

  useEffect(() => {
    const unsubscribe = subscribeToUserBookings((bookings) => {
      const active = bookings.find(b => ['assigned', 'arrived', 'in_progress', 'searching', 'pending_payment'].includes(b.status));
      setActiveBooking(active || null);
    });
    return () => unsubscribe();
  }, []);

  if (!currentUser) return null;

  return (
    <div className="animate-fade-in pb-32 space-y-8 p-6 aurora-background min-h-screen">
      
      {/* Header Premium */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-primary-500 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <img src={currentUser?.photoUrl} alt="Profile" className="relative w-14 h-14 rounded-full object-cover border-2 border-slate-800" />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-900 shadow-sm"></span>
          </div>
          <div>
            <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em] font-black">Helper Client</p>
            <h1 className="text-2xl font-black text-white tracking-tight">{currentUser?.firstName}</h1>
          </div>
        </div>
        <button className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center relative backdrop-blur-md">
          <Bell size={22} className="text-slate-300" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary-500 rounded-full border-2 border-slate-900"></span>
        </button>
      </div>

      {/* Section Vedette Immersive */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <TrendingUp size={20} className="text-primary-400" />
            <h2 className="text-white font-black text-xl tracking-tight">Services en Vedette</h2>
          </div>
          <span className="text-[10px] text-primary-400 font-bold uppercase tracking-widest bg-primary-500/10 px-3 py-1 rounded-full border border-primary-500/20">Elite 2024</span>
        </div>
        
        <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-4 px-1 snap-x">
          {POPULAR_SERVICES.map((service) => (
            <button 
              key={service.id}
              onClick={() => {
                const cat = SERVICES_CATEGORIES.find(c => c.id === service.categoryId);
                if (cat) onStartNewBooking(cat);
              }}
              className="flex-shrink-0 w-52 h-80 relative rounded-[2.5rem] overflow-hidden snap-start active:scale-95 transition-all group shadow-2xl"
            >
              <img src={service.image} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={service.name} />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-slate-900/90 group-hover:to-black/80 transition-all duration-500"></div>
              
              <div className="absolute top-5 left-5">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-3 py-1 rounded-full">
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">{service.tag}</span>
                </div>
              </div>

              <div className="absolute top-5 right-5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-xl flex items-center space-x-1 border border-white/10">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-black text-white">{service.rating}</span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 text-left transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                <p className="text-primary-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{service.price}</p>
                <h3 className="text-white font-black text-lg leading-tight tracking-tight drop-shadow-lg">{service.name}</h3>
                
                <div className="mt-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <span className="text-[10px] text-slate-300 font-bold">Réserver</span>
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-lg">
                    <ArrowUpRight size={16} />
                  </div>
                </div>
              </div>
            </button>
          ))}
          
          <button onClick={() => onStartNewBooking()} className="flex-shrink-0 w-52 h-80 rounded-[2.5rem] bg-slate-800/20 border-2 border-dashed border-slate-700/50 flex flex-col items-center justify-center space-y-3 active:scale-95 transition-all group">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-500">
               <ArrowUpRight size={28} />
            </div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-300 transition-colors">Découvrir plus</span>
          </button>
        </div>
      </div>

      {/* Bannière Helper Pro - Le Produit Phare */}
      <button 
        onClick={() => {
          const cat = SERVICES_CATEGORIES.find(c => c.id === 'cat_helper_pro');
          if (cat) onStartNewBooking(cat);
        }}
        className="relative w-full overflow-hidden rounded-[2.5rem] p-8 text-left group transition-all duration-700 active:scale-95 shadow-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-primary-700 to-primary-900 group-hover:scale-110 transition-transform duration-1000"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        
        <div className="relative z-10 space-y-4">
            <div className="bg-white/20 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/30 flex items-center space-x-2 w-fit">
                <Crown size={14} className="text-amber-300 fill-amber-300" />
                <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Exclusivité Helper Pro</span>
            </div>
            
            <h2 className="text-3xl font-black text-white leading-[1.1] tracking-tighter">Votre Femme de maison<br/>certifiée & garantie</h2>
            <p className="text-primary-100/80 text-xs font-medium uppercase tracking-wider">Paiement Mensuel • Remplacement 48h</p>

            <div className="flex -space-x-3 pt-2">
                {[1,2,3,4].map(i => (
                    <img key={i} src={`https://i.pravatar.cc/100?u=pro_woman_${i}`} className="w-10 h-10 rounded-2xl border-2 border-primary-700 object-cover shadow-xl" alt="Pro" />
                ))}
                <div className="w-10 h-10 rounded-2xl border-2 border-primary-700 bg-primary-800 flex items-center justify-center text-[10px] font-black text-white">+25</div>
            </div>
        </div>
      </button>

      {/* Section Helpers d'Élite */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Award size={20} className="text-amber-500" />
            <h2 className="text-white font-black text-xl tracking-tight">Nos Helpers d'Élite</h2>
          </div>
          <div className="flex items-center bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
             <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center">
               <Star size={10} className="fill-amber-500 mr-1.5" /> Mieux notées
             </span>
          </div>
        </div>

        <div className="flex space-x-5 overflow-x-auto no-scrollbar pb-6 px-1 snap-x scroll-smooth">
          {TOP_RATED_MAIDS.map((maid) => (
            <div 
              key={maid.id}
              className="flex-shrink-0 w-48 h-72 relative rounded-[2.5rem] overflow-hidden snap-start active:scale-95 transition-all shadow-xl border border-slate-700/50 group"
            >
              <img src={maid.photoUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={maid.firstName} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent"></div>
              
              <div className="absolute top-4 left-4 bg-amber-500/90 backdrop-blur-md rounded-xl p-2 shadow-lg border border-white/20">
                <Shield size={16} className="text-white" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-5 space-y-2">
                <div className="flex items-center justify-between">
                   <h4 className="text-white font-black text-lg tracking-tight">{maid.firstName}</h4>
                   <div className="flex items-center space-x-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/10">
                      <Star size={10} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-[10px] font-black text-white">{maid.rating}</span>
                   </div>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center text-[9px] text-slate-200 font-bold uppercase tracking-widest">
                     <Clock size={12} className="mr-1.5 text-primary-400" /> {maid.experience} exp.
                  </div>
                  <div className="flex items-center text-[9px] text-slate-200 font-bold uppercase tracking-widest">
                     <MapPinIcon size={12} className="mr-1.5 text-primary-400" /> {maid.commune}
                  </div>
                </div>

                <div className="pt-3">
                   <button 
                    onClick={() => onStartNewBooking(SERVICES_CATEGORIES.find(c => c.id === 'cat_helper_pro'))}
                    className="w-full py-2 bg-primary-600 hover:bg-primary-500 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest transition-colors shadow-lg"
                   >
                     Réserver son Profil
                   </button>
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex-shrink-0 w-44 h-72 rounded-[2.5rem] bg-slate-800/20 border border-dashed border-slate-700/50 flex flex-col items-center justify-center p-8 text-center space-y-4">
             <div className="p-4 bg-slate-800 rounded-2xl text-slate-500 group-hover:text-primary-400 transition-colors">
                <Sparkles size={28} />
             </div>
             <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Prêt à rejoindre<br/>l'élite ?</p>
             <button className="text-[10px] font-black text-primary-400 uppercase tracking-widest underline underline-offset-4">Devenir Helper</button>
          </div>
        </div>
      </div>

      {/* Grille Express - Carrés Immersifs & Colorés */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
            <h2 className="text-white font-black text-xl tracking-tight">Services Express</h2>
            <button onClick={() => onStartNewBooking()} className="text-[10px] text-primary-400 font-black uppercase tracking-widest bg-primary-500/10 px-3 py-1.5 rounded-full border border-primary-500/20 flex items-center">
              Voir tout <ArrowRight size={12} className="ml-1" />
            </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
            {expressServices.map((category, index) => (
                <button
                    key={category.id}
                    onClick={() => onStartNewBooking(category)}
                    className={`relative aspect-square rounded-[2rem] bg-slate-800/40 border border-slate-700/30 overflow-hidden transition-all duration-500 group active:scale-95 shadow-lg flex flex-col items-center justify-center p-4 text-center
                      hover:scale-105 hover:shadow-xl
                      ${index % 3 === 0 ? 'hover:bg-amber-500/20 hover:border-amber-500/50 hover:shadow-amber-500/10' :
                        index % 3 === 1 ? 'hover:bg-green-500/20 hover:border-green-500/50 hover:shadow-green-500/10' :
                        'hover:bg-primary-500/20 hover:border-primary-500/50 hover:shadow-primary-500/10'}
                    `}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-900/80 z-0"></div>
                    <div className="relative z-10 flex flex-col items-center space-y-3">
                        <div className={`w-12 h-12 rounded-2xl bg-slate-900/60 backdrop-blur-md flex items-center justify-center text-3xl shadow-xl border border-white/5 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-500
                          ${index % 3 === 0 ? 'group-hover:text-amber-400 group-hover:shadow-amber-500/40' :
                            index % 3 === 1 ? 'group-hover:text-green-400 group-hover:shadow-green-500/40' :
                            'group-hover:text-primary-400 group-hover:shadow-primary-500/40'}
                        `}>
                            {category.icon}
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-black text-white text-[10px] uppercase tracking-tighter leading-tight drop-shadow-md transition-colors">
                              {category.name}
                            </h3>
                            <div className={`h-0.5 w-4 mx-auto rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-center
                              ${index % 3 === 0 ? 'bg-amber-500' : index % 3 === 1 ? 'bg-green-500' : 'bg-primary-500'}
                            `}></div>
                        </div>
                    </div>
                </button>
            ))}
        </div>
      </div>

      {/* Engagements Helper */}
      <div className="space-y-4 pt-4">
        <h2 className="text-white font-black text-lg tracking-tight px-1 uppercase text-center opacity-40 tracking-[0.2em]">Nos Engagements</h2>
        <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800/30 p-4 rounded-3xl text-center border border-slate-700/30 flex flex-col items-center space-y-2 backdrop-blur-sm">
                <div className="p-2 bg-primary-500/10 rounded-xl text-primary-400">
                    <Shield size={20} />
                </div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter leading-tight">Sécurité<br/>Vérifiée</p>
            </div>
            <div className="bg-slate-800/30 p-4 rounded-3xl text-center border border-slate-700/30 flex flex-col items-center space-y-2 backdrop-blur-sm">
                <div className="p-2 bg-green-500/10 rounded-xl text-green-400">
                    <Zap size={20} />
                </div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter leading-tight">Intervention<br/>Express</p>
            </div>
            <div className="bg-slate-800/30 p-4 rounded-3xl text-center border border-slate-700/30 flex flex-col items-center space-y-2 backdrop-blur-sm">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                    <CheckCircle2 size={20} />
                </div>
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter leading-tight">Qualité<br/>Garantie</p>
            </div>
        </div>
      </div>

      {activeBooking && (
          <div className="bg-primary-600/20 border border-primary-500/30 rounded-[2rem] p-5 backdrop-blur-md animate-fade-in flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-lg">
                  <Clock size={24} className="animate-pulse" />
              </div>
              <div className="flex-1">
                  <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Mission en cours</p>
                  <h3 className="font-bold text-white truncate">{activeBooking.serviceName}</h3>
              </div>
              <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors">Suivi</button>
          </div>
      )}

      {/* Signature Officielle */}
      <div className="text-center opacity-80 pt-8 pb-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
          HELPER Propulsé par <a href="http://www.koffmann.com" target="_blank" rel="noopener noreferrer" className="dynamic-koffmann">Koffmann Group</a>
        </p>
      </div>
      
    </div>
  );
};

export default Home;
