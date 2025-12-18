import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Ticket, ChevronDown, ChevronRight, X, Send } from 'lucide-react';
import GlassContainer from '../../components/profile/GlassContainer';
import { profileService } from '../../services/profileService';

interface HelpSupportPageProps {
  onBack: () => void;
}

const HelpSupportPage: React.FC<HelpSupportPageProps> = ({ onBack }) => {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmitTicket = async () => {
    if(!subject || !message) return;
    setSending(true);
    const id = await profileService.createTicket(subject, message);
    setSending(false);
    setIsTicketModalOpen(false);
    alert(`Ticket #${id} créé avec succès. Notre équipe vous répondra sous 24h.`);
    setSubject('');
    setMessage('');
  };

  return (
    <div className="animate-fade-in p-6 pb-32 space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-white">Aide & Support</h1>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassContainer className="p-5 flex flex-col items-center justify-center space-y-3" onClick={() => alert('Le chat live est géré par l\'assistant vocal pour le moment.')}>
          <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
            <MessageCircle size={24} className="text-primary-400" />
          </div>
          <span className="text-white font-bold text-sm">Chat Support</span>
        </GlassContainer>

        <GlassContainer className="p-5 flex flex-col items-center justify-center space-y-3" onClick={() => setIsTicketModalOpen(true)}>
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Ticket size={24} className="text-purple-400" />
          </div>
          <span className="text-white font-bold text-sm">Ouvrir Ticket</span>
        </GlassContainer>
      </div>

      <div>
        <h2 className="text-lg font-bold text-white mb-4">Questions Fréquentes</h2>
        <div className="space-y-3">
          <FaqItem 
            question="Comment annuler une mission ?" 
            answer="Vous pouvez annuler sans frais jusqu'à 1h avant l'heure prévue directement depuis l'onglet Réservations."
          />
          <FaqItem 
            question="Les prestataires sont-ils vérifiés ?" 
            answer="Oui, tous nos Helpers passent un contrôle d'identité rigoureux et une vérification de casier judiciaire."
          />
          <FaqItem 
            question="Comment fonctionne le paiement ?" 
            answer="Le montant est bloqué au moment de la réservation mais n'est versé au prestataire qu'après validation de la mission via QR Code."
          />
        </div>
      </div>

      <div className="pt-6">
        <GlassContainer className="p-5 space-y-2">
          <h3 className="text-white font-bold text-sm">Informations Légales</h3>
          <p className="text-slate-400 text-[10px] leading-relaxed">
            Helper est une filiale de la société Koffmann Group, société spécialisée dans le développement et l'exploitation de solutions informatiques innovantes.<br/><br/>
            RCCM : CI-ABJ-03-2023-B13-02587<br/>
            Siège : Palmeraie, Abidjan, Côte d'Ivoire<br/>
            Dirigeant : M. Paul Koffmann
          </p>
        </GlassContainer>
        <div className="text-center mt-4">
          <p className="text-[10px] text-slate-600">Version 1.2.0 (Build 45)</p>
        </div>
      </div>

      {/* Ticket Modal */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsTicketModalOpen(false)}></div>
            <div className="relative w-full max-w-sm bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Nouveau Ticket</h3>
                    <button onClick={() => setIsTicketModalOpen(false)}><X className="text-slate-400" /></button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Sujet</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-primary-500 outline-none"
                            placeholder="Ex: Problème de facturation"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-slate-400 block mb-1">Message</label>
                        <textarea 
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white text-sm focus:border-primary-500 outline-none h-32 resize-none"
                            placeholder="Décrivez votre problème..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleSubmitTicket}
                        disabled={sending || !subject || !message}
                        className="w-full py-4 bg-primary-500 hover:bg-primary-600 rounded-xl text-white font-bold flex items-center justify-center disabled:opacity-50"
                    >
                        {sending ? 'Envoi...' : <><Send size={18} className="mr-2" /> Envoyer la demande</>}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <GlassContainer className="px-4 py-3" onClick={() => setIsOpen(!isOpen)}>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-white">{question}</h3>
        {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
      </div>
      {isOpen && (
        <p className="mt-3 text-xs text-slate-400 leading-relaxed border-t border-slate-700/50 pt-2 animate-fade-in">
          {answer}
        </p>
      )}
    </GlassContainer>
  );
};

export default HelpSupportPage;