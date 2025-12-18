import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Mail, Sparkles, Smartphone, Globe, ChevronRight } from 'lucide-react';
import GlassContainer from '../../components/profile/GlassContainer';
import { profileService, UserPreferences } from '../../services/profileService';

interface PreferencesPageProps {
  onBack: () => void;
}

const PreferencesPage: React.FC<PreferencesPageProps> = ({ onBack }) => {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    const data = await profileService.getPreferences();
    setPrefs(data);
    setLoading(false);
  };

  const updatePref = async (key: keyof UserPreferences, value: any) => {
    if (!prefs) return;
    const newPrefs = { ...prefs, [key]: value };
    setPrefs(newPrefs); // Optimistic update
    await profileService.updatePreferences(newPrefs);
  };

  if (loading || !prefs) return <div className="p-10 text-center text-slate-500">Chargement...</div>;

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onChange(!value); }}
      className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${value ? 'bg-primary-500' : 'bg-slate-700'}`}
    >
      <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${value ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  );

  return (
    <div className="animate-fade-in p-6 pb-32 space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-white">Préférences</h1>
      </div>

      <div className="space-y-6">
        {/* Notifications Section */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Notifications</h2>
          <div className="space-y-3">
            <GlassContainer className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell size={20} className="text-slate-400" />
                <div>
                  <p className="text-white font-medium">Notifications Push</p>
                  <p className="text-xs text-slate-500">Alertes missions et chat</p>
                </div>
              </div>
              <Toggle value={prefs.pushNotifications} onChange={(v) => updatePref('pushNotifications', v)} />
            </GlassContainer>

            <GlassContainer className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail size={20} className="text-slate-400" />
                <div>
                  <p className="text-white font-medium">Emails</p>
                  <p className="text-xs text-slate-500">Reçus et newsletters</p>
                </div>
              </div>
              <Toggle value={prefs.emailNotifications} onChange={(v) => updatePref('emailNotifications', v)} />
            </GlassContainer>
          </div>
        </div>

        {/* AI Section */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Expérience IA</h2>
          <GlassContainer className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles size={20} className="text-primary-400" />
              <div>
                <p className="text-white font-medium">Suggestions Intelligentes</p>
                <p className="text-xs text-slate-500">Helper Assistant personnalisé</p>
              </div>
            </div>
            <Toggle value={prefs.aiSuggestions} onChange={(v) => updatePref('aiSuggestions', v)} />
          </GlassContainer>
        </div>

        {/* General Section */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Général</h2>
          <div className="space-y-3">
            <GlassContainer className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone size={20} className="text-slate-400" />
                <div>
                  <p className="text-white font-medium">Économie de données</p>
                  <p className="text-xs text-slate-500">Réduire la qualité des images</p>
                </div>
              </div>
              <Toggle value={prefs.dataSaver} onChange={(v) => updatePref('dataSaver', v)} />
            </GlassContainer>

            <GlassContainer className="p-4 flex items-center justify-between cursor-pointer">
              <div className="flex items-center space-x-3">
                <Globe size={20} className="text-slate-400" />
                <p className="text-white font-medium">Langue</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-primary-400 font-bold text-sm">{prefs.language}</span>
                <ChevronRight size={16} className="text-slate-500" />
              </div>
            </GlassContainer>
          </div>
        </div>

        <button 
          onClick={() => {
            if(window.confirm('Réinitialiser toutes les préférences ?')) {
               profileService.updatePreferences({
                 pushNotifications: true, emailNotifications: true, aiSuggestions: true, dataSaver: false, language: 'Français (FR)'
               }).then(loadPrefs);
            }
          }}
          className="w-full py-4 text-primary-400 text-sm font-medium hover:text-primary-300 transition-colors"
        >
          Restaurer les réglages par défaut
        </button>
      </div>
    </div>
  );
};

export default PreferencesPage;