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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API_URL } from "../../constants/api";
import { useTheme } from "../../contexts/ThemeContext";
import createHomeStyles from "../../assets/styles/home.styles";
import { formatPublishDate } from "../../lib/utils";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";

const TravelSchedulePublicScreen = () => {
  const { colors } = useTheme();
  const styles = createHomeStyles(colors);
 const {  token } = useAuthStore();

  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Lấy Lịch trình Public
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/tripSchedule/public`, {
        method: "GET",
       headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const res = await response.json();
      console.log("res: ", res);
      
      setData(res); // có thể là res.schedules tùy backend
    } catch (e) {
      Alert.alert("Lỗi", "Không thể lấy dữ liệu lịch trình public.\n" + e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSchedules(); }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchedules();
  };

  const handleDetail = (item: any) => {
    router.push({ pathname: "/(page)/ScheduleDetailScreen", params:  { id: item._id } });

  };

  // Card lịch trình public
  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.bookCard}
      activeOpacity={0.86}
      onPress={() => handleDetail(item)}
    >
      {/* Avatar User + Username */}
      <View style={styles.bookHeader}>
        <View style={styles.userInfo}>
         <Image source={{ uri: item.user?.profileImage }} style={styles.avatar} />
          <Text style={styles.username}>{item.user?.username || "Unknown"}</Text>
        </View>
      </View>

      {/* Ảnh đại diện lịch trình */}
      <View style={styles.bookImageContainer}>
              <Image source={{ uri: item.image }} style={styles.bookImage} />
            </View>

      {/* Nội dung Lịch trình */}
      <View style={styles.bookDetails}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.caption} numberOfLines={2}>{item.description}</Text>
        ): null}
        <Text style={styles.date}>
          Public {item.createdAt ? formatPublishDate(item.createdAt) : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={{fontSize:21, fontWeight:"bold", color:colors.primary, margin:16, marginBottom:0}}>
        Lịch trình cộng đồng
      </Text>

      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item._id}
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
