
import React, { useState } from 'react';
import { Camera, X, ScanLine, CheckCircle2 } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: () => void;
  onClose: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const [isScanning, setIsScanning] = useState(true);

  const handleSimulateScan = () => {
    setIsScanning(false);
    setTimeout(() => {
        onScanSuccess();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
            <h3 className="text-white font-bold text-lg drop-shadow-md">Scanner le QR Prestataire</h3>
            <button onClick={onClose} className="p-2 bg-white/10 rounded-full backdrop-blur-md">
                <X className="text-white" size={24} />
            </button>
        </div>

        {/* Camera Viewport (Simulated) */}
        <div className="flex-1 relative bg-slate-800 overflow-hidden">
             {/* Fake Camera Feed Background */}
             <img 
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800" 
                className={`absolute inset-0 w-full h-full object-cover opacity-60 transition-all duration-300 ${isScanning ? 'blur-sm' : 'blur-none'}`} 
                alt="Camera Feed"
             />

             {/* Overlay UI */}
             <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                 {isScanning ? (
                     <>
                        <div className="relative w-64 h-64 border-2 border-primary-500 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(59,130,246,0.5)]">
                            <div className="absolute inset-0 bg-primary-500/10 animate-pulse"></div>
                            <ScanLine className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-400 w-full h-full p-10 opacity-80" />
                            {/* Scanning Line Animation */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-primary-400 shadow-[0_0_10px_#60a5fa] animate-[scan_2s_infinite]"></div>
                        </div>
                        <p className="text-white text-center mt-8 font-medium drop-shadow-lg bg-black/40 px-4 py-2 rounded-full">
                            Placez le QR Code du prestataire dans le cadre
                        </p>
                        
                        {/* DEV ONLY BUTTON */}
                        <button 
                            onClick={handleSimulateScan}
                            className="mt-8 px-6 py-3 bg-white text-black font-bold rounded-full shadow-lg active:scale-95 transition-transform"
                        >
                            [Simulation] Scanner Code
                        </button>
                     </>
                 ) : (
                     <div className="flex flex-col items-center animate-fade-in-up">
                         <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-2xl mb-4">
                             <CheckCircle2 size={48} className="text-white" />
                         </div>
                         <h2 className="text-2xl font-bold text-white mb-2">Code Validé !</h2>
                         <p className="text-slate-300">Paiement libéré.</p>
                     </div>
                 )}
             </div>
        </div>
    </div>
  );
};

export default QRScanner;
