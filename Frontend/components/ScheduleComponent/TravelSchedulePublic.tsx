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
} from 'react-native-popup-menu';

import { API_URL } from "../../constants/api";
import { useTheme } from "../../contexts/ThemeContext";
import createHomeStyles from "../../assets/styles/home.styles";
import { formatPublishDate } from "../../lib/utils";
import { useAuthStore } from "../../store/authStore";

const TravelSchedulePublicScreen = () => {
  const { colors } = useTheme();
  const styles = createHomeStyles(colors);
  const { token, user, setUser } = useAuthStore();
  const router = useRouter();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedTrips, setSavedTrips] = useState(user?.savedTripSchedules || []);

  // Báo cáo
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  const fetchSchedules = async () => {
    try {
      const response = await fetch(`${API_URL}/tripSchedule/public`);
      const res = await response.json();
      if (response.ok) {
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
      const response = await fetch(`${API_URL}/tripSchedule/saved/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const savedData = await response.json();
      if (response.ok) {
        const savedTripIds = savedData.map((trip: any) => trip._id);
        setSavedTrips(savedTripIds);
        setUser({ ...user, savedTripSchedules: savedTripIds });
      }
    } catch (error) {
      console.error("Failed to fetch saved trips:", error);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchSchedules(), fetchSavedTrips()]);
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

  const handleDetail = (item: any) => {
    router.push({ pathname: "/(page)/ScheduleDetailScreen", params: { id: item._id } });
  };

  const handleSaveTrip = async (tripId: string) => {
    const isCurrentlySaved = savedTrips.includes(tripId);
    const updatedSavedTrips = isCurrentlySaved
      ? savedTrips.filter(id => id !== tripId)
      : [...savedTrips, tripId];

    // Optimistic UI
    setSavedTrips(updatedSavedTrips);
    setUser({ ...user, savedTripSchedules: updatedSavedTrips });

    try {
      const response = await fetch(`${API_URL}/tripSchedule/${tripId}/save`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        // Revert on error
        setSavedTrips(savedTrips);
        setUser({ ...user, savedTripSchedules: savedTrips });
        Alert.alert("Lỗi", "Không thể lưu lịch trình.");
      }
    } catch (error) {
      setSavedTrips(savedTrips);
      setUser({ ...user, savedTripSchedules: savedTrips });
      Alert.alert("Lỗi", "Đã có lỗi xảy ra.");
    }
  };

  const handleReport = async () => {
    if (!selectedTripId || !reportReason.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập lý do báo cáo.");
      return;
    }

    setReportLoading(true);
    try {
      const response = await fetch(`${API_URL}/reports/trip-schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId: selectedTripId,
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

  const openReportModal = (tripId: string) => {
    setSelectedTripId(tripId);
    setReportModalVisible(true);
  };

  const closeReportModal = () => {
    setReportModalVisible(false);
    setReportReason('');
    setReportDescription('');
    setSelectedTripId(null);
  };

  const renderItem = ({ item }: any) => {
    const isSaved = savedTrips.includes(item._id);

    const handleShareTrip = async () => {
      try {
        await Share.share({
          message: `Thử xem lịch trình này nhé: ${item.title} | Travel Buddy`,
        });
      } catch (error) {
        console.log("Share Error:", error);
      }
    };

    return (
      <View style={styles.bookCard}>
        <View style={styles.bookHeader}>
          <TouchableOpacity onPress={() => handleDetail(item)} style={styles.userInfo}>
            <Image source={{ uri: item.user?.profileImage }} style={styles.avatar} />
            <Text style={styles.username}>{item.user?.username || "Unknown"}</Text>
          </TouchableOpacity>

          <Menu>
            <MenuTrigger>
              <Ionicons name="ellipsis-vertical" size={24} color={colors.text} style={{ padding: 8 }} />
            </MenuTrigger>
            <MenuOptions customStyles={{ optionsContainer: styles.menuOptionsContainer }}>
              <MenuOption onSelect={() => handleSaveTrip(item._id)}>
                <View style={styles.menuOption}>
                  <Ionicons name={isSaved ? "bookmark" : "bookmark-outline"} size={22} color={colors.text} />
                  <Text style={styles.menuOptionText}>
                    {isSaved ? 'Bỏ lưu' : 'Lưu lịch trình'}
                  </Text>
                </View>
              </MenuOption>
              <MenuOption onSelect={handleShareTrip}>
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
      </View>
    );
  };

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

      {/* Nút tạo lịch trình */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: 36,
          right: 30,
          width: 62,
          height: 62,
          backgroundColor: colors.primary || "#276ef1",
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

      {/* Modal Báo cáo */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeReportModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            <View style={{
              backgroundColor: colors.background,
              borderRadius: 16,
              padding: 20,
              width: '100%',
              maxWidth: 400,
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>
                Báo cáo lịch trình
              </Text>

              <Text style={{ color: colors.text, marginBottom: 8 }}>Lý do báo cáo:</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: colors.border || '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  backgroundColor: colors.card || '#fff',
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
                  borderColor: colors.border || '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  color: colors.text,
                  backgroundColor: colors.card || '#fff',
                  height: 100,
                  textAlignVertical: 'top',
                  marginBottom: 20,
                }}
                placeholder="Mô tả thêm lý do báo cáo..."
                placeholderTextColor="#999"
                multiline
                value={reportDescription}
                onChangeText={setReportDescription}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                <TouchableOpacity
                  onPress={closeReportModal}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    backgroundColor: '#eee',
                  }}
                >
                  <Text style={{ color: '#333', fontWeight: '600' }}>Hủy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleReport}
                  disabled={reportLoading || !reportReason.trim()}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    backgroundColor: reportReason.trim() ? colors.primary : '#ccc',
                    opacity: reportLoading ? 0.7 : 1,
                  }}
                >
                  {reportLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Gửi</Text>
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