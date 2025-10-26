import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
  SafeAreaView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import PostCard from '../../components/PostCard'; // <-- Kiểm tra đường dẫn
import Loader from '../../components/Loader'; // <-- Kiểm tra đường dẫn
import { API_URL } from '../../constants/api'; // <-- Kiểm tra đường dẫn
import { useAuthStore } from '../../store/authStore'; // <-- Kiểm tra đường dẫn

const CommentModal = ({ visible, onClose, postId }: { visible: boolean; onClose: () => void; postId: string | null }) => {
  const { token, user } = useAuthStore();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load comments");
      setComments(data);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [postId, token]);

  useEffect(() => {
    if (visible) {
      fetchComments();
    }
  }, [visible, fetchComments]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !postId) return;
    setIsPosting(true);
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newComment }),
      });
      const postedComment = await response.json();
      if (!response.ok) throw new Error(postedComment.message || 'Failed to post comment');
      
      setComments(prevComments => [...prevComments, postedComment]);
      setNewComment('');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : "Could not post comment");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalContainer}>
            <View style={styles.handle} />
            <Text style={styles.headerTitle}>Bình luận</Text>
            
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginTop: 20 }}/>
            ) : (
              <FlatList
                data={comments}
                renderItem={({ item }) => (
                  <View style={styles.commentItemContainer}>
                    <Image source={{ uri: item.user.profileImage || 'https://via.placeholder.com/40' }} style={styles.commentAvatar} />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentText}><Text style={styles.commentUsername}>{item.user.username} </Text>{item.text}</Text>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item._id}
                style={styles.list}
                ListEmptyComponent={<Text style={styles.emptyText}>Chưa có bình luận nào</Text>}
              />
            )}

            <View style={styles.inputContainer}>
                <Image source={{ uri: user?.profileImage || 'https://via.placeholder.com/40' }} style={styles.inputAvatar} />
                <TextInput
                    style={styles.input}
                    placeholder={`Bình luận...`}
                    placeholderTextColor="#A8A8A8"
                    value={newComment}
                    onChangeText={setNewComment}
                />
                <TouchableOpacity onPress={handlePostComment} disabled={isPosting}>
                    {isPosting ? <ActivityIndicator size="small" color="#0A84FF"/> : <Text style={styles.postButton}>Đăng</Text>}
                </TouchableOpacity>
            </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default function FeedScreen() {
  const { token, user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts`, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch posts');
      }
      setPosts(data);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not load feed');
    } finally {
      // Dòng này cực kỳ quan trọng để tắt trạng thái loading
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true); // Hiển thị loader mỗi khi vào tab
      fetchPosts();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
  }, []);

  const handleLike = async (postId: string) => {
    // Cập nhật UI ngay lập tức
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p._id === postId) {
          const isLiked = p.likes.includes(user?._id);
          return {
            ...p,
            likes: isLiked
              ? p.likes.filter((id: string) => id !== user?._id)
              : [...p.likes, user?._id],
          };
        }
        return p;
      })
    );

    // Gửi yêu cầu tới server
    try {
      await fetch(`${API_URL}/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (error) {
      console.error('Failed to update like status:', error);
      // Nếu lỗi, fetch lại để đồng bộ
      fetchPosts(); 
    }
  };

  useFocusEffect(useCallback(() => {
    setLoading(true);
    fetchPosts();
  }, []));

  const handleCommentPress = (postId: string) => {
    setSelectedPostId(postId);
    setCommentModalVisible(true);
  };

  const closeCommentModal = () => {
    setCommentModalVisible(false);
    setSelectedPostId(null);
  };

  if (loading && !refreshing) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <PostCard 
            post={item} 
            onLike={handleLike} 
            onCommentPress={handleCommentPress}
            currentUserId={user?._id} 
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 12 }}
        showsVerticalScrollIndicator={false}
      />
      
      <Link href="/create-post" asChild>
        <TouchableOpacity style={styles.fab}>
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </Link>
      
      <CommentModal 
        visible={isCommentModalVisible}
        onClose={closeCommentModal}
        postId={selectedPostId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Styles cho FeedScreen ---
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 8,
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF', // Nền trắng
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#DCDCDC', // Màu xám nhạt cho tay cầm
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    color: '#111111', // Chữ đen
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFEFEF', // Đường kẻ nhạt
  },
  list: { paddingHorizontal: 16, marginTop: 10 },
  emptyText: {
    color: '#888888',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  commentItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 12,
  },
  commentAvatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    marginRight: 12 
  },
  commentContent: { 
    flex: 1 
  },
  commentText: { 
    color: '#111111', // Chữ đen
    fontSize: 14, 
    lineHeight: 20 
  },
  commentUsername: { 
    fontWeight: 'bold' 
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  inputAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 10 
  },
  input: { 
    flex: 1, 
    color: '#111111', // Chữ đen khi nhập
    fontSize: 14,
    backgroundColor: '#f0f2f5', // Nền xám nhạt cho ô nhập
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  postButton: { 
    color: '#007AFF', // Màu xanh dương cho nút "Đăng"
    fontWeight: '600', 
    fontSize: 16,
    marginLeft: 10,
  },
});


