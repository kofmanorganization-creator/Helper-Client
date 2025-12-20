import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Calendar as CalendarIcon, Clock, Crosshair, ExternalLink, Loader2, Moon, Sparkles, AlertTriangle, Info } from 'lucide-react';

interface ScheduleAddressPageProps {
  address: string | null;
  onAddressChange: (address: string) => void;
  onDateTimeChange: (datetime: Date) => void;
}

const ALL_TIME_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

const ScheduleAddressPage: React.FC<ScheduleAddressPageProps> = ({ address, onAddressChange, onDateTimeChange }) => {
  const [selectedDateIndex, setSelectedDateIndex] = useState<number>(0);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const next7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      return {
        fullDate: date,
        dayName: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date),
        dayNumber: new Intl.DateTimeFormat('fr-FR', { day: 'numeric' }).format(date),
        month: new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date),
        isToday: i === 0
      };
    });
  }, []);

  const availableSlots = useMemo(() => {
    const selectedDay = next7Days[selectedDateIndex];
    if (!selectedDay.isToday) return ALL_TIME_SLOTS;

    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const safetyBuffer = 45;

    return ALL_TIME_SLOTS.filter(slot => {
      const [slotHour, slotMin] = slot.split(':').map(Number);
      const slotTotalMinutes = slotHour * 60 + slotMin;
      const currentTotalMinutes = currentHour * 60 + currentMinutes + safetyBuffer;
      return slotTotalMinutes > currentTotalMinutes;
    });
  }, [selectedDateIndex, now, next7Days]);

  useEffect(() => {
    if (selectedTimeSlot) {
      const targetDate = new Date(next7Days[selectedDateIndex].fullDate);
      const [hours, minutes] = selectedTimeSlot.split(':').map(Number);
      targetDate.setHours(hours, minutes, 0, 0);
      onDateTimeChange(targetDate);
    }
  }, [selectedDateIndex, selectedTimeSlot, next7Days]);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setGpsError("GPS non supporté");
      return;
    }
    setIsLocating(true);
    setGpsError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onAddressChange(`📍 GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        setIsLocating(false);
      },
      (error) => {
        console.warn("[GPS] Erreur détectée, bascule manuelle :", error.message);
        setGpsError("GPS indisponible (désactivé). Saisissez l'adresse manuellement.");
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  };

  return (
    <div className="animate-fade-in relative pb-8 space-y-6">
      <div className="relative w-full h-64 overflow-hidden">
          <div className="absolute inset-0">
             <img src="https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover" alt="Schedule" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 to-slate-900"></div>
          <div className="absolute bottom-0 left-0 w-full p-6">
              <h1 className="text-2xl font-bold text-white tracking-tight">Quand & Où ?</h1>
          </div>
      </div>

      <div className="px-6 space-y-6">
        <div className="space-y-3">
            <h3 className="text-white font-semibold flex items-center text-sm">
                <CalendarIcon size={16} className="mr-2 text-primary-400" />
                Date de l'intervention
            </h3>
            <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
                {next7Days.map((day, index) => (
                    <button
                        key={index}
                        onClick={() => setSelectedDateIndex(index)}
                        className={`flex-shrink-0 w-14 h-16 rounded-xl flex flex-col items-center justify-center transition-all border
                            ${selectedDateIndex === index ? 'bg-primary-500 border-primary-400 shadow-lg text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}
                        `}
                    >
                        <span className="text-[10px] uppercase font-bold">{day.dayName.substring(0,3)}</span>
                        <span className="text-lg font-bold">{day.dayNumber}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="space-y-3">
             <h3 className="text-white font-semibold flex items-center text-sm">
                <Clock size={16} className="mr-2 text-primary-400" />
                Créneau horaire
             </h3>
             <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((time) => (
                    <button
                        key={time}
                        onClick={() => setSelectedTimeSlot(time)}
                        className={`py-3 rounded-xl border text-xs font-bold transition-all
                            ${selectedTimeSlot === time ? 'bg-primary-500/20 border-primary-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}
                        `}
                    >
                        {time}
                    </button>
                ))}
             </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-white font-semibold flex items-center text-sm">
              <MapPin size={16} className="mr-2 text-primary-400" />
              Lieu de prestation
          </h3>
          <div className="relative">
            <input 
              type="text" 
              value={address || ''} 
              onChange={(e) => onAddressChange(e.target.value)} 
              placeholder="Ex: Riviera Palmeraie, Immeuble..." 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-4 pl-4 pr-12 text-white text-sm outline-none focus:border-primary-500" 
            />
            <button 
                onClick={handleGeolocation} 
                disabled={isLocating}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-slate-700 rounded-lg text-primary-400 active:scale-95"
            >
                {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Crosshair size={18} />}
            </button>
          </div>
          {gpsError && (
              <p className="text-[10px] text-amber-500 flex items-center px-1">
                  <Info size={12} className="mr-1" /> {gpsError}
              </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleAddressPage;