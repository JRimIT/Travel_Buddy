import React, { useEffect, useRef } from 'react';
import styles from '../../styles/chat/ChatWindow.module.css';
import { Conversation, Message } from '../../types/chat'; // ✅ Import từ types chung

interface Props {
  conversation: Conversation | null;
  messages: Message[];
  inputText: string;
  onInputChange: (text: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  adminId: string;
}

export default function ChatWindow({
  conversation,
  messages,
  inputText,
  onInputChange,
  onSendMessage,
  onKeyPress,
  adminId
}: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!conversation) {
    return (
      <div className={styles.noSelection}>
        <div className={styles.noSelectionContent}>
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#d1d5db" strokeWidth="2"/>
          </svg>
          <h3>Chọn cuộc hội thoại</h3>
          <p>Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      <div className={styles.chatHeader}>
        <div className={styles.headerInfo}>
          <h3>{conversation.user.username}</h3>
          <p>{conversation.user.email}</p>
        </div>
        <span className={`${styles.statusBadge} ${styles[conversation.status]}`}>
          {conversation.status === 'pending' && 'Chờ xử lý'}
          {conversation.status === 'active' && 'Đang xử lý'}
          {conversation.status === 'resolved' && 'Đã giải quyết'}
        </span>
      </div>

      <div className={styles.messagesArea}>
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`${styles.message} ${
              msg.senderRole === 'support' ? styles.myMessage : styles.userMessage
            }`}
          >
            <div className={styles.messageContent}>
              <div className={styles.messageSender}>
                {msg.sender.username}
              </div>
              <div className={styles.messageText}>{msg.content}</div>
              <div className={styles.messageTime}>
                {new Date(msg.createdAt).toLocaleString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputArea}>
        <textarea
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder="Nhập tin nhắn..."
          className={styles.input}
          rows={1}
        />
        <button onClick={onSendMessage} className={styles.sendBtn} disabled={!inputText.trim()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
