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

const CommentItem = ({ comment, onReplyPress }) => {
  if (!comment || !comment.user || !comment._id) {
    return null;
  }
  return (
    <View style={styles.commentWrapper}>
      <View style={styles.commentItemContainer}>
        <Image
          source={{ uri: comment.user.profileImage || 'https://via.placeholder.com/40' }}
          style={styles.commentAvatar}
        />
        <View style={styles.commentContent}>
          <View style={styles.commentBubble}>
            <Text style={styles.commentUsername}>{comment.user.username}</Text>
            <Text style={styles.commentText}>{comment.text}</Text>
          </View>
          <TouchableOpacity onPress={() => onReplyPress(comment)} style={styles.replyButtonContainer}>
            <Text style={styles.replyButton}>Trả lời</Text>
          </TouchableOpacity>
        </View>
      </View>
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => {
            if (reply && reply._id) {
              return <CommentItem key={reply._id} comment={reply} onReplyPress={onReplyPress} />;
            }
            return null;
          })}
        </View>
      )}
    </View>
  );
};

// --- COMPONENT COMMENT MODAL ---
// *** SỬA LỖI 1 & 3: Cập nhật định nghĩa props ở đây ***
const CommentModal = ({ visible, onClose, postId, onCommentPosted }: {
    visible: boolean;
    onClose: () => void;
    postId: string | null;
    onCommentPosted: (postId: string, newComment: any, parentId: string | null) => void;
}) => {
    const { token, user } = useAuthStore();
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);

    const fetchComments = useCallback(async () => {
        if (!postId) return;
        console.log("--- TOKEN USED FOR GET ---", token);
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
            const data = await response.json();
            
            console.log("--- DATA FROM SERVER (GET) ---", JSON.stringify(data, null, 2)); // <--- THÊM DÒNG NÀY

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
        } else {
            setReplyingTo(null);
            setNewComment('');
        }
    }, [visible, fetchComments]); // <--- Thêm fetchComments vào đây


    const handlePostComment = async () => {
        if (!newComment.trim() || !postId) return;
        setIsPosting(true);
        
        const body = {
            text: newComment,
            parentId: replyingTo ? replyingTo._id : null,
        };

        try {
            const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            const postedComment = await response.json();
            console.log("--- SERVER RESPONSE (POST) ---", JSON.stringify(postedComment, null, 2)); // <--- THÊM DÒNG NÀY

            if (!response.ok) {
                throw new Error(postedComment.message || '[translate:Không thể đăng bình luận]');
            }

            // *** Chuyển hàm đệ quy ra ngoài, không cần nó ở đây nữa ***
            const addReplyRecursivelyLocal = (list, parentId, newReply) => {
                return list.map(c => {
                    if (c._id === parentId) return { ...c, replies: [...(c.replies || []), newReply] };
                    if (c.replies) return { ...c, replies: addReplyRecursivelyLocal(c.replies, parentId, newReply) };
                    return c;
                });
            };
            
            if (replyingTo) {
                setComments(current => addReplyRecursivelyLocal(current, replyingTo._id, postedComment));
            } else {
                setComments(current => [postedComment, ...current]);
            }
            
            // *** Gửi dữ liệu lên component cha, giờ sẽ không còn lỗi ***
            onCommentPosted(postId, postedComment, replyingTo ? replyingTo._id : null);

            setNewComment('');
            setReplyingTo(null);
        } catch (error) {
            Alert.alert('[translate:Lỗi]', error.message);
        } finally {
            setIsPosting(false);
        }
    };

    const handleReplyPress = (comment) => {
        setReplyingTo(comment);
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
                <View style={styles.modalContainer}>
                    <View style={styles.handle} />
                    <Text style={styles.headerTitle}>[translate:Bình luận]</Text>
                    {replyingTo && (
                        <View style={styles.replyingContainer}>
                            <Text style={styles.replyingText}>
                                Đang trả lời @{replyingTo.user?.username || 'user'}
                            </Text>
                            <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                <Ionicons name="close-circle" size={20} color="#888" />
                            </TouchableOpacity>
                        </View>
                    )}
                    {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
                        <FlatList
                            data={comments}
                            renderItem={({ item }) => <CommentItem comment={item} onReplyPress={handleReplyPress} />}
                            keyExtractor={(item) => item._id.toString()}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={<Text style={styles.emptyText}>[translate:Chưa có bình luận nào]</Text>}
                        />
                    )}
                    <View style={styles.inputContainer}>
                        <Image source={{ uri: user?.profileImage || 'https://via.placeholder.com/40' }} style={styles.inputAvatar} />
                        <TextInput
                            style={styles.commentInput} // Dùng style đã tối ưu
                            placeholder={replyingTo ? `[translate:Trả lời] @${replyingTo.user?.username || 'user'}...` : "[translate:Viết bình luận...]"}
                            placeholderTextColor="#8e8e8e"
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                        />
                        <TouchableOpacity onPress={handlePostComment} disabled={isPosting}>
                            {isPosting ? <ActivityIndicator size="small" /> : <Text style={styles.postButton}>[translate:Đăng]</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

// --- COMPONENT FEEDSCREEN CHÍNH ---
export default function FeedScreen() {
  const { token, user, setUser } = useAuthStore();
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
    if (debouncedSearchQuery) {
        handleSearch(debouncedSearchQuery);
    } else {
        setSearchResults([]); // Xóa kết quả tìm kiếm khi ô search trống
    }
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
  const addReplyRecursively = (commentsList: any[], parentId: string, newReply: any): any[] => {
      return commentsList.map(comment => {
          if (comment._id === parentId) {
              return {
                  ...comment,
                  replies: [...(comment.replies || []), newReply]
              };
          }
          if (comment.replies && comment.replies.length > 0) {
              const updatedReplies = addReplyRecursively(comment.replies, parentId, newReply);
              return {
                  ...comment,
                  replies: updatedReplies
              };
          }
          return comment;
      });
  };

  const onCommentPosted = (postId: string, newComment: any, parentId: string | null) => {
    setPosts(currentPosts =>
        currentPosts.map(post => {
            if (post._id === postId) {
                const existingComments = post.comments || [];
                const updatedComments = parentId
                    ? addReplyRecursively(existingComments, parentId, newComment)
                    : [newComment, ...existingComments];
                
                return { ...post, comments: updatedComments };
            }
            return post;
        })
    );
  };

  const handleDeletePost = async (postId: string) => {
    Alert.alert(
        "Xác nhận xóa",
        "Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác", // Nội dung
        [
            {
                text: "Hủy",
                style: "cancel",
            },
            {
                text: "Xóa",
                style: "destructive",
                onPress: async () => {
                    try {
                        const response = await fetch(`${API_URL}/posts/${postId}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                            },
                        });
                        if (!response.ok) {
                            throw new Error("Không thể xóa bài viết. Vui lòng thử lại");
                        }
                        setPosts(prevPosts => prevPosts.filter(p => p._id !== postId));
                        setSearchResults(prevResults => prevResults.filter(p => p._id !== postId));

                    } catch (error) {
                        Alert.alert("[translate:Lỗi]", error.message);
                    }
                },
            },
        ]
    );
};
  
  const displayedPosts = searchQuery.trim().length > 0 ? searchResults : posts;
  const showNoResults = searchQuery.trim().length > 0 && !isSearching && displayedPosts.length === 0;
  const handleSavePost = async (postId: string) => {
    if (!user) {
        Alert.alert('Lỗi', 'Bạn cần đăng nhập để thực hiện hành động này.');
        return;
    }
    const savedPosts = user.savedPosts || [];
    const isCurrentlySaved = savedPosts.includes(postId);
    const updatedSavedPosts = isCurrentlySaved
        ? savedPosts.filter(id => id !== postId)
        : [...savedPosts, postId];
    
    setUser({ ...user, savedPosts: updatedSavedPosts });
    try {
        await fetch(`${API_URL}/posts/${postId}/save`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });
    } catch (error) {
        console.error("Failed to save post:", error);
        setUser({ ...user, savedPosts: savedPosts });
        Alert.alert('Lỗi', 'Không thể hoàn tất thao tác. Vui lòng thử lại.');
    }
};

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
                        userSavedPosts={user?.savedPosts || []}
                        onSave={handleSavePost}
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
    container: { flex: 1, backgroundColor: '#fff' }, // Đổi nền thành trắng cho sạch sẽ
    searchContainer: {
        backgroundColor: '#f0f2f5', // Màu nền xám nhẹ
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 16,
        marginTop: 10,
        borderRadius: 25, // Bo tròn nhiều hơn
        flexDirection: 'row',
        alignItems: 'center',
    },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 16, color: '#111' },
    fab: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E91E63', // Giữ màu hồng đặc trưng
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },

    // --- Styles cho Comment Modal ---
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        maxHeight: '85%', // Chiều cao tối đa 85% màn hình
    },
    handle: { width: 40, height: 5, borderRadius: 2.5, backgroundColor: '#DCDCDC', alignSelf: 'center', marginBottom: 10 },
    headerTitle: { color: '#111', fontSize: 18, fontWeight: 'bold', textAlign: 'center', paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EFEFEF' },
    listContent: { paddingHorizontal: 16, paddingBottom: 20 },
    emptyText: { color: '#888', textAlign: 'center', marginTop: 50, fontSize: 16 },

    // --- Styles cho từng Comment Item (Cải tiến lớn) ---
    commentWrapper: {
        // Không cần style ở đây, để commentItemContainer xử lý
    },
    commentItemContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginVertical: 10, // Tăng khoảng cách dọc
    },
    commentAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        marginRight: 12,
    },
    commentContent: {
        flex: 1,
        alignItems: 'flex-start', // Quan trọng: Căn các phần tử con sang trái
    },
    commentBubble: {
        backgroundColor: '#f0f2f5', // Màu xám nhạt như Facebook/Instagram
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingVertical: 10,
        // *** FIX QUAN TRỌNG: Để bong bóng co lại theo nội dung ***
        alignSelf: 'flex-start',
        // *** Giới hạn chiều rộng để không bị quá dài ***
        maxWidth: '95%',
    },
    commentUsername: {
        fontWeight: 'bold',
        color: '#111',
        fontSize: 14,
        marginBottom: 2,
    },
    commentText: {
        color: '#111',
        fontSize: 15, // Tăng cỡ chữ cho dễ đọc
        lineHeight: 20, // Tăng khoảng cách dòng
    },
    replyButtonContainer: {
        marginLeft: 4, // Đẩy nút "Trả lời" vào gần hơn
        marginTop: 6,
    },
    replyButton: {
        color: '#65676B',
        fontSize: 13,
        fontWeight: '600',
    },

    // --- Styles cho Replies Container (Cải tiến lớn) ---
    repliesContainer: {
        // *** FIX BỐ CỤC QUAN TRỌNG ***
        marginLeft: 19, // = (Avatar width / 2), để đường kẻ bắt đầu từ giữa avatar cha
        paddingLeft: 22, // Khoảng cách từ đường kẻ đến nội dung reply
        borderLeftWidth: 2, // Làm đường kẻ dày hơn một chút
        borderLeftColor: '#E4E6EB', // Màu xám rất nhạt
        marginTop: 8,
    },

    // --- Styles cho vùng nhập liệu (Cải tiến lớn) ---
    inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E4E6EB',
    backgroundColor: '#fff',
  },
    inputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
    commentInput: {
    flex: 1,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
    postButton: {
    color: '#1877F2',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
    marginBottom: 8, // 👈 nâng nút lên nhẹ
  },


    replyingContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#f0f2f5',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ddd',
    },
    replyingText: {
        color: '#65676B',
        fontSize: 14,
    },
});



