
import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { ChatService } from '../services/chatService';
import { ChatSession } from '../types';
import ChatRoom from '../components/chat/ChatRoom';

const chatService = new ChatService();

const Messages = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = chatService.subscribeToSessions(data => {
      setSessions(data);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredSessions = sessions.filter(s => 
    s.providerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // VIEW: Chat Room
  if (selectedSession) {
    return (
      <ChatRoom 
        session={selectedSession} 
        onBack={() => setSelectedSession(null)} 
      />
    );
  }

  // VIEW: Chat List
  return (
    <div className="animate-fade-in p-6 pb-32 space-y-6">
      <h1 className="text-2xl font-bold text-white">Messages</h1>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher une conversation..." 
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none placeholder-slate-500"
        />
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-primary-500" size={32} />
          </div>
        ) : filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
            <div 
                key={session.id} 
                onClick={() => setSelectedSession(session)}
                className="flex items-center p-4 rounded-2xl hover:bg-slate-800/30 active:bg-slate-800/50 transition-colors cursor-pointer border border-transparent hover:border-slate-700/30 group"
            >
                <div className="relative mr-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 border border-slate-600 flex items-center justify-center text-lg font-bold text-white shadow-lg group-hover:scale-105 transition-transform">
                    {session.providerName.charAt(0)}
                </div>
                {session.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 shadow-sm"></div>
                )}
                </div>
                
                <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">{session.providerName}</h3>
                    <span className="text-xs text-slate-500">
                        {session.lastMessageTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                </div>
                <p className={`text-sm truncate ${session.unreadCount > 0 ? 'text-white font-medium' : 'text-slate-400'}`}>
                    {session.lastMessage}
                </p>
                </div>

                {session.unreadCount > 0 && (
                <div className="ml-3 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-primary-500/30">
                    {session.unreadCount}
                </div>
                )}
            </div>
            ))
        ) : (
            <div className="text-center py-10 text-slate-500">
                <p>Aucune conversation pour le moment.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
