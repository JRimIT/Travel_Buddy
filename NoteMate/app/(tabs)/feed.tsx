import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import PostCard from '../../components/PostCard';
import Loader from '../../components/Loader';
import { API_URL } from '../../constants/api';
import { useAuthStore } from '../../store/authStore';

// --- DEBOUNCE HOOK (Để tối ưu search) ---
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// --- COMPONENT COMMENT MODAL ---
// Sửa lỗi cú pháp và khai báo props
const CommentModal = ({ visible, onClose, postId, onCommentPosted }: { visible: boolean; onClose: () => void; postId: string | null; onCommentPosted: (postId: string) => void; }) => {
    const { token, user } = useAuthStore();
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    const fetchComments = useCallback(async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/posts/${postId}/comments`, { headers: { 'Authorization': `Bearer ${token}` } });
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

    // Sửa lỗi: Chỉ giữ lại một hàm handlePostComment
    const handlePostComment = async () => {
        if (!newComment.trim() || !postId) return;
        setIsPosting(true);
        try {
            const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ text: newComment }),
            });
            const postedComment = await response.json();
            if (!response.ok) throw new Error(postedComment.message || 'Không thể đăng bình luận');

            setComments(prev => [...prev, postedComment]);
            setNewComment('');
            onCommentPosted(postId); // Gọi callback để cập nhật UI ở Feed

        } catch (error) {
            Alert.alert('Lỗi', error.message);
        } finally {
            setIsPosting(false);
        }
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.modalContainer}>
                    <View style={styles.handle} />
                    <Text style={styles.headerTitle}>Bình luận</Text>
                    {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
                        <FlatList
                            data={comments}
                            renderItem={({ item }) => (
                                <View style={styles.commentItemContainer}>
                                    <Image source={{ uri: item.user?.profileImage || 'https://via.placeholder.com/40' }} style={styles.commentAvatar} />
                                    <View style={styles.commentContent}><Text style={styles.commentText}><Text style={styles.commentUsername}>{item.user?.username} </Text>{item.text}</Text></View>
                                </View>
                            )}
                            keyExtractor={(item) => item._id}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={<Text style={styles.emptyText}>Chưa có bình luận nào</Text>}
                        />
                    )}
                    <View style={styles.inputContainer}>
                        <Image source={{ uri: user?.profileImage || 'https://via.placeholder.com/40' }} style={styles.inputAvatar} />
                        <TextInput style={styles.input} placeholder="Viết bình luận..." placeholderTextColor="#8e8e8e" value={newComment} onChangeText={setNewComment} multiline />
                        <TouchableOpacity onPress={handlePostComment} disabled={isPosting}>
                            {isPosting ? <ActivityIndicator size="small" /> : <Text style={styles.postButton}>Đăng</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// --- COMPONENT FEEDSCREEN CHÍNH ---
export default function FeedScreen() {
  const { token, user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isCommentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch posts');
      setPosts(data);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Could not load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, []);

  const handleLike = async (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(p => {
        if (p._id === postId) {
          const isLiked = p.likes.includes(user?._id);
          return { ...p, likes: isLiked ? p.likes.filter((id: string) => id !== user?._id) : [...p.likes, user?._id] };
        }
        return p;
      })
    );
    try {
      await fetch(`${API_URL}/posts/${postId}/like`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) {
      console.error('Failed to update like status:', error);
      fetchPosts(); 
    }
  };
  
  const handleSearch = async (query: string) => {
    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
        const response = await fetch(`${API_URL}/posts/search?q=${encodeURIComponent(query)}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Search failed');
        setSearchResults(data);
    } catch (error) {
        Alert.alert('Lỗi tìm kiếm', error instanceof Error ? error.message : 'Đã có lỗi xảy ra');
    } finally {
        setIsSearching(false);
    }
  };

  useEffect(() => {
    handleSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  useFocusEffect(useCallback(() => {
    if (!isCommentModalVisible) {
      fetchPosts();
    }
  }, [isCommentModalVisible]));
  
  // Sửa lỗi: Chỉ giữ lại một hàm handleCommentPress
  const handleCommentPress = (postId: string) => {
    setSelectedPostId(postId);
    setCommentModalVisible(true);
  };

  // Sửa lỗi: Chỉ giữ lại một hàm closeCommentModal
  const closeCommentModal = () => {
    setCommentModalVisible(false);
    setSelectedPostId(null);
  };

  const onCommentPosted = (postId: string) => {
    setPosts(currentPosts =>
      currentPosts.map(post => {
        if (post._id === postId) {
          return { ...post, comments: [...post.comments, {}] };
        }
        return post;
      })
    );
  };

  const handleDeletePost = async (postId: string) => { /* ... giữ nguyên logic xóa ... */ };
  
  const displayedPosts = searchQuery.trim().length > 0 ? searchResults : posts;
  const showNoResults = searchQuery.trim().length > 0 && !isSearching && displayedPosts.length === 0;

  if (loading && !refreshing) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
        <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput style={styles.searchInput} placeholder="Tìm kiếm..." value={searchQuery} onChangeText={setSearchQuery} />
            {isSearching && <ActivityIndicator size="small" />}
        </View>
        {showNoResults ? <Text style={styles.emptyText}>Không tìm thấy kết quả nào.</Text> : (
            <FlatList
                data={displayedPosts}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                    <PostCard 
                        post={item} 
                        onLike={handleLike} 
                        onCommentPress={handleCommentPress}
                        onDelete={handleDeletePost}
                        currentUserId={user?._id} 
                    />
                )}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ padding: 12 }}
                showsVerticalScrollIndicator={false}
            />
        )}
        <Link href="/create-post" asChild>
            <TouchableOpacity style={styles.fab}>
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>
        </Link>
        <CommentModal 
            visible={isCommentModalVisible}
            onClose={closeCommentModal}
            postId={selectedPostId}
            onCommentPosted={onCommentPosted}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  // --- Styles cho FeedScreen ---
  container: { flex: 1, backgroundColor: '#f0f2f5' },
    searchContainer: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', alignItems: 'center' },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16 },
    fab: { position: 'absolute', bottom: 80, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center', zIndex: 1000, elevation: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, maxHeight: '85%' },
    handle: { width: 40, height: 5, borderRadius: 2.5, backgroundColor: '#DCDCDC', alignSelf: 'center', marginBottom: 10 },
    headerTitle: { color: '#111', fontSize: 16, fontWeight: 'bold', textAlign: 'center', paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EFEFEF' },
    listContent: { paddingHorizontal: 16 }, // <-- Style còn thiếu
    emptyText: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 16 },
    commentItemContainer: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 12 },
    commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
    commentContent: { flex: 1 },
    commentText: { color: '#111', fontSize: 14, lineHeight: 20 },
    commentUsername: { fontWeight: 'bold' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#EFEFEF', backgroundColor: '#fff' },
    inputAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
    input: { flex: 1, backgroundColor: '#f0f2f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: Platform.OS === 'ios' ? 12 : 8, minHeight: 44, color: '#111' },
    postButton: { color: '#007AFF', fontWeight: '600', fontSize: 16, marginLeft: 10 },
});


