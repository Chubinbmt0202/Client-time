import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onValue, ref, query, limitToLast, orderByChild } from "firebase/database";
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
  Platform,
} from "react-native";
import { API_ENDPOINTS } from "../constants/api";
import { database } from "../utils/firebase";
import { CustomAlert, CustomAlertState } from "../components/CustomAlert";

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
  const [customAlert, setCustomAlert] = useState<CustomAlertState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });
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

    console.log(`📡 Lắng nghe thông báo realtime (tối đa 30 cái) cho: ${employeeId}`);
    const notiRef = ref(database, `notifications/${employeeId}`);
    const notiQuery = query(notiRef, orderByChild("ngay_tao"), limitToLast(30));

    const unsubscribe = onValue(notiQuery, (snapshot) => {
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
        setCustomAlert({
          visible: true,
          title: "Lỗi",
          message: data.message || "Không thể cập nhật trạng thái thông báo.",
          type: "error",
          confirmText: "Đã hiểu",
          onConfirm: () => setCustomAlert((prev) => ({ ...prev, visible: false })),
        });
      }
    } catch (error) {
      console.error("Lỗi đánh dấu đã đọc:", error);
      setCustomAlert({
        visible: true,
        title: "Lỗi kết nối",
        message: "Không thể kết nối tới server.",
        type: "error",
        confirmText: "Đã hiểu",
        onConfirm: () => setCustomAlert((prev) => ({ ...prev, visible: false })),
      });
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;
    const hasUnread = notifications.some((n) => !n.da_doc);
    if (!hasUnread) {
      setCustomAlert({
        visible: true,
        title: "Thông báo",
        message: "Tất cả thông báo đã được đọc.",
        type: "info",
        confirmText: "Đã hiểu",
        onConfirm: () => setCustomAlert((prev) => ({ ...prev, visible: false })),
      });
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
        setCustomAlert({
          visible: true,
          title: "Lỗi",
          message: data.message || "Không thể cập nhật trạng thái.",
          type: "error",
          confirmText: "Đã hiểu",
          onConfirm: () => setCustomAlert((prev) => ({ ...prev, visible: false })),
        });
      }
    } catch (error) {
      console.error("Lỗi đánh dấu tất cả đã đọc:", error);
      setCustomAlert({
        visible: true,
        title: "Lỗi kết nối",
        message: "Không thể kết nối tới server.",
        type: "error",
        confirmText: "Đã hiểu",
        onConfirm: () => setCustomAlert((prev) => ({ ...prev, visible: false })),
      });
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
          icon: <MaterialCommunityIcons name="face-recognition" size={24} color="#0066FF" />,
          bgColor: "#E5F0FF",
        };
      case "LEAVE":
        return {
          icon: <Ionicons name="document-text" size={24} color="#059669" />,
          bgColor: "#D1FAE5",
        };
      case "ATTENDANCE":
        return {
          icon: <Ionicons name="checkmark-circle" size={24} color="#D97706" />,
          bgColor: "#FEF3C7",
        };
      default:
        return {
          icon: <Feather name="bell" size={24} color="#475569" />,
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
        activeOpacity={0.85}
      >
        {/* Unread Indicator Glow */}
        {!item.da_doc && <View style={styles.unreadIndicator} />}

        <View style={[styles.iconWrapper, { backgroundColor: config.bgColor }]}>
          {config.icon}
        </View>
        
        <View style={styles.contentWrapper}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.da_doc && styles.titleUnread]} numberOfLines={1}>
              {item.tieu_de}
            </Text>
            <Text style={[styles.timeText, !item.da_doc && styles.timeTextUnread]}>{formatTime(item.ngay_tao)}</Text>
          </View>
          
          <Text style={[styles.descText, !item.da_doc && styles.descTextUnread]} numberOfLines={2}>
            {item.noi_dung}
          </Text>

          {/* Action Footer */}
          {!item.da_doc && (
            <View style={styles.actionFooter}>
              <TouchableOpacity
                style={styles.markReadBtn}
                onPress={() => handleMarkAsRead(item.id_thong_bao, item.da_doc)}
              >
                <Feather name="check" size={14} color="#FFFFFF" />
                <Text style={styles.actionText}>Đánh dấu đã đọc</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Premium Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông báo</Text>
        </View>
        <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
          <Ionicons name="checkmark-done" size={18} color="#0066FF" />
          <Text style={styles.markAllText}>Đã đọc tất cả</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={styles.loadingText}>Đang tải thông báo mới nhất...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#0066FF"]} />
          }
          contentContainerStyle={{ flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="notifications-off-outline" size={56} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
              <Text style={styles.emptyDesc}>
                Các thông báo về điểm danh, phép và hệ thống sẽ xuất hiện tại đây.
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
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#0066FF"]} tintColor="#0066FF" />
          }
        />
      )}
      <CustomAlert {...customAlert} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F4F7FA", // Softer, more premium background
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 44 : 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F0F5FF",
    borderRadius: 20,
    gap: 4,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0066FF",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "500",
    color: "#64748B",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  notiItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 24, // Larger border radius for modern feel
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "transparent",
    // Premium shadow
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    position: "relative",
    overflow: "hidden",
  },
  notiItemUnread: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5F0FF",
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  unreadIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#0066FF",
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475569",
    flex: 1,
    marginRight: 8,
  },
  titleUnread: {
    color: "#0F172A",
    fontWeight: "800",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94A3B8",
  },
  timeTextUnread: {
    color: "#0066FF",
    fontWeight: "600",
  },
  descText: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    fontWeight: "400",
  },
  descTextUnread: {
    color: "#334155",
    fontWeight: "500",
  },
  actionFooter: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  markReadBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0066FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    paddingTop: 120,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 2,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10,
  },
  emptyDesc: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});

