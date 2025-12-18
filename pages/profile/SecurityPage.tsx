import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Smartphone, Monitor, ChevronRight, Download, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import GlassContainer from '../../components/profile/GlassContainer';
import { profileService, SecuritySession } from '../../services/profileService';

interface SecurityPageProps {
  onBack: () => void;
}

const SecurityPage: React.FC<SecurityPageProps> = ({ onBack }) => {
  const [sessions, setSessions] = useState<SecuritySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    const data = await profileService.getSessions();
    setSessions(data);
    setLoading(false);
  };

  const handleExport = async () => {
      setExporting(true);
      const url = await profileService.requestDataExport();
      setExporting(false);
      alert(`Données exportées avec succès ! Téléchargement : ${url}`);
  };

  const handleDeleteAccount = async () => {
      if(window.confirm('ATTENTION : Cette action est irréversible. Voulez-vous vraiment supprimer votre compte ?')) {
          await profileService.deleteAccount();
      }
  };

  return (
    <div className="animate-fade-in p-6 pb-32 space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-white">Sécurité</h1>
      </div>

      <div className="space-y-6">
        
        {/* Credentials */}
        <div className="space-y-3">
          <GlassContainer className="p-4 flex items-center justify-between cursor-pointer" onClick={() => alert('Fonctionnalité simulée')}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-slate-700/50 rounded-lg">
                <Lock size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-medium">Mot de passe</p>
                <p className="text-xs text-slate-500">Dernière modification il y a 3 mois</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-500" />
          </GlassContainer>

          <GlassContainer className="p-4 flex items-center justify-between border-primary-500/30 bg-primary-500/5 cursor-pointer" onClick={() => {}}>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary-500/20 rounded-lg">
                <Smartphone size={20} className="text-primary-400" />
              </div>
              <div>
                <p className="text-white font-medium">Double Authentification (2FA)</p>
                <p className="text-xs text-primary-200">Activé via SMS</p>
              </div>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          </GlassContainer>
        </div>

        {/* Sessions */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Appareils Connectés</h2>
          {loading ? (
             <p className="text-slate-500 text-sm">Chargement...</p>
          ) : (
             sessions.map(session => (
                <GlassContainer key={session.id} className={`p-4 flex items-center justify-between mb-2 ${!session.isCurrent ? 'opacity-70' : ''}`}>
                    <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-700/50 rounded-lg">
                        {session.device.includes('iPhone') || session.device.includes('Android') ? <Smartphone size={20} className="text-slate-300" /> : <Monitor size={20} className="text-slate-300" />}
                    </div>
                    <div>
                        <p className="text-white font-medium">{session.device}</p>
                        <p className={`text-xs ${session.isCurrent ? 'text-green-400' : 'text-slate-500'}`}>
                            {session.lastActive} • {session.location}
                        </p>
                    </div>
                    </div>
                </GlassContainer>
             ))
          )}
        </div>

        {/* Danger Zone */}
        <div className="pt-6">
          <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-4">
            <p className="text-red-400 font-bold text-sm uppercase tracking-wider flex items-center">
              <ShieldCheck size={16} className="mr-2" /> Zone de Danger
            </p>
            
            <button 
                onClick={handleExport}
                disabled={exporting}
                className="w-full flex items-center justify-center space-x-2 py-3 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
            >
              {exporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
              <span className="font-medium text-sm">Exporter mes données</span>
            </button>
            
            <button 
                onClick={handleDeleteAccount}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-500 transition-colors"
            >
              <Trash2 size={18} />
              <span className="font-bold text-sm">Supprimer mon compte</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SecurityPage;