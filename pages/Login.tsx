
import React, { useState } from 'react';
import { Smartphone, Lock, Eye, EyeOff, Loader2, AlertCircle, X, MessageCircle, Phone as PhoneIcon } from 'lucide-react';

interface LoginProps {
  phone: string;
  setPhone: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  loading: boolean;
  error: string | null;
  passwordError: boolean;
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ 
  phone, setPhone, password, setPassword, loading, error, passwordError, onLogin, onSwitchToRegister 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handlePhoneChange = (val: string) => {
    const numericValue = val.replace(/\D/g, '');
    if (numericValue.length <= 10) setPhone(numericValue);
  };

  const handlePasswordChange = (val: string) => {
    const numericValue = val.replace(/\D/g, '');
    if (numericValue.length <= 6) setPassword(numericValue);
  };

  const handleWhatsAppSupport = () => {
    const message = encodeURIComponent("Bonjour Helper, j'ai oublié mon code secret pour mon compte associé au numéro +225" + phone);
    window.open(`https://wa.me/2250707070707?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col p-6 pt-12 animate-fade-in relative">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-8">Ravi de vous revoir</h1>

        <div className="space-y-4">
            <div className={`bg-slate-800 border transition-all duration-300 rounded-2xl px-4 py-3 shadow-inner ${passwordError || (error && error.includes('incorrect')) ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-700'}`}>
                <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Numéro de Téléphone</label>
                <div className="flex items-center">
                    <Smartphone size={18} className="text-slate-500 mr-2" />
                    <span className="text-slate-300 font-bold mr-1">+225</span>
                    <input 
                        type="tel" 
                        className="bg-transparent text-white w-full outline-none font-bold text-lg" 
                        placeholder="0707070707" 
                        value={phone} 
                        onChange={e => handlePhoneChange(e.target.value)}
                        maxLength={10} 
                    />
                </div>
            </div>

            <div className={`bg-slate-800 border transition-all duration-300 rounded-2xl px-4 py-3 shadow-inner ${passwordError || (error && error.includes('incorrect')) ? 'border-red-500/50 ring-1 ring-red-500/20' : 'border-slate-700'}`}>
                <label className="text-[10px] text-slate-500 block mb-1 uppercase font-bold">Code de sécurité (6 chiffres)</label>
                <div className="flex items-center">
                    <Lock size={18} className="text-slate-500 mr-2" />
                    <input 
                        type={showPassword ? "text" : "password"} 
                        className="bg-transparent text-white w-full outline-none font-bold text-lg tracking-widest" 
                        placeholder="••••••" 
                        value={password} 
                        onChange={e => handlePasswordChange(e.target.value)}
                        maxLength={6} 
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="p-1 text-slate-500 hover:text-white transition-colors">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            <div className="flex justify-end px-1">
                <button 
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-primary-400 font-medium hover:text-primary-300 transition-colors"
                >
                    Mot de passe oublié ?
                </button>
            </div>
        </div>

        {error && (
            <div className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-fade-in-up flex items-start text-red-400 text-sm font-medium shadow-lg shadow-red-500/5">
                <AlertCircle size={18} className="mr-3 shrink-0 mt-0.5" />
                <span>{error}</span>
            </div>
        )}

        <div className="mt-auto pb-10">
            <button 
                onClick={onLogin}
                disabled={loading || phone.length !== 10 || password.length !== 6}
                className="w-full py-4 bg-primary-600 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center disabled:opacity-50 transition-all active:scale-95"
            >
                {loading ? <Loader2 className="animate-spin" /> : 'SE CONNECTER'}
            </button>
            <button onClick={onSwitchToRegister} className="w-full py-3 mt-2 text-slate-500 text-sm font-medium hover:text-white transition-colors">
                Nouveau sur Helper ? Créer un compte
            </button>
        </div>

        {/* MODAL MOT DE PASSE OUBLIÉ */}
        {showForgotModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-fade-in">
                <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-fade-in-up">
                    <button 
                        onClick={() => setShowForgotModal(false)}
                        className="absolute top-4 right-4 p-2 bg-slate-700 rounded-full text-slate-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>

                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="text-primary-400" size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-white">Code oublié ?</h2>
                        <p className="text-slate-400 text-sm mt-2">
                            Pour votre sécurité, la réinitialisation du code secret nécessite une validation par notre service client.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button 
                            onClick={handleWhatsAppSupport}
                            className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-lg shadow-green-600/20"
                        >
                            <MessageCircle size={20} />
                            <span>CONTACTER VIA WHATSAPP</span>
                        </button>
                        
                        <button 
                            onClick={() => window.open('tel:+2250707070707')}
                            className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl flex items-center justify-center space-x-2 transition-all active:scale-95"
                        >
                            <PhoneIcon size={20} />
                            <span>APPELER LE SUPPORT</span>
                        </button>
                    </div>

                    <p className="text-[10px] text-slate-500 text-center mt-6">
                        Disponible 7j/7 de 8h à 20h.
                    </p>
                </div>
            </div>
        )}
    </div>
  );
};

export default Login;
