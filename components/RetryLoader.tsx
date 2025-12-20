
import React from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface RetryLoaderProps {
  message?: string;
  onRetry?: () => void;
  showAction?: boolean;
}

const RetryLoader: React.FC<RetryLoaderProps> = ({ 
  message = "Initialisation sécurisée...", 
  onRetry, 
  showAction = false 
}) => {
  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
        <Loader2 className="animate-spin text-primary-500 relative" size={48} />
      </div>
      
      <h2 className="text-white font-bold text-lg mb-2">{message}</h2>
      <p className="text-slate-500 text-xs uppercase tracking-widest leading-relaxed max-w-[250px]">
        Le réseau Helper vérifie l'intégrité de votre mission en temps réel.
      </p>

      {(showAction || onRetry) && (
        <button 
          onClick={() => onRetry?.() || window.location.reload()}
          className="mt-10 flex items-center space-x-2 px-6 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-slate-300 hover:text-white transition-all active:scale-95"
        >
          <RefreshCw size={16} />
          <span className="text-sm font-bold">Réessayer maintenant</span>
        </button>
      )}

      <div className="mt-12 flex items-center space-x-2 text-slate-600">
        <AlertCircle size={14} />
        <span className="text-[10px] font-medium">Ghost Protocol v2.1 • Sécurisé</span>
      </div>
    </div>
  );
};

export default RetryLoader;
