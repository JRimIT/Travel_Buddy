import React, { useEffect, useState, useRef } from "react";
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
  Animated,
  Easing,
  TextInput,
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
import api from "../../utils/apiClient";

const TravelSchedulePublicScreen = () => {
  const { colors } = useTheme();
  const styles = createHomeStyles(colors);
  const { token, user, setUser } = useAuthStore();
  const router = useRouter();

  const [rawData, setRawData] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savedTrips, setSavedTrips] = useState(user?.savedTripSchedules || []);

  // Search/filter/sort states
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // or "oldest"
  const [destinationFilter, setDestinationFilter] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);

  const searchAnim = useRef(new Animated.Value(0)).current;

  const fetchSchedules = async () => {
    try {
      const response = await api.get(`/tripSchedule/public`);
      const res = await response.data;
      setRawData(res);
      setData(res || []);
    } catch (e) {
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

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchSchedules(), fetchSavedTrips()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAllData();
  }, [token]);

  useEffect(() => {
    let filtered = rawData;

    // Tìm kiếm đa trường
    if (searchText.trim()) {
      const query = searchText.trim().toLowerCase();
      filtered = filtered.filter(item =>
        (item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.user?.username?.toLowerCase().includes(query) ||
          item.destination?.toLowerCase().includes(query))||
          item.province?.toLowerCase().includes(query)
      );
    }
    // Lọc nơi đến
    if (destinationFilter) {
      filtered = filtered.filter(item =>
        item.destination?.toLowerCase().includes(destinationFilter.toLowerCase())
      );
    }
    // Sắp xếp
    

    filtered = filtered.slice().sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortBy === "newest" ? db - da : da - db;
    });

    setData(filtered);
  }, [searchText, sortBy, destinationFilter, rawData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  const handleDetail = (item) => {
    router.push({ pathname: "/(page)/ScheduleDetailScreen", params: { id: item._id } });
  };

  const handleSaveTrip = async (tripId) => {
    const isCurrentlySaved = savedTrips.includes(tripId);
    const updatedSavedTrips = isCurrentlySaved
      ? savedTrips.filter(id => id !== tripId)
      : [...savedTrips, tripId];
    setSavedTrips(updatedSavedTrips);
    setUser({ ...user, savedTripSchedules: updatedSavedTrips });

    try {
      const response = await fetch(`${API_URL}/tripSchedule/${tripId}/save`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
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

  // Nút search bar animation show/hide
  const toggleSearchBar = () => {
    setShowSearchBar(val => {
      Animated.timing(searchAnim, {
        toValue: !val ? 1 : 0,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease)
      }).start();
      return !val;
    });
  };

  // Tạo destination (nơi đến) duy nhất cho dropdown
  const destinationList = [...new Set(rawData.map(item => item.destination).filter(Boolean))];

  const renderItem = ({ item }) => {
    const isSaved = savedTrips.includes(item._id);

    const handleShareTrip = async () => {
      try {
        await Share.share({
          message: `Thử xem lịch trình này nhé: ${item.title} | Travel Buddy`,
        });
      } catch (error) {
        // ignore
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
            <Text style={{ color: colors.primary, fontSize: 13, marginTop: 3 }}>
              {item.destination ? `Địa điểm: ${item.destination}` : ""}
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

      {/* Nút Search nổi */}
      {!showSearchBar &&
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 18,
            right: 22,
            zIndex: 99,
            backgroundColor: colors.primary,
            borderRadius: 24,
            padding: 7,
            shadowColor: "#000",
            shadowOpacity: 0.12,
            elevation: 4,
          }}
          activeOpacity={0.92}
          onPress={toggleSearchBar}
        >
          <Ionicons name="search-outline" size={28} color="#fff"/>
        </TouchableOpacity>
      }

      {/* Search + Filter + Sắp xếp (ẩn/hiện + animation) */}
      <Animated.View
        style={{
          opacity: searchAnim,
          transform: [{
            translateY: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [-56, 0] })
          }],
          marginTop: 14,
        }}
        pointerEvents={showSearchBar ? "auto" : "none"}
      >
        {showSearchBar && (
          <View style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            padding: 14,
            marginHorizontal: 14,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            elevation: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}>
            {/* Search input */}
            <TextInput
              style={{
                flex: 1,
                paddingVertical: 3,
                paddingHorizontal: 13,
                borderRadius: 8,
                borderColor: colors.border,
                borderWidth: 1,
              }}
              value={searchText}
              placeholder="Tìm theo tên, mô tả, người đăng..."
              placeholderTextColor={colors.placeholderText}
              onChangeText={setSearchText}
              autoFocus
            />

            {/* Destination filter */}
            <TouchableOpacity onPress={() => setDestinationFilter("")}>
              <Ionicons name={destinationFilter ? "close-circle" : "location-outline"} size={23} color={colors.primary}/>
            </TouchableOpacity>
            {destinationList.length > 0 &&
              <TouchableOpacity
                style={{ paddingHorizontal: 1 }}
                onPress={() => {
                  Alert.alert(
                    "Lọc nơi đến",
                    "Chọn nơi đến để lọc:",
                    destinationList.map(dest => ({
                      text: dest,
                      onPress: () => setDestinationFilter(dest)
                    })),
                    {
                      cancelable: true
                    }
                  );
                }}>
                <Ionicons name="filter" size={20} color={destinationFilter ? colors.primary : "#888"} />
              </TouchableOpacity>
            }

            {/* Sort button */}
            <TouchableOpacity onPress={() => setSortBy(s => s === "newest" ? "oldest" : "newest")}>
              <Ionicons name={sortBy === "newest" ? "arrow-up" : "arrow-down"} size={23} color={colors.primary}/>
            </TouchableOpacity>

            {/* Đóng search bar */}
            <TouchableOpacity onPress={toggleSearchBar}>
              <Ionicons name="close" size={26} color="#666"/>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

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
      {/* nút "+" mặc định */}
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
    </View>
  );
};

export default TravelSchedulePublicScreen;
