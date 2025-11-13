import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore'; // <-- Điều chỉnh đường dẫn nếu cần
import { API_URL } from '../constants/api'; // <-- Điều chỉnh đường dẫn nếu cần

// Component cho mỗi bình luận, có nút like riêng
const CommentItem = ({ comment }: { comment: any }) => (
  <View style={styles.commentItemContainer}>
    <Image source={{ uri: comment.user.profileImage || 'https://via.placeholder.com/40' }} style={styles.commentAvatar} />
    <View style={styles.commentContent}>
      <Text style={styles.commentText}>
        <Text style={styles.commentUsername}>{comment.user.username} </Text>
        {comment.text}
      </Text>
      <Text style={styles.commentTimestamp}>3 ngày</Text>
    </View>
    <TouchableOpacity style={styles.likeButton}>
      <Ionicons name="heart-outline" size={16} color="#A8A8A8" />
    </TouchableOpacity>
  </View>
);


export default function CommentsScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { token, user } = useAuthStore();
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
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
    fetchComments();
  }, [fetchComments]);

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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={10}
      >
        <View style={styles.modalContainer}>
          <View style={styles.handle} />
          <Text style={styles.headerTitle}>Bình luận</Text>
          
          {loading ? (
            <ActivityIndicator color="#fff" style={{ marginTop: 20 }}/>
          ) : (
            <FlatList
              data={comments}
              renderItem={({ item }) => <CommentItem comment={item} />}
              keyExtractor={(item) => item._id}
              style={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Chưa có bình luận nào</Text>
              }
            />
          )}

          <View style={styles.inputContainer}>
            <Image source={{ uri: user?.profileImage || 'https://via.placeholder.com/40' }} style={styles.inputAvatar} />
            <TextInput
              style={styles.input}
              placeholder={`Bình luận với tư cách ${user?.username || 'bạn'}...`}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  container: { flex: 1, justifyContent: 'flex-end' },
  modalContainer: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#555',
    alignSelf: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#3A3A3C',
  },
  list: { paddingHorizontal: 16, marginTop: 10 },
  emptyText: {
    color: '#A8A8A8',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  commentItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 12,
  },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  commentContent: { flex: 1 },
  commentText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  commentUsername: { fontWeight: 'bold' },
  commentTimestamp: { color: '#A8A8A8', fontSize: 12, marginTop: 4 },
  likeButton: { paddingLeft: 16, paddingTop: 4 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3A3A3C',
  },
  inputAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  postButton: {
    color: '#0A84FF',
    fontWeight: '600',
    fontSize: 16,
  },
});
