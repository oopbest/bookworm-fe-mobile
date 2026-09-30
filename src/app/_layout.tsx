import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/store/AuthStore";
import { useThemeStore } from "@/store/ThemeStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { checkAuth } = useAuthStore();
  const { loadTheme } = useThemeStore();

  const [fontsLoaded, fontError] = useFonts({
    "JetBrainsMono-Regular": require("../../assets/fonts/ttf/JetBrainsMono-Regular.ttf"),
    "JetBrainsMono-Medium": require("../../assets/fonts/ttf/JetBrainsMono-Medium.ttf"),
    "JetBrainsMono-Bold": require("../../assets/fonts/ttf/JetBrainsMono-Bold.ttf"),
  });

  useEffect(() => {
    checkAuth();
    loadTheme();
  }, []);

  //  เมื่อฟอนต์โหลดเสร็จ ให้ปิด Splash Screen
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);
  // หากฟอนต์ยังโหลดไม่เสร็จ ให้รอชั่วคราว
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="book/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
