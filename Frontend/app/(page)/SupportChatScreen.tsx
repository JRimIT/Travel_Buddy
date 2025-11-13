import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import io from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import { API_URL } from '../../constants/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRoute } from '@react-navigation/native';

const SOCKET_URL = 'http://10.0.2.2:3000'; 

const SupportChatScreen = () => {
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);
  const route = useRoute<any>();
  const { initialMessage } = route.params || {};

  useEffect(() => {
    initializeChat();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
  if (initialMessage && conversation && socketRef.current && messages.length === 0) {
  
    socketRef.current.emit('send_message', {
      conversationId: conversation._id,
      senderId: user._id,
      senderRole: 'user',
      content: initialMessage
    });
  }
  
}, [conversation, initialMessage, messages]);

  const initializeChat = async () => {
    try {
    
      const res = await fetch(`${API_URL}/conversation/user/${user._id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const conv = await res.json();
      setConversation(conv);
      
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      socketRef.current.on('connect', () => {
        socketRef.current.emit('join_conversation', {
          conversationId: conv._id,
          userId: user._id,
          role: 'user',
        });
      });
      socketRef.current.on('connect_error', (e) => setLoading(false));
      socketRef.current.on('disconnect', () => {});
      socketRef.current.on('message_history', (history) => {
        setMessages(history);
        setLoading(false);
        setTimeout(() => flatListRef.current?.scrollToEnd({animated:true}), 400);
      });
      socketRef.current.on('receive_message', (newMessage) => {
        setMessages((prev) => {
          if (prev.find(m => m._id === newMessage._id)) return prev; 
          return [...prev, newMessage];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({animated:true}), 250);
      });

      socketRef.current.on('user_typing', ({ isTyping }) => setIsTyping(isTyping));
    } catch (error) {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!inputText.trim() || !conversation) return;
    socketRef.current.emit('send_message', {
      conversationId: conversation._id,
      senderId: user._id,
      senderRole: 'user',
      content: inputText.trim(),
    });
    setInputText('');
  };

  const handleTyping = (text) => {
    setInputText(text);
    if (socketRef.current && conversation) {
      socketRef.current.emit('typing', {
        conversationId: conversation._id,
        userId: user._id,
        isTyping: text.length > 0,
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3488fa" />
        <Text style={{ marginTop: 10, color: '#666', fontSize:16 }}>Đang kết nối...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 65 : 24}
    >
      <View style={styles.header}>
        <Ionicons name="chatbubbles" size={28} color="#fff" style={{marginRight:8}}/>
        <Text style={styles.headerTitle}>Hỗ trợ khách hàng</Text>
        <Text numberOfLines={1} style={styles.headerSubtitle}>
          {conversation?.supportAdmin
            ? `Đang chat với ${conversation.supportAdmin.username}`
            : 'Chờ hỗ trợ viên...'}
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => {
          const isMyMessage = item.sender._id === user._id;
          return (
            <View style={[styles.messageRow, isMyMessage ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>    
              {!isMyMessage && (
                <Image
                  source={{ uri: item.sender.profileImage || undefined }}
                  style={styles.avatar}
                />
              )}
              <View style={[
                styles.messageBubble,
                isMyMessage ? styles.myMessage : styles.supportMessage
              ]}>
                <Text style={[styles.senderName, isMyMessage && { color: '#fff' }]}>  
                  {isMyMessage ? 'Bạn' : (item.sender.username || 'Support')}
                </Text>
                <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
                  {item.content}
                </Text>
                <Text style={styles.timestamp}>
                  {new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </Text>
              </View>
              {isMyMessage && (
                <Image
                  source={{ uri: user.profileImage || undefined }}
                  style={styles.avatar}
                />
              )}
            </View>
          );
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated:true})}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có tin nhắn. Hãy gửi tin đầu tiên!</Text>
          </View>
        }
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Support đang nhập...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={handleTyping}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#aaa"
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={styles.sendButton}
          activeOpacity={0.83}
          disabled={!inputText.trim()}
        >
          <Ionicons
            name="send"
            size={22}
            color={inputText.trim() ? '#fff' : '#b8cbff'}
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff3fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eff3fa',
  },
  header: {
    backgroundColor: '#3488fa',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 45 : 26,
    alignItems: 'center',
    flexDirection: 'row',
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    shadowColor: '#3488fa',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.23,
    shadowRadius: 15,
    elevation: 7,
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
    letterSpacing: 0.7,
  },
  headerSubtitle: {
    color: '#e6f3ff',
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 2,
    flex:1,
  },
  messagesList: {
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 18,
    alignItems: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 7,
    backgroundColor: '#dde6f3',
    borderWidth: 1.2,
    borderColor: '#c4ddff',
  },
  messageBubble: {
    maxWidth: '78%',
    borderRadius: 15,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 3,
    shadowColor: '#111',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2.3,
    elevation: 1,
  },
  myMessage: {
    backgroundColor: '#3a70ec',
    marginLeft: 'auto',
    borderTopRightRadius: 3,
  },
  supportMessage: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 3,
  },
  senderName: {
    fontWeight: 'bold',
    color: '#1b5eff',
    fontSize: 12,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 15,
    color: '#283454',
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 11,
    color: '#b0b8c3',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    paddingLeft: 16,
    marginTop: 10,
  },
  typingText: {
    fontSize: 13,
    color: '#3488fa',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f6fbff',
    borderTopWidth: 1,
    borderColor: '#e3eefa',
    paddingHorizontal: 14,
    paddingTop: 13,
    paddingBottom: Platform.OS === 'ios' ? 25 : 13,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 16,
    color: '#242e44',
    borderWidth: 1,
    borderColor: '#ddeaf8',
    marginRight: 10,
    shadowColor: '#c4deff',
    shadowOpacity: 0.07,
    shadowRadius: 1.1,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3a70ec',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#379CFA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyContainer: {
    padding: 28,
    alignItems: 'center',
  },
  emptyText: {
    color: '#a9b6c7',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SupportChatScreen;
