import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Link, useRouter } from "expo-router";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import { useAuthStore } from "../../store/authStore";
import { useTheme } from "../../contexts/ThemeContext";
import createLoginStyles from "../../assets/styles/login.styles";
// Facebook Auth
import * as Facebook from "expo-auth-session/providers/facebook";
// Google Auth
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();

const Login = () => {
  // const resetFacebookLogin = () => {
  //   fbResponse?.type === "success" && AuthSession.dismiss();
  // };

  const router = useRouter();
  const { colors } = useTheme();
  const styles = createLoginStyles(colors);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { user, isLoading, login, isCheckingAuth } = useAuthStore();

  // const extra =
  //   Constants.expoConfig?.extra ||
  //   Constants.manifest2?.extra ||
  //   Constants.manifest?.extra;

  // // === FACEBOOK LOGIN ===
  // const redirectUri = AuthSession.makeRedirectUri({ useProxy: true } as any);
  // console.log("✅ FB redirectUri:", redirectUri);

  // const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
  //   clientId: extra?.facebookAppId, // fallback cho web
  //   androidClientId: extra?.facebookAppId,
  //   iosClientId: extra?.facebookAppId,
  //   // redirectUri,
  // });
  // console.log("FB App ID:", extra?.facebookAppId);

  // const androidClientId = extra?.googleAndroidClientId;
  // const iosClientId = extra?.googleIosClientId;
  // const expoClientId = extra?.googleExpoClientId;
  // const redirectUri = AuthSession.makeRedirectUri({
  //   scheme: "travelbuddy",
  // });
  // const [request, response, promptAsync] = Google.useAuthRequest({
  //   androidClientId,
  //   iosClientId,
  //   clientId: expoClientId,
  //   redirectUri,
  // });

  // Login bằng email/password
  const handleLogin = async () => {
    const result = await login(email, password);
    if (!result.success) {
      Alert.alert("Login Failed", result.error);
    } else {
      // router.replace("/home");
    }
  };

  // Xử lý callback Google login
  // useEffect(() => {
  //   if (response?.type === "success") {
  //     const idToken = response.authentication?.idToken;
  //     if (idToken) {
  //       loginWithGoogle(idToken).then((res) => {
  //         if (res.success) {
  //           // router.replace("/home");
  //         } else {
  //           Alert.alert("Google Login Failed", res.error);
  //         }
  //       });
  //     }
  //   }
  // }, [response]);

  // useEffect(() => {
  //   const handleFacebookLogin = async () => {
  //     if (fbResponse?.type === "success") {
  //       const accessToken = fbResponse.authentication?.accessToken;
  //       if (!accessToken) return;

  //       try {
  //         // Gọi backend để xác thực Facebook
  //         const res = await fetch("http://localhost:3000/api/auth/facebook", {
  //           method: "POST",
  //           headers: { "Content-Type": "application/json" },
  //           body: JSON.stringify({ accessToken }),
  //         });

  //         const data = await res.json();
  //         if (res.ok) {
  //           await loginWithFacebook(data.token); // hoặc loginWithOAuth(data.token)
  //           Alert.alert("Facebook Login", "Login successful!");
  //           // router.replace("/home");
  //         } else {
  //           Alert.alert("Facebook Login Failed", data.message);
  //         }
  //       } catch (err) {
  //         console.error("Facebook login error:", err);
  //         Alert.alert("Error", "Something went wrong");
  //       }
  //     }
  //   };

  //   handleFacebookLogin();
  // }, [fbResponse]);

  //
  if (isCheckingAuth) return null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <View style={styles.topIllustration}>
          <Image
            source={require("../../assets/images/i.png")}
            style={styles.illustrationImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.formContainer}>
            {/* Email */}
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
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.placeholderText}
                  keyboardType="email-address"
                />
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
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.placeholderText}
                  secureTextEntry={!showPassword}
                />
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.primary}
                  style={styles.inputIcon}
                  onPress={() => setShowPassword(!showPassword)}
                />
              </View>
            </View>

            {/* Login button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>
            {/* Facebook Login Button */}
            {/* <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: "#1877F2", flexDirection: "row", gap: 8 },
              ]}
              onPress={() => {
                resetFacebookLogin(); // reset session cũ
                fbPromptAsync(); // gọi login lại
              }}
              disabled={!fbRequest}
            >
              <Image
                source={require("../../assets/images/fbicon.jpg")}
                style={{ width: 20, height: 20 }}
              />
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                Login with Facebook
              </Text>
            </TouchableOpacity> */}

            {/* Google Login Button */}
            {/* <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: "#fff", flexDirection: "row", gap: 8 },
              ]}
              onPress={() => promptAsync()}
              disabled={!request}
            >
              <Image
                source={require("../../assets/images/ggicon.jpg")}
                style={{ width: 20, height: 20 }}
              />
              <Text style={{ color: "#000", fontWeight: "600" }}>
                Sign in with Google
              </Text>
            </TouchableOpacity> */}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don’t have an account? </Text>
              <Link href="/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.link}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default Login;
