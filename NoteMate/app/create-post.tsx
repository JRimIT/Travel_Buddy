// app/create-post.tsx

import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  Text, 
  Image, 
  ActivityIndicator, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { API_URL } from '../constants/api'; // Đường dẫn có thể cần điều chỉnh
import { useAuthStore } from '../store/authStore'; // Đường dẫn có thể cần điều chỉnh

export default function CreatePostScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  // Hàm chọn ảnh
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  // Hàm xử lý đăng bài
  const handlePost = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in both title and content.');
      return;
    }
    setUploading(true);

    try {
      // Trong thực tế, bạn nên có một endpoint riêng để upload ảnh và nhận về URL.
      // Ở đây, để đơn giản, ta sẽ giả lập URL của ảnh.
      // Bạn cần thay thế logic này bằng việc upload ảnh lên Cloudinary.
      const imageUrl = image ? image.uri : ''; 

      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          content,
          imageUrl, // URL sau khi upload
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create post');
      
      Alert.alert('Success', 'Your travel story has been posted!');
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.headerTitle}>Create New Post</Text>
        
        <TextInput
          placeholder="An awesome title for your trip"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
        
        <TextInput
          placeholder="Share the details of your journey..."
          value={content}
          onChangeText={setContent}
          multiline
          style={[styles.input, styles.contentInput]}
        />

        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image.uri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={40} color="#888" />
              <Text style={styles.imagePickerText}>Add a photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.postButton, uploading && styles.disabledButton]} 
          onPress={handlePost} 
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.postButtonText}>Post Story</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
  },
  contentInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imagePicker: {
    borderRadius: 10,
    backgroundColor: '#f0f2f5',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePickerText: {
    marginTop: 8,
    color: '#555',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  postButton: {
    backgroundColor: '#E91E63',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
