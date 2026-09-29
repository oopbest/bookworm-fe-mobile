import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../constants/api";

interface User {
  _id: string;
  username: string;
  email: string;
  profileImage: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean; // โหลดตอนกดปุ่ม login / signup / logout
  isCheckingAuth: boolean; // โหลดตอนเปิดแอปเพื่อเช็ค Token
  checkAuth: () => Promise<void>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isCheckingAuth: true, // เริ่มต้นเป็น true จนกว่าจะเช็คเสร็จ

  // 1. เช็ค Token ตอนเปิดแอป
  checkAuth: async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");
      if (storedToken && storedUser) {
        set({ token: storedToken, user: JSON.parse(storedUser) });
      }
    } catch (error) {
      console.log("Error checking auth:", error);
    } finally {
      set({ isCheckingAuth: false }); // เช็คเสร็จแล้ว
    }
  },

  // 2. เข้าสู่ระบบ
  login: async (email, password) => {
    set({ isLoading: true }); // เริ่มโหลด
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || "Login failed" };
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      set({ token: data.token, user: data.user });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Network error" };
    } finally {
      set({ isLoading: false }); // โหลดเสร็จสิ้น
    }
  },

  // 3. สมัครสมาชิก
  signup: async (username, email, password) => {
    set({ isLoading: true }); // เริ่มโหลด
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || "Signup failed" };
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      set({ token: data.token, user: data.user });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "Network error" };
    } finally {
      set({ isLoading: false }); // โหลดเสร็จสิ้น
    }
  },

  // 4. ออกจากระบบ
  logout: async () => {
    set({ isLoading: true });
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      set({ token: null, user: null });
    } catch (error) {
      console.log("Error logging out:", error);
    } finally {
      set({ isLoading: false });
    }
  },
}));
