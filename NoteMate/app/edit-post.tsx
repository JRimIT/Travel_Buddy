// app/edit-post.tsx

import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  Text,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';

import { API_URL } from '../constants/api';
import { useAuthStore } from '../store/authStore';

export default function EditPostScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  // Lấy dữ liệu được truyền từ PostCard
  const { postId, title, content } = useLocalSearchParams<{ postId: string; title: string; content: string }>();

  const [newTitle, setNewTitle] = useState(title || '');
  const [newContent, setNewContent] = useState(content || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveChanges = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Lỗi', 'Tiêu đề và nội dung không được để trống.');
      return;
    }
    setIsSaving(true);

    try {
      const response = await fetch(`${API_URL}/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể cập nhật bài viết.');
      }
      
      Alert.alert('Thành công', 'Bài viết đã được cập nhật.');
      router.back(); // Quay lại trang feed
    } catch (error) {
      Alert.alert('Lỗi', error instanceof Error ? error.message : 'Đã có lỗi xảy ra.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Chỉnh sửa bài viết' }} />
      
      <Text style={styles.label}>Tiêu đề</Text>
      <TextInput
        placeholder="Tiêu đề cho chuyến đi của bạn"
        value={newTitle}
        onChangeText={setNewTitle}
        style={styles.input}
      />
      
      <Text style={styles.label}>Nội dung</Text>
      <TextInput
        placeholder="Chia sẻ chi tiết về hành trình..."
        value={newContent}
        onChangeText={setNewContent}
        multiline
        style={[styles.input, styles.contentInput]}
      />

      <TouchableOpacity 
        style={[styles.saveButton, isSaving && styles.disabledButton]} 
        onPress={handleSaveChanges} 
        disabled={isSaving}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  contentInput: {
    minHeight: 150,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#007AFF', // Màu xanh dương
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
