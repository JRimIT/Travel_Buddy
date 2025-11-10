import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAuthStore = create(
  persist(
    (set) => ({
      // --- STATE ---
      user: null,
      token: null,
      isCheckingAuth: true,

      // --- ACTIONS ---
      
      // Action LOGIN: Thực hiện API call và trả về kết quả
      login: async (email, password) => {
        try {
          const response = await fetch('http://10.0.2.2:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }
          // Cập nhật state khi thành công
          set({ user: data.user, token: data.token });
          return { success: true };
        } catch (error) {
          console.error("Login error:", error);
          return { success: false, error: error.message };
        }
      },
      
      // Action REGISTER: Tương tự login
      register: async (username, email, password) => {
        try {
            const response = await fetch('http://10.0.2.2:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            set({ user: data.user, token: data.token });
            return { success: true };
        } catch (error) {
            console.error("Registration error:", error);
            return { success: false, error: error.message };
        }
      },

      // Action LOGOUT: Xóa state
      logout: () => {
        set({ user: null, token: null });
      },

      // Action SETUSER: Cập nhật user từ bên ngoài
      setUser: (newUserData) => {
        set({ user: newUserData });
      },
    }),
    {
      // --- Cấu hình Persist ---
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isCheckingAuth = false;
        }
      },
    }
  )
);
