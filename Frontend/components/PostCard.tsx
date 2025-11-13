import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ParsedText from 'react-native-parsed-text';

interface PostCardProps {
  post: {
    _id: string;
    title: string;
    user: {
      _id?: string;
      username: string;
      profileImage?: string;
    };
    content: string;
    imageUrl?: string;
    likes: string[];
    comments: any[];
    commentCount?: number;
  };
  onLike: (postId: string) => void;
  onCommentPress: (postId: string) => void;
  onDelete: (postId: string) => void;
  currentUserId?: string;
  userSavedPosts: string[];
  onSave: (postId: string) => void;
}

// ✅ Hàm tiện ích xử lý avatar
const getAvatarUri = (username?: string, profileImage?: string) => {
  let uri = profileImage;

  // Nếu chưa có ảnh riêng, dùng DiceBear theo username hoặc mặc định
  if (!uri) {
    const seed = username || "default";
    uri = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(seed)}`;
  }

  // DiceBear SVG → PNG cho React Native
  if (uri.includes("/svg?")) {
    uri = uri.replace("/svg?", "/png?");
  }

  return uri;
};

const PostCard: React.FC<PostCardProps> = ({
  post,
  onLike,
  onCommentPress,
  onDelete,
  currentUserId,
  userSavedPosts,
  onSave
}) => {
  const router = useRouter();
  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false;
  const isOwner = currentUserId === post.user?._id;

  const handleHashtagPress = (hashtag: string) => {
    const query = hashtag.substring(1);
    router.push({ pathname: '/search', params: { query } });
  };

  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => onDelete(post._id),
        },
      ]
    );
  };

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
                content: post.content,
              },
            });
          },
        },
        {
          text: 'Xóa bài viết',
          onPress: handleDelete,
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Hãy xem bài viết này từ ${post.user.username}: ${post.title}\n\n${post.content}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const isSaved = userSavedPosts.includes(post._id);

  return (
    <View style={styles.card}>
      {/* Header: Avatar + Username + Tùy chọn */}
      <View style={styles.header}>
        <Image
          source={{ uri: getAvatarUri(post.user?.username, post.user?.profileImage) }}
          style={styles.avatar}
        />
        <Text style={styles.username}>{post.user?.username}</Text>

        {isOwner && (
          <TouchableOpacity onPress={showOptions} style={styles.optionsButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tiêu đề + nội dung */}
      <Text style={styles.title}>{post.title}</Text>
      <ParsedText
        style={styles.content}
        parse={[
          {
            pattern: /#(\w+)/,
            style: styles.hashtag,
            onPress: handleHashtagPress,
          },
        ]}
      >
        {post.content}
      </ParsedText>

      {/* Ảnh trong bài đăng */}
      {post.imageUrl && (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} />
      )}

      {/* Hành động: like, comment, share, save */}
      <View style={styles.actionsContainer}>
        <View style={styles.leftActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onLike(post._id)}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? '#e91e63' : '#555'}
            />
            <Text style={styles.actionText}>{post.likes.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => onCommentPress(post._id)}>
            <Ionicons name="chatbubble-outline" size={24} color="#555" />
            <Text style={styles.actionText}>
              {post.commentCount ?? post.comments?.length ?? 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color="#555" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => onSave(post._id)}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={24} color="#555" />
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
  optionsButton: {
    marginLeft: 'auto',
  },
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
  hashtag: {
    color: '#007AFF',
    fontWeight: '500',
  },
  postImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionText: {
    marginLeft: 6,
    color: '#555',
    fontSize: 14,
  },
});

export default PostCard;
