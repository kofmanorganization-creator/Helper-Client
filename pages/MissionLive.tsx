
import React, { useState, useEffect } from 'react';
import { Booking, MissionStatus, Provider } from '../types';
import { subscribeToSingleBooking } from '../services/bookingService';
import MatchingRadar from '../components/mission/MatchingRadar';
import QRScanner from '../components/mission/QRScanner';
import ReviewModal from '../components/mission/ReviewModal';
import { Phone, MessageSquare, ShieldCheck, QrCode, Clock, Navigation, Loader2, Wallet, AlertCircle } from 'lucide-react';

interface MissionLiveProps {
  missionId: string;
  onMissionComplete: () => void;
}

const MissionLive: React.FC<MissionLiveProps> = ({ missionId, onMissionComplete }) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (!missionId) return;

    console.log("[MISSION] Initializing subscription for mission:", missionId);
    
    const unsubscribe = subscribeToSingleBooking(missionId, (data) => {
      if (!data) return;
      
      console.log("[MISSION] Live update - Status:", data.status);
      setBooking(data as Booking);
      
      // Auto-trigger completion logic if mission is completed by provider
      if (data.status === 'completed' || data.status === 'reviewed') {
          onMissionComplete();
      }
    });

    return () => {
      console.log("[MISSION] Unsubscribing from mission:", missionId);
      unsubscribe();
    };
  }, [missionId, onMissionComplete]);

  const handleScanSuccess = () => {
      setShowScanner(false);
      onMissionComplete();
  };

  // 1. AWAITING PAYMENT (ONLINE FLOW)
  if (booking?.status === 'pending_payment' || booking?.status === 'AWAITING_PAYMENT') {
    return (
        <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center border-4 border-primary-500/20 mb-6">
                <Wallet size={48} className="text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Validation du Paiement</h2>
            <p className="text-slate-400 mt-2 max-w-xs text-sm">
                Finalisez la transaction sur votre application de paiement pour lancer la recherche d'un prestataire.
            </p>
            <div className="mt-8 flex items-center space-x-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                <Loader2 className="animate-spin text-primary-400" size={16} />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">En attente de confirmation...</span>
            </div>
        </div>
    );
  }

  // 2. SEARCHING FOR PROVIDER (MATCHING RADAR)
  if (!booking || booking.status === 'searching' || booking.status === 'PENDING_ASSIGNMENT') {
    return (
        <div className="h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden animate-fade-in">
            <MatchingRadar onFound={() => {}} />
            <div className="absolute bottom-12 left-0 right-0 px-6 text-center animate-pulse space-y-2">
                <p className="text-primary-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center">
                   <Clock size={12} className="mr-2" />
                   Matching intelligent Helper
                </p>
                <p className="text-slate-500 text-[10px]">
                    Nous notifions les meilleurs prestataires dans votre zone.
                </p>
            </div>
        </div>
    );
  }

  // 3. LIVE MISSION MANAGEMENT
  const { status, provider } = booking;
  
  const getStatusLabel = () => {
      const s = status.toLowerCase();
      if (s === 'assigned') return 'Prestataire en route';
      if (s === 'arrived') return 'Prestataire sur place';
      if (s === 'in_progress') return 'Mission en cours';
      if (s === 'completed_wait') return 'Mission terminée';
      return 'Actualisation...';
  };

  return (
    <div className="min-h-screen bg-slate-900 relative pb-32">
        <div className="h-[45vh] w-full bg-slate-800 relative overflow-hidden">
            <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000" 
                className="w-full h-full object-cover opacity-60"
                alt="Map" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900"></div>
            
            <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-full border border-slate-700 shadow-xl flex items-center space-x-2 z-10 whitespace-nowrap">
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'completed_wait' ? 'bg-green-500' : 'bg-primary-500 animate-pulse'}`}></div>
                <span className="text-white font-bold text-xs uppercase tracking-tight">{getStatusLabel()}</span>
            </div>
        </div>

        <div className="absolute top-[40vh] left-0 right-0 min-h-[60vh] bg-slate-900 rounded-t-[2.5rem] shadow-2xl border-t border-slate-700/50 p-6 animate-fade-in-up">
            {provider && (
                <div className="flex items-center space-x-4 mb-6">
                    <img src={provider.photoUrl} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700" alt="Provider" />
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white tracking-tight">{provider.name}</h2>
                        <p className="text-slate-400 text-[10px] flex items-center mt-0.5">
                            <ShieldCheck size={12} className="text-green-500 mr-1" />
                            {provider.jobsCount} missions réussies • {provider.rating}⭐
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <button className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-primary-400 transition-colors hover:bg-slate-700">
                            <MessageSquare size={18} />
                        </button>
                        <a href={`tel:${provider.phone}`} className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-green-400 transition-colors hover:bg-slate-700">
                            <Phone size={18} />
                        </a>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {(status === 'assigned' || status === 'ASSIGNED') && (
                    <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 flex items-center space-x-4 shadow-inner">
                        <div className="p-3 bg-primary-500/10 rounded-xl text-primary-400">
                            <Navigation size={24} />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">Le prestataire arrive</p>
                            <p className="text-xs text-slate-500 italic mt-0.5">"Je suis en route, j'arrive dans quelques minutes."</p>
                        </div>
                    </div>
                )}
                
                {(status === 'completed_wait' || status === 'COMPLETED_WAIT') && (
                    <div className="bg-primary-600 p-6 rounded-[2rem] shadow-2xl shadow-primary-900/40 text-center space-y-4 animate-fade-in-up border border-white/10">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto backdrop-blur-md">
                            <QrCode className="text-white" size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Mission Terminée ?</h3>
                            <p className="text-primary-100 text-xs mt-1">
                                Scannez le QR Code du prestataire pour confirmer le travail et libérer le paiement.
                            </p>
                        </div>
                        <button 
                            onClick={() => setShowScanner(true)}
                            className="w-full py-4 bg-white text-primary-600 font-bold rounded-2xl shadow-xl transition-transform active:scale-95"
                        >
                            VALIDER & PAYER
                        </button>
                    </div>
                )}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs px-2">
                    <div className="flex items-center text-slate-500 font-bold uppercase tracking-wider">
                        <AlertCircle size={14} className="mr-2" />
                        Paiement {booking.paymentMethod === 'cash' ? 'en Espèces' : 'Sécurisé'}
                    </div>
                    <span className="text-white font-bold bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                        {booking.totalAmount.toLocaleString('fr-FR')} F
                    </span>
                </div>
            </div>
        </div>

        {showScanner && <QRScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />}
        {showReview && <ReviewModal onSubmit={() => onMissionComplete()} />}
    </div>
  );
};

export default MissionLive;
