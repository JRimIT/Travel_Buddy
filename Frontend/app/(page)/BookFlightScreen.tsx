import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { API_URL } from "../../constants/api";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "../../store/authStore";

const BookFlightScreen = () => {
  const { colors } = useTheme();

  const route = useRoute<any>();
  const {user} = useAuthStore();
  const { scheduleId, fromLocation, province } = route.params;

  console.log("User bookiung: ", user);
  
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    depart: fromLocation,
    arrival: province,
    date: "",
    note: "",
    amount: "",
  });

  
  const handleChange = (field, value) => setForm({ ...form, [field]: value });

  const handleSubmit = async () => {
  if (
    !form.fullName ||
    !form.phone ||
    !form.depart ||
    !form.arrival ||
    !form.date
  ) {
    Alert.alert("Lỗi", "Vui lòng nhập đầy đủ các trường bắt buộc.");
    return;
  }
  try {
    const res = await fetch(`${API_URL}/booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: user._id,
        tripSchedule: scheduleId,
        amount: Number(form.amount || 1),
        bookingInfo: form,
      }),
    });
    const rs = await res.json();
    if (res.status === 200 || res.status === 201) {
      // Nếu thành công, tạo text gửi qua chat
      const bookingContent =
        "[🛫 ĐẶT VÉ MÁY BAY]\nKhách: " + form.fullName +
        "\nSố điện thoại: " + form.phone +
        (form.email ? "\nEmail: " + form.email : "") +
        "\nNơi đi: " + form.depart +
        "\nNơi đến: " + form.arrival +
        "\nNgày bay: " + form.date +
        (form.amount ? "\nSố vé: " + form.amount : "") +
        (form.note ? "\nGhi chú: " + form.note : "");
      // Điều hướng sang màn chat support và truyền nội dung đó
     
      router.push({
        pathname: "/SupportChatScreen",
        params: {
          initialMessage: bookingContent
        }
      })
      // Bạn nên dùng navigation.replace thay vì goBack+push, sẽ mượt hơn
    } else {
      Alert.alert("Lỗi", rs.message || "Gửi yêu cầu thất bại.");
    }
  } catch (e) {
    Alert.alert("Lỗi", "Gửi yêu cầu thất bại.");
  }
};


  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header icon and title */}
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            name="airplane-takeoff"
            size={38}
            color={colors.primary}
          />
        </View>
        <Text
          style={[
            styles.title,
            { color: colors.primary }
          ]}
        >
          Đặt vé máy bay
        </Text>

        {/* Hiển thị thông tin đã có sẵn */}
        <View style={styles.quickInfoBox}>
          <Text style={styles.quickInfoLabel}>
            <Ionicons name="person" size={17} color={colors.primary} /> Người đặt: 
            <Text style={styles.quickInfoValue}> {user?.username || user?.name || ""}</Text>
          </Text>
          <Text style={styles.quickInfoLabel}>
            <Ionicons name="navigate" size={17} color={colors.primary} /> Nơi xuất phát: 
            <Text style={styles.quickInfoValue}> {form.depart}</Text>
          </Text>
          <Text style={styles.quickInfoLabel}>
            <Ionicons name="location" size={17} color={colors.primary} /> Nơi đến: 
            <Text style={styles.quickInfoValue}> {form.arrival}</Text>
          </Text>
        </View>

        {/* Form nhập thông tin */}
        <Text style={[styles.label, { color: colors.primary }]}>
          <Ionicons name="person" size={18} color={colors.primary} /> Họ và tên *
        </Text>
        <TextInput
          value={form.fullName}
          onChangeText={val => handleChange("fullName", val)}
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="Nhập họ tên..."
          placeholderTextColor={colors.placeholderText}
        />

        <Text style={[styles.label, { color: colors.primary }]}>
          <Ionicons name="call" size={18} color={colors.primary} /> Số điện thoại *
        </Text>
        <TextInput
          value={form.phone}
          onChangeText={val => handleChange("phone", val)}
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="Nhập số điện thoại"
          placeholderTextColor={colors.placeholderText}
          keyboardType="phone-pad"
        />

        <Text style={[styles.label, { color: colors.textDark }]}>
          <Ionicons name="mail" size={18} color={colors.textDark} /> Email
        </Text>
        <TextInput
          value={form.email}
          onChangeText={val => handleChange("email", val)}
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="Nhập email (nếu có)"
          placeholderTextColor={colors.placeholderText}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[styles.label, { color: colors.primary }]}>
          <MaterialCommunityIcons name="airplane-marker" size={18} color={colors.primary} /> Nơi đi *
        </Text>
        <TextInput
          value={form.depart}
          onChangeText={val => handleChange("depart", val)}
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="VD: SGN (TP.HCM)"
          placeholderTextColor={colors.placeholderText}
        />

        <Text style={[styles.label, { color: colors.primary }]}>
          <MaterialCommunityIcons name="airplane-marker" size={18} color={colors.primary} /> Nơi đến *
        </Text>
        <TextInput
          value={form.arrival}
          onChangeText={val => handleChange("arrival", val)}
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="VD: HAN (Hà Nội)"
          placeholderTextColor={colors.placeholderText}
        />

        <Text style={[styles.label, { color: colors.primary }]}>
          <Ionicons name="calendar" size={18} color={colors.primary} /> Ngày bay *
        </Text>
        <TextInput
          value={form.date}
          onChangeText={val => handleChange("date", val)}
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.placeholderText}
        />

        <Text style={[styles.label, { color: colors.textDark }]}>
          <Ionicons name="ticket" size={18} color={colors.textDark} /> Số lượng vé
        </Text>
        <TextInput
          value={form.amount}
          onChangeText={val => handleChange("amount", val)}
          style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder="Nhập số vé"
          placeholderTextColor={colors.placeholderText}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: colors.textDark }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textDark} /> Ghi chú thêm
        </Text>
        <TextInput
          value={form.note}
          onChangeText={val => handleChange("note", val)}
          style={[
            styles.input,
            { backgroundColor: colors.inputBackground, color: colors.textPrimary, borderColor: colors.border, minHeight: 52 }
          ]}
          placeholder="Thông tin thêm (nếu có)"
          placeholderTextColor={colors.placeholderText}
          multiline
        />

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary, shadowColor: colors.primary }
          ]}
          onPress={handleSubmit}
        >
          <MaterialCommunityIcons
            name="ticket-confirmation"
            size={22}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
            Gửi yêu cầu đặt vé
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerIcon: {
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    letterSpacing: 0.8,
  },
  quickInfoBox: {
    backgroundColor: "#f1f4fc",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  quickInfoLabel: {
    fontSize: 15,
    color: "#3061c8",
    fontWeight: "bold",
    marginBottom: 5,
  },
  quickInfoValue: {
    fontWeight: "normal",
    color: "#222"
  },
  label: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 4,
  },
  input: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
  },
  button: {
    marginTop: 10,
    marginBottom: 30,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});

export default BookFlightScreen;
