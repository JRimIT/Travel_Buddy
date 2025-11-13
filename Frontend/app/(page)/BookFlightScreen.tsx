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
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { API_URL } from "../../constants/api";
import { useTheme } from "../../contexts/ThemeContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuthStore } from "../../store/authStore";

const BookFlightScreen = () => {
  const { colors } = useTheme();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const { scheduleId, fromLocation, province } = route.params;

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

  // State xác thực email
  const [emailVerified, setEmailVerified] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
    if (field === "email") setEmailVerified(false);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // ✅ Gửi OTP qua Email
  const sendEmailOTP = async () => {
    if (!validateEmail(form.email)) {
      Alert.alert("Lỗi", "Email không hợp lệ. VD: example@gmail.com");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          userId: user._id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowOTPModal(true);
      } else {
        Alert.alert("Lỗi", data.message || "Không thể gửi OTP");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi OTP. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Xác thực OTP
  const verifyEmailOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert("Lỗi", "Vui lòng nhập mã OTP 6 số");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          otp: otpCode,
          userId: user._id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setEmailVerified(true);
        setShowOTPModal(false);
        setOtpCode("");
        Alert.alert("Thành công", "Email đã được xác thực!");
      } else {
        Alert.alert("Lỗi", data.message || "Mã OTP không đúng");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể xác thực OTP");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Submit booking
  const handleSubmit = async () => {
    if (
      !form.fullName ||
      !form.phone ||
      !form.email ||
      !form.depart ||
      !form.arrival ||
      !form.date
    ) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ các trường bắt buộc.");
      return;
    }

    if (!emailVerified) {
      Alert.alert("Chưa xác thực", "Vui lòng xác thực email trước khi đặt vé.");
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
        const bookingContent =
          `[🛫 ĐẶT VÉ MÁY BAY]\n` +
          `Khách: ${form.fullName}\n` +
          `Số điện thoại: ${form.phone}\n` +
          `Email: ${form.email} ✓\n` +
          `Nơi đi: ${form.depart}\n` +
          `Nơi đến: ${form.arrival}\n` +
          `Ngày bay: ${form.date}\n` +
          (form.amount ? `Số vé: ${form.amount}\n` : "") +
          (form.note ? `Ghi chú: ${form.note}` : "");

        router.push({
          pathname: "/SupportChatScreen",
          params: { initialMessage: bookingContent },
        });
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
        <View style={styles.headerIcon}>
          <MaterialCommunityIcons
            name="airplane-takeoff"
            size={38}
            color={colors.primary}
          />
        </View>
        <Text style={[styles.title, { color: colors.primary }]}>
          Đặt vé máy bay
        </Text>

        <View style={styles.quickInfoBox}>
          <Text style={styles.quickInfoLabel}>
            <Ionicons name="person" size={17} color={colors.primary} /> Người
            đặt:
            <Text style={styles.quickInfoValue}>
              {" "}
              {user?.username || user?.name || ""}
            </Text>
          </Text>
          <Text style={styles.quickInfoLabel}>
            <Ionicons name="navigate" size={17} color={colors.primary} /> Nơi
            xuất phát:
            <Text style={styles.quickInfoValue}> {form.depart}</Text>
          </Text>
          <Text style={styles.quickInfoLabel}>
            <Ionicons name="location" size={17} color={colors.primary} /> Nơi
            đến:
            <Text style={styles.quickInfoValue}> {form.arrival}</Text>
          </Text>
        </View>

        {/* Họ tên */}
        <Text style={[styles.label, { color: colors.primary }]}>
          <Ionicons name="person" size={18} color={colors.primary} /> Họ và tên
          *
        </Text>
        <TextInput
          value={form.fullName}
          onChangeText={(val) => handleChange("fullName", val)}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="Nhập họ tên..."
          placeholderTextColor={colors.placeholderText}
        />

        {/* Số điện thoại */}
        <Text style={[styles.label, { color: colors.primary }]}>
          <Ionicons name="call" size={18} color={colors.primary} /> Số điện
          thoại *
        </Text>
        <TextInput
          value={form.phone}
          onChangeText={(val) => handleChange("phone", val)}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="Nhập số điện thoại"
          placeholderTextColor={colors.placeholderText}
          keyboardType="phone-pad"
        />

        {/* Email + Xác thực */}
        <Text style={[styles.label, { color: colors.primary }]}>
          <Ionicons name="mail" size={18} color={colors.primary} /> Email *
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <TextInput
            value={form.email}
            onChangeText={(val) => handleChange("email", val)}
            style={[
              styles.input,
              {
                flex: 1,
                marginBottom: 0,
                backgroundColor: colors.inputBackground,
                color: colors.textPrimary,
                borderColor: emailVerified ? "#4caf50" : colors.border,
              },
            ]}
            placeholder="Nhập email"
            placeholderTextColor={colors.placeholderText}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={{
              marginLeft: 10,
              backgroundColor: emailVerified ? "#4caf50" : colors.primary,
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 10,
            }}
            onPress={() => !emailVerified && sendEmailOTP()}
            disabled={emailVerified || loading}
          >
            {emailVerified ? (
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
            ) : (
              <View>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Xác thực
                  </Text>
                )}

              </View>

              
            )}
          </TouchableOpacity>
        </View>
        

        {/* Nơi đi */}
        <Text style={[styles.label, { color: colors.primary }]}>
          <MaterialCommunityIcons
            name="airplane-marker"
            size={18}
            color={colors.primary}
          />{" "}
          Nơi đi *
        </Text>
        <TextInput
          value={form.depart}
          onChangeText={(val) => handleChange("depart", val)}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="VD: SGN (TP.HCM)"
          placeholderTextColor={colors.placeholderText}
        />

        {/* Nơi đến */}
        <Text style={[styles.label, { color: colors.primary }]}>
          <MaterialCommunityIcons
            name="airplane-marker"
            size={18}
            color={colors.primary}
          />{" "}
          Nơi đến *
        </Text>
        <TextInput
          value={form.arrival}
          onChangeText={(val) => handleChange("arrival", val)}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="VD: HAN (Hà Nội)"
          placeholderTextColor={colors.placeholderText}
        />

        {/* Ngày bay */}
        <Text style={[styles.label, { color: colors.primary }]}>
          <Ionicons name="calendar" size={18} color={colors.primary} /> Ngày bay
          *
        </Text>
        <TextInput
          value={form.date}
          onChangeText={(val) => handleChange("date", val)}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.placeholderText}
        />

        {/* Số lượng vé */}
        <Text style={[styles.label, { color: colors.textDark }]}>
          <Ionicons name="ticket" size={18} color={colors.textDark} /> Số lượng
          vé
        </Text>
        <TextInput
          value={form.amount}
          onChangeText={(val) => handleChange("amount", val)}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.textPrimary,
              borderColor: colors.border,
            },
          ]}
          placeholder="Nhập số vé"
          placeholderTextColor={colors.placeholderText}
          keyboardType="numeric"
        />

        {/* Ghi chú */}
        <Text style={[styles.label, { color: colors.textDark }]}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={18}
            color={colors.textDark}
          />{" "}
          Ghi chú thêm
        </Text>
        <TextInput
          value={form.note}
          onChangeText={(val) => handleChange("note", val)}
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.textPrimary,
              borderColor: colors.border,
              minHeight: 52,
            },
          ]}
          placeholder="Thông tin thêm (nếu có)"
          placeholderTextColor={colors.placeholderText}
          multiline
        />

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
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

      {/* Modal nhập OTP */}
      <Modal
        visible={showOTPModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOTPModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 24,
              width: "85%",
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: colors.primary,
                marginBottom: 10,
                textAlign: "center",
              }}
            >
              Nhập mã OTP
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#666",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Mã đã được gửi đến email của bạn
            </Text>

            <TextInput
              value={otpCode}
              onChangeText={setOtpCode}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 10,
                padding: 14,
                fontSize: 18,
                textAlign: "center",
                letterSpacing: 8,
                marginBottom: 20,
              }}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
            />

            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: "#ddd",
                  padding: 14,
                  borderRadius: 10,
                  marginRight: 10,
                }}
                onPress={() => {
                  setShowOTPModal(false);
                  setOtpCode("");
                }}
              >
                <Text
                  style={{
                    textAlign: "center",
                    fontWeight: "bold",
                    color: "#666",
                  }}
                >
                  Hủy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.primary,
                  padding: 14,
                  borderRadius: 10,
                }}
                onPress={verifyEmailOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={{
                      textAlign: "center",
                      fontWeight: "bold",
                      color: "#fff",
                    }}
                  >
                    Xác nhận
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ marginTop: 15 }} onPress={sendEmailOTP}>
              <Text
                style={{
                  textAlign: "center",
                  color: colors.primary,
                  fontWeight: "bold",
                }}
              >
                Gửi lại mã OTP
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerIcon: { alignItems: "center", marginBottom: 12 },
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
  quickInfoValue: { fontWeight: "normal", color: "#222" },
  label: { fontSize: 15, fontWeight: "bold", marginBottom: 4 },
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
