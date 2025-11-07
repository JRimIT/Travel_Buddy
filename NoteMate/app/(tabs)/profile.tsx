import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../../contexts/ThemeContext";
import createProfileStyles from "../../assets/styles/profile.styles";
import LogoutButton from "../../components/LogoutButton";
import { useRouter, useFocusEffect } from "expo-router";

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const Profile = () => {
  const { token } = useAuthStore();
  const [userInfo, setUserInfo] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [newAvatar, setNewAvatar] = useState("");
  const { colors } = useTheme();
  const styles = createProfileStyles(colors);
  const router = useRouter();

  // Search bar state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const searchWidth = useState(new Animated.Value(0))[0];

  // Modal edit state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTrip, setEditTrip] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPublic, setEditPublic] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    public: 0,
    private: 0,
    latestTitle: "",
  });

  useFocusEffect(
    React.useCallback(() => { fetchAllData(); }, [])
  );

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchUserInfo(), fetchUserTrips()]);
    setLoading(false);
  };

  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Tải thông tin user thất bại");
      setUserInfo(data.user);
      setNewAvatar(data.user.profileImage || "");
    } catch (error) {
      Alert.alert("Lỗi", error instanceof Error ? error.message : "Tải thông tin user thất bại");
    }
  };

  const fetchUserTrips = async () => {
    try {
      const response = await fetch(`${API_URL}/tripSchedule/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const arr = Array.isArray(data) ? data : data.trips || [];
      setTrips(arr);
      calculateStats(arr);
    } catch (error) {
      Alert.alert("Lỗi", error instanceof Error ? error.message : "Lấy danh sách lịch trình lỗi");
    }
  };

  const calculateStats = (arr) => {
    const total = arr.length;
    const pub = arr.filter(t => t.isPublic).length;
    const pri = total - pub;
    let latestTitle = "";
    if (arr.length > 0) {
      arr.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      latestTitle = arr[0].title;
    }
    setStats({ total, public: pub, private: pri, latestTitle });
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setNewAvatar(base64Image);
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/profile/avatar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ profileImage: base64Image }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Đổi avatar thất bại");
        }
        Alert.alert("OK", "Đã cập nhật ảnh đại diện!");
        fetchUserInfo();
      } catch (error) {
        Alert.alert("Lỗi", error instanceof Error ? error.message : "Không cập nhật được avatar");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteTrip = async (tripId) => {
    try {
      setDeleteId(tripId);
      const response = await fetch(`${API_URL}/tripSchedule/${tripId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Xoá thất bại");
      const updated = trips.filter(trip => trip._id !== tripId);
      setTrips(updated);
      calculateStats(updated);
      Alert.alert("Thành công", "Đã xoá lịch trình");
    } catch (error) {
      Alert.alert("Lỗi", error instanceof Error ? error.message : "Xoá lịch trình thất bại");
    } finally {
      setDeleteId(null);
    }
  };

  const confirmDelete = (tripId) => {
    Alert.alert("Xoá lịch trình", "Bạn có chắc muốn xoá lịch trình này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        onPress: () => handleDeleteTrip(tripId),
        style: "destructive",
      },
    ]);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await sleep(600);
    await fetchAllData();
    setRefreshing(false);
  };

  // ✅ Hàm mở chat support
  const handleOpenSupportChat = () => {
    router.push("/SupportChatScreen");
  };

  // Search bar animation
  const openSearch = () => {
    setSearchOpen(true);
    Animated.timing(searchWidth, {
      toValue: 220,
      duration: 270,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };
  const closeSearch = () => {
    Animated.timing(searchWidth, {
      toValue: 0,
      duration: 190,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setSearchOpen(false);
      setSearchText("");
    });
  };
  const displayedTrips = searchText.trim()
    ? trips.filter(t => t.title?.toLowerCase().includes(searchText.trim().toLowerCase()))
    : trips;

  // Trip card
  const renderTripItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tripItem}
      onPress={() => router.push({ pathname: "/ScheduleDetailScreen", params: { id: item._id } })}
      activeOpacity={0.94}
    >
      <Image source={{ uri: item.image }} style={styles.tripImage} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.tripTitle}>{item.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 3 }}>
          <Ionicons name={item.isPublic ? "earth" : "lock-closed"} size={15} color={item.isPublic ? "#2da0f7" : "#999"} />
          <Text style={{marginLeft:6, color: item.isPublic ? "#2da0f7" : "#888"}}>
            {item.isPublic ? "Công khai" : "Riêng tư"}
          </Text>
          <Text style={{ marginLeft: 10, color: "#888" }}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {item.description && <Text numberOfLines={2} style={{ color: "#4a5d85", fontSize: 14 }}>{item.description}</Text>}
      </View>
      <View style={{ marginLeft: 12, alignItems: "center", justifyContent: "center" }}>
        <TouchableOpacity onPress={() => {
          setEditTrip(item);
          setEditTitle(item.title);
          setEditDesc(item.description || "");
          setEditPublic(!!item.isPublic);
          setEditModalVisible(true);
        }}>
          <Ionicons name="pencil-outline" size={21} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 10 }} onPress={() => confirmDelete(item._id)}>
          {deleteId === item._id ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="trash-outline" size={21} color="#e54653" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) return (
    <View style={{ flex:1, justifyContent:"center", alignItems:"center", backgroundColor:colors.background }}>
      <ActivityIndicator size={"large"} color={colors.primary}/>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* --- Header avatar + info --- */}
      <View style={styles.profileHeader}>
        <View style={{ alignItems: 'center', marginRight: 18 }}>
          {newAvatar ? (
            <Image source={{ uri: newAvatar }} style={styles.avatar} />
          ) : (
            <Ionicons name="person-circle-outline" size={76} color={colors.primary} />
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8, gap: 10 }}>
            <TouchableOpacity onPress={handlePickAvatar}>
              <Ionicons name="camera-outline" size={23} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/setting") }>
              <Ionicons name="settings-outline" size={23} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Info */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text style={styles.username}>{userInfo?.username || "Guest"}</Text>
          <Text style={styles.email}>{userInfo?.email || " – "}</Text>
          <View style={{ marginTop: 8 }}>
            <Text style={styles.statsText}>🧳 Tổng lịch trình: {stats.total}</Text>
            <Text style={styles.statsText}>🌏 Công khai: {stats.public}</Text>
            <Text style={styles.statsText}>🔒 Riêng tư: {stats.private}</Text>
            <Text style={styles.statsText}>🆕 Gần nhất: {stats.latestTitle}</Text>
          </View>
        </View>
      </View>

      {/* ✅ Nút Chat với Support */}
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          paddingVertical: 12,
          paddingHorizontal: 20,
          borderRadius: 12,
          marginHorizontal: 20,
          marginTop: 12,
          marginBottom: 8,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
        onPress={handleOpenSupportChat}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubbles" size={22} color="#fff" style={{ marginRight: 10 }} />
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
          Chat với Support
        </Text>
      </TouchableOpacity>

      <LogoutButton />

      {/* --- Header danh sách + Search --- */}
      <View style={styles.tripsHeader}>
        <Text style={styles.tripsTitle}>Chuyến đi của bạn</Text>
        <View style={{ flexDirection: 'row', alignItems: "center" }}>
          <Animated.View style={{
            width: searchWidth,
            overflow: "hidden",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#ecf7ff",
            borderRadius: 15,
            borderWidth: 1,
            borderColor: "#cdeafe",
            marginRight: searchOpen ? 5 : 0,
            height: 34,
          }}>
            <Ionicons name="search" size={19} color="#399be7" style={{ marginLeft: 9, marginRight: 4 }} />
            <TextInput
              style={{
                height: 34,
                flex: 1,
                fontSize: 15,
                color: "#1976d2",
                backgroundColor: "transparent",
              }}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Tìm theo tên..."
              placeholderTextColor="#8bb5de"
              autoFocus={searchOpen}
            />
            <TouchableOpacity onPress={closeSearch} style={{ padding: 7 }}>
              <Ionicons name="close-circle" size={20} color="#339bf9" />
            </TouchableOpacity>
          </Animated.View>
          {!searchOpen && (
            <TouchableOpacity onPress={openSearch} style={{ marginLeft: 7 }}>
              <Ionicons name="search" size={23} color={colors.primary} />
            </TouchableOpacity>
          )}
          <Text style={styles.tripsCount}>{displayedTrips.length} chuyến</Text>
        </View>
      </View>

      <FlatList
        data={displayedTrips}
        keyExtractor={(item) => item._id}
        renderItem={renderTripItem}
        contentContainerStyle={styles.tripsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="earth-outline" size={50} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Bạn chưa có chuyến đi nào</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/CreateScheduleScreen")}
            >
              <Ionicons name="add" size={24} color={colors.white} />
              <Text style={styles.addButtonText}>Tạo chuyến đi mới</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal sửa lịch trình */}
      {editModalVisible && (
        <View style={{
          position: "absolute",
          left: 0, right: 0, top: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.3)",
          justifyContent: "center", alignItems: "center",
          zIndex: 9,
        }}>
          <View style={{
            backgroundColor: "#fff", borderRadius: 18,
            padding: 24, width: "89%", shadowColor: "#1879d8", elevation: 13,
          }}>
            <Text style={{
              fontWeight: "bold", fontSize: 18, marginBottom: 13,
              color: "#1976d2", textAlign: "center"
            }}>
              Chỉnh sửa lịch trình
            </Text>
            <Text style={{ fontSize: 15, marginBottom: 5 }}>Tên lịch trình</Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              style={{
                borderColor: "#d5e0f2",
                borderWidth: 1.3, borderRadius: 9, padding: 9, fontSize: 15,
                marginBottom: 15, color: "#172965"
              }}
              placeholder="Nhập tên lịch trình"
            />
            <Text style={{ fontSize: 15, marginBottom: 5 }}>Mô tả (tuỳ chọn)</Text>
            <TextInput
              value={editDesc}
              onChangeText={setEditDesc}
              style={{
                borderColor: "#d5e0f2", borderWidth: 1.1,
                borderRadius: 9, padding: 9, fontSize: 15,
                marginBottom: 15, color: "#172965",
                minHeight: 38,
              }}
              placeholder="Mô tả nhanh chuyến đi"
              multiline
            />
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 13 }}>
              <TouchableOpacity
                style={{
                  flexDirection: "row", alignItems: "center",
                  backgroundColor: editPublic ? "#d0f2ff" : "#eee",
                  borderWidth: 1, borderColor: "#1b9cec", borderRadius: 8,
                  padding: 6, marginRight: 10,
                }}
                onPress={() => setEditPublic(true)}
              >
                <Ionicons name="earth" size={17} color="#169be1" />
                <Text style={{marginLeft: 6, color: "#169be1", fontWeight:"bold"}}>Công khai</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: "row", alignItems: "center",
                  backgroundColor: !editPublic ? "#ffe6f3" : "#eee",
                  borderWidth: 1, borderColor: "#f058a0", borderRadius: 8,
                  padding: 6,
                }}
                onPress={() => setEditPublic(false)}
              >
                <Ionicons name="lock-closed" size={17} color="#e03470" />
                <Text style={{marginLeft: 6, color: "#e03470", fontWeight:"bold"}}>Riêng tư</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 8}}>
              <TouchableOpacity
                style={{ marginRight: 17, paddingVertical:8, paddingHorizontal:14 }}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={{ color: "#999", fontWeight:"bold", fontSize: 16 }}>Huỷ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#1879d8",
                  borderRadius: 7, paddingHorizontal: 22, paddingVertical:12,
                  minWidth: 90, alignItems: "center"
                }}
                disabled={savingEdit}
                onPress={async () => {
                  if (!editTitle.trim()) {
                    Alert.alert("Thiếu tên lịch trình!");
                    return;
                  }
                  setSavingEdit(true);
                  try {
                    const response = await fetch(`${API_URL}/tripSchedule/${editTrip._id}`, {
                      method: "PUT",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        title: editTitle.trim(),
                        description: editDesc.trim(),
                        isPublic: editPublic,
                      }),
                    });
                    if (!response.ok) {
                      const data = await response.json();
                      throw new Error(data.error || "Sửa lịch trình lỗi");
                    }
                    await fetchUserTrips();
                    setEditModalVisible(false);
                    Alert.alert("Cập nhật thành công!");
                  } catch (e) {
                    Alert.alert("Lỗi", e.message?.toString() || "Không cập nhật được");
                  } finally {
                    setSavingEdit(false);
                  }
                }}
              >
                {savingEdit
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={{ color: "#fff", fontWeight:"bold", fontSize:16 }}>Lưu</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default Profile;
