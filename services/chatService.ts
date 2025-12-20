
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ChatSession, Message, FirestoreTimestamp } from '../types';

export class ChatService {
  
  subscribeToSessions(callback: (sessions: ChatSession[]) => void): () => void {
    const user = auth.currentUser;
    if (!user) return () => {};

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => {
        const data = doc.data();
        const otherParticipantId = data.participants.find((p: string) => p !== user.uid);
        const otherParticipantInfo = (data.participantInfo && data.participantInfo[otherParticipantId]) 
            ? data.participantInfo[otherParticipantId] 
            : { name: 'Prestataire', avatar: '' };

        return {
          id: doc.id,
          providerId: otherParticipantId,
          providerName: otherParticipantInfo.name,
          providerAvatar: otherParticipantInfo.avatar,
          lastMessage: data.lastMessage || "",
          lastMessageTime: (data.lastMessageTimestamp as FirestoreTimestamp)?.toDate() || new Date(),
          unreadCount: (data.unreadCounts && data.unreadCounts[user.uid]) || 0,
          isOnline: false,
        } as ChatSession;
      });
      callback(sessions);
    }, (error) => {
        if (error.code === 'permission-denied') {
            console.warn("[ChatService] Accès aux sessions restreint ou document non créé.");
        } else {
            console.error("[ChatService] Erreur sessions:", error);
        }
        callback([]);
    });

    return unsubscribe;
  }
  
  subscribeToMessages(sessionId: string, callback: (messages: Message[]) => void): () => void {
    const q = query(collection(db, `chats/${sessionId}/messages`), orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as FirestoreTimestamp)?.toDate() || new Date(),
        } as Message;
      });
      callback(messages);
    }, (error) => {
        console.warn(`[ChatService] Erreur messages pour ${sessionId}:`, error.message);
        callback([]);
    });
    return unsubscribe;
  }

  async sendMessage(sessionId: string, text: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("Non authentifié");

    const messagesColRef = collection(db, `chats/${sessionId}/messages`);
    const chatDocRef = doc(db, 'chats', sessionId);
    
    await addDoc(messagesColRef, {
      senderId: user.uid,
      text: text,
      timestamp: serverTimestamp(),
      isRead: false
    });
    
    await updateDoc(chatDocRef, {
      lastMessage: text,
      lastMessageTimestamp: serverTimestamp()
    });
  }
}
