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
  Alert,
} from "react-native";
import * as React from "react";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import Loader from "../../components/Loader";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import { useFocusEffect } from "@react-navigation/native";
import { debounce } from "lodash";
import createDetailStyles from "../../assets/styles/detail.styles";
import { AiVoice } from "../../components/AiComponent/AiVoice";
import COLORS from "../../constants/colors";
import apiClient from "../../utils/apiClient"; // axios client có interceptor

const Detail = () => {
  const { colors } = useTheme();
  const styles = createDetailStyles(colors);
  const { id } = useLocalSearchParams();
  const { token } = useAuthStore();

  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [contentBook, setContentBook] = useState("");
  const [editNote, setEditNote] = useState(true);
  const [bookUserId, setBookUserId] = useState<string | null>(null);
  const [userRequestId, setUserRequestId] = useState<string | null>(null);

  //  Lấy dữ liệu chi tiết sách
  const fetchDataBook = async () => {
    try {
      const response = await apiClient.get(`/books/detail/${id}`);
      setUserRequestId(response.data.userRequest.userId);
      setBookUserId(response.data.book.user);
      setContentBook(response.data.book.content);
      setNote(response.data.book.content ?? "");
    } catch (error) {
      console.error(" Error fetching book detail:", error);
    }
  };

  //  Auto save note (debounce)
  const autoSaveNote = debounce(async (content: string) => {
    if (!token) return;
    try {
      await apiClient.post(`/books/detail`, {
        bookId: id,
        content,
      });
      console.log(" Auto saved");
    } catch (error) {
      console.error(" Error auto saving note:", error);
    }
  }, 1000);

  useEffect(() => {
    fetchDataBook();
  }, []);

  useEffect(() => {
  if (note && note.trim() !== "") {
    autoSaveNote(note);
  }
}, [note]);


  useFocusEffect(
    React.useCallback(() => {
      fetchDataBook();
    }, [id])
  );

  //  Pick Image & Upload
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
        const response = await apiClient.post(`/AI/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const { summary } = response.data;
        setNote((prev) => prev + "\n" + summary);
      } catch (error) {
        console.error(" Upload failed:", error);
        Alert.alert("Upload failed");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return <Loader />;
  }

  const isOwner = bookUserId === userRequestId;

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
          {/* Header */}
          <View style={localStyles.header}>
            <TouchableOpacity
              style={localStyles.buttonSubmit}
              onPress={() => router.back()}
            >
              <Text style={localStyles.headerButtonText}>Back</Text>
            </TouchableOpacity>
            <Text style={localStyles.headerTitle}>Book Note</Text>
          </View>

          {/* Note Card */}
          <View style={localStyles.bookCard}>
            <TextInput
              style={localStyles.input}
              multiline
              placeholder="Enter your text here..."
              textAlignVertical="top"
              value={note}
              onChangeText={setNote}
              editable={editNote && isOwner}
            />
          </View>

          {!isOwner ? (
            <Text style={{ color: COLORS.textSecondary, marginBottom: 10 }}>
              Bạn không có quyền chỉnh sửa ghi chú này.
            </Text>
          ) : (
            <View style={localStyles.footer}>
              <TouchableOpacity style={localStyles.AIbutton} onPress={pickImage}>
                <Image
                  source={require("../../assets/images/i.png")}
                  style={localStyles.AIicon}
                />
                <Text style={localStyles.AIlabel}>NOTE AI</Text>
              </TouchableOpacity>
              <AiVoice note={note} setNote={setNote} />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const localStyles = StyleSheet.create({
  header: {
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: "JetBrainsMono-Medium",
    color: COLORS.black,
  },
  headerButtonText: {
    fontSize: 16,
    color: COLORS.white,
  },
  buttonSubmit: {
    backgroundColor: "#FF7A20",
    justifyContent: "center",
    alignItems: "center",
    height: 35,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  bookCard: {
    flex: 100,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 300,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 12,
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
    marginRight: 8,
  },
  AIicon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
    tintColor: "#fff",
    marginBottom: 2,
  },
  AIlabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#fff",
  },
});

export default Detail;
