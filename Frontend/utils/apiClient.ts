// api/axiosConfig.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { API_URL } from '../constants/api';

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const { token } = useAuthStore.getState();
 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor để bắt JWT expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("API Error:", error.response?.status);
    if (error.response?.status === 401 || 
        error.response?.data?.message?.includes('jwt expired')) {
      
      // Xóa token và user
      const { logout } = useAuthStore.getState();
      logout();
  
    }
    return Promise.reject(error);
  }
);

export default api;
