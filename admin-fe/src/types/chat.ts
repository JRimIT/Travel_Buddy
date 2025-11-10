// types/chat.ts
export interface User {
  _id: string;
  username: string;
  profileImage?: string;
  email: string;
}

export interface SupportAdmin {
  _id: string;
  username: string;
}

export interface Conversation {
  _id: string;
  user: User;
  supportAdmin?: SupportAdmin;
  lastMessage: string;
  lastMessageAt: string;
  status: 'active' | 'resolved' | 'pending';
  unreadCountSupport: number;
}

export interface MessageSender {
  _id: string;
  username: string;
  profileImage?: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: MessageSender;
  senderRole: 'user' | 'support';
  content: string;
  createdAt: string;
  isRead: boolean;
}
