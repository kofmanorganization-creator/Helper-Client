
import React, { useState } from 'react';
import { Star, Camera, Send } from 'lucide-react';

interface ReviewModalProps {
  onSubmit: (rating: number, comment: string) => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md"></div>
        
        <div className="relative w-full max-w-sm bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl animate-fade-in-up">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">Mission Terminée !</h2>
                <p className="text-slate-400 text-sm">Comment s'est passée votre expérience ?</p>
            </div>

            {/* Stars */}
            <div className="flex justify-center space-x-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-transform active:scale-90 focus:outline-none"
                    >
                        <Star 
                            size={32} 
                            className={`transition-colors ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} 
                        />
                    </button>
                ))}
            </div>

            {/* Comment */}
            <div className="space-y-4">
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Laissez un commentaire (optionnel)..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500 resize-none h-24"
                />
                
                <button className="w-full py-3 border border-dashed border-slate-600 rounded-xl text-slate-400 flex items-center justify-center hover:bg-slate-700/30 transition-colors">
                    <Camera size={18} className="mr-2" />
                    Ajouter des photos
                </button>
            </div>

            <button
                onClick={() => onSubmit(rating, comment)}
                disabled={rating === 0}
                className={`w-full mt-6 py-4 rounded-xl font-bold flex items-center justify-center transition-all
                    ${rating > 0 
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600' 
                        : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                `}
            >
                <Send size={18} className="mr-2" />
                Envoyer l'avis
            </button>
        </div>
    </div>
  );
};

export default ReviewModal;
