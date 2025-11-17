import React, { useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Share,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ParsedText from 'react-native-parsed-text';
import { API_URL } from '../constants/api';
import { useAuthStore } from '../store/authStore';

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
    status?: 'public' | 'private';
  };
  onLike: (postId: string) => void;
  onCommentPress: (postId: string) => void;
  onDelete: (postId: string) => void;
  currentUserId?: string;
  userSavedPosts: string[];
  onSave: (postId: string) => void;
  onStatusChange?: (postId: string, newStatus: 'public' | 'private') => void;
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
  onSave,
  onStatusChange
}) => {
  const router = useRouter();
  const { token } = useAuthStore();
  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false;
  const isOwner = currentUserId === post.user?._id;

  // === SHARE MODAL STATE ===
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareQuery, setShareQuery] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareResults, setShareResults] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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

  const handleStatusChange = async (newStatus: 'public' | 'private') => {
    if (!token) {
      Alert.alert('Lỗi', 'Bạn cần đăng nhập để thực hiện hành động này.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/posts/${post._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Không thể cập nhật status');
      }

      Alert.alert('Thành công', `Đã chuyển bài viết sang ${newStatus === 'public' ? 'công khai' : 'riêng tư'}.`);
      if (onStatusChange) {
        onStatusChange(post._id, newStatus);
      }
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật status');
    }
  };

  const showStatusOptions = () => {
    const currentStatus = post.status || 'public';
    Alert.alert(
      'Thay đổi quyền riêng tư',
      `Bài viết hiện tại: ${currentStatus === 'public' ? 'Công khai' : 'Riêng tư'}`,
      [
        {
          text: currentStatus === 'public' ? 'Chuyển sang riêng tư' : 'Chuyển sang công khai',
          onPress: () => handleStatusChange(currentStatus === 'public' ? 'private' : 'public'),
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ],
      { cancelable: true }
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
          text: `Quyền riêng tư (${post.status === 'private' ? 'Riêng tư' : 'Công khai'})`,
          onPress: showStatusOptions,
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

  // === SHARE FUNCTIONS ===
  const openShareModal = () => {
    if (!token) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để chia sẻ bài viết.");
      return;
    }
    setShareModalVisible(true);
    setShareQuery("");
    setShareResults([]);
    setSelectedUserId(null);
  };

  const closeShareModal = () => {
    setShareModalVisible(false);
    setShareQuery("");
    setShareResults([]);
    setSelectedUserId(null);
  };

  const searchShareUsers = async (q: string) => {
    setShareQuery(q);
    setSelectedUserId(null);
    if (!token || q.trim().length < 2) {
      setShareResults([]);
      return;
    }
    try {
      setShareLoading(true);
      const res = await fetch(
        `${API_URL}/profile/search-users?query=${encodeURIComponent(
          q.trim()
        )}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const json = await res.json();
      if (Array.isArray(json)) {
        setShareResults(json);
      } else {
        setShareResults([]);
      }
    } catch (e) {
      console.log("Search users error:", e);
    } finally {
      setShareLoading(false);
    }
  };

  const handleSharePostInternal = async () => {
    if (!selectedUserId) {
      Alert.alert("Lỗi", "Vui lòng chọn người nhận.");
      return;
    }
    if (!token) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để chia sẻ bài viết.");
      return;
    }
    setShareLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/posts/${post._id}/share`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ toUserId: selectedUserId }),
        }
      );
      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || "Không thể chia sẻ bài viết");
      }
      Alert.alert("Thành công", "Đã gửi lời mời chia sẻ bài viết.");
      closeShareModal();
    } catch (error: any) {
      Alert.alert("Lỗi", error.message || "Không thể chia sẻ bài viết.");
    } finally {
      setShareLoading(false);
    }
  };

  const handleShareExternal = async () => {
    try {
      await Share.share({
        message: `Hãy xem bài viết này từ ${post.user.username}: ${post.title}\n\n${post.content}`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  const handleShare = () => {
    Alert.alert(
      'Chia sẻ bài viết',
      'Bạn muốn chia sẻ như thế nào?',
      [
        {
          text: 'Chia sẻ trong app',
          onPress: openShareModal,
        },
        {
          text: 'Chia sẻ ra ngoài',
          onPress: handleShareExternal,
        },
        {
          text: 'Hủy',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const isSaved = userSavedPosts.includes(post._id);

  return (
    <View style={styles.card}>
      {/* Header: Avatar + Username + Status badge + Tùy chọn */}
      <View style={styles.header}>
        <Image
          source={{ uri: getAvatarUri(post.user?.username, post.user?.profileImage) }}
          style={styles.avatar}
        />
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.username}>{post.user?.username}</Text>
          {isOwner && post.status === 'private' && (
            <View style={{ marginLeft: 8, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="lock-closed" size={14} color="#888" />
              <Text style={{ marginLeft: 4, fontSize: 12, color: '#888' }}>Riêng tư</Text>
            </View>
          )}
        </View>

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
      {post.imageUrl && post.imageUrl.trim() !== '' && (post.imageUrl.startsWith('http://') || post.imageUrl.startsWith('https://')) ? (
        <Image 
          source={{ uri: post.imageUrl }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : null}

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

        {!isOwner && (
          <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => onSave(post._id)}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={24} color="#555" />
          </TouchableOpacity>
        )}
      </View>

      {/* Share Modal */}
      <Modal
        visible={shareModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeShareModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 20,
              width: "90%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#333",
                marginBottom: 12,
              }}
            >
              Chia sẻ cho bạn
            </Text>
            <Text style={{ color: "#666", marginBottom: 8 }}>
              Tìm kiếm người nhận:
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                color: "#333",
              }}
              placeholder="Nhập tên hoặc email..."
              placeholderTextColor="#999"
              autoCapitalize="none"
              value={shareQuery}
              onChangeText={searchShareUsers}
            />

            {shareLoading && (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator size="small" color="#007AFF" />
              </View>
            )}

            {shareResults.length > 0 && (
              <View
                style={{
                  maxHeight: 220,
                  borderWidth: 1,
                  borderColor: "#ddd",
                  borderRadius: 8,
                  marginBottom: 12,
                  overflow: "hidden",
                }}
              >
                <FlatList
                  data={shareResults}
                  keyExtractor={(u) => u._id}
                  renderItem={({ item }) => {
                    const selected = selectedUserId === item._id;
                    return (
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 10,
                          paddingVertical: 8,
                          backgroundColor: selected ? "#e3f2ff" : "#fff",
                        }}
                        onPress={() =>
                          setSelectedUserId(
                            selected ? null : (item._id as string)
                          )
                        }
                      >
                        <Image
                          source={{
                            uri: getAvatarUri(item.username, item.profileImage),
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            marginRight: 8,
                          }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: "#333",
                              fontWeight: "500",
                            }}
                          >
                            {item.username}
                          </Text>
                          {item.email && (
                            <Text
                              style={{
                                color: "#666",
                                fontSize: 12,
                              }}
                            >
                              {item.email}
                            </Text>
                          )}
                        </View>
                        {selected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#007AFF"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            )}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
              }}
            >
              <TouchableOpacity
                onPress={closeShareModal}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  backgroundColor: "#eee",
                }}
                disabled={shareLoading}
              >
                <Text style={{ color: "#333", fontWeight: "600" }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSharePostInternal}
                disabled={shareLoading || !selectedUserId}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  backgroundColor: selectedUserId ? "#007AFF" : "#ccc",
                  opacity: shareLoading ? 0.7 : 1,
                }}
              >
                {shareLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Gửi
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
