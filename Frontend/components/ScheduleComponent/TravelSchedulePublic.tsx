import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from "react-native-popup-menu";

import { API_URL } from "../../constants/api";
import { useTheme } from "../../contexts/ThemeContext";
import createHomeStyles from "../../assets/styles/home.styles";
import { formatPublishDate } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";
import api from "../../utils/apiClient";


const TravelSchedulePublicScreen = () => {
  const { colors } = useTheme();
  const styles = createHomeStyles(colors);
  const { token, user, setUser } = useAuthStore();
  const router = useRouter();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedTrips, setSavedTrips] = useState<string[]>(user?.savedTripSchedules || []);
  const [completedTrips, setCompletedTrips] = useState<string[]>([]);

  // === REVIEW MODAL ===
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  // === REPORT MODAL ===
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  // === FETCH DATA ===
  const fetchSchedules = async () => {
    try {
      const response = await api.get(`/tripSchedule/public`);
      const res = await response.data;      
      if (response.status === 200) {
        setData(res);
      } else {
        throw new Error(res.error || "Không thể lấy dữ liệu.");
      }
    } catch (e: any) {
      Alert.alert("Lỗi", "Không thể lấy dữ liệu lịch trình public.\n" + e.message);
    }
  };

  const fetchSavedTrips = async () => {
    if (!token) return;
    try {
      const response = await api.get(`/tripSchedule/saved/my`);
      const res = await response.data;
      if (response.status === 200) {
        const savedTripIds = res.map(trip => trip._id);
        setSavedTrips(savedTripIds);
        setUser({ ...user, savedTripSchedules: savedTripIds });
      } else {
        throw new Error(res.error || "Không thể lấy dữ liệu.");
      }
      
    } catch (error) {
      console.error("Failed to fetch saved trips:", error);
    }
  };

  const fetchCompletedTrips = async () => {
  if (!token) {
    console.log("No token, skip completed trips");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tripSchedule/completed/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const text = await response.text();
    console.log("Raw response from completed/my:", text); // Debug

    if (!response.ok) {
      console.error("HTTP Error:", response.status);
      return;
    }

    const data = JSON.parse(text);
    const ids = data.map((t: any) => t._id);
    console.log("Completed trip IDs:", ids);
    setCompletedTrips(ids);
  } catch (error) {
    console.error("Fetch error:", error);
  }
};

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchSchedules(), fetchSavedTrips(), fetchCompletedTrips()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // === ACTIONS ===
  const handleDetail = (item: any) => {
  console.log("Nhấn vào trip với id:", item._id); // debug
  router.push({ pathname: "/(page)/ScheduleDetailScreen", params: { id: item._id } });
};


  const handleSaveTrip = async (tripId: string) => {
    const isSaved = savedTrips.includes(tripId);
    const updated = isSaved
      ? savedTrips.filter((id) => id !== tripId)
      : [...savedTrips, tripId];

    setSavedTrips(updated);
    setUser({ ...user, savedTripSchedules: updated });

    try {
      const response = await fetch(`${API_URL}/tripSchedule/${tripId}/save`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
    } catch (error) {
      setSavedTrips(savedTrips);
      setUser({ ...user, savedTripSchedules: savedTrips });
      Alert.alert("Lỗi", "Không thể lưu lịch trình.");
    }
  };

  const handleMarkAsCompleted = async (tripId: string) => {
    const isCompleted = completedTrips.includes(tripId);
    const updated = isCompleted
      ? completedTrips.filter((id) => id !== tripId)
      : [...completedTrips, tripId];

    setCompletedTrips(updated);

    try {
      const response = await fetch(`${API_URL}/tripSchedule/${tripId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
    } catch (error) {
      setCompletedTrips(completedTrips);
      Alert.alert("Lỗi", "Không thể đánh dấu đã đi.");
    }
  };

  const handleShareTrip = async (item: any) => {
    try {
      await Share.share({
        message: `Thử xem lịch trình này nhé: ${item.title} | Travel Buddy`,
      });
    } catch (error) {
      console.log("Share Error:", error);
    }
  };

  // === REVIEW ===
  const openReviewModal = (tripId: string) => {
    setSelectedTripId(tripId);
    setReviewModalVisible(true);
  };

  const closeReviewModal = () => {
    setReviewModalVisible(false);
    setRating(0);
    setReviewText("");
    setSelectedTripId(null);
  };

const handleSubmitReview = async () => {
  if (rating === 0 || !reviewText.trim()) {
    Alert.alert("Lỗi", "Vui lòng chọn số sao và nhập nhận xét.");
    return;
  }

  setReviewLoading(true);
  try {
    const url = `${API_URL}/reviews/trip-schedule/${selectedTripId}`;
    console.log("Gửi review đến:", url); // DEBUG

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rating,
        comment: reviewText.trim(),
      }),
    });

    // IN RA RESPONSE ĐỂ XEM
    const text = await response.text();
    console.log("Raw response:", text.substring(0, 300)); // In 300 ký tự đầu

    if (!response.ok) {
      console.error("HTTP Error:", response.status);
      Alert.alert("Lỗi", `Mã lỗi: ${response.status}`);
      return;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Không phải JSON:", text);
      Alert.alert("Lỗi", "Server trả về dữ liệu không hợp lệ");
      return;
    }

    Alert.alert("Thành công", "Đánh giá đã được gửi. Cảm ơn bạn!");
    closeReviewModal();
    onRefresh();
  } catch (error) {
    console.error("Fetch error:", error);
    Alert.alert("Lỗi", "Không thể kết nối đến server");
  } finally {
    setReviewLoading(false);
  }
};

  // === REPORT ===
  const openReportModal = (tripId: string) => {
    setSelectedReportId(tripId);
    setReportModalVisible(true);
  };

  const closeReportModal = () => {
    setReportModalVisible(false);
    setReportReason("");
    setReportDescription("");
    setSelectedReportId(null);
  };

  const handleReport = async () => {
    if (!selectedReportId || !reportReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do báo cáo.");
      return;
    }

    setReportLoading(true);
    try {
      const response = await fetch(`${API_URL}/reports/trip-schedule`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetId: selectedReportId,
          reason: reportReason.trim(),
          description: reportDescription.trim() || undefined,
        }),
      });

      if (response.ok) {
        Alert.alert("Thành công", "Báo cáo đã được gửi. Cảm ơn bạn!");
        closeReportModal();
      } else {
        const error = await response.json();
        Alert.alert("Lỗi", error.error || "Không thể gửi báo cáo.");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Đã có lỗi mạng. Vui lòng thử lại.");
    } finally {
      setReportLoading(false);
    }
  };

  // === RENDER ITEM ===
  const renderItem = ({ item }: any) => {
    const isSaved = savedTrips.includes(item._id);
    const isCompleted = completedTrips.includes(item._id);
    const tripReviews = item.reviews || [];
    const hasReviewed = tripReviews.some((r: any) => r.user._id === user?._id);

    return (
      <View style={styles.bookCard}>
        {/* Header */}
        <View style={styles.bookHeader}>
          <TouchableOpacity onPress={() => handleDetail(item)} style={styles.userInfo}>
            <Image
              source={{
                uri: item.user?.profileImage?.includes("dicebear.com")
                  ? item.user.profileImage.replace("/svg?", "/png?")
                  : item.user?.profileImage || "https://cdn-icons-png.flaticon.com/512/847/847969.png",
              }}
              style={styles.avatar}
            />
            <Text style={styles.username}>{item.user?.username || "Người dùng"}</Text>
          </TouchableOpacity>

          <Menu>
            <MenuTrigger>
              <Ionicons name="ellipsis-vertical" size={24} color={colors.text} style={{ padding: 8 }} />
            </MenuTrigger>
            <MenuOptions customStyles={{ optionsContainer: styles.menuOptionsContainer }}>
              <MenuOption onSelect={() => handleSaveTrip(item._id)}>
                <View style={styles.menuOption}>
                  <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={colors.text} />
                  <Text style={styles.menuOptionText}>{isSaved ? "Bỏ lưu" : "Lưu lịch trình"}</Text>
                </View>
              </MenuOption>

              {isSaved && (
                <MenuOption onSelect={() => handleMarkAsCompleted(item._id)}>
                  <View style={styles.menuOption}>
                    <Ionicons name={isCompleted ? "checkmark-circle" : "checkmark-circle-outline"} size={22} color={colors.text} />
                    <Text style={styles.menuOptionText}>
                      {isCompleted ? "Bỏ đánh dấu đã đi" : "Đánh dấu đã đi"}
                    </Text>
                  </View>
                </MenuOption>
              )}

              {isCompleted && !hasReviewed && (
                <MenuOption onSelect={() => openReviewModal(item._id)}>
                  <View style={styles.menuOption}>
                    <Ionicons name="star-outline" size={22} color={colors.text} />
                    <Text style={styles.menuOptionText}>Đánh giá</Text>
                  </View>
                </MenuOption>
              )}

              <MenuOption onSelect={() => handleShareTrip(item)}>
                <View style={styles.menuOption}>
                  <Ionicons name="paper-plane-outline" size={22} color={colors.text} />
                  <Text style={styles.menuOptionText}>Chia sẻ</Text>
                </View>
              </MenuOption>

              <MenuOption onSelect={() => openReportModal(item._id)}>
                <View style={styles.menuOption}>
                  <Ionicons name="flag-outline" size={22} color={colors.text} />
                  <Text style={styles.menuOptionText}>Báo cáo</Text>
                </View>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>

        {/* Body */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => handleDetail(item)}>
          <View style={styles.bookImageContainer}>
            <Image source={{ uri: item.image }} style={styles.bookImage} />
          </View>
          <View style={styles.bookDetails}>
            <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.caption} numberOfLines={2}>{item.description}</Text>
            ) : null}
            <Text style={styles.date}>
              Public {item.createdAt ? formatPublishDate(item.createdAt) : ""}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Reviews Section */}
        {tripReviews.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
              <Text style={{ fontWeight: "bold", color: colors.text, marginRight: 8 }}>Đánh giá</Text>
              <View style={{ flexDirection: "row" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name="star"
                    size={14}
                    color={star <= item.averageRating ? "#f59e0b" : "#ddd"}
                  />
                ))}
              </View>
              <Text style={{ color: "#666", marginLeft: 4 }}>({item.reviewCount})</Text>
            </View>

            {tripReviews.slice(0, 2).map((review: any, idx: number) => (
              <View key={idx} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                  <Image
                    source={{ uri: review.user.profileImage || "https://cdn-icons-png.flaticon.com/512/847/847969.png" }}
                    style={{ width: 24, height: 24, borderRadius: 12, marginRight: 8 }}
                  />
                  <Text style={{ fontWeight: "500", color: colors.text }}>{review.user.username}</Text>
                </View>
                <View style={{ flexDirection: "row", marginBottom: 4 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name="star"
                      size={14}
                      color={star <= review.rating ? "#f59e0b" : "#ddd"}
                    />
                  ))}
                </View>
                <Text style={{ color: "#555", fontSize: 13 }} numberOfLines={2}>
                  {review.comment}
                </Text>
              </View>
            ))}

            {tripReviews.length > 2 && (
              <TouchableOpacity onPress={() => handleDetail(item)}>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "500" }}>
                  Xem thêm {tripReviews.length - 2} đánh giá...
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  // === LOADING ===
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 21, fontWeight: "bold", color: colors.primary, margin: 16, marginBottom: 0 }}>
        Lịch trình cộng đồng
      </Text>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <Text style={{ marginTop: 40, color: "#aaa", textAlign: "center" }}>
            Không có lịch trình public nào.
          </Text>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 36,
          right: 30,
          width: 62,
          height: 62,
          backgroundColor: colors.primary,
          borderRadius: 31,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.18,
          shadowRadius: 6,
          elevation: 8,
          zIndex: 100,
        }}
        activeOpacity={0.85}
        onPress={() => router.push("/FormTravel")}
      >
        <Ionicons name="add" size={38} color="#fff" />
      </TouchableOpacity>

      {/* === REVIEW MODAL === */}
      <Modal visible={reviewModalVisible} transparent animationType="fade" onRequestClose={closeReviewModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 }}>
            <View style={{ backgroundColor: colors.background, borderRadius: 16, padding: 20, width: "100%", maxWidth: 400 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 16 }}>
                Đánh giá lịch trình
              </Text>

              <Text style={{ color: colors.text, marginBottom: 8 }}>Chọn số sao:</Text>
              <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} style={{ marginHorizontal: 4 }}>
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={36}
                      color="#f59e0b"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={{ color: colors.text, marginBottom: 8 }}>Nhận xét:</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border || "#ddd",
                  borderRadius: 8,
                  padding: 12,
                  height: 100,
                  textAlignVertical: "top",
                  color: colors.text,
                  backgroundColor: colors.card || "#fff",
                  marginBottom: 20,
                }}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                placeholderTextColor="#999"
                multiline
                value={reviewText}
                onChangeText={setReviewText}
              />

              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
                <TouchableOpacity
                  onPress={closeReviewModal}
                  style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: "#eee" }}
                >
                  <Text style={{ color: "#333", fontWeight: "600" }}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmitReview}
                  disabled={reviewLoading || rating === 0 || !reviewText.trim()}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    backgroundColor: (rating > 0 && reviewText.trim()) ? colors.primary : "#ccc",
                    opacity: reviewLoading ? 0.7 : 1,
                  }}
                >
                  {reviewLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "600" }}>Gửi</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* === REPORT MODAL === */}
      <Modal visible={reportModalVisible} transparent animationType="fade" onRequestClose={closeReportModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 }}>
            <View style={{ backgroundColor: colors.background, borderRadius: 16, padding: 20, width: "100%", maxWidth: 400 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.text, marginBottom: 16 }}>
                Báo cáo lịch trình
              </Text>

              <Text style={{ color: colors.text, marginBottom: 8 }}>Lý do báo cáo:</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border || "#ddd",
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  backgroundColor: colors.card || "#fff",
                  marginBottom: 16,
                }}
                placeholder="Ví dụ: spam, nội dung không phù hợp..."
                placeholderTextColor="#999"
                value={reportReason}
                onChangeText={setReportReason}
              />

              <Text style={{ color: colors.text, marginBottom: 8 }}>Mô tả chi tiết (tùy chọn):</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border || "#ddd",
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  backgroundColor: colors.card || "#fff",
                  height: 100,
                  textAlignVertical: "top",
                  marginBottom: 20,
                }}
                placeholder="Mô tả thêm lý do báo cáo..."
                placeholderTextColor="#999"
                multiline
                value={reportDescription}
                onChangeText={setReportDescription}
              />

              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
                <TouchableOpacity
                  onPress={closeReportModal}
                  style={{ paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, backgroundColor: "#eee" }}
                >
                  <Text style={{ color: "#333", fontWeight: "600" }}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleReport}
                  disabled={reportLoading || !reportReason.trim()}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    backgroundColor: reportReason.trim() ? colors.primary : "#ccc",
                    opacity: reportLoading ? 0.7 : 1,
                  }}
                >
                  {reportLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "600" }}>Gửi</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default TravelSchedulePublicScreen;