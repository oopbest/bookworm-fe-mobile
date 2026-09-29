import React from "react";
import { Redirect } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuthStore } from "@/store/AuthStore";
import COLORS from "../../constants/colors";

export default function Index() {
  const { user, logout, isCheckingAuth } = useAuthStore();

  // กำลังตรวจเช็ค Token จากเครื่อง
  if (isCheckingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return user ? (
    <Redirect href={"/(tabs)" as any} />
  ) : (
    <Redirect href="/login" />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});
