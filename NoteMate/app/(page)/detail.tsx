import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as React from "react";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import Loader from "../../components/Loader";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import { useFocusEffect } from "@react-navigation/native";
import { debounce, set } from "lodash";
import createDetailStyles from "../../assets/styles/detail.styles";
 // Đảm bảo bạn đã import component này

import { AiVoice } from "../../components/AiComponent/AiVoice";
import COLORS from "../../constants/colors";

const Detail = () => {
  const { colors } = useTheme();
  const styles = createDetailStyles(colors);
  const { id } = useLocalSearchParams();
  const { token } = useAuthStore();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [contentBook, setContentBook] = useState("");
  const [editNote, setEditNote] = useState(true); // Tạm thời đặt cứng nếu chưa có logic khác
  const [bookUserId, setBookUserId] = useState<string | null>(null);
  const [userRequestId, setUserRequestId] = useState<string | null>(null);

  const fetchDataBook = async () => {
    try {
      const response = await axios.get(`${API_URL}/books/detail/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      // console.log("user Book detail response: ", response.data.book.user);
      // console.log("userRequest: ",response.data.userRequest.userId);
      
      setUserRequestId(response.data.userRequest.userId);
      setBookUserId(response.data.book.user);
      setContentBook(response.data.book.content);
      setNote(response.data.book.content);
    } catch (error) {
      console.error("Error fetching book detail:", error);
    }
  };

  const autoSaveNote = debounce(async (content: string) => {
    try {
      await axios.post(`${API_URL}/books/detail`, {
        bookId: id,
        content,
      });
      console.log("Auto saved");
    } catch (error) {
      console.error("Error auto saving note:", error);
    }
  }, 1000);

  useEffect(() => {
    fetchDataBook();
  }, []);

  useEffect(() => {
    if (note !== "") {
      autoSaveNote(note);
    }
  }, [note]);

  useFocusEffect(
    React.useCallback(() => {
      fetchDataBook();
    }, [id])
  );

  // console.log("Content Book user ID: ", );
  

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Need camera roll access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

  

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      const formData = new FormData();
      formData.append("image", {
        uri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);

      try {
        setLoading(true);
        const response = await axios.post(
          "http://10.0.2.2:3000/api/AI/upload",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        const { summary } = response.data;
        setNote((prev) => prev + "\n" + summary);
      } catch (error) {
        console.error("Upload failed:", error);
        Alert.alert("Upload failed");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.buttonSubmit}
              onPress={() => router.back()}
            >
              <Text style={style.headerTitle}>Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Book Note</Text>
          </View>

          <View style={styles.bookCard}>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Enter your text here..."
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
              editable={editNote && bookUserId === userRequestId}
            />
          </View>

          {
            bookUserId !== userRequestId ? (
              <Text style={{ color: COLORS.textSecondary, marginBottom: 10 }}>
                Bạn không có quyền chỉnh sửa ghi chú này.
              </Text>
            ) : (
                    <View style={style.footer}>
                      <TouchableOpacity style={styles.AIbutton} onPress={pickImage}>
                        <Image
                          source={require("../../assets/images/i.png")}
                          style={style.AIicon}
                          />
                        <Text style={style.AIlabel}>NOTE AI</Text>
                      </TouchableOpacity>
                          <AiVoice note={note} setNote={setNote} />

                    </View>
            )
          }

          

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const style = StyleSheet.create({
  
  
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 300,
  },
  bookCard: {
    flex: 100,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    marginBottom: 20,
    padding: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 4, // nhỏ hơn
  backgroundColor: "#FAFAFA",
  paddingVertical: 4, // giảm bớt
  paddingHorizontal: 8, // giảm bớt
  borderRadius: 8, // gọn hơn
  marginBottom: 12, // ngắn hơn
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 1.5,
  elevation: 1,
  borderWidth: 1,
  borderColor: "#e0e0e0",
},
AIbutton: {
  flex: 1,
  backgroundColor: "#FF8A4C",
  borderRadius: 8,
  paddingVertical: 6,
  paddingHorizontal: 4,
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
},
AIicon: {
  width: 22,  // nhỏ hơn
  height: 22, // nhỏ hơn
  resizeMode: "contain",
  tintColor: "#fff",
  marginBottom: 2,
},
AIlabel: {
  fontSize: 10, // nhỏ hơn
  fontWeight: "500",
  color: "#fff",
},

  header: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "JetBrainsMono-Medium",
    letterSpacing: 0.5,
    color: COLORS.white,
    marginBottom: 8,
  },
  buttonSubmit: {
    backgroundColor: "#FF7A20",
    justifyContent: "center",
    alignItems: "center",
    height: 35,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
});

export default Detail;
