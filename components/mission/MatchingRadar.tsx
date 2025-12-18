
import React, { useEffect, useState } from 'react';
import { Search, MapPin, Users } from 'lucide-react';

interface MatchingRadarProps {
  onFound: () => void;
}

const MatchingRadar: React.FC<MatchingRadarProps> = ({ onFound }) => {
  const [radius, setRadius] = useState(3); // Start at 3km
  const [candidates, setCandidates] = useState(0);
  const [stage, setStage] = useState<'scan' | 'negotiate' | 'finalizing'>('scan');

  useEffect(() => {
    // Simulation of the "Super Sayen" dynamic dispatch algorithm
    
    // 1. Expand Radius
    const radiusInterval = setInterval(() => {
      setRadius(prev => Math.min(prev + 2, 15));
    }, 1500);

    // 2. Simulate finding candidates
    const candidateTimeout = setTimeout(() => {
      setCandidates(3);
      setStage('negotiate');
    }, 3000);

    // 3. Finalize
    const foundTimeout = setTimeout(() => {
        setStage('finalizing');
        setTimeout(onFound, 1000);
    }, 6000);

    return () => {
      clearInterval(radiusInterval);
      clearTimeout(candidateTimeout);
      clearTimeout(foundTimeout);
    };
  }, [onFound]);

  return (
    <div className="flex flex-col items-center justify-center h-full py-12 relative overflow-hidden">
        {/* Radar Circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border border-primary-500/30 rounded-full animate-ping opacity-20 absolute"></div>
            <div className="w-48 h-48 border border-primary-500/50 rounded-full animate-pulse opacity-40 absolute"></div>
            <div className="w-32 h-32 border border-primary-400 rounded-full flex items-center justify-center relative bg-primary-900/20 backdrop-blur-sm shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                 <Search className="text-white animate-bounce" size={32} />
            </div>
        </div>

        {/* Text Status */}
        <div className="relative z-10 mt-48 text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
                {stage === 'scan' && 'Recherche en cours...'}
                {stage === 'negotiate' && 'Prestataires trouvés...'}
                {stage === 'finalizing' && 'Confirmation...'}
            </h2>
            
            <div className="flex flex-col items-center space-y-1">
                 <p className="text-primary-300 text-sm font-medium flex items-center">
                    <MapPin size={14} className="mr-1" />
                    Zone de recherche : {radius} km
                 </p>
                 {candidates > 0 && (
                     <p className="text-green-400 text-sm font-medium flex items-center animate-fade-in">
                        <Users size={14} className="mr-1" />
                        {candidates} prestataires contactés
                     </p>
                 )}
            </div>
        </div>
        
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
    </div>
  );
};

export default MatchingRadar;
