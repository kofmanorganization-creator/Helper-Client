
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
    const unsubscribe = subscribeToSingleBooking(missionId, (data) => {
      setBooking(data as Booking);
    });
    return () => unsubscribe();
  }, [missionId]);

  const handleScanSuccess = () => {
      setShowScanner(false);
      // Simulation fin de mission
      onMissionComplete();
  };

  if (booking?.status === 'AWAITING_PAYMENT') {
    return (
        <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center border-4 border-primary-500/20 mb-6">
                <Wallet size={48} className="text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Validation du Paiement</h2>
            <p className="text-slate-400 mt-2 max-w-xs text-sm">
                Finalisez la transaction sur votre application de paiement pour lancer la recherche.
            </p>
            <div className="mt-8 flex items-center space-x-2 text-slate-500">
                <Loader2 className="animate-spin" size={16} />
                <span className="text-xs font-medium uppercase tracking-widest">En attente...</span>
            </div>
        </div>
    );
  }

  // RECHERCHE PRESTATAIRE (CASH OU ONLINE PAYÉ)
  if (!booking || booking.status === 'PENDING_ASSIGNMENT') {
    return (
        <div className="h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
            <MatchingRadar onFound={() => {}} />
            <div className="absolute bottom-12 left-0 right-0 px-6 text-center animate-pulse">
                <p className="text-primary-400 text-xs font-bold uppercase tracking-widest">Matching en cours</p>
                <p className="text-slate-500 text-[10px] mt-1">Vos prestataires favoris sont prioritaires</p>
            </div>
        </div>
    );
  }

  const { status, provider } = booking;
  const getStatusText = () => {
      switch(status) {
          case 'ASSIGNED': return 'Prestataire en route';
          case 'ARRIVED': return 'Prestataire sur place';
          case 'IN_PROGRESS': return 'Mission en cours';
          case 'COMPLETED_WAIT': return 'Mission terminée';
          default: return 'Actualisation...';
      }
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
            
            <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-full border border-slate-700 shadow-xl flex items-center space-x-2 z-10">
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'COMPLETED_WAIT' ? 'bg-green-500' : 'bg-primary-500 animate-pulse'}`}></div>
                <span className="text-white font-bold text-sm uppercase tracking-tight">{getStatusText()}</span>
            </div>
        </div>

        <div className="absolute top-[40vh] left-0 right-0 min-h-[60vh] bg-slate-900 rounded-t-[2.5rem] shadow-2xl border-t border-slate-700/50 p-6 animate-fade-in-up">
            {provider && (
                <div className="flex items-center space-x-4 mb-6">
                    <img src={provider.photoUrl} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700" alt="Provider" />
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white">{provider.name}</h2>
                        <p className="text-slate-400 text-xs flex items-center">
                            <ShieldCheck size={12} className="text-green-500 mr-1" />
                            {provider.jobsCount} missions réussies
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <button className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-primary-400">
                            <MessageSquare size={20} />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-green-400">
                            <Phone size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {status === 'ASSIGNED' && (
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex items-center space-x-3">
                        <Navigation className="text-primary-400" size={24} />
                        <div>
                            <p className="text-white font-medium text-sm italic">"J'arrive dans 5 minutes"</p>
                        </div>
                    </div>
                )}
                {status === 'COMPLETED_WAIT' && (
                    <div className="bg-primary-600 p-5 rounded-3xl shadow-lg text-center space-y-3 animate-fade-in">
                        <QrCode className="mx-auto text-white" size={32} />
                        <h3 className="text-lg font-bold text-white">Travail terminé ?</h3>
                        <p className="text-primary-100 text-xs">Scannez le code du prestataire pour confirmer le paiement espèces.</p>
                        <button 
                            onClick={() => setShowScanner(true)}
                            className="w-full py-3 bg-white text-primary-600 font-bold rounded-xl shadow-md"
                        >
                            VALIDER LA MISSION
                        </button>
                    </div>
                )}
            </div>
            
            <div className="mt-8 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30 flex items-center space-x-3">
                <AlertCircle size={16} className="text-slate-500" />
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                    Paiement {booking.paymentMethod === 'cash' ? 'en Espèces' : 'Mobile Money'}
                </p>
            </div>
        </div>

        {showScanner && <QRScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />}
        {showReview && <ReviewModal onSubmit={() => onMissionComplete()} />}
    </div>
  );
};

export default MissionLive;
