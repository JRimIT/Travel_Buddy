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
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "../../constants/api";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../../contexts/ThemeContext";
import createProfileStyles from "../../assets/styles/profile.styles";
import LogoutButton from "../../components/LogoutButton";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import PostCard from "../../components/PostCard";

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
  const [savedTrips, setSavedTrips] = useState([]);
  const [sharedTrips, setSharedTrips] = useState([]);
  const [pendingShares, setPendingShares] = useState([]);
  const [pendingPostShares, setPendingPostShares] = useState([]);
  const [acceptedPostShares, setAcceptedPostShares] = useState([]);
  const [showPendingShares, setShowPendingShares] = useState(true);
  const [showPendingPostShares, setShowPendingPostShares] = useState(true);
  const [tab, setTab] = useState("created"); // 'created' | 'saved' | 'shared'
  const [createdTrips, setCreatedTrips] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  
  // Notification state
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);
  
  // Saved modal state
  const [savedModalVisible, setSavedModalVisible] = useState(false);
  const [savedTab, setSavedTab] = useState("posts"); // 'posts' | 'trips'

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
  const params = useLocalSearchParams();


React.useEffect(() => {
  const defaultAvatar =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";


  if (userInfo?.profileImage && userInfo.profileImage.trim() !== "") {
    setNewAvatar(userInfo.profileImage);
  } else {
    setNewAvatar(defaultAvatar);
  }
}, [userInfo]);

  // Nếu được mở với initialTab=shared từ EditTripScreen
  React.useEffect(() => {
    const initialTabParam = params.initialTab;
    const initial =
      Array.isArray(initialTabParam) ? initialTabParam[0] : initialTabParam;
    if (initial === "shared") {
      setTab("shared");
    }
  }, [params.initialTab]);


  useFocusEffect(
    React.useCallback(() => {
      fetchAllData();
    }, [])
  );

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchUserInfo(),
      fetchUserTrips(),
      fetchSavedTrips(),
      fetchSharedData(),
      fetchUserPosts(),
      fetchSavedPosts(),
    ]);
    setLoading(false);
  };

  const fetchSavedPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts/saved`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Lấy danh sách bài viết đã lưu lỗi");
      setSavedPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching saved posts:", error);
      setSavedPosts([]);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/posts/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Lấy danh sách bài viết lỗi");
      setUserPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      setUserPosts([]);
    }
  };

// --- 1️⃣ Sau khi fetch user info ---
const fetchUserInfo = async () => {
  try {
    const response = await fetch(`${API_URL}/profile/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Tải thông tin user thất bại");
    setUserInfo(data.user);
    setNewAvatar(
      data.user.profileImage?.trim()
        ? data.user.profileImage
        : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
    );

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
    setCreatedTrips(arr); // !!! THÊM DÒNG NÀY ĐỂ HIỂN THỊ tab "chuyến đi của tôi"
    calculateStats(arr);
  } catch (error) {
    Alert.alert(
      "Lỗi",
      error instanceof Error ? error.message : "Lấy danh sách lịch trình lỗi"
    );
  }
};


  const calculateStats = (arr) => {
    const total = arr.length;
    const pub = arr.filter((t) => t.isPublic).length;
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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profileImage: base64Image }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || "Đổi avatar thất bại");
        }
        Alert.alert("OK", "Đã cập nhật ảnh đại diện!");
        fetchUserInfo();
      } catch (error) {
        Alert.alert(
          "Lỗi",
          error instanceof Error ? error.message : "Không cập nhật được avatar"
        );
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
    // Cập nhật cả trips lẫn createdTrips (đảm bảo FlatList luôn dùng createdTrips)
    const updated = trips.filter((trip) => trip._id !== tripId);
    setTrips(updated);
    setCreatedTrips(updated); 
    calculateStats(updated);
    Alert.alert("Thành công", "Đã xoá lịch trình");
  } catch (error) {
    Alert.alert(
      "Lỗi",
      error instanceof Error ? error.message : "Xoá lịch trình thất bại"
    );
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
  React.useEffect(() => {
  console.log("🖼️ Avatar hiển thị trong UI:", newAvatar);
}, [newAvatar]);


const fetchSavedTrips = async () => {
  try {
    const response = await fetch(`${API_URL}/tripSchedule/saved/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.error || "Lấy chuyến đi đã lưu thất bại");

    setSavedTrips(result); // Sửa chỗ này!!! Không dùng setTrips nữa.
    calculateStats(result);
  } catch (error) {
    Alert.alert("Lỗi", error.message || "Lấy chuyến đi đã lưu thất bại");
  }
};

// Lấy chuyến đi được chia sẻ & lời mời pending
const fetchSharedData = async () => {
  try {
    // Trip đã được chia sẻ & mình đã accept (clone thành trip của mình)
    const sharedRes = await fetch(`${API_URL}/tripSchedule/shared/my`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const sharedJson = await sharedRes.json();
    setSharedTrips(Array.isArray(sharedJson) ? sharedJson : []);

    // Lời mời chia sẻ tới mình đang pending
    const pendingRes = await fetch(
      `${API_URL}/tripSchedule/shares/incoming?status=pending`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const pendingJson = await pendingRes.json();
    setPendingShares(Array.isArray(pendingJson) ? pendingJson : []);

    // Lời mời chia sẻ post tới mình đang pending
    const pendingPostRes = await fetch(
      `${API_URL}/posts/shares/incoming?status=pending`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const pendingPostJson = await pendingPostRes.json();
    setPendingPostShares(Array.isArray(pendingPostJson) ? pendingPostJson : []);

    // Lấy các post shares đã được accept
    const acceptedPostRes = await fetch(
      `${API_URL}/posts/shares/incoming?status=accepted`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const acceptedPostJson = await acceptedPostRes.json();
    setAcceptedPostShares(Array.isArray(acceptedPostJson) ? acceptedPostJson : []);

    // Cập nhật latest notification nếu có post share mới
    if (pendingPostJson.length > 0) {
      const latest = pendingPostJson[0];
      setLatestNotification({
        type: 'post_share',
        share: latest,
        message: `${latest.from?.username || 'Ai đó'} đã chia sẻ bài viết "${latest.post?.title || 'bài viết'}" với bạn`,
        createdAt: latest.createdAt,
      });
    }
  } catch (error) {
    console.log("Error fetchSharedData:", error);
  }
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
    ? createdTrips.filter((t) =>
        t.title?.toLowerCase().includes(searchText.trim().toLowerCase())
      )
    : createdTrips;

  const displayedSharedTrips =
    tab === "shared"
      ? (searchText.trim()
          ? sharedTrips.filter((t) =>
              t.title?.toLowerCase().includes(searchText.trim().toLowerCase())
            )
          : sharedTrips)
      : [];

  const handleSaveTrip = async (trip) => {
    try {
      // Nếu chưa lưu → gọi API lưu
      const response = await fetch(`${API_URL}/tripSchedule/save/${trip._id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Lưu chuyến đi thất bại");
      fetchSavedTrips();
    } catch (err) {
      Alert.alert("Lỗi", "Không thể lưu chuyến đi");
    }
  };

  const handleUnsaveTrip = (trip) => {
    Alert.alert(
      "Bỏ lưu chuyến đi",
      "Bạn có chắc muốn bỏ lưu chuyến đi này không?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Bỏ lưu",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/tripSchedule/save/${trip._id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
              });
              if (!response.ok) throw new Error("Không bỏ lưu được chuyến đi");
              fetchSavedTrips();
            } catch (err) {
              Alert.alert("Lỗi", "Không thể bỏ lưu chuyến đi");
            }
          }
        }
      ]
    );
  };




  // Trip card
const renderTripItem = ({ item }) => {
  // Xác định trạng thái đã lưu
  const isSaved = savedTrips.some(t => t._id === item._id);
  const isOwner =
    item.user?._id === userInfo?._id ||
    item.user === userInfo?._id;

  return (
    <TouchableOpacity
      style={styles.tripItem}
      onPress={() =>
        router.push({
          pathname: "/ScheduleDetailScreen",
          params: { id: item._id },
        })
      }
      activeOpacity={0.94}
    >
      <Image source={{ uri: item.image }} style={styles.tripImage} />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.tripTitle}>{item.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 3 }}>
          <Ionicons name={item.isPublic ? "earth" : "lock-closed"} size={15} color={item.isPublic ? "#2da0f7" : "#999"} />
          <Text style={{ marginLeft: 6, color: item.isPublic ? "#2da0f7" : "#888" }}>
            {item.isPublic ? "Công khai" : "Riêng tư"}
          </Text>
          <Text style={{ marginLeft: 10, color: "#888" }}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        {item.description &&
          <Text numberOfLines={2} style={{ color: "#4a5d85", fontSize: 14 }}>
            {item.description}
          </Text>
        }
      </View>
      <View style={{ marginLeft: 12, alignItems: "center", justifyContent: "center" }}>
      {/* Nút edit – chỉ hiện nếu là chủ lịch trình */}
      {isOwner && (
        <TouchableOpacity
          onPress={() => {
            console.log("Nhấn nút edit trong profile, trip id:", item._id);
            router.push({
              pathname: "/(page)/ScheduleEditScreen",
              params: { id: item._id },
            });
          }}>
          <Ionicons name="pencil-outline" size={21} color={colors.primary} />
        </TouchableOpacity>
      )}
        {/* Nút đã lưu/huỷ lưu */}
        <TouchableOpacity
          style={{ marginTop: 10 }}
          onPress={() => {
            if (isSaved) {
              handleUnsaveTrip(item);
            } else {
              handleSaveTrip(item);
            }
          }}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={21}
            color={isSaved ? colors.primary : "#999"}
          />
        </TouchableOpacity>
        {/* Nút xoá */}
        <TouchableOpacity
          style={{ marginTop: 10 }}
          onPress={() => confirmDelete(item._id)}
        >
          <Ionicons
            name="trash"
            size={22}
            color="#e53935"
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};



  if (loading && !refreshing)
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size={"large"} color={colors.primary} />
      </View>
    );

  return (
    <View style={styles.container}>
      {/* --- Header avatar + info --- */}
      <View style={styles.profileHeader}>
        <View style={{ alignItems: 'center', marginRight: 18 }}>
          {userInfo?.profileImage ? (
            <Image
              source={{ uri: userInfo.profileImage.replace('/svg?', '/png?') }}
              style={styles.avatar}
            />
          ) : (
            <Ionicons
              name="person-circle-outline"
              size={76}
              color={colors.primary}
            />
          )}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 8,
              gap: 10,
            }}
          >
            <TouchableOpacity onPress={handlePickAvatar}>
              <Ionicons
                name="camera-outline"
                size={23}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/setting")}>
              <Ionicons
                name="settings-outline"
                size={23}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => {
                fetchSavedPosts(); // Refresh saved posts khi mở modal
                setSavedModalVisible(true);
              }}
              style={{ marginRight: 12 }}
            >
              <Ionicons
                name="bookmark-outline"
                size={23}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setNotificationModalVisible(true)}
              style={{ position: 'relative' }}
            >
              <Ionicons
                name="notifications-outline"
                size={23}
                color={colors.primary}
              />
              {pendingPostShares.length > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    backgroundColor: '#ff4444',
                    borderRadius: 10,
                    width: 18,
                    height: 18,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: colors.background,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                    {pendingPostShares.length > 9 ? '9+' : pendingPostShares.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        {/* Info */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={styles.username}>{userInfo?.username || "Guest"}</Text>
          <Text style={styles.email}>{userInfo?.email || " – "}</Text>
          <View style={{ marginTop: 8 }}>
            <Text style={styles.statsText}>
              🧳 Tổng lịch trình: {stats.total}
            </Text>
            <Text style={styles.statsText}>🌏 Công khai: {stats.public}</Text>
            <Text style={styles.statsText}>🔒 Riêng tư: {stats.private}</Text>
            <Text style={styles.statsText}>
              🆕 Gần nhất: {stats.latestTitle}
            </Text>
          </View>
        </View>
      </View>

      {/* ✅ Nút Chat với Support */}
      <TouchableOpacity
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
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
        <Ionicons
          name="chatbubbles"
          size={22}
          color="#fff"
          style={{ marginRight: 10 }}
        />
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
          Chat với Support
        </Text>
      </TouchableOpacity>

      <LogoutButton />

      {/* --- Header danh sách + Search --- */}
      <View style={styles.tripsHeader}>
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
      <View style={{ flexDirection: "row", marginVertical: 12, marginHorizontal: 6 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 10,
            borderBottomWidth: 2,
            borderBottomColor:
              tab === "created" ? colors.primary : "transparent",
            alignItems: "center",
          }}
          onPress={() => setTab("created")}
        >
          <Text
            style={{
              color:
                tab === "created" ? colors.primary : colors.textSecondary,
              fontWeight: "bold",
            }}
          >
            Chuyến đi của tôi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            padding: 10,
            borderBottomWidth: 2,
            borderBottomColor:
              tab === "shared" ? colors.primary : "transparent",
            alignItems: "center",
          }}
          onPress={() => setTab("shared")}
        >
          <Text
            style={{
              color: tab === "shared" ? colors.primary : colors.textSecondary,
              fontWeight: "bold",
            }}
          >
            Chuyến đi được chia sẻ
          </Text>
        </TouchableOpacity>
      </View>

      {tab === "shared" && pendingShares.length > 0 && (
        <View style={{ marginHorizontal: 12, marginBottom: 10 }}>
          <TouchableOpacity
            onPress={() => setShowPendingShares((prev) => !prev)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: showPendingShares ? 6 : 0,
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                color: colors.textPrimary,
              }}
            >
              Chờ bạn chấp nhận ({pendingShares.length})
            </Text>
            <Ionicons
              name={showPendingShares ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showPendingShares &&
            [...pendingShares]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((share) => (
                <View
                  key={share._id}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: "#f2f7ff",
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{ fontWeight: "600", color: colors.textPrimary }}
                  >
                    {share.trip?.title || "Chuyến đi"}
                  </Text>
                  <Text style={{ color: colors.textSecondary, marginTop: 2 }}>
                    Được chia sẻ bởi: {share.from?.username || "Người dùng"}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: "#ccc",
                        marginRight: 8,
                      }}
                      onPress={async () => {
                        try {
                          await fetch(
                            `${API_URL}/tripSchedule/shares/${share._id}/reject`,
                            {
                              method: "POST",
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );
                          fetchSharedData();
                        } catch (e) {
                          Alert.alert("Lỗi", "Không thể từ chối chia sẻ");
                        }
                      }}
                    >
                      <Text style={{ color: "#777", fontWeight: "500" }}>
                        Từ chối
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        backgroundColor: colors.primary,
                      }}
                      onPress={async () => {
                        try {
                          await fetch(
                            `${API_URL}/tripSchedule/shares/${share._id}/accept`,
                            {
                              method: "POST",
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );
                          fetchAllData();
                        } catch (e) {
                          Alert.alert("Lỗi", "Không thể chấp nhận chia sẻ");
                        }
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "600",
                        }}
                      >
                        Chấp nhận
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
        </View>
      )}

      {tab === "shared" && pendingPostShares.length > 0 && (
        <View style={{ marginHorizontal: 12, marginBottom: 10 }}>
          <TouchableOpacity
            onPress={() => setShowPendingPostShares((prev) => !prev)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: showPendingPostShares ? 6 : 0,
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                color: colors.textPrimary,
              }}
            >
              Chờ bạn chấp nhận - Bài viết ({pendingPostShares.length})
            </Text>
            <Ionicons
              name={showPendingPostShares ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {showPendingPostShares &&
            [...pendingPostShares]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((share) => (
                <View
                  key={share._id}
                  style={{
                    padding: 10,
                    borderRadius: 10,
                    backgroundColor: "#fff3e0",
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{ fontWeight: "600", color: colors.textPrimary }}
                  >
                    {share.post?.title || "Bài viết"}
                  </Text>
                  <Text style={{ color: colors.textSecondary, marginTop: 2 }}>
                    Được chia sẻ bởi: {share.from?.username || "Người dùng"}
                  </Text>
                  {share.post?.content && (
                    <Text
                      style={{
                        color: colors.textSecondary,
                        marginTop: 4,
                        fontSize: 12,
                      }}
                      numberOfLines={2}
                    >
                      {share.post.content}
                    </Text>
                  )}
                  <View
                    style={{
                      flexDirection: "row",
                      marginTop: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <TouchableOpacity
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: "#ccc",
                        marginRight: 8,
                      }}
                      onPress={async () => {
                        try {
                          await fetch(
                            `${API_URL}/posts/shares/${share._id}/reject`,
                            {
                              method: "POST",
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );
                          fetchSharedData();
                        } catch (e) {
                          Alert.alert("Lỗi", "Không thể từ chối chia sẻ");
                        }
                      }}
                    >
                      <Text style={{ color: "#777", fontWeight: "500" }}>
                        Từ chối
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        paddingVertical: 6,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        backgroundColor: colors.primary,
                      }}
                      onPress={async () => {
                        try {
                          await fetch(
                            `${API_URL}/posts/shares/${share._id}/accept`,
                            {
                              method: "POST",
                              headers: { Authorization: `Bearer ${token}` },
                            }
                          );
                          fetchSharedData(); // Fetch lại shared data để cập nhật
                          fetchAllData();
                        } catch (e) {
                          Alert.alert("Lỗi", "Không thể chấp nhận chia sẻ");
                        }
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontWeight: "600",
                        }}
                      >
                        Chấp nhận
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
        </View>
      )}

      <FlatList
        data={tab === "shared" ? displayedSharedTrips : displayedTrips}
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
            <Ionicons
              name="earth-outline"
              size={50}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {tab === "shared"
              ? "Bạn chưa có chuyến đi được chia sẻ nào"
              : "Bạn chưa có chuyến đi nào"}
            </Text>
            {tab === "created" && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push("/CreateScheduleScreen")}
              >
                <Ionicons name="add" size={24} color={colors.white} />
                <Text style={styles.addButtonText}>Tạo chuyến đi mới</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Notification Modal */}
      <Modal
        visible={notificationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "80%",
              paddingTop: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingBottom: 15,
                borderBottomWidth: 1,
                borderBottomColor: colors.border || "#eee",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: colors.textPrimary,
                }}
              >
                Thông báo
              </Text>
              <TouchableOpacity
                onPress={() => setNotificationModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={[
                ...pendingPostShares.map(item => ({ ...item, isPending: true })),
                ...acceptedPostShares.map(item => ({ ...item, isPending: false }))
              ].sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    padding: 15,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border || "#eee",
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: item.isPending ? "transparent" : (colors.cardBackground || "#f9f9f9"),
                  }}
                  onPress={() => {
                    if (!item.isPending && item.post?._id) {
                      // Navigate to post detail - chỉ scroll đến bài viết, không mở comment modal
                      setNotificationModalVisible(false);
                      router.push({
                        pathname: "/(tabs)/feed",
                        params: { 
                          postId: item.post._id
                        },
                      });
                    }
                  }}
                >
                  {item.from?.profileImage ? (
                    <Image
                      source={{
                        uri: item.from.profileImage.includes("/svg?")
                          ? item.from.profileImage.replace("/svg?", "/png?")
                          : item.from.profileImage,
                      }}
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        marginRight: 12,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: 25,
                        backgroundColor: colors.primary + "20",
                        justifyContent: "center",
                        alignItems: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name="person-outline"
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.textPrimary,
                        fontSize: 14,
                        marginBottom: 4,
                      }}
                    >
                      <Text style={{ fontWeight: "600" }}>
                        {item.from?.username || "Người dùng"}
                      </Text>
                      {" đã chia sẻ cho bạn bài viết "}
                      <Text style={{ fontWeight: "600" }}>
                        "{item.post?.title || "bài viết"}"
                      </Text>
                    </Text>
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {new Date(item.createdAt).toLocaleString("vi-VN")}
                    </Text>
                  </View>
                  {item.isPending ? (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: "#ccc",
                        }}
                        onPress={async () => {
                          try {
                            await fetch(
                              `${API_URL}/posts/shares/${item._id}/reject`,
                              {
                                method: "POST",
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            );
                            fetchSharedData();
                          } catch (e) {
                            Alert.alert("Lỗi", "Không thể từ chối chia sẻ");
                          }
                        }}
                      >
                        <Text style={{ color: "#777", fontWeight: "500", fontSize: 12 }}>
                          Từ chối
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          backgroundColor: colors.primary,
                        }}
                        onPress={async () => {
                          try {
                            await fetch(
                              `${API_URL}/posts/shares/${item._id}/accept`,
                              {
                                method: "POST",
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            );
                            fetchSharedData();
                            setNotificationModalVisible(false);
                          } catch (e) {
                            Alert.alert("Lỗi", "Không thể chấp nhận chia sẻ");
                          }
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "600",
                            fontSize: 12,
                          }}
                        >
                          Chấp nhận
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colors.textSecondary}
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View
                  style={{
                    padding: 40,
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name="notifications-off-outline"
                    size={50}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={{
                      color: colors.textSecondary,
                      marginTop: 10,
                    }}
                  >
                    Không có thông báo nào
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Latest Notification Toast */}
      {latestNotification && (
        <View
          style={{
            position: "absolute",
            top: 100,
            left: 20,
            right: 20,
            backgroundColor: colors.cardBackground || "#fff",
            borderRadius: 12,
            padding: 15,
            flexDirection: "row",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            zIndex: 1000,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primary + "20",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12,
            }}
          >
            <Ionicons
              name="document-text-outline"
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontWeight: "600",
                color: colors.textPrimary,
                fontSize: 14,
              }}
            >
              {latestNotification.message}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setLatestNotification(null)}
            style={{ marginLeft: 8 }}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Saved Modal - Hiển thị feed đã lưu và trips đã lưu */}
      <Modal
        visible={savedModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSavedModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: "90%",
              paddingTop: 20,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingBottom: 15,
                borderBottomWidth: 1,
                borderBottomColor: colors.border || "#eee",
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: colors.textPrimary,
                }}
              >
                Đã lưu
              </Text>
              <TouchableOpacity
                onPress={() => setSavedModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Tabs: Posts và Trips */}
            <View
              style={{
                flexDirection: "row",
                marginHorizontal: 20,
                marginTop: 15,
                marginBottom: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.border || "#eee",
              }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderBottomWidth: 2,
                  borderBottomColor:
                    savedTab === "posts" ? colors.primary : "transparent",
                  alignItems: "center",
                }}
                onPress={() => setSavedTab("posts")}
              >
                <Text
                  style={{
                    color:
                      savedTab === "posts"
                        ? colors.primary
                        : colors.textSecondary,
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  Bài viết ({savedPosts.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderBottomWidth: 2,
                  borderBottomColor:
                    savedTab === "trips" ? colors.primary : "transparent",
                  alignItems: "center",
                }}
                onPress={() => setSavedTab("trips")}
              >
                <Text
                  style={{
                    color:
                      savedTab === "trips"
                        ? colors.primary
                        : colors.textSecondary,
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  Chuyến đi ({savedTrips.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content */}
            {savedTab === "posts" ? (
              <FlatList
                data={savedPosts}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <PostCard
                    post={item}
                    onLike={async (postId) => {
                      try {
                        const response = await fetch(
                          `${API_URL}/posts/${postId}/like`,
                          {
                            method: "POST",
                            headers: { Authorization: `Bearer ${token}` },
                          }
                        );
                        if (response.ok) {
                          fetchSavedPosts();
                        }
                      } catch (error) {
                        console.error("Failed to like post:", error);
                      }
                    }}
                    onCommentPress={(postId) => {
                      setSavedModalVisible(false);
                      router.push({
                        pathname: "/(tabs)/feed",
                        params: { postId, openComments: "true" },
                      });
                    }}
                    onDelete={async (postId) => {
                      try {
                        const response = await fetch(
                          `${API_URL}/posts/${postId}`,
                          {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                          }
                        );
                        if (response.ok) {
                          fetchSavedPosts();
                        }
                      } catch (error) {
                        Alert.alert("Lỗi", "Không thể xóa bài viết");
                      }
                    }}
                    currentUserId={userInfo?._id}
                    userSavedPosts={userInfo?.savedPosts || []}
                    onSave={async (postId) => {
                      try {
                        await fetch(`${API_URL}/posts/${postId}/save`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        fetchSavedPosts();
                        fetchUserInfo();
                      } catch (error) {
                        console.error("Failed to save post:", error);
                      }
                    }}
                    onStatusChange={(postId, newStatus) => {
                      setSavedPosts((prevPosts) =>
                        prevPosts.map((p) =>
                          p._id === postId ? { ...p, status: newStatus } : p
                        )
                      );
                    }}
                  />
                )}
                contentContainerStyle={{ padding: 12 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View
                    style={{
                      padding: 40,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={50}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={{
                        color: colors.textSecondary,
                        marginTop: 10,
                      }}
                    >
                      Chưa có bài viết nào được lưu
                    </Text>
                  </View>
                }
              />
            ) : (
              <FlatList
                data={savedTrips}
                keyExtractor={(item) => item._id}
                renderItem={renderTripItem}
                contentContainerStyle={{ padding: 12 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View
                    style={{
                      padding: 40,
                      alignItems: "center",
                    }}
                  >
                    <Ionicons
                      name="earth-outline"
                      size={50}
                      color={colors.textSecondary}
                    />
                    <Text
                      style={{
                        color: colors.textSecondary,
                        marginTop: 10,
                      }}
                    >
                      Chưa có chuyến đi nào được lưu
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Modal sửa lịch trình */}
      {editModalVisible && (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9,
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 18,
              padding: 24,
              width: "89%",
              shadowColor: "#1879d8",
              elevation: 13,
            }}
          >
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 18,
                marginBottom: 13,
                color: "#1976d2",
                textAlign: "center",
              }}
            >
              Chỉnh sửa lịch trình
            </Text>
            <Text style={{ fontSize: 15, marginBottom: 5 }}>
              Tên lịch trình
            </Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
              style={{
                borderColor: "#d5e0f2",
                borderWidth: 1.3,
                borderRadius: 9,
                padding: 9,
                fontSize: 15,
                marginBottom: 15,
                color: "#172965",
              }}
              placeholder="Nhập tên lịch trình"
            />
            <Text style={{ fontSize: 15, marginBottom: 5 }}>
              Mô tả (tuỳ chọn)
            </Text>
            <TextInput
              value={editDesc}
              onChangeText={setEditDesc}
              style={{
                borderColor: "#d5e0f2",
                borderWidth: 1.1,
                borderRadius: 9,
                padding: 9,
                fontSize: 15,
                marginBottom: 15,
                color: "#172965",
                minHeight: 38,
              }}
              placeholder="Mô tả nhanh chuyến đi"
              multiline
            />
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 13,
              }}
            >
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: editPublic ? "#d0f2ff" : "#eee",
                  borderWidth: 1,
                  borderColor: "#1b9cec",
                  borderRadius: 8,
                  padding: 6,
                  marginRight: 10,
                }}
                onPress={() => setEditPublic(true)}
              >
                <Ionicons name="earth" size={17} color="#169be1" />
                <Text
                  style={{
                    marginLeft: 6,
                    color: "#169be1",
                    fontWeight: "bold",
                  }}
                >
                  Công khai
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: !editPublic ? "#ffe6f3" : "#eee",
                  borderWidth: 1,
                  borderColor: "#f058a0",
                  borderRadius: 8,
                  padding: 6,
                }}
                onPress={() => setEditPublic(false)}
              >
                <Ionicons name="lock-closed" size={17} color="#e03470" />
                <Text
                  style={{
                    marginLeft: 6,
                    color: "#e03470",
                    fontWeight: "bold",
                  }}
                >
                  Riêng tư
                </Text>
              </TouchableOpacity>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginTop: 8,
              }}
            >
              <TouchableOpacity
                style={{
                  marginRight: 17,
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                }}
                onPress={() => setEditModalVisible(false)}
              >
                <Text
                  style={{ color: "#999", fontWeight: "bold", fontSize: 16 }}
                >
                  Huỷ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#1879d8",
                  borderRadius: 7,
                  paddingHorizontal: 22,
                  paddingVertical: 12,
                  minWidth: 90,
                  alignItems: "center",
                }}
                disabled={savingEdit}
                onPress={async () => {
                  if (!editTitle.trim()) {
                    Alert.alert("Thiếu tên lịch trình!");
                    return;
                  }
                  setSavingEdit(true);
                  try {
                    const response = await fetch(
                      `${API_URL}/tripSchedule/${editTrip._id}`,
                      {
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
                      }
                    );
                    if (!response.ok) {
                      const data = await response.json();
                      throw new Error(data.error || "Sửa lịch trình lỗi");
                    }
                    await fetchUserTrips();
                    setEditModalVisible(false);
                    Alert.alert("Cập nhật thành công!");
                  } catch (e) {
                    Alert.alert(
                      "Lỗi",
                      e.message?.toString() || "Không cập nhật được"
                    );
                  } finally {
                    setSavingEdit(false);
                  }
                }}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text
                    style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
                  >
                    Lưu
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

export default Profile;
