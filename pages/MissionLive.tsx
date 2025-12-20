
import React, { useState } from 'react';
import { useMission } from '../hooks/useMission';
import MatchingRadar from '../components/mission/MatchingRadar';
import QRScanner from '../components/mission/QRScanner';
import RetryLoader from '../components/RetryLoader';
import { Phone, ShieldCheck, QrCode, Clock, Navigation, Wallet, AlertCircle, ShieldAlert, Loader2, SearchX, Lock } from 'lucide-react';

interface MissionLiveProps {
  missionId: string;
  onMissionComplete: () => void;
}

const MissionLive: React.FC<MissionLiveProps> = ({ missionId, onMissionComplete }) => {
  const { mission, loading, error } = useMission(missionId);
  const [showScanner, setShowScanner] = useState(false);

  // 1. ÉTAT : CHARGEMENT
  if (loading) {
    return <RetryLoader message="Synchronisation sécurisée..." />;
  }

  // 2. ÉTAT : PERMISSION REFUSÉE (Terminal)
  if (error === "PERMISSION_DENIED") {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
            <Lock size={40} className="text-red-500" />
        </div>
        <h2 className="text-white font-bold text-xl">Accès restreint</h2>
        <p className="text-slate-400 mt-3 text-sm max-w-xs mx-auto leading-relaxed">
          Vous n'êtes pas autorisé à consulter cette mission ou elle est en cours d'archivage sécurisé.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-10 w-full max-w-xs py-4 bg-slate-800 border border-slate-700 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg"
        >
          RETOUR À L'ACCUEIL
        </button>
      </div>
    );
  }

  // 3. ÉTAT : MISSION INTROUVABLE (Terminal après retries)
  if (error === "MISSION_NOT_FOUND") {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
            <SearchX size={40} className="text-amber-500" />
        </div>
        <h2 className="text-white font-bold text-xl">Mission introuvable</h2>
        <p className="text-slate-400 mt-3 text-sm max-w-xs mx-auto leading-relaxed">
          La demande a peut-être été annulée ou déplacée. Veuillez vérifier l'onglet "Mes Réservations".
        </p>
        <button 
          onClick={onMissionComplete} 
          className="mt-10 w-full max-w-xs py-4 bg-primary-600 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg"
        >
          VOIR MES RÉSERVATIONS
        </button>
      </div>
    );
  }

  // ÉTAT : Erreur générique
  if (error || (!mission && !loading)) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <AlertCircle size={40} className="text-slate-500 mb-4" />
        <h2 className="text-white font-bold">Erreur de synchronisation</h2>
        <button onClick={() => window.location.reload()} className="mt-6 text-primary-400 font-bold uppercase text-xs tracking-widest">Réessayer</button>
      </div>
    );
  }

  // Fin de mission automatique
  if (mission && (mission.status === 'completed' || mission.status === 'reviewed')) {
    onMissionComplete();
    return null;
  }

  if (!mission) return null;

  // 4. ÉTATS MÉTIERS (Attente Paiement, Recherche, En cours...)
  if (['pending_payment', 'AWAITING_PAYMENT', 'INITIATED'].includes(mission.status)) {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center text-center p-8 animate-fade-in">
        <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center border-4 border-primary-500/20 mb-6 relative">
          <Wallet size={40} className="text-primary-400" />
          <div className="absolute -top-1 -right-1">
             <Loader2 className="animate-spin text-primary-500" size={20} />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Validation du Paiement</h2>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">Veuillez finaliser la transaction pour lancer la recherche d'un Helper.</p>
        <div className="mt-8 flex items-center space-x-3 bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">En attente...</span>
        </div>
      </div>
    );
  }

  if (mission.status === 'searching' || mission.status === 'PENDING_ASSIGNMENT') {
    return (
      <div className="h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden animate-fade-in">
        <MatchingRadar onFound={() => {}} />
        <div className="absolute bottom-12 left-0 right-0 px-6 text-center">
          <p className="text-primary-400 text-xs font-bold uppercase tracking-widest flex items-center justify-center animate-pulse">
            <Clock size={12} className="mr-2" /> Matching Helper en cours
          </p>
        </div>
      </div>
    );
  }

  const statusLabel = {
    'assigned': 'Helper en route',
    'arrived': 'Helper sur place',
    'in_progress': 'Mission en cours',
    'completed_wait': 'Mission terminée',
  }[mission.status.toLowerCase()] || 'Mise à jour...';

  return (
    <div className="min-h-screen bg-slate-900 relative pb-32 animate-fade-in">
      <div className="h-[40vh] w-full bg-slate-800 relative overflow-hidden">
        <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover opacity-40" alt="Carte" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900"></div>
        <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-full border border-slate-700 flex items-center space-x-2 z-10 shadow-2xl">
          <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
          <span className="text-white font-bold text-[10px] uppercase tracking-wider">{statusLabel}</span>
        </div>
      </div>

      <div className="absolute top-[35vh] left-0 right-0 min-h-[65vh] bg-slate-900 rounded-t-[2.5rem] border-t border-white/5 p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        {mission.provider && (
          <div className="flex items-center space-x-4 mb-8">
            <div className="relative">
                <img src={mission.provider.photoUrl} className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 shadow-lg" alt="Helper" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <ShieldCheck size={10} className="text-white" />
                </div>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">{mission.provider.name}</h2>
              <div className="flex items-center space-x-2 text-[10px] font-bold">
                <span className="text-yellow-500 flex items-center italic">⭐ {mission.provider.rating}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-500 uppercase tracking-widest">Helper Certifié</span>
              </div>
            </div>
            <a href={`tel:${mission.provider.phone}`} className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-green-400 shadow-xl active:scale-95 transition-transform">
              <Phone size={20} />
            </a>
          </div>
        )}

        <div className="space-y-4">
          {mission.status === 'completed_wait' ? (
            <div className="bg-primary-600 p-6 rounded-[2rem] text-center space-y-4 shadow-2xl shadow-primary-500/20 animate-fade-in-up">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto shadow-inner"><QrCode className="text-white" size={32} /></div>
              <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Mission Terminée</h3>
              <p className="text-primary-100 text-xs font-medium leading-relaxed">Scannez le code du prestataire pour libérer le règlement.</p>
              <button onClick={() => setShowScanner(true)} className="w-full py-4 bg-white text-primary-600 font-black rounded-2xl shadow-xl active:scale-95 transition-all">SCANNER LE CODE</button>
            </div>
          ) : (
            <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 flex items-center space-x-4 backdrop-blur-md">
              <div className="p-3 bg-primary-500/10 rounded-xl text-primary-400"><Navigation size={20} /></div>
              <div>
                <p className="text-white font-bold text-sm">Géolocalisation Active</p>
                <p className="text-xs text-slate-500 font-medium">Intervention en approche.</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-12 pt-6 border-t border-slate-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">
              <AlertCircle size={14} className="mr-2" /> Règlement {mission.paymentMethod}
            </div>
            <span className="text-white font-black bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700 shadow-lg">
              {mission.totalAmount?.toLocaleString()} F
            </span>
          </div>
        </div>
      </div>

      {showScanner && <QRScanner onScanSuccess={() => onMissionComplete()} onClose={() => setShowScanner(false)} />}
    </div>
  );
};

export default MissionLive;
