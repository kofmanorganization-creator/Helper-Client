
import React, { useState, useEffect, useCallback } from 'react';
import { BookingState, PaymentMethod, ServiceCategory } from './types';
import { PricingEngineFirebase } from './services/pricingEngine';
import { createBooking } from './services/bookingService';
import { useUserProfile } from './hooks/useUserProfile';
import { auth } from './lib/firebase';

import BookingStepper from './components/booking/BookingStepper';
import RealtimeCtaBar from './components/booking/RealtimeCtaBar';
import BottomNav, { TabView } from './components/BottomNav';
import VoiceAssistant from './components/VoiceAssistant'; 
import { ArrowLeft, Loader2, WifiOff, ShieldAlert, RefreshCw, Crown } from 'lucide-react';

import Onboarding from './pages/Onboarding'; 
import Home from './pages/Home';
import Bookings from './pages/Bookings';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import HelperProDashboard from './pages/admin/HelperProDashboard';
import ServiceHubPage from './pages/booking/ServiceHubPage';
import VariantSelectorPage from './pages/booking/VariantSelectorPage';
import ScheduleAddressPage from './pages/booking/ScheduleAddressPage';
import SummaryPaymentPage from './pages/booking/SummaryPaymentPage';
import MissionLive from './pages/MissionLive';
import RetryLoader from './components/RetryLoader';

const pricingEngine = new PricingEngineFirebase();

const initialBookingState: BookingState = {
  step: 1,
  serviceCategory: null,
  pricingRule: null,
  selectedVariantKey: null,
  selectedExtras: [],
  customQuantity: null,
  surfaceArea: 50,
  frequency: null,
  scheduledDateTime: null,
  address: null,
  price: null,
  commission: null,
  payout: null,
};

type ExtendedTabView = TabView | 'admin';

function App() {
  const { profile: currentUser, loading: authLoading, error: authError } = useUserProfile();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [currentTab, setCurrentTab] = useState<ExtendedTabView>('home');
  const [isBookingWizardOpen, setIsBookingWizardOpen] = useState(false);
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [bookingState, setBookingState] = useState<BookingState>(initialBookingState);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>('cash');

  useEffect(() => {
    const handleStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    const updatePrice = async () => {
      if (bookingState.step >= 2 && bookingState.serviceCategory) {
        setIsLoading(true);
        try {
          const price = await pricingEngine.getPrice(bookingState);
          const commission = pricingEngine.computeCommission(price);
          const payout = pricingEngine.computePayout(price);
          setBookingState(prev => ({ ...prev, price, commission, payout }));
        } catch (err) {
          console.error("Price error:", err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    updatePrice();
  }, [
    bookingState.step, 
    bookingState.selectedVariantKey, 
    bookingState.surfaceArea, 
    bookingState.customQuantity, 
    bookingState.scheduledDateTime, 
    bookingState.address,
    bookingState.selectedExtras
  ]);

  const handleFinalSubmit = useCallback(async () => {
    if (!selectedPaymentMethod) return;
    setIsLoading(true);
    try {
      const result = await createBooking(bookingState, selectedPaymentMethod);
      if (result && result.success && result.bookingId) {
        setActiveMissionId(result.bookingId);
        setIsBookingWizardOpen(false);
        setBookingState(initialBookingState);
      }
    } catch (error: any) {
      alert("Erreur: " + (error.message || "Action impossible."));
    } finally {
      setIsLoading(false);
    }
  }, [bookingState, selectedPaymentMethod]);

  const startNewBooking = async (category?: ServiceCategory) => {
    if (activeMissionId) return;
    if (category) {
        setIsLoading(true);
        const rules = await pricingEngine.getPricingRuleForCategory(category.id);
        setBookingState({ ...initialBookingState, step: 2, serviceCategory: category, pricingRule: rules });
        setIsLoading(false);
    } else {
        setBookingState(initialBookingState);
    }
    setIsBookingWizardOpen(true);
  };

  const handleSystemRefresh = () => {
    // Force une redirection vers l'origine et un rechargement complet
    window.location.href = window.location.origin;
  };

  if (authLoading) return <RetryLoader message="Helper sécurise votre connexion..." />;
  if (authError === 'NOT_AUTHENTICATED') return <Onboarding />;
  
  if (authError === 'PROFILE_NOT_READY' || authError === 'PROFILE_FORBIDDEN') {
      return (
        <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
          <ShieldAlert className={`mb-6 ${authError === 'PROFILE_FORBIDDEN' ? 'text-red-500' : 'text-amber-500'}`} size={48} />
          <h2 className="text-white font-bold text-lg">
            {authError === 'PROFILE_FORBIDDEN' ? 'Accès Restreint' : 'Initialisation de votre profil'}
          </h2>
          <p className="text-slate-500 text-sm mt-3 leading-relaxed">
            {authError === 'PROFILE_FORBIDDEN' 
              ? 'Votre session a expiré ou vos droits ont été réinitialisés pour votre sécurité.' 
              : 'Merci de patienter pendant que nos serveurs préparent votre compte sécurisé.'}
          </p>
          <button 
            onClick={handleSystemRefresh} 
            className="mt-8 px-6 py-3 bg-slate-800 rounded-xl text-white font-bold flex items-center space-x-2 border border-slate-700 active:scale-95 transition-transform shadow-xl"
          >
            <RefreshCw size={18} /> <span>ACTUALISER</span>
          </button>
        </div>
      );
  }

  const handleTabChange = (tab: ExtendedTabView) => {
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans aurora-background">
      <main className="max-w-md mx-auto min-h-screen bg-slate-900/50 relative shadow-2xl flex flex-col overflow-hidden border-x border-white/5">
        {isOffline && (
            <div className="absolute top-0 left-0 right-0 z-[100] bg-amber-500 text-[10px] font-black text-slate-900 py-1 text-center">
                MODE HORS-LIGNE
            </div>
        )}

        {isBookingWizardOpen ? (
          <div className="absolute inset-0 z-40 bg-slate-900 flex flex-col">
             <div className="p-4 pt-10 flex items-center">
                <button onClick={() => bookingState.step > 1 ? setBookingState(p => ({...p, step: p.step - 1})) : setIsBookingWizardOpen(false)} className="p-2 bg-slate-800 rounded-full text-white">
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1 ml-4"><BookingStepper currentStep={bookingState.step} /></div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
              {bookingState.step === 1 && <ServiceHubPage onSelectService={async (cat) => {
                setIsLoading(true);
                const rules = await pricingEngine.getPricingRuleForCategory(cat.id);
                setBookingState(p => ({...initialBookingState, step: 2, serviceCategory: cat, pricingRule: rules}));
                setIsLoading(false);
              }} selectedCategory={bookingState.serviceCategory} />}
              {bookingState.step === 2 && (
                <VariantSelectorPage 
                  bookingState={bookingState} 
                  onSelectVariant={k => setBookingState(p => ({...p, selectedVariantKey: k}))} 
                  onSurfaceChange={s => setBookingState(p => ({...p, surfaceArea: s}))} 
                  onCustomChange={q => setBookingState(p => ({...p, customQuantity: q}))} 
                  onExtrasChange={ex => setBookingState(p => ({...p, selectedExtras: ex}))}
                />
              )}
              {bookingState.step === 3 && <ScheduleAddressPage address={bookingState.address} onAddressChange={a => setBookingState(p => ({...p, address: a}))} onDateTimeChange={d => setBookingState(p => ({...p, scheduledDateTime: d}))} />}
              {bookingState.step === 4 && <SummaryPaymentPage bookingState={bookingState} selectedMethod={selectedPaymentMethod} onSelectPaymentMethod={setSelectedPaymentMethod} />}
            </div>
            <RealtimeCtaBar bookingState={bookingState} selectedMethod={selectedPaymentMethod} onNext={() => bookingState.step < 4 ? setBookingState(p => ({...p, step: p.step + 1})) : handleFinalSubmit()} isLoading={isLoading} />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {currentTab === 'home' && currentUser?.isPremium && (
                <button 
                    onClick={() => setCurrentTab('admin')}
                    className="fixed top-24 right-6 z-30 w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-xl animate-bounce"
                >
                    <Crown size={20} />
                </button>
              )}

              {activeMissionId ? <MissionLive missionId={activeMissionId} onMissionComplete={() => { setActiveMissionId(null); setCurrentTab('bookings'); }} /> : (
                <>
                  {currentTab === 'home' && <Home currentUser={currentUser} onStartNewBooking={startNewBooking} />}
                  {currentTab === 'bookings' && <Bookings />}
                  {currentTab === 'messages' && <Messages />}
                  {currentTab === 'profile' && <Profile currentUser={currentUser} />}
                  {currentTab === 'admin' && <HelperProDashboard />}
                </>
              )}
            </div>
            <BottomNav 
                currentTab={currentTab === 'admin' ? 'profile' : currentTab} 
                onTabChange={handleTabChange as any} 
                onOpenAssistant={() => setIsAssistantOpen(!isAssistantOpen)} 
                isAssistantActive={isAssistantOpen} 
            />
          </>
        )}
        <VoiceAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} onNavigate={handleTabChange} onStartBooking={startNewBooking} onUpdateBooking={(p: any) => setBookingState(prev => ({...prev, ...p}))} />
      </main>
    </div>
  );
}

export default App;
