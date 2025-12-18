
import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, Message } from '../../types';
import { ChatService } from '../../services/chatService';
import { ArrowLeft, Send, MoreVertical, Phone } from 'lucide-react';
import { auth } from '../../lib/firebase';

const chatService = new ChatService();

interface ChatRoomProps {
  session: ChatSession;
  onBack: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ session, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time messages
  useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(session.id, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [session.id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const textToSend = inputText;
    setInputText('');
    setIsSending(true);

    try {
      await chatService.sendMessage(session.id, textToSend);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Optional: Re-set input text to allow user to retry
      setInputText(textToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 absolute inset-0 z-50 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <ArrowLeft size={20} />
          </button>
          
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center text-white font-bold">
              {session.providerName.charAt(0)}
            </div>
            {session.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
            )}
          </div>
          
          <div>
            <h3 className="font-bold text-white text-sm">{session.providerName}</h3>
            <p className="text-xs text-slate-400">{session.isOnline ? 'En ligne' : 'Hors ligne'}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800">
                <Phone size={18} />
            </button>
            <button className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800">
                <MoreVertical size={18} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar pb-24">
        <div className="flex justify-center my-4">
            <span className="text-[10px] text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                Début de la conversation sécurisée
            </span>
        </div>

        {messages.map((msg, idx) => {
          const isMe = msg.senderId === auth.currentUser?.uid;
          const showTime = idx === messages.length - 1 || messages[idx + 1]?.senderId !== msg.senderId;

          return (
            <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <div 
                  className={`
                    px-4 py-3 text-sm shadow-md transition-all
                    ${isMe 
                      ? 'bg-primary-600 text-white rounded-2xl rounded-tr-none' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl rounded-tl-none'
                    }
                  `}
                >
                  {msg.text}
                </div>
                {showTime && (
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    { (msg.timestamp as Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 safe-bottom pb-8">
        <div className="flex items-end space-x-2 bg-slate-800/50 border border-slate-700 rounded-3xl p-2 pl-4 focus-within:border-primary-500/50 focus-within:ring-1 focus-within:ring-primary-500/50 transition-all">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm resize-none focus:outline-none max-h-20 py-3 no-scrollbar"
            rows={1}
            style={{ minHeight: '44px' }}
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim() || isSending}
            className={`
                w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg
                ${!inputText.trim() 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-primary-500 text-white hover:bg-primary-400 active:scale-95'
                }
            `}
          >
            <Send size={18} className={inputText.trim() ? 'ml-0.5' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;