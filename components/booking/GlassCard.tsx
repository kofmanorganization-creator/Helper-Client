import React from 'react';
import { ChevronRight } from 'lucide-react';

interface GlassCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  isSelected: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ title, description, icon, onClick, isSelected }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-2xl border transition-all duration-300
        ${isSelected ? 'bg-primary-500/20 border-primary-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-slate-900/50 rounded-lg flex items-center justify-center text-2xl">
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400">{description}</p>
          </div>
        </div>
        <div className={`transition-transform duration-300 ${isSelected ? 'rotate-90' : ''}`}>
           <ChevronRight size={24} className="text-slate-500" />
        </div>
      </div>
    </button>
  );
};

export default GlassCard;
