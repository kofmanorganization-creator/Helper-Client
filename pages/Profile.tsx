

import React, { useState, useEffect, useMemo } from 'react';
import { Settings, CreditCard, Shield, HelpCircle, LogOut, ChevronRight, Wallet, History, CheckCircle2, XCircle, Calendar, Repeat, Loader2 } from 'lucide-react';
import GlassContainer from '../components/profile/GlassContainer';
import { subscribeToUserBookings } from '../services/bookingService';
import { authService } from '../services/authService';
import { Booking, User } from '../types';

// Sub-pages
import PreferencesPage from './profile/PreferencesPage';
import PaymentMethodsPage from './profile/PaymentMethodsPage';
import SecurityPage from './profile/SecurityPage';
import HelpSupportPage from './profile/HelpSupportPage';

type ProfileView = 'main' | 'preferences' | 'payments' | 'security' | 'help';

interface ProfileProps {
  currentUser: User | null;
}

const Profile: React.FC<ProfileProps> = ({ currentUser }) => {
  const [currentView, setCurrentView] = useState<ProfileView>('main');
  const [pastMissions, setPastMissions] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentView === 'main') {
      const unsubscribe = subscribeToUserBookings((bookings) => {
        const past = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled' || b.status === 'reviewed');
        setPastMissions(past.slice(0, 3)); // Limit to 3 for the preview
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [currentView]);

  const handleLogout = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        await authService.logout();
        // The App component will handle the redirection to the onboarding screen
    }
  };

  const menuItems = [
    { icon: Settings, label: 'Préférences', badge: '', view: 'preferences' as ProfileView },
    { icon: CreditCard, label: 'Moyens de paiement', badge: '', view: 'payments' as ProfileView },
    { icon: Shield, label: 'Confidentialité & Sécurité', badge: '', view: 'security' as ProfileView },
    { icon: HelpCircle, label: 'Aide & Support', badge: '', view: 'help' as ProfileView },
  ];

  // Render Sub-pages
  if (currentView === 'preferences') return <PreferencesPage onBack={() => setCurrentView('main')} />;
  if (currentView === 'payments') return <PaymentMethodsPage onBack={() => setCurrentView('main')} />;
  if (currentView === 'security') return <SecurityPage onBack={() => setCurrentView('main')} />;
  if (currentView === 'help') return <HelpSupportPage onBack={() => setCurrentView('main')} />;

  if (!currentUser) {
      return <div className="p-10 text-center"><Loader2 className="animate-spin" /></div>;
  }

  // Render Main Profile
  return (
    <div className="animate-fade-in p-6 pb-32 space-y-8">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-white">Mon Profil</h1>
         <button 
            onClick={handleLogout}
            className="p-2 bg-slate-800/50 rounded-full text-slate-400 hover:text-white transition-colors"
            aria-label="Déconnexion"
         >
            <LogOut size={20} />
         </button>
      </div>

      {/* User Card */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="relative">
             <div className="absolute inset-0 bg-primary-500 rounded-full blur-lg opacity-30"></div>
             <img src={currentUser?.photoUrl} alt="Profile" className="relative w-24 h-24 rounded-full border-4 border-slate-800 object-cover" />
             {currentUser?.isPremium && (
                <div className="absolute bottom-0 right-0 bg-primary-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-slate-800 uppercase tracking-wide">
                    Premium
                </div>
             )}
        </div>
        <div>
            <h2 className="text-xl font-bold text-white">{currentUser?.firstName} {currentUser?.lastName}</h2>
            <p className="text-slate-400 text-sm">{currentUser?.email}</p>
        </div>
      </div>

      {/* Wallet Widget */}
      <div className="bg-gradient-to-br from-indigo-600 to-primary-700 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 flex items-center justify-between">
            <div>
                <p className="text-indigo-200 text-sm font-medium mb-1">Solde Helper</p>
                <h3 className="text-3xl font-bold text-white">12,500 F</h3>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Wallet className="text-white" size={24} />
            </div>
        </div>
        <button className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-semibold transition-colors border border-white/10">
            Recharger mon compte
        </button>
      </div>

      {/* Mission History Section */}
      <div className="space-y-4">
        <h3 className="text-white font-bold text-lg flex items-center px-1">
            <History size={20} className="mr-2 text-primary-400" />
            Historique des missions
        </h3>
        
        <div className="space-y-3">
            {isLoading ? (
                <div className="text-center py-4"><Loader2 className="animate-spin text-slate-500" /></div>
            ) : pastMissions.length > 0 ? (
                pastMissions.map((mission) => (
                    <GlassContainer key={mission.id} className="p-4 flex items-center justify-between hover:bg-slate-800/60">
                        <div className="flex flex-col">
                            <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-bold text-slate-200 text-sm">{mission.serviceName}</h4>
                                {mission.status === 'completed' || mission.status === 'reviewed' ? (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 flex items-center">
                                        <CheckCircle2 size={10} className="mr-1" /> Terminé
                                    </span>
                                ) : (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center">
                                        <XCircle size={10} className="mr-1" /> Annulé
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center text-xs text-slate-500 space-x-3">
                                <span className="flex items-center"><Calendar size={12} className="mr-1" /> {mission.scheduledAt.toDate().toLocaleDateString('fr-FR')}</span>
                                <span>•</span>
                                <span>{mission.provider?.name || 'Helper'}</span>
                            </div>
                        </div>
                        
                        <div className="text-right">
                            <p className="text-sm font-bold text-white mb-1">{mission.totalAmount.toLocaleString('fr-FR')} F</p>
                            {(mission.status === 'completed' || mission.status === 'reviewed') && (
                                 <button className="text-[10px] flex items-center justify-end text-primary-400 hover:text-primary-300 font-medium">
                                    <Repeat size={10} className="mr-1" /> Commander
                                 </button>
                            )}
                        </div>
                    </GlassContainer>
                ))
            ) : (
                <p className="text-sm text-slate-500 text-center py-4">Aucune mission passée.</p>
            )}
            
            <button className="w-full py-2 text-xs text-slate-500 font-medium hover:text-white transition-colors">
                Voir tout l'historique
            </button>
        </div>
      </div>

      {/* Settings List */}
      <div className="space-y-3">
        {menuItems.map((item, index) => (
            <GlassContainer 
                key={index} 
                onClick={() => setCurrentView(item.view)}
                className="w-full flex items-center justify-between p-4 group"
            >
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                        <item.icon size={20} />
                    </div>
                    <span className="font-medium text-slate-200 group-hover:text-white">{item.label}</span>
                </div>
                <ChevronRight size={18} className="text-slate-600 group-hover:text-slate-400" />
            </GlassContainer>
        ))}
      </div>

      {/* Logout Button */}
      <div className="pt-4">
        <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 py-3 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
        >
            <LogOut size={18} />
            <span className="font-bold">Déconnexion</span>
        </button>
      </div>

      {/* Koffmann Group Signature */}
      <div className="text-center text-xs text-slate-500 mt-6">
        Helper initié par{' '}
        <a
          href="https://www.koffmann.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold dynamic-gradient"
        >
          Koffmann Group
        </a>
      </div>

      <style>{`
        @keyframes gradient-animation {
          0% { background-position: 0% 50%; }
          25% { background-position: 100% 50%; }
          50% { background-position: 200% 50%; }
          75% { background-position: 300% 50%; }
          100% { background-position: 400% 50%; }
        }

        .dynamic-gradient {
          background: linear-gradient(90deg, #F59E0B, #10B981, #3B82F6, #EF4444, #F59E0B);
          background-size: 400% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: gradient-animation 5s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Profile;