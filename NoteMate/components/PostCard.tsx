// components/PostCard.tsx

import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Interface cho props, giúp code rõ ràng hơn
interface PostCardProps {
  post: {
    _id: string;
    title: string; // Đảm bảo title là string
    user: {
      _id?: string;
      username: string;
      profileImage?: string;
    };
    content: string;
    imageUrl?: string;
    likes: string[];
    comments: any[];
  };
  onLike: (postId: string) => void;
  onCommentPress: (postId: string) => void;
  currentUserId?: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onCommentPress, currentUserId }) => {
  const router = useRouter();
  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false;
  const isOwner = currentUserId === post.user?._id;

  const showOptions = () => {
    Alert.alert(
      'Tùy chọn',
      'Bạn muốn làm gì với bài viết này?',
      [
        {
          text: 'Sửa bài viết',
          onPress: () => {
            router.push({
              pathname: '/edit-post',
              params: { 
                postId: post._id, 
                title: post.title, 
                content: post.content 
              },
            });
          },
        },
        {
          text: 'Xóa bài viết',
          onPress: () => { /* Logic xóa ở đây */ },
          style: 'destructive',
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Image 
          source={{ uri: post.user?.profileImage || 'https://via.placeholder.com/50' }} 
          style={styles.avatar} 
        />
        <Text style={styles.username}>{post.user?.username}</Text>

        {/* Nút Tùy chọn (3 chấm) chỉ hiển thị cho chủ bài viết */}
        {isOwner && (
          <TouchableOpacity onPress={showOptions} style={styles.optionsButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tiêu đề và nội dung bài đăng */}
      <Text style={styles.title}>{post.title}</Text>
      <Text style={styles.content}>{post.content}</Text>

      {/* Ảnh của bài đăng */}
      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
      )}

      {/* Các nút hành động */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onLike(post._id)}>
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={24} color={isLiked ? '#e91e63' : '#555'} />
          <Text style={styles.actionText}>{post.likes.length}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onCommentPress(post._id)}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#555" />
          <Text style={styles.actionText}>{post.comments.length}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, { marginLeft: 'auto' }]}>
          <Ionicons name="share-social-outline" size={24} color="#555" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
  },
  // --- THÊM STYLE CHO NÚT 3 CHẤM ---
  optionsButton: {
    marginLeft: 'auto', // Đẩy nút về phía cuối
  },
  // --- THÊM STYLE CHO TIÊU ĐỀ ---
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  content: {
    fontSize: 15,
    color: '#444',
    marginBottom: 12,
    lineHeight: 22,
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 6,
    color: '#555',
    fontSize: 14,
  },
});

export default PostCard;
