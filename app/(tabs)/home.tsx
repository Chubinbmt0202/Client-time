import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DrawerActions,
  useFocusEffect,
  useNavigation,
} from "@react-navigation/native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { onValue, ref, query, limitToLast, orderByChild } from "firebase/database";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "../../constants/api";
import { database } from "../../utils/firebase";

const SHIFT_START_HOURS = 8;
const SHIFT_START_MINUTES = 0;
const SHIFT_END_HOURS = 17;
const SHIFT_END_MINUTES = 0;

// Cấu hình cách hiển thị thông báo khi ứng dụng đang mở (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function registerForPushNotificationsAsync() {
  let token;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Không lấy được quyền thông báo đẩy!');
      return;
    }
    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: 'e0c44d27-a348-4b25-85bc-582fe1533484', // Lấy từ app.json của bạn
      })).data;
      console.log('📡 Expo Push Token:', token);
    } catch (tokenErr: any) {
      console.error('Lỗi lấy Expo Push Token:', tokenErr.message);
    }
  } else {
    console.log('⚠️ Phải chạy trên thiết bị thật để nhận Push Token');
  }

  return token;
}

export default function DashboardScreen() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFaceUpdated, setIsFaceUpdated] = useState(false);
  const [profile, setProfile] = useState<{
    name: string;
    id: string;
    role: string;
    username: string;
    avatar: string;
  }>({ name: "", id: "", role: "", username: "", avatar: "" });

  // 🚀 DỮ LIỆU ĐIỂM DANH HÔM NAY
  const [attendance, setAttendance] = useState<{
    checkIn: string | null;
    checkOut: string | null;
  }>({ checkIn: null, checkOut: null });

  const [otAttendance, setOtAttendance] = useState<{
    checkIn: string | null;
    checkOut: string | null;
  }>({ checkIn: null, checkOut: null });

  const [refreshing, setRefreshing] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const [otRequests, setOtRequests] = useState<any[]>([]);
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
          avatar: user.hinh_anh || "https://randomuser.me/api/portraits/men/32.jpg",
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
          const today = new Date();

          // Lọc các records của ngày hôm nay
          const todayRecords = history.filter((record: any) => {
            const recordDate = new Date(record.log_date);
            return (
              recordDate.getDate() === today.getDate() &&
              recordDate.getMonth() === today.getMonth() &&
              recordDate.getFullYear() === today.getFullYear()
            );
          });

          // Phân loại: ca thường và ca tăng ca
          let normalRecord = null;
          let otRecord = null;

          if (todayRecords.length === 1) {
            const rec = todayRecords[0];
            const checkInDate = rec.check_in_time ? new Date(rec.check_in_time) : null;
            const hour = checkInDate ? checkInDate.getHours() : 0;
            // Nếu giờ vào ca > 16 (tức là sau 16:00), hoặc ghi chú có chứa chữ "tăng ca" / "OT"
            if (hour >= 16 || (rec.note && (rec.note.toLowerCase().includes("tăng ca") || rec.note.toLowerCase().includes("ot")))) {
              otRecord = rec;
            } else {
              normalRecord = rec;
            }
          } else if (todayRecords.length >= 2) {
            // Sắp xếp theo giờ vào tăng dần
            todayRecords.sort((a: any, b: any) => new Date(a.check_in_time).getTime() - new Date(b.check_in_time).getTime());
            normalRecord = todayRecords[0];
            otRecord = todayRecords[1];
          }

          if (normalRecord) {
            setAttendance({
              checkIn: normalRecord.check_in_time,
              checkOut: normalRecord.check_out_time
            });
          } else {
            setAttendance({ checkIn: null, checkOut: null });
          }

          if (otRecord) {
            setOtAttendance({
              checkIn: otRecord.check_in_time,
              checkOut: otRecord.check_out_time
            });
          } else {
            setOtAttendance({ checkIn: null, checkOut: null });
          }
        }


        // ==========================================
        // 🚀 LẤY DỮ LIỆU ĐĂNG KÝ TĂNG CA (OT) TỪ BACKEND
        // ==========================================
        try {
          const otResponse = await fetch(API_ENDPOINTS.OT_HISTORY(userProfile.id));
          const otResult = await otResponse.json();
          if (otResult.success) {
            setOtRequests(otResult.data || []);
          }
        } catch (otErr) {
          console.error("Lỗi khi tải lịch sử tăng ca:", otErr);
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

  // 📡 Tự động đăng ký và lưu Push Token lên Backend khi đăng nhập
  useEffect(() => {
    if (!profile.id || profile.id === "NV000") return;

    const registerPushToken = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          console.log(`📡 Đang lưu Push Token lên Backend cho nhân viên ${profile.id}...`);
          const response = await fetch(API_ENDPOINTS.UPDATE_FCM_TOKEN, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              employeeId: profile.id,
              fcmToken: token,
            }),
          });
          const result = await response.json();
          if (response.ok && result.success) {
            console.log('✅ Đã cập nhật Push Token thành công trên Backend!');
          } else {
            console.warn('❌ Gửi Push Token lên Backend thất bại:', result.message);
          }
        }
      } catch (err: any) {
        console.error('❌ Lỗi khi đăng ký nhận thông báo đẩy:', err.message);
      }
    };

    registerPushToken();
  }, [profile.id]);

  // 🔔 Lắng nghe sự kiện thông báo đẩy khi đang mở ứng dụng hoặc khi click vào thông báo
  useEffect(() => {
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('🔔 Nhận thông báo đẩy trong Foreground:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Người dùng tương tác với thông báo đẩy:', response);
      router.push('/notifications');
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // 🔥 Lắng nghe yêu cầu cập nhật khuôn mặt từ Admin qua Firebase Realtime Database
  useEffect(() => {
    if (!profile.id || profile.id === "NV000") return;

    console.log(`📡 Đang lắng nghe yêu cầu cập nhật khuôn mặt cho: ${profile.id}`);
    const faceUpdateRef = ref(database, `face_updates/${profile.id}`);

    const unsubscribe = onValue(faceUpdateRef, async (snapshot) => {
      const data = snapshot.val();
      console.log("Firebase Realtime Database data nhận được:", data);

      if (data && data.request_update === true) {
        Alert.alert(
          "Yêu cầu cập nhật khuôn mặt",
          "Quản trị viên yêu cầu bạn cập nhật lại khuôn mặt mẫu. Vui lòng thực hiện chụp ảnh khuôn mặt mới.",
          [
            {
              text: "Cập nhật ngay",
              onPress: async () => {
                // 1. Cập nhật local state & AsyncStorage để chuyển đổi UI về trạng thái chưa đăng ký
                setIsFaceUpdated(false);
                await AsyncStorage.setItem("isFaceUpdated", "false");
                const userStr = await AsyncStorage.getItem("userData");
                if (userStr) {
                  const user = JSON.parse(userStr);
                  user.is_face_updated = false;
                  await AsyncStorage.setItem("userData", JSON.stringify(user));
                }

                // 2. Chuyển hướng sang màn hình đăng ký khuôn mặt
                router.push("/face-registration");
              }
            },
            {
              text: "Bỏ qua",
              style: "cancel",
              onPress: () => console.log("Người dùng đã chọn Bỏ qua cập nhật khuôn mặt"),
            }
          ],
          { cancelable: false }
        );
      }
    });

    return () => {
      console.log(`📴 Đã huỷ lắng nghe Firebase cho: ${profile.id}`);
      unsubscribe();
    };
  }, [profile.id]);

  // 🔥 Lắng nghe thông báo realtime từ Firebase để cập nhật chuông và danh sách thông báo trên trang chủ
  useEffect(() => {
    if (!profile.id || profile.id === "NV000") return;

    const notiRef = ref(database, `notifications/${profile.id}`);
    const notiQuery = query(notiRef, orderByChild("ngay_tao"), limitToLast(30));
    const unsubscribe = onValue(notiQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        let list = Object.keys(data).map((key) => ({
          ...data[key],
          id_thong_bao: key,
        }));

        // Tối ưu: Bỏ qua đếm và hiển thị các thông báo FACE_UPDATE nếu người dùng đã đăng ký khuôn mặt
        if (isFaceUpdated) {
          list = list.filter((item) => item.loai_thong_bao !== "FACE_UPDATE");
        }

        // Sắp xếp ngày tạo giảm dần
        list.sort((a, b) => new Date(b.ngay_tao).getTime() - new Date(a.ngay_tao).getTime());
        setRecentNotifications(list);
      } else {
        setRecentNotifications([]);
      }
    });

    return () => unsubscribe();
  }, [profile.id]);

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

  const parseTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(":");
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  };

  const checkIsWithinOTWindow = (ot: any, now: Date) => {
    if (ot.trang_thai !== 'DA_DUYET') return false;

    // So sánh ngày tăng ca
    const otDate = new Date(ot.ngay_dang_ky_ot);
    const isSameDay = (d1: Date, d2: Date) => (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );

    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const otStartMinutes = parseTimeToMinutes(ot.gio_bat_dau);
    const rawEndMinutes = parseTimeToMinutes(ot.gio_ket_thuc_du_kien);
    const isOvernight = rawEndMinutes <= otStartMinutes;
    const otEndMinutes = isOvernight ? rawEndMinutes + 1440 : rawEndMinutes;

    const currentMinutesFromMidnight = now.getHours() * 60 + now.getMinutes();

    // Trường hợp 1: Chấm công trong cùng ngày đăng ký tăng ca
    if (isSameDay(now, otDate)) {
      // Cho phép check-in sớm tối đa 30 phút, đến hết thời gian ca OT (hoặc hết ngày nếu qua đêm)
      const allowedStart = otStartMinutes - 30;
      const allowedEnd = isOvernight ? 1440 : otEndMinutes;
      return currentMinutesFromMidnight >= allowedStart && currentMinutesFromMidnight <= allowedEnd;
    }

    // Trường hợp 2: Chấm công sau nửa đêm (ngày tiếp theo) cho ca tăng ca qua đêm của ngày hôm trước
    if (isSameDay(yesterday, otDate) && isOvernight) {
      // Cho phép check-in từ 00:00 (0 phút) đến gio_ket_thuc_du_kien
      return currentMinutesFromMidnight >= 0 && currentMinutesFromMidnight <= rawEndMinutes;
    }

    return false;
  };

  const handleCheckInPress = () => {
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();

    // 🚀 KIỂM TRA ĐƠN TĂNG CA ĐƯỢC PHÊ DUYỆT
    const hasValidOT = otRequests.some(ot => checkIsWithinOTWindow(ot, now));

    if (hasValidOT) {
      router.push("/face-check-in");
      return;
    }

    // Giới hạn thời gian chấm công sớm: Không được chấm công trước quá 1 tiếng (trước 7:00)
    const isTooEarly = currentHours < (SHIFT_START_HOURS - 1);

    if (isTooEarly) {
      Alert.alert(
        "Không thể vào ca",
        "Chưa tới ca làm việc. Bạn chỉ được phép chấm công sớm tối đa 1 tiếng trước khi vào ca.",
        [{ text: "Đã hiểu", style: "cancel" }]
      );
      return;
    }

    // Giới hạn thời gian chấm công vào ca: Không được chấm công sau 8:30 (quá 30 phút)
    const isAfterLateLimit =
      currentHours > SHIFT_START_HOURS ||
      (currentHours === SHIFT_START_HOURS && currentMinutes > 30);
    
    // Nếu muộn hơn 8:30 hoặc đã qua giờ hành chính thì chặn
    if (isAfterLateLimit) {
      Alert.alert(
        "Không thể vào ca",
        "Hiện tại không nằm trong thời gian làm việc (bạn đã vào ca trễ quá 30 phút). Nếu bạn muốn làm việc giờ này, vui lòng đăng ký tăng ca.",
        [{ text: "Đã hiểu", style: "cancel" }]
      );
      return;
    }

    router.push("/face-check-in");
  };

  const now = new Date();
  const isCurrentlyOt = otRequests.some(ot => checkIsWithinOTWindow(ot, now));
  const hasApprovedOtToday = otRequests.some(ot => {
    if (ot.trang_thai !== 'DA_DUYET') return false;
    const otDate = new Date(ot.ngay_dang_ky_ot);
    return otDate.getDate() === now.getDate() &&
           otDate.getMonth() === now.getMonth() &&
           otDate.getFullYear() === now.getFullYear();
  });

  const checkInBtnDisabled = isCurrentlyOt ? !!otAttendance.checkIn : !!attendance.checkIn;
  const checkOutBtnDisabled = isCurrentlyOt 
    ? (!otAttendance.checkIn || !!otAttendance.checkOut)
    : (!attendance.checkIn || !!attendance.checkOut);

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
        <TouchableOpacity onPress={() => router.push("/notifications")}>
          <View>
            <Feather name="bell" size={24} color="#0F172A" />
            {recentNotifications.some(n => !n.da_doc) && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {recentNotifications.filter(n => !n.da_doc).length > 99 ? "99+" : recentNotifications.filter(n => !n.da_doc).length}
                </Text>
              </View>
            )}
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
            source={{ uri: profile.avatar || "https://randomuser.me/api/portraits/men/32.jpg" }}
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
                  checkInBtnDisabled ? styles.disabledAttendanceBtn : styles.checkInBtn
                ]}
                onPress={handleCheckInPress}
                disabled={checkInBtnDisabled}
              >
                <MaterialCommunityIcons
                  name="login"
                  size={24}
                  color={checkInBtnDisabled ? "#94A3B8" : "#FFFFFF"}
                />
                <Text style={[styles.attendanceBtnText, checkInBtnDisabled && styles.disabledBtnText]}>
                  {isCurrentlyOt ? "Vào tăng ca" : "Vào ca"}
                </Text>
              </TouchableOpacity>

              {/* Nút Chấm công ra */}
              <TouchableOpacity
                style={[
                  styles.attendanceButton,
                  !checkOutBtnDisabled ? styles.checkOutBtn : styles.disabledAttendanceBtn
                ]}
                onPress={() => router.push("/face-check-out")}
                disabled={checkOutBtnDisabled}
              >
                <MaterialCommunityIcons
                  name="logout"
                  size={24}
                  color={!checkOutBtnDisabled ? "#FFFFFF" : "#94A3B8"}
                />
                <Text style={[styles.attendanceBtnText, checkOutBtnDisabled && styles.disabledBtnText]}>
                  {isCurrentlyOt ? "Ra tăng ca" : "Ra ca"}
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

            {/* Overtime Today's Status */}
            {hasApprovedOtToday && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 16 }]}>
                  <Text style={styles.sectionTitle}>Trạng thái tăng ca hôm nay</Text>
                </View>
                <View style={styles.statusCardsContainer}>
                  <View
                    style={[
                      styles.statusCard,
                      otAttendance.checkIn ? styles.statusCardIn : styles.statusCardOut,
                    ]}
                  >
                    <View style={styles.statusCardHeader}>
                      <Ionicons
                        name="enter-outline"
                        size={20}
                        color={otAttendance.checkIn ? "#16A34A" : "#64748B"}
                      />
                      <Text
                        style={otAttendance.checkIn ? styles.statusCardTitleIn : styles.statusCardTitleOut}
                      >
                        Vào tăng ca
                      </Text>
                    </View>
                    <Text
                      style={otAttendance.checkIn ? styles.statusTime : styles.statusTimeEmpty}
                    >
                      {formatAttendanceTime(otAttendance.checkIn)}
                    </Text>
                    <Text
                      style={otAttendance.checkIn ? styles.statusSubtitleIn : styles.statusSubtitleOut}
                    >
                      {otAttendance.checkIn ? "Đúng giờ" : "Chưa chấm"}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusCard,
                      otAttendance.checkOut ? styles.statusCardIn : styles.statusCardOut,
                    ]}
                  >
                    <View style={styles.statusCardHeader}>
                      <Ionicons
                        name="exit-outline"
                        size={20}
                        color={otAttendance.checkOut ? "#16A34A" : "#64748B"}
                      />
                      <Text
                        style={otAttendance.checkOut ? styles.statusCardTitleIn : styles.statusCardTitleOut}
                      >
                        Ra tăng ca
                      </Text>
                    </View>
                    <Text
                      style={otAttendance.checkOut ? styles.statusTime : styles.statusTimeEmpty}
                    >
                      {formatAttendanceTime(otAttendance.checkOut)}
                    </Text>
                    <Text
                      style={otAttendance.checkOut ? styles.statusSubtitleIn : styles.statusSubtitleOut}
                    >
                      {otAttendance.checkOut ? "Hoàn thành" : "Chưa chấm"}
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* Notifications */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Thông báo gần đây</Text>
              <TouchableOpacity onPress={() => router.push("/notifications")}>
                <Text style={styles.linkText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.notificationList}>
              {recentNotifications.length === 0 ? (
                <View style={styles.emptyRecentNoti}>
                  <Text style={styles.emptyRecentNotiText}>Không có thông báo mới nào</Text>
                </View>
              ) : (
                recentNotifications.slice(0, 2).map((item) => {
                  let icon = <Feather name="bell" size={20} color="#64748B" />;
                  let bgColor = "#F1F5F9";

                  if (item.loai_thong_bao === "FACE_UPDATE") {
                    icon = <MaterialCommunityIcons name="face-recognition" size={22} color="#1C75FF" />;
                    bgColor = "#EEF4FE";
                  } else if (item.loai_thong_bao === "LEAVE") {
                    icon = <Ionicons name="document-text-outline" size={20} color="#10B981" />;
                    bgColor = "#E6FBF3";
                  } else if (item.loai_thong_bao === "ATTENDANCE") {
                    icon = <Ionicons name="checkmark-circle-outline" size={20} color="#F59E0B" />;
                    bgColor = "#FEF7E6";
                  }

                  // Format relative time simple version
                  const formatRelativeTime = (timeInput: any) => {
                    try {
                      const date = new Date(timeInput);
                      const now = new Date();
                      const diffMins = Math.floor((now.getTime() - date.getTime()) / 60000);
                      const diffHours = Math.floor(diffMins / 60);
                      const diffDays = Math.floor(diffHours / 24);

                      if (diffMins < 1) return "Vừa xong";
                      if (diffMins < 60) return `${diffMins} phút trước`;
                      if (diffHours < 24) return `${diffHours} giờ trước`;
                      return `${diffDays} ngày trước`;
                    } catch (e) {
                      return "";
                    }
                  };

                  return (
                    <TouchableOpacity
                      key={item.id_thong_bao}
                      style={[styles.notificationItem, !item.da_doc && styles.notificationItemUnread]}
                      onPress={() => router.push("/notifications")}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.notificationIconWrapper, { backgroundColor: bgColor }]}>
                        {icon}
                      </View>
                      <View style={styles.notificationContent}>
                        <View style={styles.notiHeaderRow}>
                          <Text style={[styles.notificationTitle, !item.da_doc && styles.notificationTitleUnread]} numberOfLines={1}>
                            {item.tieu_de}
                          </Text>
                          <Text style={styles.notificationTime}>{formatRelativeTime(item.ngay_tao)}</Text>
                        </View>
                        <Text style={styles.notificationDesc} numberOfLines={2}>
                          {item.noi_dung}
                        </Text>
                      </View>
                      {!item.da_doc && <View style={styles.notiUnreadDot} />}
                    </TouchableOpacity>
                  );
                })
              )}
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
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
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
  notificationItemUnread: {
    borderColor: "#BFDBFE",
    backgroundColor: "#F8FAFF",
  },
  notificationTitleUnread: {
    fontWeight: "700",
  },
  notiHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notiUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1C75FF",
    alignSelf: "center",
    marginLeft: 8,
  },
  emptyRecentNoti: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  emptyRecentNotiText: {
    fontSize: 13,
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
