import { useEffect } from "react";
import { Stack } from "expo-router";
import { useAuthStore } from "@/store/AuthStore";
import { useThemeStore } from "@/store/ThemeStore";

export default function RootLayout() {
  const { checkAuth } = useAuthStore();
  const { loadTheme } = useThemeStore();

  useEffect(() => {
    checkAuth();
    loadTheme();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}
