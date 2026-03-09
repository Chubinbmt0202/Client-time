import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DrawerActions,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFaceUpdated, setIsFaceUpdated] = useState(false);
  const [profile, setProfile] = useState({ name: "", id: "", role: "" });
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadSession = async () => {
        try {
          let updated = false;

          const faceStatus = await AsyncStorage.getItem("isFaceUpdated");
          if (faceStatus !== null) updated = faceStatus === "true";

          const userStr = await AsyncStorage.getItem("userData");
          if (userStr) {
            const user = JSON.parse(userStr);
            setProfile({
              name: user.full_name || "Người dùng",
              id: user.username || "NV000",
              role: user.role === "admin" ? "Quản trị viên" : "Nhân viên",
            });

            // Fallback in case root isFaceUpdated didn't save correctly
            if (user.is_face_updated === true) {
              updated = true;
            }
          }

          setIsFaceUpdated(updated);
        } catch (error) {
          console.error("Lỗi tải thông tin phiên:", error);
        }
      };

      loadSession();
    }, []),
  );

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const formatTime = (value: number) =>
    value < 10 ? `0${value}` : value.toString();

  const days = [
    "CHỦ NHẬT",
    "THỨ 2",
    "THỨ 3",
    "THỨ 4",
    "THỨ 5",
    "THỨ 6",
    "THỨ 7",
  ];
  const dayName = days[currentTime.getDay()];
  const dateStr = `${dayName}, ${currentTime.getDate()} THÁNG ${currentTime.getMonth() + 1}, ${currentTime.getFullYear()}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleOpenDrawer}>
          <Feather name="menu" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trang chủ</Text>
        <TouchableOpacity>
          <View>
            <Feather name="bell" size={24} color="#0F172A" />
            <View style={styles.notificationDot} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Warning Banner */}
      {!isFaceUpdated && (
        <View style={styles.warningBanner}>
          <Ionicons
            name="warning-outline"
            size={20}
            color="#B45309"
            style={styles.warningIcon}
          />
          <View style={styles.warningTextContainer}>
            <Text style={styles.warningTitle}>Chưa đăng ký khuôn mặt</Text>
            <Text style={styles.warningDesc}>
              Bạn chưa đăng ký dữ liệu khuôn mặt mẫu. Vui lòng cập nhật để có
              thể chấm công.
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        {isFaceUpdated && (
          <View style={styles.profileCard}>
            <Image
              source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.name}</Text>
              <Text style={styles.profileRole}>{profile.role}</Text>
              <Text style={styles.profileId}>Mã NV: {profile.id}</Text>
            </View>
          </View>
        )}

        {/* Date & Time */}
        <View style={styles.timeSection}>
          <Text style={styles.dateText}>{dateStr}</Text>
          <View style={styles.clockContainer}>
            <View style={styles.timeBlock}>
              <View style={styles.timeBox}>
                <Text style={styles.timeValue}>
                  {formatTime(currentTime.getHours())}
                </Text>
              </View>
              <Text style={styles.timeLabel}>Giờ</Text>
            </View>

            <View style={styles.timeBlock}>
              <View style={styles.timeBox}>
                <Text style={styles.timeValue}>
                  {formatTime(currentTime.getMinutes())}
                </Text>
              </View>
              <Text style={styles.timeLabel}>Phút</Text>
            </View>

            <View style={styles.timeBlock}>
              <View style={styles.timeBox}>
                <Text style={styles.timeValue}>
                  {formatTime(currentTime.getSeconds())}
                </Text>
              </View>
              <Text style={styles.timeLabel}>Giây</Text>
            </View>
          </View>
        </View>

        {!isFaceUpdated ? (
          /* Missing Face Registration UI */
          <View style={styles.faceRegistrationContainer}>
            <View style={styles.faceIconWrapper}>
              <View style={styles.faceIconInner}>
                <MaterialCommunityIcons
                  name="face-recognition"
                  size={60}
                  color="#1C75FF"
                />
              </View>
            </View>

            <Text style={styles.faceRegTitle}>Xác thực tài khoản</Text>
            <Text style={styles.faceRegDesc}>
              Tính năng chấm công đang bị khóa. Hãy đăng ký khuôn mặt để bắt đầu
              sử dụng.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/camera")}
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color="#FFFFFF"
                style={styles.btnIcon}
              />
              <Text style={styles.primaryButtonText}>
                Đăng ký khuôn mặt ngay
              </Text>
            </TouchableOpacity>

            <View style={styles.disabledButton}>
              <Ionicons
                name="finger-print-outline"
                size={20}
                color="#94A3B8"
                style={styles.btnIcon}
              />
              <Text style={styles.disabledButtonText}>Chấm công (Bị khóa)</Text>
            </View>
          </View>
        ) : (
          /* Normal Check-in UI */
          <>
            {/* Check-in Button */}
            <TouchableOpacity style={styles.checkInButton}>
              <MaterialCommunityIcons
                name="face-recognition"
                size={24}
                color="#FFFFFF"
                style={styles.checkInIcon}
              />
              <Text style={styles.checkInText}>Chấm công ngay</Text>
            </TouchableOpacity>

            {/* Today's Status */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trạng thái hôm nay</Text>
            </View>

            <View style={styles.statusCardsContainer}>
              <View style={[styles.statusCard, styles.statusCardIn]}>
                <View style={styles.statusCardHeader}>
                  <Ionicons name="enter-outline" size={20} color="#16A34A" />
                  <Text style={styles.statusCardTitleIn}>Giờ vào</Text>
                </View>
                <Text style={styles.statusTime}>08:00 AM</Text>
                <Text style={styles.statusSubtitleIn}>Đúng giờ</Text>
              </View>

              <View style={[styles.statusCard, styles.statusCardOut]}>
                <View style={styles.statusCardHeader}>
                  <Ionicons name="exit-outline" size={20} color="#64748B" />
                  <Text style={styles.statusCardTitleOut}>Giờ ra</Text>
                </View>
                <Text style={styles.statusTimeEmpty}>--:--</Text>
                <Text style={styles.statusSubtitleOut}>Chưa chấm</Text>
              </View>
            </View>

            {/* Notifications */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thông báo gần đây</Text>
              <TouchableOpacity>
                <Text style={styles.linkText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.notificationList}>
              {/* Item 1 */}
              <View style={styles.notificationItem}>
                <View
                  style={[
                    styles.notificationIconWrapper,
                    { backgroundColor: "#EEF4FE" },
                  ]}
                >
                  <Ionicons name="megaphone" size={20} color="#1C75FF" />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    Họp toàn công ty quý 3
                  </Text>
                  <Text style={styles.notificationDesc}>
                    Lịch họp định kỳ quý 3 sẽ diễn ra vào lúc 14:00 ngày mai tại
                    phòng họp lớn.
                  </Text>
                  <Text style={styles.notificationTime}>2 giờ trước</Text>
                </View>
              </View>

              {/* Item 2 */}
              <View style={styles.notificationItem}>
                <View
                  style={[
                    styles.notificationIconWrapper,
                    { backgroundColor: "#DCFCE7" },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>
                    Duyệt đơn nghỉ phép
                  </Text>
                  <Text style={styles.notificationDesc}>
                    Đơn xin nghỉ phép ngày 20/10 của bạn đã được quản lý phê
                    duyệt.
                  </Text>
                  <Text style={styles.notificationTime}>Hôm qua</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  notificationDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: "#EDF2FF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#1C75FF",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 2,
  },
  profileId: {
    fontSize: 12,
    color: "#94A3B8",
  },
  timeSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 16,
  },
  clockContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  timeBlock: {
    alignItems: "center",
  },
  timeBox: {
    backgroundColor: "#F8FAFC",
    width: 72,
    height: 80,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timeValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#0F172A",
  },
  timeLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  checkInButton: {
    backgroundColor: "#1C75FF",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginBottom: 32,
    shadowColor: "#1C75FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  checkInIcon: {
    marginRight: 8,
  },
  checkInText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  linkText: {
    fontSize: 14,
    color: "#1C75FF",
  },
  statusCardsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 32,
  },
  statusCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  statusCardIn: {
    backgroundColor: "#F0FDF4",
    borderColor: "#DCFCE7",
  },
  statusCardOut: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
  },
  statusCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusCardTitleIn: {
    fontSize: 14,
    color: "#16A34A",
    marginLeft: 6,
    fontWeight: "500",
  },
  statusCardTitleOut: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 6,
    fontWeight: "500",
  },
  statusTime: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  statusTimeEmpty: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
    letterSpacing: 2,
  },
  statusSubtitleIn: {
    fontSize: 13,
    color: "#16A34A",
  },
  statusSubtitleOut: {
    fontSize: 13,
    color: "#94A3B8",
  },
  notificationList: {
    gap: 16,
  },
  notificationItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  notificationIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
  },
  notificationDesc: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: "#94A3B8",
  },
  warningBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7", // Yellow-100
    padding: 16,
    alignItems: "flex-start",
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B45309", // Yellow-700
    marginBottom: 4,
  },
  warningDesc: {
    fontSize: 13,
    color: "#B45309",
    lineHeight: 18,
  },
  faceRegistrationContainer: {
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 16,
  },
  faceIconWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "#BFDBFE", // Blue-200
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#EFF6FF", // Blue-50
  },
  faceIconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DBEAFE", // Blue-100
    justifyContent: "center",
    alignItems: "center",
  },
  faceRegTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  faceRegDesc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  primaryButton: {
    flexDirection: "row",
    backgroundColor: "#1C75FF",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#1C75FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  btnIcon: {
    marginRight: 8,
  },
  disabledButton: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9", // Slate-100
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledButtonText: {
    color: "#94A3B8", // Slate-400
    fontSize: 15,
    fontWeight: "600",
  },
});
