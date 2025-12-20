
import React, { useState } from 'react';
import { useMission } from '../hooks/useMission';
import MatchingRadar from '../components/mission/MatchingRadar';
import QRScanner from '../components/mission/QRScanner';
import RetryLoader from '../components/RetryLoader';
import { Phone, ShieldCheck, QrCode, Clock, Navigation, Wallet, AlertCircle, Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

interface MissionLiveProps {
  missionId: string;
  onMissionComplete: () => void;
}

const MissionLive: React.FC<MissionLiveProps> = ({ missionId, onMissionComplete }) => {
  const { mission, loading, error } = useMission(missionId);
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQRSuccess = async () => {
    setIsProcessing(true);
    try {
      const finishFn = httpsCallable(functions, 'completeMissionWithQR');
      await finishFn({ missionId });
      onMissionComplete();
    } catch (e) {
      alert("Erreur de validation QR.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <RetryLoader message="Connexion au flux Ghost..." />;
  
  if (error === "FORBIDDEN") return (
    <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-10 text-center">
      <Lock className="text-red-500 mb-6" size={48} />
      <h2 className="text-white font-bold text-xl">Accès Inbox Restreint</h2>
      <p className="text-slate-500 text-sm mt-2">Cette mission ne vous est plus accessible.</p>
      <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-slate-800 rounded-xl text-white font-bold">RETOUR</button>
    </div>
  );

  if (!mission) return null;

  // ÉTAT 1 : RECHERCHE (CLIENT)
  if (mission.status === 'searching') {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden animate-fade-in">
        <MatchingRadar onFound={() => {}} />
        <div className="absolute bottom-12 left-0 right-0 px-6 text-center">
          <p className="text-primary-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center animate-pulse">
            <Clock size={12} className="mr-2" /> RECHERCHE DE VOTRE HELPER...
          </p>
        </div>
      </div>
    );
  }

  // ÉTAT 2 : MISSION EN COURS / ARRIVÉE
  const statusLabel = {
    'assigned': 'Helper en route',
    'arrived': 'Helper sur place',
    'in_progress': 'Prestation en cours',
    'completed_wait': 'Prêt pour validation',
  }[mission.status] || 'Mise à jour...';

  return (
    <div className="min-h-screen bg-slate-900 relative pb-32 animate-fade-in">
      {/* Map Mockup */}
      <div className="h-[40vh] w-full bg-slate-800 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover opacity-30" alt="Map" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900"></div>
        <div className="absolute top-8 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 rounded-full border border-slate-700 flex items-center space-x-2 z-10 shadow-2xl">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-white font-bold text-[10px] uppercase tracking-wider">{statusLabel}</span>
        </div>
      </div>

      <div className="absolute top-[35vh] left-0 right-0 min-h-[65vh] bg-slate-900 rounded-t-[2.5rem] border-t border-white/5 p-8 shadow-2xl">
        {mission.provider && (
          <div className="flex items-center space-x-4 mb-10">
            <img src={mission.provider.photoUrl} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-700 shadow-xl" alt="Pro" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white leading-tight">{mission.provider.name}</h2>
              <div className="flex items-center space-x-2 text-primary-400 text-[10px] font-black uppercase tracking-widest mt-1">
                <ShieldCheck size={14} /> <span>Helper Certifié</span>
              </div>
            </div>
            <a href={`tel:${mission.provider.phone}`} className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-green-400 shadow-xl">
              <Phone size={22} />
            </a>
          </div>
        )}

        <div className="space-y-6">
          {mission.status === 'assigned' || mission.status === 'arrived' ? (
            <div className="p-6 bg-slate-800/40 rounded-3xl border border-slate-700/50 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-500/10 rounded-xl text-primary-400"><Navigation size={24} /></div>
                <div>
                  <p className="text-white font-bold">Arrivée estimée</p>
                  <p className="text-xs text-slate-500">12 minutes environ</p>
                </div>
              </div>
            </div>
          ) : mission.status === 'in_progress' ? (
             <div className="p-6 bg-green-500/10 rounded-3xl border border-green-500/30 flex flex-col items-center text-center space-y-4 animate-pulse">
                <Clock className="text-green-500" size={32} />
                <h3 className="text-white font-bold uppercase tracking-widest text-sm">Prestation en cours</h3>
                <p className="text-slate-400 text-xs">Le prestataire travaille actuellement sur votre mission.</p>
             </div>
          ) : (
            <div className="bg-primary-600 p-8 rounded-[2.5rem] text-center space-y-6 shadow-2xl animate-fade-in-up">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <QrCode className="text-white" size={40} />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Mission Terminée</h3>
              <p className="text-primary-100 text-xs font-medium leading-relaxed">Scannez le code du Helper pour confirmer la fin de mission et libérer le règlement.</p>
              <button 
                onClick={() => setShowScanner(true)} 
                disabled={isProcessing}
                className="w-full py-5 bg-white text-primary-600 font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : 'SCANNER LE CODE'}
              </button>
            </div>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/50 flex items-center justify-between">
            <div className="flex items-center text-slate-500 font-black uppercase tracking-widest text-[10px]">
              <Wallet size={16} className="mr-3 text-primary-500" /> Règlement {mission.paymentMethod}
            </div>
            <span className="text-white font-black text-xl tracking-tight">
              {mission.totalAmount?.toLocaleString()} F
            </span>
        </div>
      </div>

      {showScanner && <QRScanner onScanSuccess={handleQRSuccess} onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default MissionLive;
