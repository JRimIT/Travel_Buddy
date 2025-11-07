import React from 'react';
import styles from '../../styles/chat/ConversationList.module.css';
import { Conversation } from '../../types/chat'; // ✅ Import từ types chung

interface Props {
  conversations: Conversation[];
  selectedConvId?: string;
  onSelectConversation: (conv: Conversation) => void;
}

export default function ConversationList({ 
  conversations, 
  selectedConvId, 
  onSelectConversation 
}: Props) {
  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2>Danh sách cuộc hội thoại</h2>
        <span className={styles.count}>{conversations.length}</span>
      </div>

      <div className={styles.conversationList}>
        {conversations.map((conv) => (
          <div
            key={conv._id}
            className={`${styles.convItem} ${
              selectedConvId === conv._id ? styles.active : ''
            }`}
            onClick={() => onSelectConversation(conv)}
          >
            <div className={styles.convAvatar}>
              {conv.user.profileImage ? (
                <img src={conv.user.profileImage} alt={conv.user.username} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {conv.user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className={styles.convContent}>
              <div className={styles.convHeader}>
                <span className={styles.convUsername}>{conv.user.username}</span>
                {conv.unreadCountSupport > 0 && (
                  <span className={styles.unreadBadge}>
                    {conv.unreadCountSupport}
                  </span>
                )}
              </div>
              <div className={styles.convLastMessage}>
                {conv.lastMessage || 'Chưa có tin nhắn'}
              </div>
              <div className={styles.convMeta}>
                <span className={styles.convTime}>
                  {new Date(conv.lastMessageAt).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit'
                  })}
                </span>
                <span className={`${styles.statusBadge} ${styles[conv.status]}`}>
                  {conv.status === 'pending' && 'Chờ'}
                  {conv.status === 'active' && 'Đang xử lý'}
                  {conv.status === 'resolved' && 'Đã xong'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
