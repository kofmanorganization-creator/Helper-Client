

import React, { useState, useEffect } from 'react';
import { Booking, MissionStatus, Provider } from '../types';
import { subscribeToSingleBooking } from '../services/bookingService';
import MatchingRadar from '../components/mission/MatchingRadar';
import QRScanner from '../components/mission/QRScanner';
import ReviewModal from '../components/mission/ReviewModal';
import { Phone, MessageSquare, ShieldCheck, QrCode, Clock, Navigation, Loader2, Wallet } from 'lucide-react';

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
      setBooking(data);
    });

    return () => unsubscribe();
  }, [missionId]);

  const handleScanSuccess = () => {
      setShowScanner(false);
      // Backend would update status to 'scanned' via a function
      // For demo, we assume this is done. The onSnapshot will catch the change.
      // We will show review modal based on the 'scanned' status.
  };

  useEffect(() => {
      // Automatically show review modal once payment is confirmed
      if (booking?.status === 'scanned') {
          const timer = setTimeout(() => setShowReview(true), 1500);
          return () => clearTimeout(timer);
      }
  }, [booking?.status]);

  const handleReviewSubmit = (rating: number, comment: string) => {
      console.log("Review submitted:", rating, comment);
      // In a real app, call a cloud function to submit the review
      // which would then set the booking status to 'reviewed' or 'completed'.
      setShowReview(false);
      onMissionComplete();
  };
  
  // --- VIEW: AWAITING PAYMENT ---
  if (booking?.status === 'pending_payment') {
    return (
        <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-primary-500/10 rounded-full flex items-center justify-center border-4 border-primary-500/20 mb-6">
                <Wallet size={48} className="text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">En attente de paiement</h2>
            <p className="text-slate-400 mt-2 max-w-xs">
                Veuillez suivre les instructions sur votre téléphone pour autoriser la transaction.
            </p>
            <Loader2 className="animate-spin text-white mt-8" size={32} />
            <p className="text-xs text-slate-600 mt-4">La page se mettra à jour automatiquement.</p>
        </div>
    );
  }

  // --- VIEW: LOADING / SEARCHING ---
  if (!booking || booking.status === 'searching' || booking.status === 'pending') {
    return (
        <div className="h-screen bg-slate-900">
            {/* If provider is not yet assigned, show the radar */}
            {!booking?.provider ? (
                 <MatchingRadar onFound={() => { /* Backend handles this automatically */}} />
            ) : (
                 <div className="flex h-full items-center justify-center text-slate-400">
                     <Loader2 className="animate-spin mr-2" />
                     Chargement de la mission...
                 </div>
            )}
        </div>
    );
  }

  // --- VIEW: ACTIVE MISSION ---
  const { status, provider } = booking;
  const getStatusText = () => {
      switch(status) {
          case 'assigned': return 'En route (5 min)';
          case 'arrived': return 'Prestataire arrivé';
          case 'in_progress': return 'Mission en cours...';
          case 'completed_wait': return 'Mission terminée';
          case 'scanned': return 'Paiement validé';
          default: return 'En attente';
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 relative pb-32">
        {/* MAP BACKGROUND (STATIC) */}
        <div className="h-[45vh] w-full bg-slate-800 relative overflow-hidden">
            <img 
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000" 
                className="w-full h-full object-cover opacity-60"
                alt="Map View" 
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900"></div>
            
            {/* Status Pill */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-full border border-slate-700 shadow-xl flex items-center space-x-2 z-10">
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'completed_wait' ? 'bg-green-500' : 'bg-primary-500 animate-pulse'}`}></div>
                <span className="text-white font-bold text-sm">{getStatusText()}</span>
            </div>
        </div>

        {/* BOTTOM SHEET INFO */}
        <div className="absolute top-[40vh] left-0 right-0 min-h-[60vh] bg-slate-900 rounded-t-[2.5rem] shadow-2xl border-t border-slate-700/50 p-6 animate-fade-in-up">
            
            {/* Provider Card */}
            {provider && (
                <div className="flex items-center space-x-4 mb-6">
                    <div className="relative">
                        <img src={provider.photoUrl} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700" alt="Provider" />
                        <div className="absolute -bottom-2 -right-2 bg-white text-slate-900 text-xs font-bold px-1.5 py-0.5 rounded-lg flex items-center shadow-sm">
                            ★ {provider.rating}
                        </div>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white">{provider.name}</h2>
                        <p className="text-slate-400 text-sm flex items-center">
                            <ShieldCheck size={12} className="text-green-500 mr-1" />
                            Identité vérifiée • {provider.jobsCount} missions
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <button className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-primary-400 hover:bg-slate-700 transition-colors">
                            <MessageSquare size={20} />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-green-400 hover:bg-slate-700 transition-colors">
                            <Phone size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Actions / Status Content */}
            <div className="space-y-4">
                {status === 'assigned' && (
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex items-center space-x-3">
                        <Navigation className="text-primary-400" size={24} />
                        <div>
                            <p className="text-white font-medium">Arrivée estimée: 14:35</p>
                            <p className="text-xs text-slate-500">Trafic fluide dans votre zone.</p>
                        </div>
                    </div>
                )}
                {status === 'in_progress' && (
                    <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex items-center space-x-3">
                        <Clock className="text-yellow-400 animate-spin-slow" size={24} />
                        <div>
                            <p className="text-white font-medium">Travail en cours</p>
                            <p className="text-xs text-slate-500">Ne payez rien directement au prestataire.</p>
                        </div>
                    </div>
                )}
                {status === 'completed_wait' && (
                    <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-5 rounded-3xl shadow-lg shadow-primary-500/20 text-center space-y-3 animate-pulse">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto text-white">
                            <QrCode size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Le prestataire a terminé ?</h3>
                        <p className="text-primary-100 text-sm">Scannez son QR Code pour valider le travail et libérer le paiement.</p>
                        <button 
                            onClick={() => setShowScanner(true)}
                            className="w-full py-3 bg-white text-primary-700 font-bold rounded-xl shadow-md hover:bg-slate-50 transition-colors"
                        >
                            Scanner maintenant
                        </button>
                    </div>
                )}
            </div>

            {/* Timeline Vertical */}
            <div className="mt-8 space-y-6 relative pl-4 border-l-2 border-slate-800 ml-2">
                <TimelineItem 
                    active={true} 
                    completed={true} 
                    title="Commande confirmée" 
                    time={booking.scheduledAt ? booking.scheduledAt.toDate().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : '--:--'} 
                />
                <TimelineItem active={true} completed={!!provider} title="Prestataire trouvé" time="--" />
                <TimelineItem active={status === 'arrived' || status === 'in_progress' || status === 'completed_wait'} completed={status !== 'assigned'} title="Prestataire sur place" time="--" />
                <TimelineItem active={status === 'completed_wait' || status === 'scanned'} completed={status === 'scanned'} title="Mission terminée & payée" time="--" isLast />
            </div>
        </div>

        {/* MODALS */}
        {showScanner && (
            <QRScanner 
                onScanSuccess={handleScanSuccess} 
                onClose={() => setShowScanner(false)} 
            />
        )}
        {showReview && (
            <ReviewModal onSubmit={handleReviewSubmit} />
        )}
    </div>
  );
};

const TimelineItem = ({ active, completed, title, time }: {active: boolean, completed: boolean, title: string, time: string, isLast?: boolean}) => (
    <div className="relative">
        <div className={`absolute -left-[21px] w-4 h-4 rounded-full border-2 transition-colors duration-500
            ${completed ? 'bg-primary-500 border-primary-500' : active ? 'bg-slate-900 border-primary-500 animate-pulse' : 'bg-slate-900 border-slate-700'}
        `}></div>
        <div className={`transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-40'}`}>
            <h4 className="text-sm font-bold text-white">{title}</h4>
            <span className="text-xs text-slate-500">{time}</span>
        </div>
    </div>
);

export default MissionLive;