import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import React, { useState } from "react";
import styles from "../../assets/styles/signup.styles";
import { Ionicons } from "@expo/vector-icons";
import { router, useRouter } from "expo-router";
import { useAuthStore } from "../../store/authStore";
import colors from "../../constants/colors";
import { useTheme } from "../../contexts/ThemeContext";
import createSignUpStyles from "../../assets/styles/signup.styles";
import { API_URL } from "../../constants/api";

const Signup = () => {
  const { colors } = useTheme();
  const styles = createSignUpStyles(colors);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { user, isLoading, register } = useAuthStore();

  // State OTP
  const [emailVerified, setEmailVerified] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  // Email validate
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Gửi OTP
  const sendEmailOTP = async () => {
    if (!validateEmail(email)) {
      Alert.alert("Lỗi", "Email không hợp lệ. VD: example@gmail.com");
      return;
    }
    setLoading(true);
    try {
      // Nếu email đã đăng ký, có thể trả về lỗi phía server
      const res = await fetch(`${API_URL}/auth/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowOTPModal(true);
      } else {
        Alert.alert("Lỗi", data.message || "Không thể gửi OTP");
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi mã OTP.");
    } finally {
      setLoading(false);
    }
  };

  // Xác thực OTP
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
        body: JSON.stringify({ email, otp: otpCode }),
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

  // Đăng ký user
  const handleSignup = async () => {
    if (!username || !email || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập đủ các trường.");
      return;
    }

    if (!emailVerified) {
      Alert.alert("Chưa xác thực email", "Bạn cần xác thực email trước khi đăng ký.");
      return;
    }

    const result = await register(username, email, password);
    if (!result.success) {
      Alert.alert("Signup Failed", result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>BookWorm</Text>
            <Text style={styles.subtitle}>Share your favorite reads</Text>
          </View>
          <View style={styles.formContainer}>
            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.placeholderText}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            </View>

            {/* Email + Xác thực */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.placeholderText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setEmailVerified(false);
                  }}
                />
                <TouchableOpacity
                  style={{
                    marginLeft: 10,
                    backgroundColor: emailVerified ? "#4caf50" : colors.primary,
                    paddingVertical: 8,
                    paddingHorizontal: 13,
                    borderRadius: 10,
                  }}
                  onPress={() => !emailVerified && sendEmailOTP()}
                  disabled={emailVerified || loading}
                >
                  {emailVerified ? (
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  ) : (
                    loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={{ color: "#fff", fontWeight: "bold" }}>Xác thực</Text>
                    )
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.placeholderText}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.primary}
                    style={styles.inputIcon}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.link}> Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

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
              Nhập mã OTP Email
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: "#666",
                marginBottom: 20,
                textAlign: "center",
              }}
            >
              Mã đã được gửi tới email của bạn
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

            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
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
                <Text style={{ textAlign: "center", fontWeight: "bold", color: "#666" }}>
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

export default Signup;
