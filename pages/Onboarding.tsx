
import React, { useState, useEffect } from 'react';
import { Sparkles, Smartphone, Loader2, AlertCircle, RefreshCw, Lock, CheckCircle2, Eye, EyeOff, XCircle, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';
import { trackOtp } from '../services/analyticsService';
import { otpService } from '../services/otpService';
import Login from './Login';

const SLIDES = [
    {
        image: "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?q=80&w=1200&auto=format&fit=crop",
        title: "Votre temps est précieux.",
        subtitle: "Confiez-nous vos tâches quotidiennes."
    },
    {
        image: "https://images.unsplash.com/photo-1581578731117-104f2a417954?q=80&w=1200&auto=format&fit=crop",
        title: "La qualité Helper.",
        subtitle: "Prestataires rigoureusement sélectionnés."
    }
];

const Onboarding: React.FC = () => {
  const [step, setStep] = useState<'splash' | 'welcome' | 'login' | 'register' | 'register_geo' | 'final_ai'>('splash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  // Form Data
  const [phone, setPhone] = useState('');
  const [phoneConfirm, setPhoneConfirm] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [commune, setCommune] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');

  useEffect(() => {
    const splashTimer = setTimeout(() => setStep('welcome'), 2500);
    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
      if (step === 'welcome') {
          const slideInterval = setInterval(() => setCurrentSlide(prev => (prev + 1) % SLIDES.length), 5000);
          return () => clearInterval(slideInterval);
      }
  }, [step]);

  const handlePhoneChange = (val: string, setter: (v: string) => void) => {
    const numericValue = val.replace(/\D/g, '');
    if (numericValue.length <= 10) setter(numericValue);
  };

  const handleLogin = async () => {
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();

    if (cleanPhone.length !== 10) { setError("Numéro de téléphone invalide."); return; }
    if (cleanPassword.length !== 6) { setError("Le code doit comporter 6 chiffres."); return; }
    
    setLoading(true);
    setError(null);
    setPasswordError(false);
    try {
      await authService.loginWithPhonePassword(cleanPhone, cleanPassword);
      trackOtp("verified");
    } catch (e: any) {
      console.error("[ONBOARDING] Login failed:", e.message);
      setError(e.message || "Numéro ou code secret incorrect.");
      setPasswordError(true);
      trackOtp("failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();

    if (!cleanFirstName || !cleanLastName) { setError("Veuillez saisir votre nom complet."); return; }
    if (cleanPhone.length !== 10) { setError("Numéro de téléphone invalide."); return; }
    if (cleanPhone !== phoneConfirm.trim()) { setError("Les numéros de téléphone ne correspondent pas."); return; }
    if (cleanPassword.length !== 6) { setError("Le code secret doit comporter 6 chiffres."); return; }

    setLoading(true);
    setError(null);
    try {
      await authService.register({ 
          firstName: cleanFirstName, 
          lastName: cleanLastName, 
          phone: cleanPhone, 
          password: cleanPassword 
      });
      setStep('register_geo');
    } catch (e: any) {
      console.error("[ONBOARDING] Register Error:", e.message);
      if (e.message?.includes("déjà associé") || e.code === 'auth/email-already-in-use') {
          setError("Ce numéro est déjà utilisé. Connectez-vous plutôt.");
      } else {
          setError(e.message || "Erreur lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
        if (commune) await authService.updateLocation(commune);
        const msg = await authService.getWelcomeMessage(firstName);
        setWelcomeMessage(msg);
        setStep('final_ai');
    } catch (e) {
        console.error("[ONBOARDING] Finalization error:", e);
        setStep('final_ai'); // On passe quand même à l'étape finale
    } finally {
        setLoading(false);
    }
  };

  if (step === 'splash') {
    return (
      <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center relative">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center animate-bounce shadow-2xl">
            <span className="font-black text-6xl text-primary-600">H</span>
        </div>
        <h1 className="text-3xl font-bold text-white mt-6 tracking-widest animate-pulse">HELPER</h1>
      </div>
    );
  }

  if (step === 'final_ai') {
      return (
        <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <Sparkles size={48} className="text-primary-400 mb-8 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mb-4">Compte Activé !</h2>
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-3xl italic text-primary-200 shadow-xl">
                "{welcomeMessage || "Bienvenue chez Helper !"}"
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-8 px-8 py-4 bg-primary-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all"
            >
              ACCÉDER À L'ACCUEIL
            </button>
        </div>
      );
  }

  const isPhoneMismatch = phoneConfirm.length > 0 && phone !== phoneConfirm;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 relative font-sans overflow-x-hidden">
      
      {step === 'welcome' && (
        <div className="absolute inset-0 flex flex-col justify-end">
          <div className="absolute inset-0">
            {SLIDES.map((slide, index) => (
              <img key={index} src={slide.image} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`} />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
          </div>
          <div className="relative z-10 p-6 pb-12">
            <h1 className="text-4xl font-bold text-white mb-2 leading-tight">{SLIDES[currentSlide].title}</h1>
            <p className="text-slate-200 mb-8 text-lg opacity-80">{SLIDES[currentSlide].subtitle}</p>
            <div className="flex space-x-4">
              <button onClick={() => setStep('login')} className="w-1/2 py-4 bg-primary-600 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all">CONNEXION</button>
              <button onClick={() => setStep('register')} className="w-1/2 py-4 bg-slate-800 border border-slate-700 text-white font-bold rounded-2xl active:scale-95 transition-all">S'INSCRIRE</button>
            </div>
          </div>
        </div>
      )}

      {step === 'login' && (
        <Login 
          phone={phone}
          setPhone={setPhone}
          password={password}
          setPassword={setPassword}
          loading={loading}
          error={error}
          passwordError={passwordError}
          onLogin={handleLogin}
          onSwitchToRegister={() => { setError(null); setPasswordError(false); setStep('register'); }}
        />
      )}

      {step === 'register' && (
        <div className="min-h-screen flex flex-col p-6 pt-12 animate-fade-in overflow-y-auto no-scrollbar">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-6">Créer un compte</h1>

            <div className="space-y-4">
                <div className="flex space-x-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 w-1/2 shadow-inner">
                        <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Nom</label>
                        <input type="text" className="bg-transparent text-white w-full outline-none font-medium" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Ex: Koffi" />
                    </div>
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 w-1/2 shadow-inner">
                        <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Prénoms</label>
                        <input type="text" className="bg-transparent text-white w-full outline-none font-medium" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Ex: Paul" />
                    </div>
                </div>

                <div className={`bg-slate-800 border rounded-2xl px-4 py-3 shadow-inner transition-colors duration-300 ${isPhoneMismatch ? 'border-red-500/50' : 'border-slate-700'}`}>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Numéro de Téléphone</label>
                    <div className="flex items-center">
                        <Smartphone size={18} className="text-slate-500 mr-2" />
                        <span className="text-slate-300 font-bold mr-1">+225</span>
                        <input type="tel" className="bg-transparent text-white w-full outline-none font-bold text-lg" value={phone} onChange={e => handlePhoneChange(e.target.value, setPhone)} maxLength={10} placeholder="0707070707" />
                    </div>
                </div>

                <div className={`bg-slate-800 border rounded-2xl px-4 py-3 shadow-inner transition-colors duration-300 ${isPhoneMismatch ? 'border-red-500' : 'border-slate-700'}`}>
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Confirmez le Numéro</label>
                    <div className="flex items-center">
                        <Smartphone size={18} className="text-slate-500 mr-2" />
                        <span className="text-slate-300 font-bold mr-1">+225</span>
                        <input type="tel" className="bg-transparent text-white w-full outline-none font-bold text-lg" value={phoneConfirm} onChange={e => handlePhoneChange(e.target.value, setPhoneConfirm)} maxLength={10} placeholder="Réécrire le numéro" />
                        {phone.length === 10 && phone === phoneConfirm && <CheckCircle2 size={18} className="text-green-500 ml-2" />}
                        {isPhoneMismatch && <XCircle size={18} className="text-red-500 ml-2 animate-pulse" />}
                    </div>
                </div>

                {isPhoneMismatch && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 ml-2 animate-fade-in flex items-center">
                        <AlertCircle size={10} className="mr-1" /> Les numéros ne correspondent pas
                    </p>
                )}

                <div className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 shadow-inner">
                    <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Code secret (6 chiffres)</label>
                    <div className="flex items-center">
                        <Lock size={18} className="text-slate-500 mr-2" />
                        <input 
                            type={showRegisterPassword ? "text" : "password"}
                            className="bg-transparent text-white w-full outline-none font-bold text-lg tracking-widest" 
                            value={password} 
                            onChange={(e) => {
                                const numericValue = e.target.value.replace(/\D/g, '');
                                if (numericValue.length <= 6) setPassword(numericValue);
                            }} 
                            maxLength={6} 
                            placeholder="••••••" 
                        />
                        <button 
                            onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            className="p-1 text-slate-500 hover:text-white transition-colors"
                        >
                            {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className={`mt-6 p-4 rounded-2xl animate-fade-in-up flex flex-col space-y-3 ${error.includes("utilisé") ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                    <div className="flex items-center text-sm font-medium">
                        <AlertCircle size={18} className={`mr-2 shrink-0 ${error.includes("utilisé") ? 'text-orange-400' : 'text-red-400'}`} />
                        <span className={error.includes("utilisé") ? 'text-orange-400' : 'text-red-400'}>{error}</span>
                    </div>
                    {error.includes("utilisé") && (
                        <button 
                            onClick={() => { setError(null); setStep('login'); }}
                            className="flex items-center justify-center space-x-2 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 rounded-xl text-xs font-bold transition-all"
                        >
                            <span>ALLER À LA CONNEXION</span>
                            <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            )}

            <div className="mt-8 pb-10">
                <button 
                    onClick={handleRegister}
                    disabled={loading || !firstName || !lastName || phone.length !== 10 || phone !== phoneConfirm || password.length !== 6}
                    className="w-full py-4 bg-primary-600 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center disabled:opacity-50 transition-all active:scale-95"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'S\'INSCRIRE'}
                </button>
                <button onClick={() => { setError(null); setStep('login'); }} className="w-full py-3 mt-2 text-slate-500 text-sm font-medium hover:text-white transition-colors">
                    Déjà un compte ? Se connecter
                </button>
            </div>
        </div>
      )}

      {step === 'register_geo' && (
        <div className="min-h-screen flex flex-col p-6 pt-12 animate-fade-in text-center">
            <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="text-primary-400" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Où êtes-vous ?</h2>
            <p className="text-slate-400 text-sm mb-8">Helper a besoin de connaître votre commune pour vous proposer les meilleurs prestataires.</p>
            <select 
                value={commune} 
                onChange={e => setCommune(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-2xl py-4 px-4 text-white outline-none focus:border-primary-500"
            >
                <option value="">Sélectionnez votre commune</option>
                <option value="Cocody">Cocody</option>
                <option value="Abobo">Abobo</option>
                <option value="Yopougon">Yopougon</option>
                <option value="Marcory">Marcory</option>
                <option value="Treichville">Treichville</option>
                <option value="Koumassi">Koumassi</option>
                <option value="Adjamé">Adjamé</option>
                <option value="Plateau">Plateau</option>
                <option value="Attécoubé">Attécoubé</option>
                <option value="Port-Bouët">Port-Bouët</option>
            </select>
            <button onClick={handleFinalize} disabled={loading || !commune} className="w-full mt-10 py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'TERMINER'}
            </button>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
