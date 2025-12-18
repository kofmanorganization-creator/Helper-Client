
import React, { useState, useEffect } from 'react';
import { BookingState, PaymentMethod, ServiceCategory, User } from './types';
import { PricingEngineFirebase } from './services/pricingEngine';
import { createBooking } from './services/bookingService';
import { SERVICES_CATEGORIES } from './constants'; 
import { analytics, auth, db } from './lib/firebase';
import { logEvent } from 'firebase/analytics';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Components
import BookingStepper from './components/booking/BookingStepper';
import RealtimeCtaBar from './components/booking/RealtimeCtaBar';
import BottomNav, { TabView } from './components/BottomNav';
import VoiceAssistant from './components/VoiceAssistant'; 
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

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
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<TabView>('home');
  const [isBookingWizardOpen, setIsBookingWizardOpen] = useState(false);
  
  // Mission Live State
  const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
  
  // Voice Assistant State
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Booking Wizard State
  const [bookingState, setBookingState] = useState<BookingState>(initialBookingState);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>('wave');

  /**
   * ✅ SOLUTION PRO : Surveillance de session avec redirection forcée.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthError(null);
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setCurrentUser({ uid: firebaseUser.uid, ...userData } as User);
            
            // FORCER LE REDIRECT : On réinitialise la vue pour atterrir sur le dashboard
            setCurrentTab('home');
            setIsBookingWizardOpen(false);
            setAuthLoading(false);
          } else {
            console.warn("Profil Firestore manquant. Nettoyage...");
            setCurrentUser(null);
            await signOut(auth);
            setAuthLoading(false);
          }
        } else {
          setCurrentUser(null);
          setAuthLoading(false);
        }
      } catch (err: any) {
        console.error("Auth Sync Error:", err);
        setAuthError("Erreur de synchronisation du compte.");
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Calcul du prix en temps réel
  useEffect(() => {
    if (!isBookingWizardOpen) return;

    const calculatePrice = async () => {
      const newPrice = await pricingEngine.getPrice(bookingState);
      const newCommission = pricingEngine.computeCommission(newPrice);
      const newPayout = pricingEngine.computePayout(newPrice);
      
      setBookingState(prev => ({
        ...prev,
        price: newPrice,
        commission: newCommission,
        payout: newPayout,
      }));
    };

    calculatePrice();
  }, [bookingState.selectedVariantKey, bookingState.surfaceArea, bookingState.customQuantity, bookingState.serviceCategory, isBookingWizardOpen]);

  // Actions
  const startNewBooking = async (category?: ServiceCategory) => {
    if (activeMissionId) return;

    if (category) {
        setIsLoading(true);
        const rules = await pricingEngine.getPricingRuleForCategory(category.id);
        setBookingState({
            ...initialBookingState,
            step: 2,
            serviceCategory: category,
            pricingRule: rules,
        });
        setIsLoading(false);
    } else {
        setBookingState(initialBookingState);
    }
    setIsBookingWizardOpen(true);
  };

  const handleVoiceBookingStart = (categoryName?: string) => {
      if (categoryName) {
          const match = SERVICES_CATEGORIES.find(c => 
              c.name.toLowerCase().includes(categoryName.toLowerCase()) || 
              categoryName.toLowerCase().includes(c.name.toLowerCase())
          );
          if (match) startNewBooking(match);
          else startNewBooking();
      } else {
          startNewBooking();
      }
  };

  const handleVoiceUpdateBooking = (params: any) => {
      setBookingState(prev => {
          let newState = { ...prev };
          if (params.surface_area) newState.surfaceArea = Number(params.surface_area);
          if (params.address) newState.address = String(params.address);
          if (params.custom_quantity) {
               newState.selectedVariantKey = 'custom';
               newState.customQuantity = Number(params.custom_quantity);
          }
          return newState;
      });
  };

  const handleVoiceNavigation = (tab: string) => {
      if (['home', 'bookings', 'messages', 'profile'].includes(tab)) {
          setCurrentTab(tab as TabView);
          closeBookingWizard();
      }
  };

  const closeBookingWizard = () => {
    setIsBookingWizardOpen(false);
    setBookingState(initialBookingState);
  };

  const handleSelectService = async (category: ServiceCategory) => {
    setIsLoading(true);
    const rules = await pricingEngine.getPricingRuleForCategory(category.id);
    setBookingState(prev => ({
      ...initialBookingState,
      step: prev.serviceCategory?.id === category.id ? 1 : 2,
      serviceCategory: category,
      pricingRule: rules,
    }));
    setIsLoading(false);
  };
  
  const handleNextStep = () => {
    if (bookingState.step === 4) {
      handleConfirmAndPay();
      return;
    }
    setBookingState(prev => ({ ...prev, step: prev.step + 1 }));
  };

  const handlePrevStep = () => {
    if (bookingState.step > 1) {
      setBookingState(prev => ({ ...prev, step: prev.step - 1 }));
    } else {
      closeBookingWizard();
    }
  };
  
  const handleConfirmAndPay = async () => {
      if(!selectedPaymentMethod) {
          alert("Veuillez sélectionner une méthode de paiement.");
          return;
      }
      setIsLoading(true);
      try {
          const result = await createBooking(bookingState, selectedPaymentMethod);

          if(result.success && result.bookingId) {
              if (analytics) {
                logEvent(analytics, 'create_booking', {
                    service_category: bookingState.serviceCategory?.name,
                    total_price: bookingState.price,
                    payment_method: selectedPaymentMethod,
                });
              }
              closeBookingWizard();
              setActiveMissionId(result.bookingId); 
          } else {
              alert("La création de la réservation a échoué.");
          }
      } catch (error: any) {
          console.error("Booking failed:", error);
          alert(`Erreur: ${error.message || 'Une erreur est survenue.'}`);
      } finally {
          setIsLoading(false);
      }
  };

  if (authLoading) {
    return (
        <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 relative">
                 <Loader2 className="animate-spin text-primary-500 absolute inset-0" size={80} />
                 <div className="absolute inset-0 flex items-center justify-center font-black text-white text-2xl">H</div>
            </div>
            <p className="text-slate-500 text-[10px] animate-pulse tracking-[0.3em] font-black uppercase">Sécurisation en cours</p>
        </div>
    );
  }
  
  // Onboarding est affiché uniquement si aucun utilisateur n'est connecté
  if (!currentUser) {
      return <Onboarding />;
  }

  const renderBookingWizardStep = () => {
    switch (bookingState.step) {
      case 1:
        return <ServiceHubPage 
                  onSelectService={handleSelectService}
                  selectedCategory={bookingState.serviceCategory}
                />;
      case 2:
        return <VariantSelectorPage
                  bookingState={bookingState}
                  onSelectVariant={key => setBookingState(p => ({...p, selectedVariantKey: key, customQuantity: null}))}
                  onSurfaceChange={surface => setBookingState(p => ({...p, surfaceArea: surface, selectedVariantKey: String(surface)}))}
                  onCustomChange={(quantity) => setBookingState(p => ({...p, selectedVariantKey: 'custom', customQuantity: quantity}))}
                />;
      case 3:
        return <ScheduleAddressPage
                  address={bookingState.address}
                  onAddressChange={addr => setBookingState(p => ({...p, address: addr}))}
                  onDateTimeChange={date => setBookingState(p => ({...p, scheduledDateTime: date}))}
                />;
      case 4:
        return <SummaryPaymentPage 
                  bookingState={bookingState}
                  selectedMethod={selectedPaymentMethod}
                  onSelectPaymentMethod={setSelectedPaymentMethod}
                />;
      default:
        return null;
    }
  };

  const renderMainContent = () => {
      if (activeMissionId) {
          return <MissionLive 
                    missionId={activeMissionId}
                    onMissionComplete={() => {
                        setActiveMissionId(null);
                        setCurrentTab('home');
                    }} 
                 />;
      }

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
        
        {authError && (
            <div className="fixed top-0 left-0 right-0 z-[100] p-4 bg-red-600 text-white text-[10px] font-black flex items-center justify-between animate-fade-in">
                <div className="flex items-center">
                    <AlertTriangle size={14} className="mr-2" />
                    ERREUR SYSTÈME : {authError.toUpperCase()}
                </div>
                <button onClick={() => window.location.reload()} className="underline decoration-white/30">RÉESSAYER</button>
            </div>
        )}

        {isBookingWizardOpen ? (
          <div className="absolute inset-0 z-40 bg-slate-900 flex flex-col animate-fade-in">
             <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-10 pointer-events-none">
                <div className="relative pointer-events-auto flex items-center justify-center">
                    <button 
                        onClick={handlePrevStep} 
                        className="absolute left-0 top-1/2 -translate-y-1/2 p-2 w-10 h-10 rounded-full bg-slate-900/40 backdrop-blur-md text-white border border-white/10 hover:bg-slate-800 transition-colors z-20 flex items-center justify-center"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="w-full pl-12">
                         <BookingStepper currentStep={bookingState.step} />
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
              {renderBookingWizardStep()}
            </div>
            
            <RealtimeCtaBar 
              bookingState={bookingState} 
              selectedMethod={selectedPaymentMethod}
              onNext={handleNextStep}
              isLoading={isLoading}
            />
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {renderMainContent()}
            </div>
            
            {!activeMissionId && (
                <BottomNav 
                    currentTab={currentTab} 
                    onTabChange={setCurrentTab} 
                    onOpenAssistant={() => setIsAssistantOpen(prev => !prev)} 
                    isAssistantActive={isAssistantOpen}
                />
            )}
          </>
        )}
        
        <VoiceAssistant 
            isOpen={isAssistantOpen} 
            onClose={() => setIsAssistantOpen(false)} 
            onNavigate={handleVoiceNavigation}
            onStartBooking={handleVoiceBookingStart}
            onUpdateBooking={handleVoiceUpdateBooking}
        />
        
      </main>
    </div>
  );
}

export default App;
