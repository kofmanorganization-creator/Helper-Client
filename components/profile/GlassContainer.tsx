
import React from 'react';

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const GlassContainer: React.FC<GlassContainerProps> = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-slate-800/40 border border-slate-700/50 backdrop-blur-md rounded-2xl 
        ${onClick ? 'cursor-pointer hover:bg-slate-800/60 transition-colors active:scale-[0.99] transform duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassContainer;
