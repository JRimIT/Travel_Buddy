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
import createLoginStyles from "../../assets/styles/login.styles";
import { useRouter } from "expo-router";
import { API_URL } from "../../constants/api";

const ForgotPassword = () => {
  const { colors } = useTheme();
  const styles = createLoginStyles(colors);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email) return Alert.alert("Error", "Please enter your email");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Success", "OTP sent to your email");
        router.push({ pathname: "/(auth)/resetPassword", params: { email } });
      } else {
        Alert.alert("Error", data.message || "Cannot send OTP");
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
      <Text style={styles.label}>Enter your registered email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={colors.placeholderText}
        keyboardType="email-address"
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleSendOTP}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ForgotPassword;
