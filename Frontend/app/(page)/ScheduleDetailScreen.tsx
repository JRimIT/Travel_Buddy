import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { API_URL } from "../../constants/api";
import { useTheme } from "../../contexts/ThemeContext";
import { formatPublishDate } from "../../lib/utils";
import { useRoute } from "@react-navigation/native";
import { useAuthStore } from "../../store/authStore";
import { router } from "expo-router";
import COLORS from "../../constants/colors";
import DateTimePicker from "@react-native-community/datetimepicker";

// Helper định dạng ngày tiếng Việt
function beautifyDate(dateStr) {
  if (!dateStr) return "";
  let d = new Date(dateStr);
  if (isNaN(+d)) return dateStr;
  const days = [
    "Chủ nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  let thu = days[d.getDay()];
  return `${thu}, ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
}

const transportIcons = {
  "Máy bay": (
    <MaterialCommunityIcons name="airplane" size={22} color="#41b1ff" />
  ),
  "Tàu hỏa": <FontAwesome5 name="train" size={20} color="#7c5efa" />,
  "Xe khách": <Ionicons name="bus" size={22} color="#ed881a" />,
  "Xe máy": <Ionicons name="bicycle-outline" size={22} color="#33bc7f" />,
  "Ô tô": <MaterialCommunityIcons name="car" size={22} color="#3b6bb3" />,
  Taxi: <Ionicons name="car-sport-outline" size={22} color="#eaa620" />,
  "Xe bus": <Ionicons name="bus" size={22} color="#37a6ce" />,
  "Xe đạp": <FontAwesome5 name="bicycle" size={20} color="#30bc3e" />,
  "Xe điện": <Ionicons name="train-outline" size={22} color="#54c4fa" />,
};

const ScheduleDetailScreen = () => {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const { user, token } = useAuthStore();
  const id = route.params?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareUsername, setShareUsername] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [selectedActivityIndex, setSelectedActivityIndex] = useState(null);
  const [activityTime, setActivityTime] = useState("");
  const [activityName, setActivityName] = useState("");
  const [activityCost, setActivityCost] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
   const [displayCost, setDisplayCost] = useState("");

  useEffect(() => {
    fetchScheduleDetail();
    // eslint-disable-next-line
  }, [id]);

  const fetchScheduleDetail = async () => {
    setLoading(true);
    try {
      // In ra id để kiểm tra
      console.log("Fetch detail với id:", id);

      const res = await fetch(`${API_URL}/tripSchedule/${id}`);
      const json = await res.json();
      console.log("Chi tiết trả về từ server:", json); // DEBUG
      setData(json);
    } catch (err) {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  function formatCurrency(amount) {
  if (!amount || amount === 0) return "0đ";
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
  const handleCostChange = (text) => {
    // Chỉ cho phép số
    const numericValue = text.replace(/[^0-9]/g, '');
    setActivityCost(numericValue);
    
    // Format để hiển thị
    if (numericValue) {
      setDisplayCost(new Intl.NumberFormat('vi-VN').format(parseInt(numericValue)));
    } else {
      setDisplayCost('');
    }
  };

  // ⭐ TOGGLE CHECKBOX HOÀN THÀNH
  const toggleActivityCompleted = async (
    dayIndex: number,
    activityIndex: number
  ) => {
    try {
      const updatedDays = JSON.parse(JSON.stringify(data.days)); // Deep clone
      const currentCompleted =
        updatedDays[dayIndex].activities[activityIndex].completed;
      updatedDays[dayIndex].activities[activityIndex].completed =
        !currentCompleted;

      const res = await fetch(`${API_URL}/tripSchedule/${id}/activities`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          dayIndex,
          activityIndex,
          completed: !currentCompleted,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setData({ ...data, days: updatedDays });
      } else {
        Alert.alert("Lỗi", json.error || "Không thể cập nhật trạng thái");
      }
    } catch (e) {
      console.error("Toggle completed error:", e);
      Alert.alert("Lỗi", "Không thể kết nối server");
    }
  };

  // ⭐ MỞ MODAL THÊM HOẠT ĐỘNG MỚI
    const openAddActivityModal = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex);
    setSelectedActivityIndex(null);
    setActivityTime("");
    setActivityName("");
    setActivityCost("");
    setDisplayCost("");  // ⭐ THÊM
    setSelectedTime(new Date());
    setEditModalVisible(true);
  };


  // ⭐ MỞ MODAL CHỈNH SỬA HOẠT ĐỘNG
    const openEditActivityModal = (dayIndex: number, activityIndex: number) => {
    const activity = data.days[dayIndex].activities[activityIndex];
    setSelectedDayIndex(dayIndex);
    setSelectedActivityIndex(activityIndex);
    setActivityName(activity.name || "");
    
    // ⭐ XỬ LÝ COST VỚI FORMAT
    const cost = activity.cost ? String(activity.cost) : "";
    setActivityCost(cost);
    if (cost) {
      setDisplayCost(new Intl.NumberFormat('vi-VN').format(parseInt(cost)));
    } else {
      setDisplayCost("");
    }
    
    // Xử lý TIME
    const timeStr = activity.time || "";
    setActivityTime(timeStr);
    
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours) || 0);
      date.setMinutes(parseInt(minutes) || 0);
      setSelectedTime(date);
    } else {
      setSelectedTime(new Date());
    }
    
    setEditModalVisible(true);
  };


  // ⭐ XỬ LÝ KHI CHỌN THỜI GIAN
  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false);
    }

    if (date) {
      setSelectedTime(date);
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      setActivityTime(`${hours}:${minutes}`);
    }
  };

  // ⭐ XÓA HOẠT ĐỘNG
  const handleDeleteActivity = async (
    dayIndex: number,
    activityIndex: number
  ) => {
    Alert.alert("Xác nhận xóa", "Bạn có chắc muốn xóa hoạt động này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await fetch(
              `${API_URL}/tripSchedule/${id}/activities/${dayIndex}/${activityIndex}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const json = await res.json();
            if (json.success) {
              const updatedDays = JSON.parse(JSON.stringify(data.days));
              updatedDays[dayIndex].activities.splice(activityIndex, 1);
              setData({ ...data, days: updatedDays });
              Alert.alert("Thành công", "Đã xóa hoạt động");
            } else {
              Alert.alert("Lỗi", json.error || "Không thể xóa hoạt động");
            }
          } catch (e) {
            console.error("Delete activity error:", e);
            Alert.alert("Lỗi", "Không thể kết nối server");
          }
        },
      },
    ]);
  };

  // ⭐ LƯU HOẠT ĐỘNG (THÊM MỚI HOẶC CHỈNH SỬA)
    // ⭐ LƯU HOẠT ĐỘNG (THÊM MỚI HOẶC CHỈNH SỬA) - CÓ SẮP XẾP THEO THỜI GIAN
  const handleSaveActivity = async () => {
    if (!activityName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên hoạt động");
      return;
    }

    setEditLoading(true);
    try {
      const activityData = {
        time: activityTime.trim(),
        name: activityName.trim(),
        cost: activityCost.trim() ? parseFloat(activityCost) : 0,
      };

      let res;
      if (selectedActivityIndex !== null) {
        // CHỈNH SỬA hoạt động cũ
        res = await fetch(
          `${API_URL}/tripSchedule/${id}/activities/${selectedDayIndex}/${selectedActivityIndex}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(activityData),
          }
        );
      } else {
        // THÊM hoạt động mới
        res = await fetch(
          `${API_URL}/tripSchedule/${id}/activities/${selectedDayIndex}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(activityData),
          }
        );
      }

      const json = await res.json();
      if (json.success) {
        // ⭐⭐⭐ SẮP XẾP HOẠT ĐỘNG THEO THỜI GIAN ⭐⭐⭐
        const updatedTrip = { ...json.trip };
        updatedTrip.days = updatedTrip.days.map((day) => {
          if (Array.isArray(day.activities)) {
            // Sắp xếp activities theo thời gian
            day.activities.sort((a, b) => {
              const timeA = a.time || "23:59";
              const timeB = b.time || "23:59";
              return timeA.localeCompare(timeB);
            });
          }
          return day;
        });

        setData(updatedTrip);
        setEditModalVisible(false);
        Alert.alert(
          "Thành công",
          selectedActivityIndex !== null
            ? "Đã cập nhật hoạt động"
            : "Đã thêm hoạt động mới"
        );
      } else {
        Alert.alert("Lỗi", json.error || "Không thể lưu hoạt động");
      }
    } catch (e) {
      console.error("Save activity error:", e);
      Alert.alert("Lỗi", "Không thể kết nối server");
    } finally {
      setEditLoading(false);
    }
  };


  const handleGoToBookingPage = (user, scheduleId, fromLocation, province) => {
    router.push({
      pathname: "/BookFlightScreen",
      params: { user, scheduleId, fromLocation, province },
    });
  };
  const updateBookingStatus = async (status: string) => {
    try {
      const res = await fetch(`${API_URL}/tripSchedule/${id}/booking`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingStatus: status }),
      });

      const json = await res.json();
      if (json.success) {
        Alert.alert("Thành công", "Đã gửi yêu cầu đặt giúp!");
        fetchScheduleDetail(); // load lại data
      } else {
        Alert.alert("Lỗi", json.error || "Không thể cập nhật!");
      }
    } catch (e) {
      Alert.alert("Lỗi", "Không thể kết nối server!");
    }
  };

  const handleGoToEditPage = () => {
    console.log("=== DEBUG: handleGoToEditPage called ===");
    if (!data || !data._id) {
      console.log("No data or _id, cannot navigate to edit.", data);
      return;
    }

    const s: any = data as any;
    const tripStartDate =
      s.startDate || (Array.isArray(s.days) && s.days[0]?.date) || "";
    const tripEndDate =
      s.endDate ||
      (Array.isArray(s.days) && s.days[s.days.length - 1]?.date) ||
      "";

    const params = {
      id: s._id,
      title: s.title || "",
      description: s.description || "",
      isPublic: s.isPublic ? "true" : "false",
      fromLocation: s.fromLocation || "",
      province: s.province || "",
      mainTransport: s.mainTransport || "",
      innerTransport: s.innerTransport || "",
      budgetHotel:
        (s.budget && typeof s.budget.hotel !== "undefined"
          ? String(s.budget.hotel)
          : "") || "",
      budgetFlight:
        (s.budget && typeof s.budget.flight !== "undefined"
          ? String(s.budget.flight)
          : "") || "",
      budgetFun:
        (s.budget && typeof s.budget.fun !== "undefined"
          ? String(s.budget.fun)
          : "") || "",
      homeName: s.home?.name || "",
      homeAddress: s.home?.address || "",
      homePhone: s.home?.phone || "",
      homeWebsite: s.home?.website || "",
      startDate: tripStartDate || "",
      endDate: tripEndDate || "",
      editMode: "clone", // chỉnh sửa từ trang chi tiết -> lưu thành bài mới
    };

    console.log(
      "Navigating to /(page)/ScheduleEditScreen with params:",
      params
    );

    router.push({
      pathname: "/(page)/ScheduleEditScreen",
      params,
    });
  };

  const handleShareTrip = async () => {
    if (!data || !data._id) return;
    if (!shareUsername.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên người nhận chia sẻ");
      return;
    }
    if (!token) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để chia sẻ lịch trình");
      return;
    }
    setShareLoading(true);
    try {
      const res = await fetch(`${API_URL}/tripSchedule/${data._id}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUsername: shareUsername.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Không thể chia sẻ lịch trình");
      }
      Alert.alert("Thành công", "Đã gửi lời mời chia sẻ lịch trình");
      setShareModalVisible(false);
      setShareUsername("");
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || "Không thể chia sẻ lịch trình");
    } finally {
      setShareLoading(false);
    }
  };
  if (loading)
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size={"large"} color={colors.primary} />
      </View>
    );
  if (!data)
    return (
      <View style={styles.loaderContainer}>
        <Text style={[styles.notFoundText, { color: colors.textPrimary }]}>
          Không tìm thấy lịch trình!
        </Text>
      </View>
    );

  const s = data;

  const hasHotelDefault =
    !!s.hotelDefault &&
    Object.values(s.hotelDefault).some(
      (v) => v !== null && v !== undefined && String(v).trim() !== ""
    );

  const hasHome =
    !!s.home &&
    Object.values(s.home).some(
      (v) => v !== null && v !== undefined && String(v).trim() !== ""
    );

  let baseStay: any = null;
  let baseLabel = "";

  // ƯU TIÊN chỗ ở mà bạn chỉnh trong form (home) nếu có dữ liệu
  if (hasHome) {
    baseStay = s.home;
    baseLabel = "Nhà riêng / Chỗ ở";
  } else if (hasHotelDefault) {
    // Chỉ khi không có home mới dùng khách sạn mặc định của trip gốc
    baseStay = s.hotelDefault;
    baseLabel = "Khách sạn mặc định";
  }
  const baseIcon =
    baseLabel === "Nhà riêng / Chỗ ở" ? (
      <Ionicons name="home" size={18} color="#00b49d" />
    ) : (
      <Ionicons name="business" size={18} color={colors.primary} />
    );

  const a = data;

  // THÊM 3 DÒNG NÀY ĐỂ DEBUG – QUAN TRỌNG NHẤT!!!
  console.log("=== DEBUG REVIEW DATA ===");
  console.log("data.averageRating:", data.averageRating);
  console.log("data.reviewCount:", data.reviewCount);
  console.log("data.reviews:", data.reviews);
  console.log("==========================");

  const tripStartDate =
    s.startDate || (Array.isArray(s.days) && s.days[0]?.date) || null;
  const tripEndDate =
    s.endDate ||
    (Array.isArray(s.days) && s.days[s.days.length - 1]?.date) ||
    null;
  const fromLocationStr = s.fromLocation || "";
  const provinceStr = s.province || "";
  console.log("fromLocation: ", fromLocationStr);
  console.log("province: ", provinceStr);
  return (
    <>
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.shareModalOverlay}>
          <View
            style={[
              styles.shareModalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.shareTitle, { color: colors.textPrimary }]}>
              Chia sẻ lịch trình này
            </Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 8 }}>
              Nhập username của người nhận:
            </Text>
            <TextInput
              value={shareUsername}
              onChangeText={setShareUsername}
              placeholder="Ví dụ: friend123"
              placeholderTextColor={colors.placeholderText}
              style={[
                styles.shareInput,
                { borderColor: colors.border, color: colors.textPrimary },
              ]}
              autoCapitalize="none"
            />
            <View style={styles.shareActions}>
              <TouchableOpacity
                style={styles.shareCancelBtn}
                onPress={() => {
                  setShareModalVisible(false);
                  setShareUsername("");
                }}
                disabled={shareLoading}
              >
                <Text
                  style={{ color: colors.textSecondary, fontWeight: "500" }}
                >
                  Hủy
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.shareConfirmBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: shareLoading ? 0.7 : 1,
                  },
                ]}
                onPress={handleShareTrip}
                disabled={shareLoading}
              >
                {shareLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Gửi</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Ảnh đại diện */}
        {s.image && (
          <Image
            source={{
              uri: s.image.startsWith("data:")
                ? s.image
                : `data:image/jpeg;base64,${s.image}`,
            }}
            style={styles.avatar}
            resizeMode="cover"
          />
        )}

        {/* Thông tin chung + nơi xuất phát + tỉnh thành */}
        <View
          style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 7,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {s.user && (
                <Image
                  source={{
                    uri:
                      s.user.profileImage ||
                      `https://ui-avatars.com/api/?name=${
                        s.user.username?.charAt(0) ?? "U"
                      }`,
                  }}
                  style={[styles.profileImage, { borderColor: colors.border }]}
                />
              )}
              <View>
                <Text style={[styles.headerTitle, { color: colors.primary }]}>
                  {s.title || "Chuyến đi"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="person-circle"
                    size={16}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.headerSub, { color: colors.textSecondary }]}
                  >
                    {s.user?.username || "User"}{" "}
                    <Text
                      style={{
                        fontWeight: "400",
                        fontStyle: "italic",
                        color: colors.placeholderText,
                        marginLeft: 8,
                      }}
                    >
                      {s.isPublic ? "Công khai" : "Riêng tư"}
                    </Text>
                  </Text>
                </View>
              </View>
            </View>
            {user?.username === s.user?.username && (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  style={[styles.iconCircleBtn, { marginRight: 8 }]}
                  onPress={() => setShareModalVisible(true)}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconCircleBtn}
                  onPress={handleGoToEditPage}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
          {s.description ? (
            <>
              <MaterialCommunityIcons
                name="notebook-outline"
                size={18}
                color={colors.textSecondary}
                style={{ marginBottom: 2 }}
              />
              <Text style={[styles.caption, { color: colors.textDark }]}>
                {s.description}
              </Text>
            </>
          ) : null}
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {s.createdAt ? formatPublishDate(s.createdAt) : ""}
          </Text>
          {(tripStartDate || tripEndDate) && (
            <Text style={styles.dateRange}>
              Thời gian:{" "}
              <Text style={{ color: colors.primary }}>
                {tripStartDate ? beautifyDate(tripStartDate) : "..."}
              </Text>
              {" - "}
              <Text style={{ color: colors.primary }}>
                {tripEndDate ? beautifyDate(tripEndDate) : "..."}
              </Text>
            </Text>
          )}
          <View style={styles.locationInfo}>
            {!!fromLocationStr && (
              <Text
                style={[
                  styles.currentLocationText,
                  { color: colors.textPrimary },
                ]}
              >
                <Ionicons name="navigate" size={17} color={colors.primary} />{" "}
                Xuất phát: {fromLocationStr}
              </Text>
            )}
            {!!provinceStr && (
              <Text
                style={[styles.provinceText, { color: colors.textSecondary }]}
              >
                <Ionicons name="location" size={15} color={colors.primary} />{" "}
                Tỉnh/Thành: {provinceStr}
              </Text>
            )}
          </View>
        </View>

        {/* Quỹ tiền và phương tiện tổng quát */}
        <View
          style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.infoTitle, { color: colors.textDark }]}>
            Thông tin hành trình
          </Text>
          <View style={styles.transportRow}>
            <Text style={{ color: colors.primary }}>
              {transportIcons[s.mainTransport] || (
                <Ionicons name="car-sport" size={18} />
              )}{" "}
              Phương tiện chính:
              <Text style={{ fontWeight: "bold", color: colors.textPrimary }}>
                {" "}
                {s.mainTransport || "Không có"}
              </Text>
            </Text>
            <Text style={{ color: "#218a32" }}>
              {transportIcons[s.innerTransport] || (
                <Ionicons name="walk" size={18} />
              )}{" "}
              Nội thành:
              <Text style={{ fontWeight: "bold", color: colors.textPrimary }}>
                {" "}
                {s.innerTransport || "Không có"}
              </Text>
            </Text>
          </View>
          <View style={styles.budgetRow}>
            <View style={{ alignItems: "center" }}>
              {baseIcon}
              <Text style={{ color: colors.textPrimary }}>{baseLabel}</Text>
              <Text style={{ fontWeight: "bold", color: colors.primary }}>
                {(s.budget?.hotel || 0).toLocaleString()} VNĐ
              </Text>
            </View>
            <View
              style={{ alignItems: "center", marginLeft: 20, marginRight: 20 }}
            >
              <Ionicons name="airplane" size={18} color={colors.primary} />
              <Text style={{ color: colors.textPrimary }}>Đi tới</Text>
              <Text style={{ fontWeight: "bold", color: colors.primary }}>
                {(s.budget?.flight || 0).toLocaleString()} VNĐ
              </Text>
            </View>
            <View style={{ alignItems: "center" }}>
              <Ionicons name="musical-notes" size={18} color={colors.primary} />
              <Text style={{ color: colors.textPrimary }}>Đi chơi</Text>
              <Text style={{ fontWeight: "bold", color: colors.primary }}>
                {(s.budget?.fun || 0).toLocaleString()} VNĐ
              </Text>
            </View>
          </View>
        </View>

        {/* Home hoặc Hotel Default */}
        {baseStay && (
          <View
            style={[styles.footer, { backgroundColor: colors.cardBackground }]}
          >
            <Text style={[styles.footerTitle, { color: colors.primary }]}>
              {baseLabel}
            </Text>
            <Text style={{ marginBottom: 3, color: colors.textPrimary }}>
              {baseIcon}{" "}
              {baseStay.name || baseStay.address || baseStay.address_line1}
            </Text>
            {baseStay.address_line2 && (
              <Text style={{ marginBottom: 3, color: colors.textSecondary }}>
                {baseStay.address_line2}
              </Text>
            )}
            {baseStay.phone && (
              <Text style={{ marginBottom: 3 }}>
                <Ionicons name="call" size={12} color={colors.textPrimary} />{" "}
                {baseStay.phone || baseStay.contact?.phone}
              </Text>
            )}
            {baseStay.website && (
              <Text style={{ marginBottom: 2, color: "#2186fb" }}>
                {baseStay.website}
              </Text>
            )}
          </View>
        )}

        {/* Vé máy bay nếu có */}
        {s.flightTicket && s.flightTicket.content && (
          <View
            style={[styles.footer, { backgroundColor: colors.cardBackground }]}
          >
            <Text style={[styles.footerTitle, { color: colors.primary }]}>
              Vé máy bay
            </Text>
            <Text style={{ color: colors.textPrimary, marginBottom: 3 }}>
              <Ionicons
                name="airplane"
                size={16}
                color={colors.textSecondary}
              />{" "}
              {s.flightTicket.content.outboundLeg?.originAirport?.skyCode ||
                "-"}{" "}
              →{" "}
              {s.flightTicket.content.outboundLeg?.destinationAirport
                ?.skyCode || "-"}
            </Text>
            <Text style={{ color: colors.textSecondary, marginBottom: 2 }}>
              Ngày đi:{" "}
              {s.flightTicket.content.outboundLeg?.localDepartureDateLabel ||
                s.flightTicket.content.outboundLeg?.localDepartureDate ||
                "-"}
            </Text>
            <Text
              style={{
                color: colors.primary,
                fontWeight: "bold",
                marginBottom: 3,
              }}
            >
              Giá:{" "}
              {typeof s.flightTicket.content.price === "string"
                ? s.flightTicket.content.price
                : `${s.flightTicket.content.price} USD`}
            </Text>
            <Text style={{ color: colors.textSecondary }}>
              {s.flightTicket.content.direct ? "Bay thẳng" : "Có điểm dừng"}
            </Text>
          </View>
        )}

        {user.username === s.user.username && (
          <View style={styles.bookingButtonWrap}>
            {/* Nút đặt vé máy bay */}
            <TouchableOpacity
              style={[
                styles.bookingButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
              onPress={() =>
                handleGoToBookingPage(user, s._id, fromLocationStr, provinceStr)
              }
            >
              <Ionicons
                name="airplane"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
                Bạn có muốn đặt giúp vé máy bay?
              </Text>
            </TouchableOpacity>
            {/* ⭐ Nút ĐẶT GIÚP ⭐ */}
            <TouchableOpacity
              style={[
                styles.bookingButton,
                {
                  backgroundColor: "#ff9800",
                  shadowColor: "#ff9800",
                  marginTop: 12,
                },
              ]}
              onPress={() =>
                Alert.alert("Xác nhận", "Bạn có chắc muốn đặt giúp không?", [
                  { text: "Hủy", style: "cancel" },
                  {
                    text: "Có đặt giúp",
                    onPress: () => updateBookingStatus("booking_pending"),
                  },
                ])
              }
            >
              <Ionicons
                name="hand-left-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
                Đặt giúp
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Lịch từng ngày */}
        {/* ⭐⭐⭐ LỊCH TỪNG NGÀY VỚI CHECKBOX & NÚT THÊM/SỬA/XÓA ⭐⭐⭐ */}
        <View
          style={[styles.dayCard, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.dayTitle, { color: colors.primary }]}>
            Lịch trình từng ngày
          </Text>

          {/* Kiểm tra nếu không có lịch trình */}
          {Array.isArray(s.days) && s.days.length === 0 && (
            <Text style={styles.noData}>Chưa có dữ liệu lịch trình.</Text>
          )}

          {/* Map qua từng ngày */}
          {Array.isArray(s.days) &&
            s.days.map((day, dayIdx) => {
              const safeDay = day || {};
              const dayNumber = safeDay.day ?? dayIdx + 1;

              // Tạo title cho ngày
              let dayTitle = `Ngày ${dayNumber}`;
              if (safeDay.label && safeDay.label !== "")
                dayTitle += ` - ${safeDay.label}`;
              if (safeDay.date && safeDay.date !== "")
                dayTitle += ` | ${beautifyDate(safeDay.date)}`;

              const activities = Array.isArray(safeDay.activities)
                ? safeDay.activities
                : [];

              // ⭐ Kiểm tra quyền sở hữu
              const isOwner = user?.username === s.user?.username;

              return (
                <View key={dayIdx} style={{ marginBottom: 15, width: "100%" }}>
                  {/* ⭐ HEADER NGÀY + NÚT THÊM */}
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <Text style={styles.dayItemTitle}>{dayTitle}</Text>

                    {/* ⭐ NÚT THÊM HOẠT ĐỘNG - CHỈ HIỆN KHI LÀ OWNER */}
                    {isOwner && (
                      <TouchableOpacity
                        onPress={() => openAddActivityModal(dayIdx)}
                        style={[
                          styles.addActivityBtn,
                          { backgroundColor: colors.primary },
                        ]}
                      >
                        <Ionicons name="add" size={18} color="#fff" />
                        <Text
                          style={{
                            color: "#fff",
                            marginLeft: 4,
                            fontWeight: "600",
                            fontSize: 13,
                          }}
                        >
                          Thêm
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* ⭐ DANH SÁCH HOẠT ĐỘNG */}
                  {activities.length > 0 ? (
                    activities.map((act, actIdx) => {
                      const safeAct = act || {};
                      const timeText =
                        typeof safeAct.time === "string"
                          ? safeAct.time
                          : safeAct.time != null
                            ? String(safeAct.time)
                            : "";
                      const nameText =
                        typeof safeAct.name === "string"
                          ? safeAct.name
                          : safeAct.name != null
                            ? String(safeAct.name)
                            : "";
                      const hasCost =
                        typeof safeAct.cost === "number" &&
                        !isNaN(safeAct.cost);
                      const isCompleted = safeAct.completed || false;

                      return (
                        <TouchableOpacity
                          key={actIdx}
                          style={[
                            styles.activityRow,
                            { backgroundColor: colors.inputBackground },
                            isCompleted && { opacity: 0.6 },
                          ]}
                          onLongPress={() => {
                            if (!isOwner) return;
                            Alert.alert("Chỉnh sửa hoạt động", nameText, [
                              { text: "Hủy", style: "cancel" },
                              {
                                text: "✏️ Sửa",
                                onPress: () =>
                                  openEditActivityModal(dayIdx, actIdx),
                              },
                              {
                                text: "🗑️ Xóa",
                                style: "destructive",
                                onPress: () =>
                                  handleDeleteActivity(dayIdx, actIdx),
                              },
                            ]);
                          }}
                          activeOpacity={0.7}
                        >
                          {/* ⭐ CHECKBOX - VỚI STYLE FIX */}
                          {isOwner && (
                            <TouchableOpacity
                              onPress={() =>
                                toggleActivityCompleted(dayIdx, actIdx)
                              }
                              style={{
                                marginRight: 8,
                                alignSelf: "center", // ⭐ ĐẢM BẢO CHECKBOX ĐƯỢC CĂN GIỮA
                              }}
                            >
                              <Ionicons
                                name={
                                  isCompleted
                                    ? "checkmark-circle"
                                    : "ellipse-outline"
                                }
                                size={24} // ⭐ TĂNG SIZE LÊN 24 ĐỂ DỄ THẤY HƠN
                                color={
                                  isCompleted ? "#4CAF50" : colors.textSecondary
                                }
                              />
                            </TouchableOpacity>
                          )}

                          {/* ICON CLOCK */}
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={16}
                            color={colors.primary}
                            style={{ marginTop: 1, marginRight: 3 }}
                          />

                          {/* THỜI GIAN */}
                          <Text
                            style={[
                              styles.activityTime,
                              isCompleted && {
                                textDecorationLine: "line-through",
                                color: colors.textSecondary,
                              },
                            ]}
                          >
                            {timeText}
                          </Text>

                          {/* TÊN HOẠT ĐỘNG */}
                          <Text
                            style={[
                              styles.activityName,
                              isCompleted && {
                                textDecorationLine: "line-through",
                                color: colors.textSecondary,
                              },
                            ]}
                          >
                            {nameText}
                          </Text>

                          {/* CHI PHÍ */}
                          {hasCost && (
  <Text style={styles.activityCost}>
    {formatCurrency(safeAct.cost)}
  </Text>
)}


                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <Text style={styles.noActivity}>Không có hoạt động</Text>
                  )}

                  {/* THÔNG TIN KHÁCH SẠN */}
                  {safeDay.hotel && (
                    <Text style={styles.hotelInfo}>
                      <Ionicons name="business" size={13} color="#be0272" /> Ở
                      khách sạn:{" "}
                      {safeDay.hotel?.name || safeDay.hotel?.address_line1}
                    </Text>
                  )}

                  {/* THÔNG TIN DI CHUYỂN */}
                  {safeDay.move && (
                    <Text style={styles.moveInfo}>
                      <Ionicons name="car-outline" size={13} color="#5374e7" />{" "}
                      Đã di chuyển: {safeDay.move.label || ""}
                    </Text>
                  )}
                </View>
              );
            })}
        </View>

        {/* PHẦN ĐÁNH GIÁ – HIỆN RA NGAY DÙ CHƯA CÓ REVIEW */}
        <View
          style={[
            styles.reviewSection,
            { backgroundColor: colors.cardBackground },
          ]}
        >
          <View style={styles.reviewHeader}>
            <Text style={[styles.reviewTitle, { color: colors.textDark }]}>
              Đánh giá từ cộng đồng
            </Text>
            <View style={styles.ratingSummary}>
              {(() => {
                const reviewsArray = Array.isArray(data.reviews)
                  ? data.reviews
                  : [];
                const computedCount = reviewsArray.length;
                const backendCount =
                  typeof data.reviewCount === "number" ? data.reviewCount : 0;
                const reviewCount =
                  backendCount > 0 ? backendCount : computedCount;

                const backendAvg =
                  typeof data.averageRating === "number"
                    ? data.averageRating
                    : 0;
                const computedAvg =
                  computedCount > 0
                    ? reviewsArray.reduce(
                        (sum: number, r: any) => sum + (r.rating || 0),
                        0
                      ) / computedCount
                    : 0;
                const averageRating = backendAvg > 0 ? backendAvg : computedAvg;

                return (
                  <>
                    <Text style={styles.averageRating}>
                      {averageRating.toFixed(1)}
                    </Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={
                            star <= Math.round(averageRating)
                              ? "star"
                              : "star-outline"
                          }
                          size={20}
                          color="#FFB800"
                        />
                      ))}
                    </View>
                    <Text
                      style={[
                        styles.reviewCountText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      ({reviewCount} đánh giá)
                    </Text>
                  </>
                );
              })()}
            </View>
          </View>

          {data.reviews && data.reviews.length > 0 ? (
            <>
              {data.reviews.slice(0, 3).map((review: any) => (
                <View key={review._id} style={styles.reviewItem}>
                  <Image
                    source={{
                      uri:
                        review.user?.profileImage ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(review.user?.username?.[0] || "U")}&background=random`,
                    }}
                    style={styles.reviewAvatar}
                  />
                  <View style={styles.reviewContent}>
                    <View style={styles.reviewTop}>
                      <Text
                        style={[
                          styles.reviewUsername,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {review.user?.username || "Người dùng"}
                      </Text>
                      <View style={styles.reviewStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={
                              star <= (review.rating || 0)
                                ? "star"
                                : "star-outline"
                            }
                            size={14}
                            color="#FFB800"
                          />
                        ))}
                      </View>
                    </View>
                    <Text
                      style={[styles.reviewComment, { color: colors.textDark }]}
                    >
                      {review.comment || "Không có bình luận"}
                    </Text>
                    <Text
                      style={[
                        styles.reviewDate,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {formatPublishDate(review.createdAt)}
                    </Text>
                  </View>
                </View>
              ))}

              {data.reviewCount > 3 && (
                <TouchableOpacity
                  style={styles.seeAllButton}
                  onPress={() =>
                    router.push({
                      pathname: "/ReviewsScreen",
                      params: { tripId: id, tripTitle: data.title },
                    })
                  }
                >
                  <Text style={styles.seeAllText}>
                    Xem tất cả {data.reviewCount} đánh giá
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text
              style={[styles.noReviewText, { color: colors.textSecondary }]}
            >
              Chưa có đánh giá nào
            </Text>
          )}
        </View>

        {/* Vé tàu/xe nếu có */}
        {s.ticket && (
          <View
            style={[styles.footer, { backgroundColor: colors.cardBackground }]}
          >
            <Text style={[styles.footerTitle, { color: colors.primary }]}>
              Vé tàu / xe
            </Text>

            {/* Vé tàu */}
            {s.ticket.chuyenTau && (
              <>
                <Text style={{ color: colors.textPrimary, marginBottom: 3 }}>
                  <Ionicons
                    name="train"
                    size={16}
                    color={colors.textSecondary}
                  />{" "}
                  {s.ticket.chuyenTau} | {s.ticket.gaDi} → {s.ticket.gaDen}
                </Text>
                <Text style={{ color: colors.textSecondary }}>
                  Ngày đi: {s.ticket.ngayDi || "-"}
                </Text>
                {s.ticket.gioDi && (
                  <Text style={{ color: colors.textSecondary }}>
                    Giờ đi: {s.ticket.gioDi}
                  </Text>
                )}
                {s.ticket.gioDen && (
                  <Text style={{ color: colors.textSecondary }}>
                    Giờ đến: {s.ticket.gioDen}
                  </Text>
                )}
                <Text style={{ color: colors.textSecondary }}>
                  Số ghế trống: {s.ticket.soGheTrong ?? "-"}
                </Text>
              </>
            )}

            {/* Vé xe khách */}
            {s.ticket.nhaXe && (
              <>
                <Text style={{ color: colors.textPrimary, marginBottom: 3 }}>
                  <Ionicons name="bus" size={16} color={colors.textSecondary} />{" "}
                  {s.ticket.nhaXe} | {s.ticket.diemDi} → {s.ticket.diemDen}
                </Text>
                <Text style={{ color: colors.textSecondary }}>
                  Loại xe: {s.ticket.loaiXe || "-"}
                </Text>
                <Text style={{ color: colors.textSecondary }}>
                  Số xe: {s.ticket.soXe || "-"}
                </Text>
                <Text style={{ color: colors.textSecondary }}>
                  Ngày đi: {s.ticket.ngayDi || "-"}
                </Text>
                {s.ticket.gioDi && (
                  <Text style={{ color: colors.textSecondary }}>
                    Giờ đi: {s.ticket.gioDi}
                  </Text>
                )}
                {s.ticket.gioDen && (
                  <Text style={{ color: colors.textSecondary }}>
                    Giờ đến: {s.ticket.gioDen}
                  </Text>
                )}
                <Text style={{ color: colors.textSecondary }}>
                  Số ghế trống: {s.ticket.soGheTrong ?? "-"}
                </Text>
              </>
            )}
          </View>
        )}
        {/* ⭐⭐⭐ MODAL CHỈNH SỬA HOẠT ĐỘNG ⭐⭐⭐ */}
        {/* ⭐⭐⭐ MODAL CHỈNH SỬA HOẠT ĐỘNG VỚI TIME PICKER ⭐⭐⭐ */}
        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.editModalOverlay}>
            <View
              style={[
                styles.editModalContent,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <Text style={[styles.editTitle, { color: colors.textPrimary }]}>
                {selectedActivityIndex !== null
                  ? "Chỉnh sửa hoạt động"
                  : "Thêm hoạt động mới"}
              </Text>

              {/* ⭐ THỜI GIAN VỚI TIME PICKER */}
              <Text style={[styles.editLabel, { color: colors.textSecondary }]}>
                Thời gian:
              </Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={[
                  styles.timePickerButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={{ color: colors.textPrimary, fontSize: 15 }}>
                  {activityTime || "Chọn thời gian"}
                </Text>
              </TouchableOpacity>

              {/* TIME PICKER */}
              {showTimePicker && (
                <DateTimePicker
                  value={selectedTime}
                  mode="time"
                  is24Hour={true}
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleTimeChange}
                />
              )}

              {/* TÊN HOẠT ĐỘNG */}
              <Text
                style={[
                  styles.editLabel,
                  { color: colors.textSecondary, marginTop: 16 },
                ]}
              >
                Tên hoạt động *:
              </Text>
              <TextInput
                value={activityName}
                onChangeText={setActivityName}
                placeholder="VD: Ăn sáng tại khách sạn"
                placeholderTextColor={colors.placeholderText}
                style={[
                  styles.editInput,
                  { borderColor: colors.border, color: colors.textPrimary },
                ]}
              />

              {/* CHI PHÍ */}
              
                <Text
                  style={[
                    styles.editLabel,
                    { color: colors.textSecondary, marginTop: 12 },
                  ]}
                >
                  Chi phí (VNĐ):
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    value={displayCost}  // ⭐ THAY ĐỔI TỪ activityCost
                    onChangeText={handleCostChange}  // ⭐ THAY ĐỔI HANDLER
                    placeholder="VD: 50,000"
                    placeholderTextColor={colors.placeholderText}
                    keyboardType="numeric"
                    style={[
                      styles.editInput,
                      { 
                        borderColor: colors.border, 
                        color: colors.textPrimary,
                        paddingRight: 40,  // ⭐ THÊM SPACE CHO "đ"
                      },
                    ]}
                  />
                  {displayCost && (
                    <Text
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        color: colors.textSecondary,
                        fontSize: 15,
                      }}
                    >
                      đ
                    </Text>
                  )}
                </View>


              {/* ACTIONS */}
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={[styles.editCancelBtn, { borderColor: colors.border }]}
                  onPress={() => {
                    setEditModalVisible(false);
                    setShowTimePicker(false);
                  }}
                  disabled={editLoading}
                >
                  <Text
                    style={{ color: colors.textSecondary, fontWeight: "500" }}
                  >
                    Hủy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.editConfirmBtn,
                    {
                      backgroundColor: colors.primary,
                      opacity: editLoading ? 0.7 : 1,
                    },
                  ]}
                  onPress={handleSaveActivity}
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Lưu
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 16 },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFoundText: { fontSize: 20, marginTop: 40, fontWeight: "bold" },
  avatar: { width: "100%", height: 180, borderRadius: 20, marginBottom: 15 },
  infoCard: {
    padding: 16,
    alignItems: "flex-start",
    marginBottom: 20,
    borderRadius: 16,
  },
  profileImage: {
    width: 37,
    height: 37,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  headerTitle: { marginBottom: 4, fontSize: 22, fontWeight: "bold" },
  headerSub: { fontWeight: "600", marginLeft: 5 },
  caption: { fontSize: 15, marginBottom: 5 },
  date: { marginTop: 7, fontSize: 13 },
  dateRange: { color: "#333", fontSize: 15, fontWeight: "bold", marginTop: 4 },
  locationInfo: { marginTop: 10, marginBottom: 15 },
  currentLocationText: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  provinceText: { fontSize: 15 },
  infoTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  transportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    width: "100%",
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  footer: { marginTop: 6, borderRadius: 16, padding: 12 },
  footerTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 6 },
  bookingButtonWrap: { marginVertical: 18, alignItems: "center" },
  bookingButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dayCard: {
    alignItems: "flex-start",
    padding: 18,
    marginTop: 2,
    borderRadius: 16,
  },
  dayTitle: { fontWeight: "bold", fontSize: 17, marginBottom: 10 },
  dayItemTitle: {
    fontWeight: "bold",
    color: "#222",
    fontSize: 15,
    marginBottom: 3,
  },
  noData: { color: "#aaa", fontStyle: "italic" },
  // activityRow: {
  //   flexDirection: "row",
  //   alignItems: "flex-start",
  //   marginTop: 5,
  //   borderRadius: 8,
  //   padding: 8,
  //   marginBottom: 4,
  // },
  activityTime: { color: "#333", fontSize: 15, fontWeight: "bold" },
  activityName: { marginLeft: 6, color: "#444", flex: 1 },
  activityCost: { marginLeft: 7, color: "#3b6bb3", fontWeight: "bold" },
  noActivity: { color: "#b7a2c4", fontStyle: "italic", marginLeft: 2 },
  hotelInfo: { color: "#be0272", marginLeft: 18, fontSize: 14, marginTop: 3 },
  moveInfo: { marginLeft: 18, color: "#3f486f", fontSize: 13, marginTop: 1 },
  reviewSection: {
    marginTop: 10,
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  ratingSummary: {
    alignItems: "center",
  },
  averageRating: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  starsRow: {
    flexDirection: "row",
    marginVertical: 4,
  },
  reviewCountText: {
    fontSize: 13,
    marginTop: 2,
  },
  reviewItem: {
    flexDirection: "row",
    marginBottom: 14,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewContent: {
    flex: 1,
  },
  reviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewUsername: {
    fontWeight: "600",
    fontSize: 15,
  },
  reviewStars: {
    flexDirection: "row",
  },
  reviewComment: {
    fontSize: 14.5,
    lineHeight: 20,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
  },
  noReviewText: {
    textAlign: "center",
    fontStyle: "italic",
    marginTop: 10,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    marginTop: 8,
  },
  seeAllText: {
    color: COLORS.primary,
    fontWeight: "600",
    marginRight: 4,
  },
  iconCircleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareModalContent: {
    width: "85%",
    borderRadius: 16,
    padding: 18,
  },
  shareTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  shareInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  shareActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  shareCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  shareConfirmBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  // ⭐⭐⭐ THÊM CÁC STYLES MỚI ĐÂY ⭐⭐⭐

  // Styles cho modal chỉnh sửa
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  editModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  editLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
    gap: 10,
  },
  editCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  editConfirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 80,
    alignItems: "center",
  },

  // Nút thêm hoạt động
  addActivityBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },

  deleteButton: {
    padding: 6,
    borderRadius: 6,
    marginLeft: 8,
    alignSelf: "center",
  },

  // Cập nhật activityRow
  activityRow: {
    flexDirection: "row",
    alignItems: "center",  // ⭐ THAY ĐỔI TỪ flex-start
    marginTop: 5,
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },

  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 6,
  },
});

export default ScheduleDetailScreen;
