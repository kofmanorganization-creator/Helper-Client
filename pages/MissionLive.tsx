
import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { subscribeToSingleBooking } from '../services/bookingService';
import MatchingRadar from '../components/mission/MatchingRadar';
import QRScanner from '../components/mission/QRScanner';
import { Phone, MessageSquare, ShieldCheck, QrCode, Clock, Navigation, Loader2, Wallet, AlertCircle } from 'lucide-react';

interface MissionLiveProps {
  missionId: string;
  onMissionComplete: () => void;
}

const MissionLive: React.FC<MissionLiveProps> = ({ missionId, onMissionComplete }) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!missionId) return;
    
    setIsInitializing(true);
    const unsubscribe = subscribeToSingleBooking(missionId, (data) => {
      if (data) {
        setBooking(data);
        setIsInitializing(false);
      }
      if (data?.status === 'completed' || data?.status === 'reviewed') {
          onMissionComplete();
      }
    });

    // Timeout de sécurité si vraiment rien ne remonte après 10s
    const timeout = setTimeout(() => {
      if (isInitializing) setIsInitializing(false);
    }, 10000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [missionId]);

  if (isInitializing && !booking) {
      return (
          <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
              <div className="relative mb-8">
                  <div className="absolute inset-0 bg-primary-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                  <Loader2 className="animate-spin text-primary-500 relative" size={48} />
              </div>
              <h2 className="text-white font-bold text-lg">Sécurisation de la mission</h2>
              <p className="text-slate-500 mt-2 text-xs uppercase tracking-widest leading-relaxed">
                  Nous connectons votre demande au réseau Helper...
              </p>
          </div>
      );
  }

  // Fallback si vraiment aucun doc n'est trouvé (cas rare après retry)
  if (!booking) {
      return (
          <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle size={48} className="text-red-500 mb-4" />
              <h2 className="text-white font-bold">Oups, un petit délai...</h2>
              <p className="text-slate-500 text-sm mt-2">La mission a été créée mais tarde à s'afficher. Vérifiez "Mes Réservations".</p>
              <button onClick={() => window.location.reload()} className="mt-6 px-6 py-3 bg-slate-800 rounded-xl text-white text-sm">Actualiser</button>
          </div>
      );
  }

  // 1. ATTENTE PAIEMENT
  if (booking.status === 'pending_payment' || booking.status === 'AWAITING_PAYMENT') {
    return (
        <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
            <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center border-4 border-primary-500/20 mb-6">
                <Wallet size={40} className="text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Validation du Paiement</h2>
            <p className="text-slate-400 mt-2 text-sm">Finalisez la transaction sur votre mobile pour lancer la recherche.</p>
            <div className="mt-8 flex items-center space-x-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                <Loader2 className="animate-spin text-primary-400" size={16} />
                <span className="text-[10px] font-bold text-slate-300 uppercase">En attente de confirmation...</span>
            </div>
        </div>
    );
  }

  // 2. RECHERCHE PRESTATAIRE
  if (booking.status === 'searching' || booking.status === 'PENDING_ASSIGNMENT') {
    return (
        <div className="h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden animate-fade-in">
            <MatchingRadar onFound={() => {}} />
            <div className="absolute bottom-12 left-0 right-0 px-6 text-center animate-pulse">
                <p className="text-primary-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center">
                   <Clock size={12} className="mr-2" /> Matching IA en cours
                </p>
            </div>
        </div>
    );
  }

  // 3. MISSION EN COURS
  const statusLabel = {
      'assigned': 'Prestataire en route',
      'arrived': 'Prestataire sur place',
      'in_progress': 'Mission en cours',
      'completed_wait': 'Mission terminée',
  }[booking.status.toLowerCase()] || 'Mise à jour...';

  return (
    <div className="min-h-screen bg-slate-900 relative pb-32 animate-fade-in">
        <div className="h-[40vh] w-full bg-slate-800 relative overflow-hidden">
            <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover opacity-40" alt="Map" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900"></div>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-full border border-slate-700 flex items-center space-x-2 z-10">
                <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                <span className="text-white font-bold text-[10px] uppercase tracking-wider">{statusLabel}</span>
            </div>
        </div>

        <div className="absolute top-[35vh] left-0 right-0 min-h-[65vh] bg-slate-900 rounded-t-[2.5rem] border-t border-slate-700/50 p-6">
            {booking.provider && (
                <div className="flex items-center space-x-4 mb-8">
                    <img src={booking.provider.photoUrl} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700" alt="Provider" />
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-white">{booking.provider.name}</h2>
                        <p className="text-slate-400 text-[10px] flex items-center">
                            <ShieldCheck size={12} className="text-green-500 mr-1" /> Verified Helper • {booking.provider.rating}⭐
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <a href={`tel:${booking.provider.phone}`} className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-green-400"><Phone size={18} /></a>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {booking.status === 'completed_wait' ? (
                    <div className="bg-primary-600 p-6 rounded-3xl text-center space-y-4 shadow-xl">
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto"><QrCode className="text-white" size={28} /></div>
                        <h3 className="text-lg font-bold text-white">Confirmer la fin</h3>
                        <p className="text-primary-100 text-[10px]">Scannez le code du prestataire.</p>
                        <button onClick={() => setShowScanner(true)} className="w-full py-4 bg-white text-primary-600 font-bold rounded-2xl shadow-xl active:scale-95 transition-transform">SCANNER LE CODE</button>
                    </div>
                ) : (
                    <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700 flex items-center space-x-4">
                        <div className="p-3 bg-primary-500/10 rounded-xl text-primary-400"><Navigation size={20} /></div>
                        <div>
                            <p className="text-white font-bold text-sm">Suivi temps réel</p>
                            <p className="text-xs text-slate-500">Arrivée estimée dans quelques minutes.</p>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="mt-12 pt-6 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center text-slate-500 font-bold uppercase tracking-widest"><AlertCircle size={14} className="mr-2" /> Paiement {booking.paymentMethod}</div>
                    <span className="text-white font-bold bg-slate-800 px-3 py-1 rounded-full">{booking.totalAmount?.toLocaleString()} F</span>
                </div>
            </div>
        </div>

        {showScanner && <QRScanner onScanSuccess={() => onMissionComplete()} onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default MissionLive;
