import { API_URL } from "../constants/api";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../store/authStore";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";

const EditScheduleScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const rawParams = useLocalSearchParams();
  const { token } = useAuthStore();

  // Helper lấy param dạng string (expo-router có thể trả về string hoặc string[])
  const getParam = (key: string): string => {
    const value = (rawParams as any)[key];
    if (Array.isArray(value)) return value[0] ?? "";
    return typeof value === "string" ? value : "";
  };

  const id = getParam("id");
  const source = getParam("source") || "created";
  const editMode = getParam("editMode") || "update"; // 'update' | 'clone'
  const initialTitle = getParam("title");
  const initialDescription = getParam("description");
  const initialFromLocation = getParam("fromLocation");
  const initialProvince = getParam("province");
  const initialMainTransport = getParam("mainTransport");
  const initialInnerTransport = getParam("innerTransport");
  const initialBudgetHotel = getParam("budgetHotel");
  const initialBudgetFlight = getParam("budgetFlight");
  const initialBudgetFun = getParam("budgetFun");
  const initialHomeName = getParam("homeName");
  const initialHomeAddress = getParam("homeAddress");
  const initialHomePhone = getParam("homePhone");
  const initialHomeWebsite = getParam("homeWebsite");
  const initialStartDate = getParam("startDate");
  const initialEndDate = getParam("endDate");
  const initialIsPublicParam = getParam("isPublic");

  const hasInitial = !!initialTitle;

  const [loading, setLoading] = useState(!hasInitial);

  // Các state tương ứng với dữ liệu chuyến đi (bám theo ScheduleDetailScreen)
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [isPublic, setIsPublic] = useState(
    initialIsPublicParam ? initialIsPublicParam === "true" : true
  );
  const [fromLocation, setFromLocation] = useState(initialFromLocation);
  const [province, setProvince] = useState(initialProvince);
  const [mainTransport, setMainTransport] = useState(initialMainTransport);
  const [innerTransport, setInnerTransport] = useState(initialInnerTransport);
  const [budgetHotel, setBudgetHotel] = useState(initialBudgetHotel);
  const [budgetFlight, setBudgetFlight] = useState(initialBudgetFlight);
  const [budgetFun, setBudgetFun] = useState(initialBudgetFun);
  const [homeName, setHomeName] = useState(initialHomeName);
  const [homeAddress, setHomeAddress] = useState(initialHomeAddress);
  const [homePhone, setHomePhone] = useState(initialHomePhone);
  const [homeWebsite, setHomeWebsite] = useState(initialHomeWebsite);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  useEffect(() => {
    console.log("=== DEBUG EditTripScreen params ===");
    console.log("rawParams:", rawParams);
    console.log("parsed id:", id);
    console.log("initialTitle:", initialTitle);

    if (!id) return;
    // Nếu đã có dữ liệu truyền từ trang chi tiết, chỉ refetch nền để cập nhật
    if (hasInitial) {
      fetchTripDetail(true);
    } else {
      fetchTripDetail(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTripDetail = async (silent = false) => {
    console.log("fetchTripDetail called, silent =", silent, "id =", id);
    if (!id) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/tripSchedule/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      setTitle(data.title || "");
      setDescription(data.description || "");
      setIsPublic(!!data.isPublic);
      setFromLocation(data.fromLocation || "");
      setProvince(data.province || "");
      setMainTransport(data.mainTransport || "");
      setInnerTransport(data.innerTransport || "");
      setBudgetHotel(data.budget?.hotel?.toString() || "");
      setBudgetFlight(data.budget?.flight?.toString() || "");
      setBudgetFun(data.budget?.fun?.toString() || "");

      // Ưu tiên dùng home nếu đã có; nếu chưa có thì prefill từ hotelDefault
      const homeSource = data.home || data.hotelDefault || {};
      setHomeName(homeSource.name || "");
      setHomeAddress(
        homeSource.address || homeSource.address_line1 || ""
      );
      setHomePhone(
        homeSource.phone || homeSource.contact?.phone || ""
      );
      setHomeWebsite(homeSource.website || "");

      setStartDate(data.startDate || "");
      setEndDate(data.endDate || "");
    } catch (e) {
      Alert.alert("Lỗi", "Không lấy được chi tiết chuyến đi");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Lỗi", "Tên chuyến đi không được để trống");
      return;
    }
    setLoading(true);
    try {
      console.log("=== DEBUG SAVE TRIP ===");
      console.log("Saving trip id:", id);

      const updatedData = {
        title: title.trim(),
        description: description.trim(),
        isPublic,
        fromLocation,
        province,
        mainTransport,
        innerTransport,
        budget: {
          hotel: Number(budgetHotel) || 0,
          flight: Number(budgetFlight) || 0,
          fun: Number(budgetFun) || 0,
        },
        home: {
          name: homeName,
          address: homeAddress,
          phone: homePhone,
          website: homeWebsite,
        },
        startDate,
        endDate,
      };

      console.log("Updated payload gửi lên:", updatedData);

      const isClone = editMode === "clone";
      const url = isClone
        ? `${API_URL}/tripSchedule/${id}/clone`
        : `${API_URL}/tripSchedule/${id}`;
      const method = isClone ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      let resJson: any = null;
      try {
        resJson = await res.json();
      } catch (parseErr) {
        console.log("Không parse được JSON từ response khi lưu:", parseErr);
      }

      console.log("Kết quả response khi lưu:", res.status, resJson);

      if (!res.ok) {
        throw new Error(
          resJson?.error ||
            resJson?.message ||
            (res.status === 404
              ? "Không tìm thấy lịch trình trên server (có thể đã bị xoá)"
              : "Cập nhật thất bại")
        );
      }
      Alert.alert(
        "Thành công",
        isClone
          ? "Đã tạo bản sao mới của lịch trình"
          : "Cập nhật chuyến đi thành công"
      );
      if (source === "shared" || isClone) {
        router.replace({
          pathname: "/(tabs)/profile",
          params: { initialTab: isClone ? "created" : "shared" },
        });
      } else {
        router.back();
      }
    } catch (e: any) {
      Alert.alert("Lỗi", e.message || "Không thể cập nhật");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Thông tin chung giống card đầu của ScheduleDetailScreen */}
      <View
        style={[styles.card, { backgroundColor: colors.cardBackground }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Thông tin chung
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Tên chuyến đi
        </Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Tên chuyến đi"
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Mô tả
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Mô tả chuyến đi"
          placeholderTextColor={colors.placeholderText}
          multiline
          style={[
            styles.input,
            styles.multilineInput,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
        />

        <View style={styles.rowBetween}>
          <Text style={{ color: colors.textSecondary }}>Chế độ công khai</Text>
          <View style={styles.rowCenter}>
            <Ionicons
              name={isPublic ? "eye" : "eye-off"}
              size={18}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              thumbColor={isPublic ? colors.primary : "#ccc"}
            />
          </View>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Nơi xuất phát
        </Text>
        <TextInput
          value={fromLocation}
          onChangeText={setFromLocation}
          placeholder="Ví dụ: Hà Nội"
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Tỉnh / Thành
        </Text>
        <TextInput
          value={province}
          onChangeText={setProvince}
          placeholder="Ví dụ: Đà Nẵng"
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
        />
      </View>

      {/* Thông tin hành trình */}
      <View
        style={[styles.card, { backgroundColor: colors.cardBackground }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Thông tin hành trình
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Phương tiện chính
        </Text>
        <TextInput
          value={mainTransport}
          onChangeText={setMainTransport}
          placeholder="Máy bay, Xe khách..."
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Phương tiện nội thành
        </Text>
        <TextInput
          value={innerTransport}
          onChangeText={setInnerTransport}
          placeholder="Xe máy, Taxi..."
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
        />

        <View style={styles.budgetRow}>
          <View style={styles.budgetItem}>
            <Text style={[styles.labelSmall, { color: colors.textSecondary }]}>
              Ngân sách khách sạn
            </Text>
            <TextInput
              value={budgetHotel}
              onChangeText={setBudgetHotel}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.placeholderText}
              style={[
                styles.input,
                styles.smallInput,
                { borderColor: colors.border, color: colors.textPrimary },
              ]}
            />
          </View>
          <View style={styles.budgetItem}>
            <Text style={[styles.labelSmall, { color: colors.textSecondary }]}>
              Ngân sách vé máy bay
            </Text>
            <TextInput
              value={budgetFlight}
              onChangeText={setBudgetFlight}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.placeholderText}
              style={[
                styles.input,
                styles.smallInput,
                { borderColor: colors.border, color: colors.textPrimary },
              ]}
            />
          </View>
          <View style={styles.budgetItem}>
            <Text style={[styles.labelSmall, { color: colors.textSecondary }]}>
              Ngân sách đi chơi
            </Text>
            <TextInput
              value={budgetFun}
              onChangeText={setBudgetFun}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.placeholderText}
              style={[
                styles.input,
                styles.smallInput,
                { borderColor: colors.border, color: colors.textPrimary },
              ]}
            />
          </View>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Ngày bắt đầu
        </Text>
        <TextInput
          value={startDate}
          onChangeText={setStartDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Ngày kết thúc
        </Text>
        <TextInput
          value={endDate}
          onChangeText={setEndDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
        />
      </View>

      {/* Thông tin chỗ ở chính (Nhà riêng / Khách sạn mặc định) */}
      <View
        style={[styles.card, { backgroundColor: colors.cardBackground }]}
      >
        <Text style={[styles.sectionTitle, { color: colors.primary }]}>
          Chỗ ở chính
        </Text>

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Tên nhà / khách sạn
        </Text>
        <TextInput
          value={homeName}
          onChangeText={setHomeName}
          placeholder="Tên nhà / khách sạn"
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Địa chỉ
        </Text>
        <TextInput
          value={homeAddress}
          onChangeText={setHomeAddress}
          placeholder="Địa chỉ chi tiết"
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Điện thoại
        </Text>
        <TextInput
          value={homePhone}
          onChangeText={setHomePhone}
          placeholder="Số điện thoại"
          keyboardType="phone-pad"
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>
          Website
        </Text>
        <TextInput
          value={homeWebsite}
          onChangeText={setHomeWebsite}
          placeholder="https://..."
          placeholderTextColor={colors.placeholderText}
          style={[
            styles.input,
            { borderColor: colors.border, color: colors.textPrimary },
          ]}
        />
      </View>

      <TouchableOpacity
        onPress={handleSave}
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    marginTop: 8,
    marginBottom: 4,
  },
  labelSmall: {
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  budgetItem: {
    flex: 1,
    marginRight: 6,
  },
  smallInput: {
    fontSize: 13,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default EditScheduleScreen;
