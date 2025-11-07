import React, { useEffect } from 'react';
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Provider } from "react-redux";

import { useAuthStore } from "../store/authStore";
import { store } from "../redux/store";
import { ThemeProvider } from "../contexts/ThemeContext";
import SafeScreen from "../components/SafeScreen";
import Loader from '../components/Loader'; // Thêm Loader
import { MenuProvider } from 'react-native-popup-menu';

// Giữ màn hình chờ hiển thị
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Lấy các state cần thiết từ store đã cập nhật
  const { user, isCheckingAuth } = useAuthStore();
  
  const segments = useSegments();
  const router = useRouter();

  // Tải fonts
  const [fontsLoaded] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  // Logic ẩn Splash Screen
  useEffect(() => {
    // Chỉ ẩn Splash Screen khi fonts đã tải VÀ việc kiểm tra auth đã hoàn tất
    if (fontsLoaded && !isCheckingAuth) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isCheckingAuth]);

  // Logic điều hướng
  useEffect(() => {
    // Nếu fonts chưa tải hoặc vẫn đang kiểm tra auth, không làm gì cả.
    if (!fontsLoaded || isCheckingAuth) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    if (user && inAuthGroup) {
      // Đã đăng nhập và đang ở màn hình auth -> vào app
      router.replace("/(tabs)");
    } else if (!user && !inAuthGroup) {
      // Chưa đăng nhập và đang cố vào app -> ra màn hình auth
      router.replace("/(auth)");
    }
  }, [user, segments, fontsLoaded, isCheckingAuth]);

  // Trong khi fonts chưa tải hoặc auth chưa kiểm tra xong, hiển thị màn hình chờ.
  if (!fontsLoaded || isCheckingAuth) {
    return <Loader />; // Hiển thị Loader thay vì null để có trải nghiệm tốt hơn
  }

  // Khi mọi thứ đã sẵn sàng, render layout của ứng dụng
  return (
    <MenuProvider>
    <Provider store={store}>
      <ThemeProvider>
        <SafeAreaProvider>
          <SafeScreen>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(page)" />
            </Stack>
          </SafeScreen>
          <StatusBar style="dark" />
        </SafeAreaProvider>
      </ThemeProvider>
    </Provider>
    </MenuProvider>
  );
}
