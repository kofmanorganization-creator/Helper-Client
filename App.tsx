
import React, { useState, useEffect, useCallback } from 'react';
import { BookingState, PaymentMethod, ServiceCategory, User } from './types';
import { PricingEngineFirebase } from './services/pricingEngine';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { createBooking } from './services/bookingService';

// Components
import BookingStepper from './components/booking/BookingStepper';
import RealtimeCtaBar from './components/booking/RealtimeCtaBar';
import BottomNav, { TabView } from './components/BottomNav';
import VoiceAssistant from './components/VoiceAssistant'; 
import { ArrowLeft, Loader2, WifiOff } from 'lucide-react';

// Pages
import Onboarding from './pages/Onboarding'; 
import Home from './pages/Home';
import Bookings from './pages/Bookings';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import ServiceHubPage from './pages/booking/ServiceHubPage';
import VariantSelectorPage from './pages/booking/VariantSelectorPage';
import ScheduleAddressPage from './pages/booking/ScheduleAddressPage';
import SummaryPaymentPage from './pages/booking/SummaryPaymentPage';
import MissionLive from './pages/MissionLive';

const pricingEngine = new PricingEngineFirebase();

const initialBookingState: BookingState = {
  step: 1,
  serviceCategory: null,
  pricingRule: null,
  selectedVariantKey: null,
  customQuantity: null,
  surfaceArea: 50,
  frequency: null,
  scheduledDateTime: null,
  address: null,
  price: null,
  commission: null,
  payout: null,
};

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthConfirmed, setIsAuthConfirmed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [currentTab, setCurrentTab] = useState<TabView>('home');
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

  /**
   * CALCUL DU PRIX EN TEMPS RÉEL
   */
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
          console.error("Erreur calcul prix:", err);
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
    bookingState.serviceCategory
  ]);

  /**
   * SOUMISSION FINALE
   */
  const handleFinalSubmit = useCallback(async () => {
    if (!selectedPaymentMethod) {
      alert("Veuillez sélectionner un mode de paiement.");
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await createBooking(bookingState, selectedPaymentMethod);
      if (result && result.success && result.bookingId) {
        setActiveMissionId(result.bookingId);
        setIsBookingWizardOpen(false);
        setBookingState(initialBookingState);
      }
    } catch (error: any) {
      console.error("[APP] Erreur création commande:", error);
      alert("Erreur: " + (error.message || "Impossible de créer la mission."));
    } finally {
      setIsLoading(false);
    }
  }, [bookingState, selectedPaymentMethod]);

  /**
   * SESSION RÉSILIENTE & ATTENTE PROFIL SERVEUR
   */
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        setIsAuthConfirmed(true);
        // On ne coupe pas le loading tant qu'on n'a pas le document Firestore
        // pour éviter d'afficher des pages vides ou en erreur
        const userDocRef = doc(db, "users", firebaseUser.uid);
        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setCurrentUser({ uid: firebaseUser.uid, ...docSnap.data() } as User);
            setAuthLoading(false);
          } else {
             console.log("[APP] En attente de la création du profil par le serveur...");
             // On laisse authLoading à true pour afficher l'écran de chargement
          }
        }, (err) => {
          console.error("[APP] Erreur Sync Firestore:", err.code);
          setAuthLoading(false); // On débloque au moins pour voir l'erreur
        });
      } else {
        setIsAuthConfirmed(false);
        setCurrentUser(null);
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) (unsubscribeProfile as () => void)();
    };
  }, []);

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

  if (authLoading) {
    return (
        <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center space-y-6">
            <div className="relative">
                 <Loader2 className="animate-spin text-primary-500" size={64} />
                 <div className="absolute inset-0 flex items-center justify-center font-black text-white text-2xl">H</div>
            </div>
            <p className="text-white font-bold tracking-tight animate-pulse">Initialisation sécurisée...</p>
            <p className="text-slate-500 text-xs text-center max-w-[200px]">Configuration de votre espace personnel par nos serveurs.</p>
        </div>
    );
  }
  
  if (!isAuthConfirmed) {
      return <Onboarding />;
  }

  const renderBookingWizardStep = () => {
    switch (bookingState.step) {
      case 1: return <ServiceHubPage onSelectService={async (cat) => {
        setIsLoading(true);
        const rules = await pricingEngine.getPricingRuleForCategory(cat.id);
        setBookingState(p => ({...initialBookingState, step: 2, serviceCategory: cat, pricingRule: rules}));
        setIsLoading(false);
      }} selectedCategory={bookingState.serviceCategory} />;
      case 2: return <VariantSelectorPage bookingState={bookingState} onSelectVariant={k => setBookingState(p => ({...p, selectedVariantKey: k}))} onSurfaceChange={s => setBookingState(p => ({...p, surfaceArea: s}))} onCustomChange={q => setBookingState(p => ({...p, customQuantity: q}))} />;
      case 3: return <ScheduleAddressPage address={bookingState.address} onAddressChange={a => setBookingState(p => ({...p, address: a}))} onDateTimeChange={d => setBookingState(p => ({...p, scheduledDateTime: d}))} />;
      case 4: return <SummaryPaymentPage bookingState={bookingState} selectedMethod={selectedPaymentMethod} onSelectPaymentMethod={setSelectedPaymentMethod} />;
      default: return null;
    }
  };

  const renderMainContent = () => {
      if (activeMissionId) return <MissionLive missionId={activeMissionId} onMissionComplete={() => { setActiveMissionId(null); setCurrentTab('bookings'); }} />;
      switch (currentTab) {
          case 'home': return <Home currentUser={currentUser} onStartNewBooking={startNewBooking} />;
          case 'bookings': return <Bookings />;
          case 'messages': return <Messages />;
          case 'profile': return <Profile currentUser={currentUser} />;
          default: return <Home currentUser={currentUser} onStartNewBooking={startNewBooking} />;
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans aurora-background">
      <main className="max-w-md mx-auto min-h-screen bg-slate-900/50 relative shadow-2xl flex flex-col overflow-hidden border-x border-white/5">
        {isOffline && (
            <div className="absolute top-0 left-0 right-0 z-[100] px-4 py-1.5 bg-amber-500 text-[10px] font-black text-slate-900 flex items-center justify-center space-x-2">
                <WifiOff size={12} /> <span>HORS LIGNE</span>
            </div>
        )}

        {isBookingWizardOpen ? (
          <div className="absolute inset-0 z-40 bg-slate-900 flex flex-col animate-fade-in">
             <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-10 flex items-center">
                <button 
                  onClick={() => bookingState.step > 1 ? setBookingState(p => ({...p, step: p.step - 1})) : setIsBookingWizardOpen(false)} 
                  className="p-2 w-10 h-10 rounded-full bg-slate-800 text-white border border-white/10 flex items-center justify-center transition-colors active:scale-95"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="flex-1 ml-4"><BookingStepper currentStep={bookingState.step} /></div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">{renderBookingWizardStep()}</div>
            <RealtimeCtaBar 
                bookingState={bookingState} 
                selectedMethod={selectedPaymentMethod} 
                onNext={() => {
                  if (bookingState.step < 4) {
                    setBookingState(p => ({...p, step: p.step + 1}));
                  } else {
                    handleFinalSubmit();
                  }
                }} 
                isLoading={isLoading} 
            />
          </div>
        ) : (
          <><div className="flex-1 overflow-y-auto no-scrollbar">{renderMainContent()}</div><BottomNav currentTab={currentTab} onTabChange={setCurrentTab} onOpenAssistant={() => setIsAssistantOpen(!isAssistantOpen)} isAssistantActive={isAssistantOpen} /></>
        )}
        <VoiceAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} onNavigate={t => { setCurrentTab(t as TabView); setIsBookingWizardOpen(false); }} onStartBooking={startNewBooking} onUpdateBooking={p => setBookingState(prev => ({...prev, ...p}))} />
      </main>
    </div>
  );
}

export default App;
