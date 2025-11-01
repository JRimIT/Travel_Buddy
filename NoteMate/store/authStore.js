// authStore.js
import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// Lấy backend URL từ .env hoặc fallback
const BACKEND_URL =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL ||
  "http://192.168.1.8:3000";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isCheckingAuth: false,

  register: async (username, email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      // đọc text trước để debug JSON parse error
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Invalid server response");
      }

      if (response.ok) {
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("token", data.token);
        set({ user: data.user, token: data.token, isLoading: false });
        return { success: true };
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      set({ isLoading: false });
      return { success: false, error: error.message || "Registration failed" };
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Invalid server response");
      }

      if (response.ok) {
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("token", data.token);
        set({ user: data.user, token: data.token, isLoading: false });
        return { success: true };
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      set({ isLoading: false });
      return { success: false, error: error.message || "Login failed" };
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Invalid server response");
      }

      if (response.ok) {
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        await AsyncStorage.setItem("token", data.token);
        set({ user: data.user, token: data.token, isLoading: false });
        return { success: true };
      } else {
        throw new Error(data.message || "Google login failed");
      }
    } catch (error) {
      console.error("Google login error:", error);
      set({ isLoading: false });
      return { success: false, error: error.message || "Google login failed" };
    }
  },

  checkAuth: async () => {
    set({ isLoading: true, isCheckingAuth: true });
    try {
      const userJson = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("token");
      const user = userJson ? JSON.parse(userJson) : null;
      set({ user, token, isLoading: false, isCheckingAuth: false });
    } catch (error) {
      console.error("Check auth error:", error);
      set({ isLoading: false, isCheckingAuth: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("token");
      set({ user: null, token: null, isLoading: false });
    } catch (error) {
      console.error("Logout error:", error);
      set({ isLoading: false });
    }
  },
}));
