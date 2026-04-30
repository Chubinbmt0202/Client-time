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
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const SHIFT_START_HOURS = 8;
const SHIFT_START_MINUTES = 0;
const SHIFT_END_HOURS = 17;
const SHIFT_END_MINUTES = 0;

export default function DashboardScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFaceUpdated, setIsFaceUpdated] = useState(false);
  const [profile, setProfile] = useState<{
    name: string;
    id: string;
    role: string;
    username: string;
  }>({ name: "", id: "", role: "", username: "" });

  // 🚀 DỮ LIỆU ĐIỂM DANH HÔM NAY
  const [attendance, setAttendance] = useState<{
    checkIn: string | null;
    checkOut: string | null;
  }>({ checkIn: null, checkOut: null });

  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const router = useRouter();

  const loadSession = useCallback(async () => {
    try {
      let updated = false;

      const userStr = await AsyncStorage.getItem("userData");
      console.log("Dữ liệu nè má:", userStr);
      if (userStr) {
        const user = JSON.parse(userStr);
        const userProfile = {
          name: user.ho_va_ten || "Người dùng",
          id: user.id_nhan_vien || "NV000",
          role: user.vai_tro === "admin" ? "Quản trị viên" : "Nhân viên",
          username: user.ten_dang_nhap || "",
        };
        setProfile(userProfile);

        // Cập nhật trạng thái đã đăng ký khuôn mặt chưa
        if (user.is_face_updated === true) {
          updated = true;
        }

        // ==========================================
        // 🚀 LẤY DỮ LIỆU ĐIỂM DANH TỪ ASYNC STORAGE
        // ==========================================
        const history = user.attendance_history;
        if (history && history.length > 0) {
          // Lấy mốc thời gian hiện tại của điện thoại
          const today = new Date();

          // Tìm record của ngày hôm nay bằng cách so sánh chính xác Ngày/Tháng/Năm
          const todayRecord = history.find((record: { log_date: string | number | Date; }) => {
            const recordDate = new Date(record.log_date);

            return (
              recordDate.getDate() === today.getDate() &&
              recordDate.getMonth() === today.getMonth() &&
              recordDate.getFullYear() === today.getFullYear()
            );
          });

          // Nếu tìm thấy, đưa thẳng vào state để UI bên dưới hiển thị
          if (todayRecord) {
            setAttendance({
              checkIn: todayRecord.check_in_time,
              checkOut: todayRecord.check_out_time
            });
          } else {
            setAttendance({ checkIn: null, checkOut: null });
          }
        }
      }

      setIsFaceUpdated(updated);
    } catch (error) {
      console.error("Lỗi tải thông tin phiên:", error);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSession();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadSession();
    }, [loadSession]),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOpenDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const formatTime = (value: number) =>
    value < 10 ? `0${value}` : value.toString();

  const formatAttendanceTime = (isoString: string | null) => {
    if (!isoString) return "--:--";
    try {
      const date = new Date(isoString);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${formatTime(displayHours)}:${formatTime(minutes)} ${ampm}`;
    } catch (e) {
      return "--:--";
    }
  };

  const getCheckInStatus = (checkInTime: string | null) => {
    if (!checkInTime) return "Chưa chấm";
    try {
      const checkInDate = new Date(checkInTime);
      const checkInHours = checkInDate.getHours();
      const checkInMinutes = checkInDate.getMinutes();

      if (
        checkInHours > SHIFT_START_HOURS ||
        (checkInHours === SHIFT_START_HOURS && checkInMinutes > SHIFT_START_MINUTES)
      ) {
        const lateMinutes =
          (checkInHours - SHIFT_START_HOURS) * 60 +
          (checkInMinutes - SHIFT_START_MINUTES);
        return `Đi trễ (${lateMinutes} phút)`;
      }
      return "Đúng giờ";
    } catch (e) {
      return "Đúng giờ";
    }
  };

  const isLate = (checkInTime: string | null) => {
    if (!checkInTime) return false;
    try {
      const checkInDate = new Date(checkInTime);
      const checkInHours = checkInDate.getHours();
      const checkInMinutes = checkInDate.getMinutes();

      return (
        checkInHours > SHIFT_START_HOURS ||
        (checkInHours === SHIFT_START_HOURS && checkInMinutes > SHIFT_START_MINUTES)
      );
    } catch (e) {
      return false;
    }
  };

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Card */}
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
              onPress={() => router.push("/face-registration")}
            >
              <Ionicons
                name="camera-outline"
                size={20}
                color="#FFFFFF"
                style={styles.btnIcon}
              />
              <Text style={styles.primaryButtonText}>
                Đăng ký khuôn mặt ngay nè
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
            {/* Check-in & Check-out Buttons */}
            <View style={styles.attendanceButtonsContainer}>
              {/* Nút Chấm công vào */}
              <TouchableOpacity
                style={[
                  styles.attendanceButton,
                  attendance.checkIn ? styles.disabledAttendanceBtn : styles.checkInBtn
                ]}
                onPress={() => router.push("/face-check-in")}
                disabled={!!attendance.checkIn}
              >
                <MaterialCommunityIcons
                  name="login"
                  size={24}
                  color={attendance.checkIn ? "#94A3B8" : "#FFFFFF"}
                />
                <Text style={[styles.attendanceBtnText, attendance.checkIn && styles.disabledBtnText]}>
                  Vào ca
                </Text>
              </TouchableOpacity>

              {/* Nút Chấm công ra */}
              <TouchableOpacity
                style={[
                  styles.attendanceButton,
                  (attendance.checkIn && !attendance.checkOut) ? styles.checkOutBtn : styles.disabledAttendanceBtn
                ]}
                onPress={() => router.push("/face-check-out")}
                disabled={!attendance.checkIn || !!attendance.checkOut}
              >
                <MaterialCommunityIcons
                  name="logout"
                  size={24}
                  color={(attendance.checkIn && !attendance.checkOut) ? "#FFFFFF" : "#94A3B8"}
                />
                <Text style={[styles.attendanceBtnText, !(attendance.checkIn && !attendance.checkOut) && styles.disabledBtnText]}>
                  Ra ca
                </Text>
              </TouchableOpacity>
            </View>

            {/* Today's Status */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trạng thái hôm nay</Text>
            </View>

            <View style={styles.statusCardsContainer}>
              <View
                style={[
                  styles.statusCard,
                  attendance.checkIn
                    ? (isLate(attendance.checkIn) ? styles.statusCardLate : styles.statusCardIn)
                    : styles.statusCardOut,
                ]}
              >
                <View style={styles.statusCardHeader}>
                  <Ionicons
                    name="enter-outline"
                    size={20}
                    color={
                      attendance.checkIn
                        ? (isLate(attendance.checkIn) ? "#D97706" : "#16A34A")
                        : "#64748B"
                    }
                  />
                  <Text
                    style={
                      attendance.checkIn
                        ? (isLate(attendance.checkIn) ? styles.statusCardTitleLate : styles.statusCardTitleIn)
                        : styles.statusCardTitleOut
                    }
                  >
                    Giờ vào
                  </Text>
                </View>
                <Text
                  style={
                    attendance.checkIn ? styles.statusTime : styles.statusTimeEmpty
                  }
                >
                  {formatAttendanceTime(attendance.checkIn)}
                </Text>
                <Text
                  style={
                    attendance.checkIn
                      ? (isLate(attendance.checkIn) ? styles.statusSubtitleLate : styles.statusSubtitleIn)
                      : styles.statusSubtitleOut
                  }
                >
                  {getCheckInStatus(attendance.checkIn)}
                </Text>
              </View>

              <View
                style={[
                  styles.statusCard,
                  attendance.checkOut ? styles.statusCardIn : styles.statusCardOut,
                ]}
              >
                <View style={styles.statusCardHeader}>
                  <Ionicons
                    name="exit-outline"
                    size={20}
                    color={attendance.checkOut ? "#16A34A" : "#64748B"}
                  />
                  <Text
                    style={
                      attendance.checkOut
                        ? styles.statusCardTitleIn
                        : styles.statusCardTitleOut
                    }
                  >
                    Giờ ra
                  </Text>
                </View>
                <Text
                  style={
                    attendance.checkOut ? styles.statusTime : styles.statusTimeEmpty
                  }
                >
                  {formatAttendanceTime(attendance.checkOut)}
                </Text>
                <Text
                  style={
                    attendance.checkOut
                      ? styles.statusSubtitleIn
                      : styles.statusSubtitleOut
                  }
                >
                  {attendance.checkOut ? "Hoàn thành" : "Chưa chấm"}
                </Text>
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
  attendanceButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  attendanceButton: {
    flex: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  checkInBtn: {
    backgroundColor: "#1C75FF",
    shadowColor: "#1C75FF",
  },
  checkOutBtn: {
    backgroundColor: "#F59E0B",
    shadowColor: "#F59E0B",
  },
  disabledAttendanceBtn: {
    backgroundColor: "#F1F5F9",
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  attendanceBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledBtnText: {
    color: "#94A3B8",
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
  statusCardLate: {
    backgroundColor: "#FFFBEB", // Amber-50
    borderColor: "#FEF3C7", // Amber-100
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
  statusCardTitleLate: {
    fontSize: 14,
    color: "#D97706", // Amber-600
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
  statusSubtitleLate: {
    fontSize: 13,
    color: "#D97706", // Amber-600
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
