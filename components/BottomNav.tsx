
import React from 'react';
import { Home, Calendar, MessageSquare, User } from 'lucide-react';

export type TabView = 'home' | 'bookings' | 'messages' | 'profile';

interface BottomNavProps {
  currentTab: TabView;
  onTabChange: (tab: TabView) => void;
  onOpenAssistant: () => void;
  isAssistantActive?: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, onOpenAssistant, isAssistantActive = false }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
        {/* Gradient fade */}
        <div className="h-16 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent pointer-events-none absolute -top-12 left-0 right-0"></div>
        
        <div className="bg-slate-900 border-t border-slate-800/50 pb-safe relative">
            
            <div className="flex justify-between items-center max-w-md mx-auto px-2 h-20 relative">
                {/* Left Side */}
                <div className="flex w-2/5 justify-around">
                    <NavButton 
                        active={currentTab === 'home'} 
                        icon={Home} 
                        label="Accueil" 
                        onClick={() => onTabChange('home')} 
                    />
                    <NavButton 
                        active={currentTab === 'bookings'} 
                        icon={Calendar} 
                        label="Booking" 
                        onClick={() => onTabChange('bookings')} 
                    />
                </div>

                {/* Center Button (Helper) - Ancré dans le flux mais flottant */}
                <div className="w-1/5 flex justify-center items-center relative">
                    <div className="absolute -top-11 flex flex-col items-center">
                        <button 
                            onClick={onOpenAssistant}
                            className="group relative w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-95 focus:outline-none mb-1"
                        >
                            {/* 1. Lueur d'ambiance (Glow) - Bleu si actif */}
                            <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-500 ${isAssistantActive ? 'bg-blue-500 opacity-60' : 'bg-amber-500 opacity-20 group-hover:opacity-50'}`}></div>

                            {/* 2. Lumière tournante (Orbital Effect) - Bleu si actif, Or si inactif */}
                            <div className="absolute inset-[-1px] rounded-full overflow-hidden">
                                <div 
                                    className={`absolute inset-[-50%] w-[200%] h-[200%] top-[-50%] left-[-50%] ${isAssistantActive ? 'animate-[spin_1s_linear_infinite]' : 'animate-[spin_3s_linear_infinite]'}`}
                                    style={{
                                        background: isAssistantActive 
                                            ? 'conic-gradient(transparent 270deg, #3b82f6 360deg)' // Blue-500 for Active
                                            : 'conic-gradient(transparent 270deg, #fbbf24 360deg)' // Amber Gold for Inactive
                                    }}
                                ></div>
                            </div>

                            {/* 3. Cercle Intérieur Sombre (Masque) */}
                            <div className="absolute inset-[2px] bg-slate-900 rounded-full flex items-center justify-center border border-white/5 shadow-2xl z-10">
                                
                                {/* 4. Le "H" Doré */}
                                <span className="font-sans text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] select-none">
                                    H
                                </span>
                                
                                {/* Petit effet de reflet glossy */}
                                <div className="absolute top-1 left-2 w-4 h-2 bg-white/10 rounded-full blur-[2px] rotate-[-45deg]"></div>
                            </div>
                        </button>
                        <span className="text-[11px] font-medium text-slate-400 drop-shadow-md tracking-wide whitespace-nowrap">Mon Helper</span>
                    </div>
                </div>

                {/* Right Side */}
                <div className="flex w-2/5 justify-around">
                    <NavButton 
                        active={currentTab === 'messages'} 
                        icon={MessageSquare} 
                        label="Messages" 
                        onClick={() => onTabChange('messages')} 
                        badge
                    />
                    <NavButton 
                        active={currentTab === 'profile'} 
                        icon={User} 
                        label="Profil" 
                        onClick={() => onTabChange('profile')} 
                    />
                </div>
            </div>
        </div>
    </div>
  );
};

const NavButton = ({ active, icon: Icon, label, onClick, badge }: any) => (
    <button
        onClick={onClick}
        className="relative flex flex-col items-center justify-center py-2 px-2 w-full group outline-none"
    >
        <div className={`relative transition-all duration-300 transform ${active ? '-translate-y-1' : ''}`}>
            <Icon 
                size={24} 
                className={`transition-colors duration-300 ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`} 
                strokeWidth={active ? 2.5 : 2}
            />
            {badge && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-slate-900 rounded-full"></span>
            )}
        </div>
        <span className={`text-[11px] font-medium mt-1.5 transition-all duration-300 ${active ? 'text-primary-400 opacity-100' : 'text-slate-500 opacity-0 h-0 overflow-hidden'}`}>
            {label}
        </span>
    </button>
);

export default BottomNav;
