import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/AuthStore";
import { API_URL } from "../../../constants/api";
import COLORS from "../../../constants/colors";
import styles from "../../../assets/styles/home.styles";

// 1. กำหนด Type สำหรับข้อมูลหนังสือจาก Backend
interface BookItem {
  _id: string;
  title: string;
  caption: string;
  rating: number;
  coverImage: string;
  user: {
    _id: string;
    username: string;
    profileImage?: string;
  };
  createdAt: string;
}

export default function HomeScreen() {
  const { token } = useAuthStore();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // 2. ฟังก์ชันดึงข้อมูลหนังสือจาก API
  const fetchBooks = async (
    pageNum: number = 1,
    isRefresh: boolean = false,
  ) => {
    if (!token) return;

    try {
      if (pageNum === 1 && !isRefresh) setLoading(true);

      const response = await fetch(`${API_URL}/books?page=${pageNum}&limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        if (pageNum === 1) {
          setBooks(data.books || []);
        } else {
          setBooks((prev) => [...prev, ...(data.books || [])]);
        }

        setPage(pageNum);
        // ตรวจสอบว่ายังมีหน้าถัดไปให้ดึงอีกหรือไม่
        setHasMore(data.currentPage < data.totalPages);
      }
    } catch (error) {
      console.log("Error fetching books:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // ดึงข้อมูลใหม่ทุกครั้งที่สลับกลับมาที่แท็บ Home (รวมถึงหลังเพิ่มหนังสือเสร็จ)
  useFocusEffect(
    useCallback(() => {
      fetchBooks(1);
    }, [token]),
  );

  // 3. ดึงลงเพื่อรีเฟรช (Pull-to-Refresh)
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBooks(1, true);
  }, [token]);

  // 4. เลื่อนถึงล่างสุดเพื่อโหลดหน้าถัดไป (Pagination)
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      fetchBooks(page + 1);
    }
  };

  // 5. แสดงดาวตาม Rating (1 - 5 ดาว)
  const renderStars = (rating: number) => {
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={16}
            color="#fbc02d"
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  // 6. การ์ดแสดงผลหนังสือแต่ละเล่ม
  const renderBookItem = ({ item }: { item: BookItem }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return (
      <View style={styles.bookCard}>
        {/* ข้อมูลเจ้าของโพสต์ */}
        <View style={styles.bookHeader}>
          <View style={styles.userInfo}>
            <Image
              source={{
                uri:
                  item.user?.profileImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    item.user?.username || "User",
                  )}&background=random`,
              }}
              style={styles.avatar}
            />
            <Text style={styles.username}>
              {item.user?.username || "Unknown"}
            </Text>
          </View>
        </View>

        {/* รูปปกหนังสือ */}
        <View style={styles.bookImageContainer}>
          <Image
            source={{ uri: item.coverImage }}
            style={styles.bookImage}
            contentFit="cover"
          />
        </View>

        {/* รายละเอียดหนังสือ */}
        <View style={styles.bookDetails}>
          <Text style={styles.bookTitle}>{item.title}</Text>
          {renderStars(item.rating)}
          <Text style={styles.caption}>{item.caption}</Text>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
      </View>
    );
  };

  // กำลังโหลดครั้งแรก
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <FlatList
        data={books}
        keyExtractor={(item) => item._id}
        renderItem={renderBookItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        // Header
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>BookWorm Feed</Text>
            <Text style={styles.headerSubtitle}>
              Discover what your friends are reading 📖
            </Text>
          </View>
        }
        // กรณีไม่มีข้อมูลหนังสือ
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={64}
              color={COLORS.textSecondary}
            />
            <Text style={styles.emptyText}>No books added yet</Text>
            <Text style={styles.emptySubtext}>
              Be the first one to share a book review!
            </Text>
          </View>
        }
        // Pull-to-refresh
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        // โหลดหน้าถัดไปเมื่อเลื่อนถึงล่างสุด
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
