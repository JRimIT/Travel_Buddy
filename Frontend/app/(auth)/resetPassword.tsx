// frontend/.expo/app/(auth)/resetPassword.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import createResetPasswordStyles from "../../assets/styles/resetPassword.styles";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_URL } from "../../constants/api";

const ResetPassword = () => {
  const { colors } = useTheme();
  const styles = createResetPasswordStyles(colors);
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string }>(); // <-- dùng hook mới
  const email = params.email || "";

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!otp || !password || !confirmPassword) {
      return Alert.alert("Error", "All fields are required");
    }
    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    setIsLoading(true);
    try {
      // 1️⃣ Verify OTP
      const verifyRes = await fetch(`${API_URL}/auth/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return Alert.alert(
          "Error",
          verifyData.message || "OTP verification failed"
        );
      }

      // 2️⃣ Reset password
      const resetRes = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password }),
      });
      const resetData = await resetRes.json();
      if (resetData.success) {
        Alert.alert("Success", "Password changed successfully", [
          {
            text: "OK",
            onPress: () => router.replace("/"),
          },
        ]);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>OTP</Text>
      <TextInput
        style={styles.input}
        value={otp}
        onChangeText={setOtp}
        placeholder="Enter OTP"
        placeholderTextColor={colors.placeholderText}
        keyboardType="number-pad"
      />

      <Text style={styles.label}>New Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="New Password"
        placeholderTextColor={colors.placeholderText}
        secureTextEntry
      />

      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm Password"
        placeholderTextColor={colors.placeholderText}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleResetPassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Reset Password</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ResetPassword;
