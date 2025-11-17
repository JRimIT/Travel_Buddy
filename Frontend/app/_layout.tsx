// app/_layout.tsx (Root Layout)
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
import Loader from '../components/Loader';
import { MenuProvider } from 'react-native-popup-menu';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { user, isCheckingAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  // ✅ FIX 1: Ẩn Splash Screen
  useEffect(() => {
    if (fontsLoaded && !isCheckingAuth) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isCheckingAuth]);

  // ✅ FIX 2: Xử lý điều hướng bất cứ khi nào user thay đổi
  useEffect(() => {
    if (!fontsLoaded || isCheckingAuth) return;

    const inAuthGroup = segments[0] === "(auth)";

    console.log("user: ", user);
    console.log("inAuthGroup: ", inAuthGroup);

    if (user && inAuthGroup) {
      // Đã đăng nhập -> vào app
      router.replace("/(tabs)");
    } else if (!user && !inAuthGroup) {
      // Chưa đăng nhập hoặc JWT expired -> vào auth
      router.replace("/(auth)");
    } else if (!user && segments[0] === undefined) {
      // Vừa lần đầu app load
      router.replace("/(auth)");
    }
  }, [user, segments, fontsLoaded, isCheckingAuth]); // ✅ Lắng nghe user thay đổi

  if (!fontsLoaded || isCheckingAuth) {
    return <Loader />;
  }

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
 