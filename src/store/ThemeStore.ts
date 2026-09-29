import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEMES, FOREST } from "../../constants/colors";

// ชนิดของธีมที่มีให้เลือก 4 แบบ
export type ThemeKey = "forest" | "retro" | "ocean" | "blossom";

export interface ThemeColors {
  primary: string;
  textPrimary: string;
  textSecondary: string;
  textDark: string;
  placeholderText: string;
  background: string;
  cardBackground: string;
  inputBackground: string;
  border: string;
  white: string;
  black: string;
}

interface ThemeState {
  currentTheme: ThemeKey;
  colors: ThemeColors;
  setTheme: (theme: ThemeKey) => Promise<void>;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set) => ({
  currentTheme: "forest",
  colors: FOREST,

  // 1. เปลี่ยนธีม และบันทึกลง AsyncStorage
  setTheme: async (theme: ThemeKey) => {
    try {
      await AsyncStorage.setItem("app_theme", theme);
      set({ currentTheme: theme, colors: THEMES[theme] });
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  },

  // 2. โหลดธีมที่เคยบันทึกไว้เมื่อเปิดแอป
  loadTheme: async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("app_theme");
      if (savedTheme && savedTheme in THEMES) {
        set({
          currentTheme: savedTheme as ThemeKey,
          colors: THEMES[savedTheme as ThemeKey],
        });
      }
    } catch (error) {
      console.log("Error loading theme:", error);
    }
  },
}));
