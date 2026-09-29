import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/AuthStore";
import { useThemeStore, ThemeKey } from "@/store/ThemeStore"; // 👈 1. นำเข้า ThemeStore
import { THEMES } from "../../../constants/colors";
import { API_URL } from "../../../constants/api";
import createStyles from "../../../assets/styles/profile.styles"; // 👈 2. createStyles

interface UserBook {
  _id: string;
  title: string;
  caption: string;
  rating: number;
  coverImage: string;
  createdAt: string;
}

// ข้อมูลตัวเลือกธีมทั้ง 4 แบบ
const THEME_OPTIONS: { key: ThemeKey; label: string; primary: string }[] = [
  { key: "forest", label: "Forest", primary: THEMES.forest.primary },
  { key: "retro", label: "Retro", primary: THEMES.retro.primary },
  { key: "ocean", label: "Ocean", primary: THEMES.ocean.primary },
  { key: "blossom", label: "Blossom", primary: THEMES.blossom.primary },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const { currentTheme, colors, setTheme } = useThemeStore(); // 👈 3. ดึง State ธีม
  const styles = useMemo(() => createStyles(colors), [colors]); // 👈 4. อัปเดตสไตล์ตามสีธีม

  const [books, setBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ดึงรายการหนังสือเฉพาะของผู้ใช้คนนี้
  const fetchUserBooks = async (isRefresh: boolean = false) => {
    if (!token) return;

    try {
      if (!isRefresh) setLoading(true);
      const response = await fetch(`${API_URL}/books/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setBooks(data || []);
      }
    } catch (error) {
      console.log("Error fetching user books:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserBooks();
    }, [token]),
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserBooks(true);
  }, [token]);

  const handleDeleteBook = (bookId: string) => {
    Alert.alert(
      "Delete Book",
      "Are you sure you want to delete this book review? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingId(bookId);
            try {
              const response = await fetch(`${API_URL}/books/${bookId}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.ok) {
                setBooks((prev) => prev.filter((b) => b._id !== bookId));
                Alert.alert("Success", "Book deleted successfully! 🗑️");
              } else {
                const data = await response.json();
                Alert.alert("Error", data.message || "Failed to delete book");
              }
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete book");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out of BookWorm?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={14}
            color="#fbc02d"
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  const renderBookItem = ({ item }: { item: UserBook }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const isDeletingThis = deletingId === item._id;

    return (
      <View style={styles.bookItem}>
        <Image
          source={{ uri: item.coverImage }}
          style={styles.bookImage}
          contentFit="cover"
        />

        <View style={styles.bookInfo}>
          <View>
            <Text style={styles.bookTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {renderStars(item.rating)}
            <Text style={styles.bookCaption} numberOfLines={2}>
              {item.caption}
            </Text>
          </View>
          <Text style={styles.bookDate}>{formattedDate}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteBook(item._id)}
          disabled={isDeletingThis}
          activeOpacity={0.7}
        >
          {isDeletingThis ? (
            <ActivityIndicator size="small" color="#e74c3c" />
          ) : (
            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => {
    const avatarUri =
      user?.profileImage ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user?.username || "User",
      )}&background=random`;

    return (
      <View>
        {/* ข้อมูลโปรไฟล์ผู้ใช้ */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.profileImage}
            contentFit="cover"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.username}>
              {user?.username || "Book Lover"}
            </Text>
            <Text style={styles.email}>{user?.email || ""}</Text>
            <Text style={styles.memberSince}>📚 Passionate Reader</Text>
          </View>
        </View>

        {/* 🎨 กล่องเลือกธีม (App Theme Selector) */}
        <View style={styles.themeSection}>
          <Text style={styles.themeTitle}>App Theme</Text>
          <View style={styles.themeOptions}>
            {THEME_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.themeCard,
                  currentTheme === t.key && styles.themeCardActive,
                ]}
                onPress={() => setTheme(t.key)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.themeCircle, { backgroundColor: t.primary }]}
                >
                  {currentTheme === t.key && (
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  )}
                </View>
                <Text style={styles.themeName}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ปุ่ม Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.white} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        {/* หัวข้อ Your Books */}
        <View style={styles.booksHeader}>
          <Text style={styles.booksTitle}>Your Books</Text>
          <Text style={styles.booksCount}>{books.length} books</Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={books}
        keyExtractor={(item) => item._id}
        renderItem={renderBookItem}
        contentContainerStyle={styles.booksList}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={56}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              You haven't posted any books yet
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/(tabs)/create" as any)}
              activeOpacity={0.8}
            >
              <Text style={styles.addButtonText}>Add your first book</Text>
            </TouchableOpacity>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}
