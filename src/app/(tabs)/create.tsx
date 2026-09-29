import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/store/AuthStore";
import { API_URL } from "../../../constants/api";
import COLORS from "../../../constants/colors";
import styles from "../../../assets/styles/create.styles";

export default function CreateScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [rating, setRating] = useState(5);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. ฟังก์ชันเลือกรูปภาพจากเครื่อง
  const pickImage = async () => {
    // ขอ Permission เข้าถึงรูปภาพในเครื่อง
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(
        "Permission required",
        "Please allow access to your photo library to select a cover image.",
      );
      return;
    }
    // เปิดคลังรูปภาพ
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true, // ดึง Base64 เพื่อส่งขึ้น Cloudinary ผ่าน Backend
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setCoverImage(asset.uri);

      // ปรับให้ยืดหยุ่นขึ้น (ดึง mimeType จริงจาก asset เผื่อผู้ใช้เลือกไฟล์ .png หรือ .webp):
      const mimeType = asset.mimeType || "image/jpeg";
      setImageBase64(`data:${mimeType};base64,${asset.base64}`);
    }
  };

  // 2. ฟังก์ชันกดแชร์หนังสือ (Submit)
  const handleSubmit = async () => {
    if (!title.trim() || !caption.trim() || !imageBase64) {
      Alert.alert(
        "Missing Fields",
        "Please fill in all fields and select a cover image.",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          caption: caption.trim(),
          rating,
          coverImage: imageBase64,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        Alert.alert("Error", data.message || "Failed to create book");
        return;
      }
      Alert.alert("Success", "Book shared successfully! 🎉", [
        {
          text: "OK",
          onPress: () => {
            // เคลียร์ฟอร์ม
            setTitle("");
            setCaption("");
            setRating(5);
            setCoverImage(null);
            setImageBase64(null);
            // กลับไปที่หน้าแรก (Home)
            router.navigate("/(tabs)" as any);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Network Error", error.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.scrollViewStyle}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add New Book</Text>
            <Text style={styles.subtitle}>
              Share your book review and ratings with others
            </Text>
          </View>
          <View style={styles.form}>
            {/* 1. ชื่อหนังสือ (Title) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Book Title</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="book-outline"
                  size={20}
                  color={COLORS.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter book title..."
                  placeholderTextColor={COLORS.placeholderText}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>
            {/* 2. ให้คะแนนดาว (Rating 1 - 5) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Rating: {rating} / 5</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    style={styles.starButton}
                    onPress={() => setRating(star)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={star <= rating ? "star" : "star-outline"}
                      size={28}
                      color="#fbc02d"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            {/* 3. คำรีวิว (Caption) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Caption / Review</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Write your thoughts or review about this book..."
                placeholderTextColor={COLORS.placeholderText}
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            {/* 4. เลือกรูปปก (Cover Image) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Cover Image</Text>
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                {coverImage ? (
                  <Image
                    source={{ uri: coverImage }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderContainer}>
                    <Ionicons
                      name="image-outline"
                      size={44}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.placeholderText}>
                      Tap to select cover image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
            {/* 5. ปุ่มบันทึก (Submit) */}
            <TouchableOpacity
              style={[styles.button, isSubmitting && { opacity: 0.8 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={20}
                    color={COLORS.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>Share Book</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
