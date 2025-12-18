
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
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ChatSession, Message, FirestoreTimestamp } from '../types';

export class ChatService {
  
  /**
   * Subscribes to the chat sessions for the current user.
   */
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
        const otherParticipantInfo = data.participantInfo[otherParticipantId] || { name: 'Prestataire', avatar: '' };

        return {
          id: doc.id,
          providerId: otherParticipantId,
          providerName: otherParticipantInfo.name,
          providerAvatar: otherParticipantInfo.avatar,
          lastMessage: data.lastMessage,
          lastMessageTime: (data.lastMessageTimestamp as FirestoreTimestamp)?.toDate() || new Date(),
          unreadCount: data.unreadCounts?.[user.uid] || 0,
          isOnline: false, // Presence is complex and better handled server-side
        } as ChatSession;
      });
      callback(sessions);
    }, (error) => {
        console.error("Error subscribing to chat sessions:", error);
        callback([]);
    });

    return unsubscribe;
  }
  
  /**
   * Subscribes to messages within a specific chat session.
   */
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
        console.error(`Error subscribing to messages for session ${sessionId}:`, error);
        callback([]);
    });
    return unsubscribe;
  }

  /**
   * Sends a message and updates the chat session summary.
   */
  async sendMessage(sessionId: string, text: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("Not authenticated");

    const messagesColRef = collection(db, `chats/${sessionId}/messages`);
    const chatDocRef = doc(db, 'chats', sessionId);
    
    // Add new message
    await addDoc(messagesColRef, {
      senderId: user.uid,
      text: text,
      timestamp: serverTimestamp(),
      isRead: false
    });
    
    // Update the parent chat document for sorting and preview
    await updateDoc(chatDocRef, {
      lastMessage: text,
      lastMessageTimestamp: serverTimestamp(),
      // In a real app, a Cloud Function would increment the unread count for the other participant
    });
  }
}
