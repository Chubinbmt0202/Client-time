import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onValue, ref } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_ENDPOINTS } from "../constants/api";
import { database } from "../utils/firebase";

interface NotificationItem {
  id_thong_bao: string;
  tieu_de: string;
  noi_dung: string;
  loai_thong_bao: string;
  da_doc: boolean;
  ngay_tao: string | number;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [isFaceUpdated, setIsFaceUpdated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const router = useRouter();

  // Load employee ID from session
  useEffect(() => {
    const loadEmployeeId = async () => {
      try {
        const userStr = await AsyncStorage.getItem("userData");
        if (userStr) {
          const user = JSON.parse(userStr);
          const id = user.id_nhan_vien || "";
          setEmployeeId(id);
          setIsFaceUpdated(user.is_face_updated === true);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin nhân viên:", error);
        setIsLoading(false);
      }
    };
    loadEmployeeId();
  }, []);

  // Listen to Firebase Realtime Database for realtime notifications
  useEffect(() => {
    if (!employeeId) return;

    console.log(`📡 Lắng nghe thông báo realtime cho: ${employeeId}`);
    const notiRef = ref(database, `notifications/${employeeId}`);

    const unsubscribe = onValue(notiRef, (snapshot) => {
      const data = snapshot.val();
      setIsLoading(false);

      if (data) {
        // Chuyển đổi object thành array
        let list: NotificationItem[] = Object.keys(data).map((key) => ({
          ...data[key],
          id_thong_bao: key,
        }));

        // Tự động ẩn các thông báo yêu cầu đăng ký khuôn mặt cũ nếu đã đăng ký rồi
        if (isFaceUpdated) {
          list = list.filter((item) => item.loai_thong_bao !== "FACE_UPDATE");
        }

        // Sắp xếp ngày tạo giảm dần (mới nhất lên đầu)
        list.sort((a, b) => {
          const timeA = new Date(a.ngay_tao).getTime();
          const timeB = new Date(b.ngay_tao).getTime();
          return timeB - timeA;
        });
        setNotifications(list);
      } else {
        setNotifications([]);
      }
    }, (error) => {
      console.error("Lỗi Firebase Realtime:", error);
      fetchNotificationsFallback();
    });

    return () => {
      console.log(`📴 Đã huỷ lắng nghe thông báo Firebase cho: ${employeeId}`);
      unsubscribe();
    };
  }, [employeeId]);

  // Fallback REST API fetch if Firebase fails or is slow
  const fetchNotificationsFallback = async () => {
    if (!employeeId) return;
    try {
      const res = await fetch(API_ENDPOINTS.NOTIFICATIONS(employeeId));
      const data = await res.json();
      if (res.ok && data.success) {
        let list: NotificationItem[] = data.data;
        if (isFaceUpdated) {
          list = list.filter((item) => item.loai_thong_bao !== "FACE_UPDATE");
        }
        setNotifications(list);
      }
    } catch (error) {
      console.error("Lỗi fallback lấy thông báo:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotificationsFallback();
    setRefreshing(false);
  };

  // Mark a single notification as read
  const handleMarkAsRead = async (id: string, alreadyRead: boolean) => {
    if (alreadyRead) return;
    try {
      const res = await fetch(API_ENDPOINTS.MARK_NOTIFICATION_READ(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        Alert.alert("Lỗi", data.message || "Không thể cập nhật trạng thái thông báo.");
      }
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
      Alert.alert("Lỗi kết nối", "Không thể kết nối tới server.");
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;
    const hasUnread = notifications.some((n) => !n.da_doc);
    if (!hasUnread) {
      Alert.alert("Thông báo", "Tất cả thông báo đã được đọc.");
      return;
    }

    try {
      const res = await fetch(API_ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        console.log("Đã đánh dấu đọc tất cả!");
      } else {
        Alert.alert("Lỗi", data.message || "Không thể cập nhật trạng thái.");
      }
    } catch (error) {
      console.error("Lỗi đánh dấu tất cả đã đọc:", error);
      Alert.alert("Lỗi kết nối", "Không thể kết nối tới server.");
    }
  };


  // Helper to format date
  const formatTime = (timeInput: string | number) => {
    try {
      const date = new Date(timeInput);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return "Hôm qua";
      if (diffDays < 7) return `${diffDays} ngày trước`;

      const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
      const month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
      const year = date.getFullYear();
      const hour = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
      const min = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
      return `${hour}:${min} ${day}/${month}/${year}`;
    } catch (e) {
      return "";
    }
  };

  // Get configuration of icon & color based on notification type
  const getNotificationConfig = (type: string) => {
    switch (type) {
      case "FACE_UPDATE":
        return {
          icon: <MaterialCommunityIcons name="face-recognition" size={22} color="#1C75FF" />,
          bgColor: "#EEF4FE",
        };
      case "LEAVE":
        return {
          icon: <Ionicons name="document-text-outline" size={22} color="#10B981" />,
          bgColor: "#E6FBF3",
        };
      case "ATTENDANCE":
        return {
          icon: <Ionicons name="checkmark-circle-outline" size={22} color="#F59E0B" />,
          bgColor: "#FEF7E6",
        };
      default:
        return {
          icon: <Feather name="bell" size={20} color="#64748B" />,
          bgColor: "#F1F5F9",
        };
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const config = getNotificationConfig(item.loai_thong_bao);
    return (
      <TouchableOpacity
        style={[styles.notiItem, !item.da_doc && styles.notiItemUnread]}
        onPress={() => handleMarkAsRead(item.id_thong_bao, item.da_doc)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrapper, { backgroundColor: config.bgColor }]}>
          {config.icon}
        </View>
        <View style={styles.contentWrapper}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.da_doc && styles.titleUnread]} numberOfLines={1}>
              {item.tieu_de}
            </Text>
            <Text style={styles.timeText}>{formatTime(item.ngay_tao)}</Text>
          </View>
          <Text style={styles.descText} numberOfLines={2}>
            {item.noi_dung}
          </Text>

          {/* Action Footer */}
          {!item.da_doc && (
            <View style={styles.actionFooter}>
              <TouchableOpacity
                style={styles.markReadBtn}
                onPress={() => handleMarkAsRead(item.id_thong_bao, item.da_doc)}
              >
                <Feather name="check" size={14} color="#1C75FF" />
                <Text style={styles.actionText}>Đọc</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {!item.da_doc && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Custom Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={26} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
          <Text style={styles.markAllText}>Đã xem tất cả</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1C75FF" />
          <Text style={styles.loadingText}>Đang tải thông báo...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#1C75FF"]} />
          }
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Feather name="bell-off" size={48} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Không có thông báo nào</Text>
              <Text style={styles.emptyDesc}>
                Tất cả thông báo của bạn từ quản trị viên và hệ thống sẽ xuất hiện tại đây.
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id_thong_bao}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#1C75FF"]} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  markAllButton: {
    padding: 6,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1C75FF",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  notiItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  notiItemUnread: {
    borderColor: "#BFDBFE",
    backgroundColor: "#F8FAFF",
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contentWrapper: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
    flex: 1,
    marginRight: 8,
  },
  titleUnread: {
    color: "#1E293B",
    fontWeight: "700",
  },
  timeText: {
    fontSize: 11,
    color: "#94A3B8",
  },
  descText: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 10,
  },
  actionFooter: {
    flexDirection: "row",
    gap: 16,
  },
  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1C75FF",
  },
  unreadDot: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1C75FF",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    paddingTop: 100,
  },
  emptyIconWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
});
