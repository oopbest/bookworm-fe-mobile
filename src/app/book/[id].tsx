import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/AuthStore";
import { useThemeStore } from "@/store/ThemeStore";
import { API_URL } from "../../../constants/api";

const { width } = Dimensions.get("window");

interface BookDetail {
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

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token, user: currentUser } = useAuthStore();
  const { colors } = useThemeStore();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. ดึงรายละเอียดหนังสือจาก Backend
  const fetchBookDetail = async () => {
    if (!token || !id) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/books/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setBook(data);
      } else {
        Alert.alert("Error", data.message || "Failed to load book details");
      }
    } catch (error) {
      console.log("Error loading book:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookDetail();
  }, [id, token]);

  // 2. ลบหนังสือ (กรณีเป็นเจ้าของโพสต์)
  const handleDelete = () => {
    Alert.alert("Delete Book", "Are you sure you want to delete this book?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const res = await fetch(`${API_URL}/books/${id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              Alert.alert("Deleted", "Book deleted successfully!");
              router.back();
            } else {
              const data = await res.json();
              Alert.alert("Error", data.message || "Failed to delete");
            }
          } catch (error: any) {
            Alert.alert("Error", error.message);
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  };

  // แสดงดาวเรตติ้ง
  const renderStars = (rating: number) => (
    <View style={styles.ratingRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Ionicons
          key={s}
          name={s <= rating ? "star" : "star-outline"}
          size={22}
          color="#fbc02d"
          style={{ marginRight: 4 }}
        />
      ))}
      <Text style={[styles.ratingNumber, { color: colors.textPrimary }]}>
        {rating}.0 / 5.0
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!book) {
    return (
      <View
        style={[styles.centerContainer, { backgroundColor: colors.background }]}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
          Book not found.
        </Text>
      </View>
    );
  }

  const isOwner = currentUser?._id === book.user?._id;
  const formattedDate = new Date(book.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* 1. Header แถบด้านบน */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text
          style={[styles.headerTitle, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          Book Details
        </Text>

        {isOwner ? (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#e74c3c" />
            ) : (
              <Ionicons name="trash-outline" size={22} color="#e74c3c" />
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. รูปปกขนาดใหญ่ (Hero Cover) */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: book.coverImage }}
            style={styles.coverImage}
            contentFit="cover"
          />
        </View>

        {/* 3. การ์ดเนื้อหา (Content Card) */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.bookTitle, { color: colors.textPrimary }]}>
            {book.title}
          </Text>

          {/* เรตติ้ง */}
          {renderStars(book.rating)}

          {/* ข้อมูลผู้โพสต์รีวิว */}
          <View style={[styles.userSection, { borderTopColor: colors.border }]}>
            <Image
              source={{
                uri:
                  book.user?.profileImage ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    book.user?.username || "User",
                  )}&background=random`,
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={[styles.username, { color: colors.textPrimary }]}>
                Reviewed by {book.user?.username || "Anonymous"}
              </Text>
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {formattedDate}
              </Text>
            </View>
          </View>

          {/* เนื้อหารีวิว (Review Caption) */}
          <View
            style={[styles.captionSection, { borderTopColor: colors.border }]}
          >
            <Text
              style={[styles.sectionHeading, { color: colors.textPrimary }]}
            >
              Review
            </Text>
            <Text style={[styles.captionText, { color: colors.textDark }]}>
              {book.caption}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  deleteButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  imageWrapper: {
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  coverImage: {
    width: width * 0.65,
    height: width * 0.9,
    borderRadius: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  ratingNumber: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 6,
  },
  userSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  username: {
    fontSize: 15,
    fontWeight: "700",
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  captionSection: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  captionText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
