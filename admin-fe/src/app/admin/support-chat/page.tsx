'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import ConversationList from '../../../components/admin/ConversationList';
import ChatWindow from '../../../components/admin/ChatWindow';
import styles from '../../../styles/chat/support-chat.module.css';
import { Conversation, Message } from '../../../types/chat'; 
import { useAuth } from '@/src/lib/auth-context';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function SupportChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [adminId, setAdminId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
 const {user} = useAuth();

  useEffect(() => {
    const mockAdminId = `${user?.id}`;
    setAdminId(mockAdminId);

    fetchConversations();
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeSocket = () => {
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to socket server');
    });

    socketRef.current.on('new_user_message', ({ conversationId }) => {
      fetchConversations();
    });

    socketRef.current.on('receive_message', (newMessage: Message) => {
      setMessages(prev => [...prev, newMessage]);
    });

    socketRef.current.on('message_history', (history: Message[]) => {
      setMessages(history);
    });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/conversation/support/all`);
      const data = await res.json();
      setConversations(data);
      console.log("setConversations: ", data);
      
      setLoading(false);
    } catch (error) {
      console.error('Fetch conversations error:', error);
      setLoading(false);
    }
  };

  const selectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    setMessages([]);

    if (socketRef.current) {
      socketRef.current.emit('join_conversation', {
        conversationId: conv._id,
        userId: adminId,
        role: 'support'
      });
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !selectedConv || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      conversationId: selectedConv._id,
      senderId: adminId,
      senderRole: 'support',
      content: inputText.trim()
    });

    setInputText('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return <div className={styles.loading}>Đang tải...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Hỗ trợ khách hàng</h1>
        <div className={styles.stats}>
          <span className={styles.statBadge}>
            {conversations?.filter(c => c.status === 'pending').length} chờ xử lý
          </span>
          <span className={styles.statBadge}>
            {conversations?.filter(c => c.status === 'active').length} đang xử lý
          </span>
        </div>
      </div>

      <div className={styles.chatLayout}>
        <ConversationList
          conversations={conversations}
          selectedConvId={selectedConv?._id}
          onSelectConversation={selectConversation}
        />

        <ChatWindow
          conversation={selectedConv}
          messages={messages}
          inputText={inputText}
          onInputChange={setInputText}
          onSendMessage={sendMessage}
          onKeyPress={handleKeyPress}
          adminId={adminId}
        />
      </div>
    </div>
  );
}
