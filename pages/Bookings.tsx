
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, MapPin, ChevronRight, CheckCircle2, CircleDashed, Loader2 } from 'lucide-react';
import { subscribeToUserBookings } from '../services/bookingService';
import { Booking } from '../types';

// FIX: Extracted BookingCard to be a standalone component and used React.FC 
// to ensure it correctly accepts the 'key' prop when used in lists.
const BookingCard: React.FC<{ booking: Booking }> = ({ booking }) => {
    const isCompleted = booking.status === 'completed' || booking.status === 'reviewed';
    const isPending = !isCompleted && booking.status !== 'cancelled';
    const date = booking.scheduledAt.toDate();

    return (
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 backdrop-blur-md active:scale-[0.98] transition-transform">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg
              ${isPending ? 'bg-yellow-500/10 text-yellow-500' : isCompleted ? 'bg-green-500/10 text-green-500' : 'bg-slate-600/20 text-slate-400'}
            `}>
              {isPending ? <CircleDashed size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <h3 className="font-bold text-white text-base">{booking.serviceName}</h3>
              <p className="text-slate-400 text-xs capitalize">{booking.status}</p>
            </div>
          </div>
          <span className="font-semibold text-white">{booking.totalAmount.toLocaleString('fr-FR')} F</span>
        </div>

        <div className="space-y-2 border-t border-slate-700/50 pt-3">
          <div className="flex items-center text-sm text-slate-300">
            <Calendar size={14} className="mr-2 text-slate-500" />
            {date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}, {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="flex items-center text-sm text-slate-300">
            <MapPin size={14} className="mr-2 text-slate-500" />
            {booking.address}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
           <div className="flex items-center space-x-2">
              {booking.provider?.photoUrl ?
                <img src={booking.provider.photoUrl} className="w-6 h-6 rounded-full object-cover border border-slate-500" alt={booking.provider.name}/>
                : <div className="w-6 h-6 rounded-full bg-slate-600 border border-slate-500"></div>
              }
              <span className="text-xs text-slate-400">Prestataire: {booking.provider?.name || 'En attente'}</span>
           </div>
           <button className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-xs font-medium text-white border border-slate-600 hover:bg-slate-700">
              Détails
           </button>
        </div>
      </div>
    );
};

const Bookings = () => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToUserBookings((data) => {
      setAllBookings(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    return allBookings.reduce((acc, booking) => {
      const bookingDate = booking.scheduledAt.toDate();
      if (bookingDate >= now && booking.status !== 'completed' && booking.status !== 'cancelled') {
        acc.upcoming.push(booking);
      } else {
        acc.past.push(booking);
      }
      return acc;
    }, { upcoming: [] as Booking[], past: [] as Booking[] });
  }, [allBookings]);

  return (
    <div className="animate-fade-in p-6 pb-32 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Mes Réservations</h1>
      </div>

      {isLoading ? (
          <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-primary-500" size={32} />
          </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="space-y-4">
                <h2 className="text-sm font-bold uppercase text-slate-500 tracking-wider">À venir</h2>
                {upcoming.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
            </div>
          )}
          
          {past.length > 0 && (
            <div className="space-y-4 pt-4">
                <h2 className="text-sm font-bold uppercase text-slate-500 tracking-wider">Historique</h2>
                {past.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
            </div>
          )}

          {allBookings.length === 0 && (
             <div className="text-center py-20">
                <p className="text-slate-400">Aucune réservation pour le moment.</p>
                <button className="mt-4 text-primary-400 font-bold">Réserver un service</button>
             </div>
          )}
        </>
      )}
    </div>
  );
};

export default Bookings;
