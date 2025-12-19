
import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Calendar as CalendarIcon, Clock, Crosshair, ExternalLink, Loader2, Moon, Sparkles } from 'lucide-react';

interface ScheduleAddressPageProps {
  address: string | null;
  onAddressChange: (address: string) => void;
  onDateTimeChange: (datetime: Date) => void;
}

const TIME_SLOTS = [
  "08:00", "10:00", "12:00", "14:00", "16:00", "18:00"
];

const ScheduleAddressPage: React.FC<ScheduleAddressPageProps> = ({ address, onAddressChange, onDateTimeChange }) => {
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsUrl, setGpsUrl] = useState<string | null>(null);

  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      fullDate: date,
      dayName: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date),
      dayNumber: new Intl.DateTimeFormat('fr-FR', { day: 'numeric' }).format(date),
      month: new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date)
    };
  });

  const nightSurcharge = useMemo(() => {
    if (!address) return 5000;
    const calculated = 5000 + (address.length * 100);
    return Math.min(10000, calculated);
  }, [address]);

  useEffect(() => {
    if (selectedTimeSlot) {
      const targetDate = new Date(next7Days[selectedDateIndex].fullDate);
      const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
      onDateTimeChange(targetDate);
    }
  }, [selectedDateIndex, selectedTimeSlot]);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setIsLocating(true);

    // FIX: Optimized geolocation settings to prevent Timeout (Code 3)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const formattedAddress = `📍 Position GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
        
        onAddressChange(formattedAddress);
        setGpsUrl(mapsLink);
        setIsLocating(false);
      },
      (error) => {
        let errorMessage = "Impossible de récupérer votre position.";
        if (error.code === 3) {
            errorMessage = "Délai d'attente GPS dépassé. Veuillez réessayer ou saisir votre adresse manuellement.";
        } else if (error.code === 1) {
            errorMessage = "Accès GPS refusé. Veuillez l'autoriser dans vos paramètres.";
        }
        console.warn(`Geolocation Error (${error.code}):`, error.message);
        alert(errorMessage);
        setIsLocating(false);
      },
      { 
        enableHighAccuracy: false, // High accuracy is often the cause of timeouts indoors
        timeout: 20000,           // Increased to 20 seconds
        maximumAge: 60000         // Allow using a cached position up to 1 minute old
      }
    );
  };

  const handleOpenMaps = () => {
      if (gpsUrl) {
          window.open(gpsUrl, '_blank');
      } else if (address) {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
      }
  };

  return (
    <div className="animate-fade-in relative pb-8 space-y-6">
      <div className="relative w-full h-72 overflow-hidden shadow-2xl shadow-slate-900/80 group">
          <div className="absolute inset-0">
             <img 
                src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1200&auto=format&fit=crop" 
                alt="Planification" 
                className="w-full h-full object-cover transition-transform duration-10000 ease-linear scale-100 group-hover:scale-110" 
             />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/20 to-slate-900"></div>
          <div className="absolute bottom-0 left-0 w-full p-6 z-10">
              <div className="flex items-center space-x-2 mb-1">
                 <span className="bg-primary-500/30 backdrop-blur-md border border-primary-500/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Étape 3
                 </span>
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-xl">Quand & Où ?</h1>
              <p className="text-slate-200 text-sm mt-1 drop-shadow-md flex items-center font-medium opacity-90">
                <Clock size={14} className="mr-1.5 inline text-primary-400" />
                Choisissez un créneau et confirmez le lieu.
              </p>
          </div>
      </div>

      <div className="px-6 space-y-6 -mt-2">
        <div className="space-y-3">
            <h3 className="text-white font-semibold flex items-center">
                <CalendarIcon size={18} className="mr-2 text-primary-400" />
                Date de l'intervention
            </h3>
            <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl backdrop-blur-sm">
                <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2 snap-x">
                    {next7Days.map((day, index) => {
                        const isSelected = selectedDateIndex === index;
                        return (
                            <button
                                key={index}
                                onClick={() => setSelectedDateIndex(index)}
                                className={`
                                    relative flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 snap-start border
                                    ${isSelected 
                                        ? 'bg-primary-500 border-primary-400 shadow-lg shadow-primary-500/30 -translate-y-1' 
                                        : 'bg-slate-700/30 border-slate-600 hover:bg-slate-700/60 text-slate-400'
                                    }
                                `}
                            >
                                <span className={`text-xs font-medium uppercase mb-1 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                                    {day.dayName.replace('.', '')}
                                </span>
                                <span className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-white'}`}>
                                    {day.dayNumber}
                                </span>
                                {index === 0 && !isSelected && (
                                    <span className="absolute -top-2 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="text-center mt-2">
                     <p className="text-xs text-primary-200 font-medium">
                        {next7Days[selectedDateIndex].month} {new Date().getFullYear()}
                     </p>
                </div>
            </div>
        </div>

        <div className="space-y-3">
             <div className="flex justify-between items-end">
                <h3 className="text-white font-semibold flex items-center">
                    <Clock size={18} className="mr-2 text-primary-400" />
                    Créneau (2h)
                </h3>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">8h - 20h</span>
             </div>
             <div className="grid grid-cols-3 gap-3">
                {TIME_SLOTS.map((time) => {
                    const isSelected = selectedTimeSlot === time;
                    const isNightSlot = time === "18:00";
                    const endHour = parseInt(time.split(':')[0]) + 2;
                    return (
                        <button
                            key={time}
                            onClick={() => setSelectedTimeSlot(time)}
                            className={`
                                relative py-3 px-2 rounded-xl border text-center transition-all duration-300 overflow-hidden
                                ${isSelected 
                                    ? isNightSlot 
                                        ? 'bg-yellow-500/20 border-yellow-400 text-yellow-100 shadow-[0_0_20px_-5px_rgba(234,179,8,0.5)]'
                                        : 'bg-primary-500/20 border-primary-500 text-white shadow-[0_0_15px_-5px_rgba(59,130,246,0.5)]' 
                                    : isNightSlot
                                        ? 'bg-slate-800/60 border-yellow-500/30 text-yellow-500/80 hover:border-yellow-500/60 hover:bg-yellow-900/10'
                                        : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                                }
                            `}
                        >
                            {isNightSlot && <div className="absolute -right-3 -top-3 w-8 h-8 bg-yellow-500/20 rounded-full blur-md"></div>}
                            <span className={`block text-sm font-bold flex items-center justify-center ${isNightSlot && !isSelected ? 'text-yellow-500' : ''}`}>
                                {isNightSlot && <Moon size={12} className="mr-1 inline-block fill-current" />}
                                {time}
                            </span>
                            <span className={`text-[10px] ${isSelected ? (isNightSlot ? 'text-yellow-200' : 'text-primary-200') : 'text-slate-500'}`}>
                                à {endHour}:00
                            </span>
                        </button>
                    );
                })}
             </div>
             {selectedTimeSlot === "18:00" && (
                 <div className="animate-fade-in-up mt-2 bg-gradient-to-r from-yellow-500/10 to-transparent border-l-2 border-yellow-500 p-3 rounded-r-xl">
                    <div className="flex items-start">
                        <Sparkles size={16} className="text-yellow-400 mt-0.5 mr-2 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-yellow-100">Tarif Spécial Nuit</p>
                            <p className="text-xs text-yellow-200/70 mt-0.5">
                                Majoration dynamique appliquée : <span className="text-white font-bold">+{nightSurcharge.toLocaleString()} F</span>
                            </p>
                        </div>
                    </div>
                 </div>
             )}
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="text-white font-semibold flex items-center justify-between">
              <div className="flex items-center">
                <MapPin size={18} className="mr-2 text-primary-400" />
                Lieu de prestation
              </div>
              {address && (
                  <button onClick={handleOpenMaps} className="text-[10px] flex items-center text-primary-400 hover:text-primary-300 transition-colors">
                      <ExternalLink size={10} className="mr-1" />
                      Voir sur carte
                  </button>
              )}
          </h3>
          <div className="relative group">
            <div className={`relative bg-slate-800/80 border rounded-xl p-1 flex items-center transition-all duration-300 ${isLocating ? 'border-primary-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-slate-700 focus-within:border-primary-500/50'}`}>
                 <div className={`p-3 rounded-lg mr-2 transition-colors ${address?.includes('Position GPS') ? 'bg-primary-500/20 text-primary-400' : 'bg-slate-700/50 text-slate-300'}`}><MapPin size={20} /></div>
                 <input type="text" value={address || ''} onChange={(e) => onAddressChange(e.target.value)} placeholder="Adresse ou Quartier..." className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none py-3 pr-12 text-sm" />
                <button onClick={handleGeolocation} disabled={isLocating} className={`absolute right-2 p-2 rounded-lg transition-all duration-300 ${isLocating ? 'bg-primary-500/20 text-primary-400 animate-pulse' : 'bg-slate-700 text-slate-400 hover:bg-primary-500 hover:text-white'}`}>
                    {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Crosshair size={18} />}
                </button>
            </div>
            {address?.includes('Position GPS') && <div className="flex items-center mt-2 text-[10px] text-green-400 animate-fade-in"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></span>Localisation précise activée</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleAddressPage;
