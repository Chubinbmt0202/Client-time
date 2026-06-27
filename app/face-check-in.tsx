import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from 'expo-location';
import { NetworkInfo } from 'react-native-network-info';
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { CustomAlert, CustomAlertState } from "../components/CustomAlert";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { API_ENDPOINTS } from "../constants/api";

import { useFaceDetection } from "../hooks/useFaceDetection";
// 1. IMPORT HÀM CLOUDINARY
import { uploadImageToCloudinary } from "../constants/cloudinary";

// 🚀 THÊM IMPORT THƯ VIỆN ÉP CÂN ẢNH Ở ĐÂY
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { FocusFrame } from "../components/FaceRegistration/FocusFrame";

export default function CheckInScreen() {
  const router = useRouter();
  const { lateReason, isOvertime } = useLocalSearchParams();
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null!);
  const isFocused = useIsFocused();
  const [isReady, setIsReady] = useState(false);
  // 🚀 Đếm 1.5 giây sau khi mở màn hình mới cho phép AI bắt đầu canh chụp
  const [statusMessage, setStatusMessage] = useState("Đang khởi động");
  const [isProcessing, setIsProcessing] = useState(false);
  const [customAlert, setCustomAlert] = useState<CustomAlertState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });
  const isCapturing = useRef(false);

  useFocusEffect(
    React.useCallback(() => {
      // Reset state mỗi khi vào lại màn hình
      setIsProcessing(false);
      isCapturing.current = false;
      setIsReady(false);
      setStatusMessage("Đang khởi động");

      const timer = setTimeout(() => {
        setIsReady(true);
        setStatusMessage("Nhìn thẳng để chấm công vào");
      }, 1500);

      return () => clearTimeout(timer);
    }, [])
  );

  // 2. CHỈ CẦN DETECT KHUÔN MẶT ĐỂ TỰ ĐỘNG CHỤP (Bỏ useFaceEmbedding)
  const { faceData, frameProcessor } = useFaceDetection(isProcessing);

  const resetAttendance = () => {
    isCapturing.current = false;
    setIsProcessing(false);
    setStatusMessage("Nhìn thẳng để chấm công vào");
  };

  // Logic tự động chụp khi nhìn thẳng
  useEffect(() => {
    if (!faceData || isProcessing) return;

    const { yawAngle, pitchAngle, leftEyeOpenProbability, rightEyeOpenProbability } = faceData;

    const eyesOpen = leftEyeOpenProbability > 0.5 && rightEyeOpenProbability > 0.5;
    // Nới lỏng góc một chút để dễ chụp hơn
    const isStraight = Math.abs(yawAngle) < 15 && Math.abs(pitchAngle) < 15;

    if (eyesOpen && isStraight && !isCapturing.current) {
      handleAttendance();
    } else if (!eyesOpen) {
      setStatusMessage("Vui lòng mở mắt");
    } else if (!isStraight) {
      setStatusMessage("Nhìn thẳng vào camera");
    }
  }, [faceData, isProcessing]);

  // LUỒNG CHẤM CÔNG MỚI (Tương tự đăng ký nhưng chỉ 1 ảnh)
  const handleAttendance = async () => {
    if (isCapturing.current || !cameraRef.current) return;
    isCapturing.current = true;
    setIsProcessing(true);
    setStatusMessage("Đang chụp ảnh vào...");

    try {
      // 1. Chờ camera lấy nét
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Chụp ảnh toàn màn hình gốc
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false
      });
      const originalUri = `file://${photo.path}`;

      // ==========================================
      // 🚀 3. ÉP CÂN ẢNH BẰNG EXPO IMAGE MANIPULATOR
      // ==========================================
      setStatusMessage("Đang xử lý ảnh...");
      const manipResult = await manipulateAsync(
        originalUri,
        [{ resize: { width: 500 } }], // Bóp chiều ngang còn 500px
        {
          compress: 0.7, // Giảm chất lượng JPEG xuống 70%
          format: SaveFormat.JPEG
        }
      );

      // Lấy link ảnh ĐÃ ĐƯỢC ÉP CÂN
      const imageUri = manipResult.uri;

      // 4. Upload 1 tấm ảnh duy nhất lên Cloudinary
      setStatusMessage("Đang đồng bộ dữ liệu...");
      const startUploadTime = Date.now();

      const userDataString = await AsyncStorage.getItem("userData");
      if (!userDataString) {
        setCustomAlert({
          visible: true,
          title: "Lỗi",
          message: "Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.",
          type: "error",
          confirmText: "Đã hiểu",
          onConfirm: () => {
            setCustomAlert(prev => ({ ...prev, visible: false }));
            resetAttendance();
          }
        });
        return;
      }
      const userId = JSON.parse(userDataString).id;
      setStatusMessage("Đang đồng bộ dữ liệu...");

      const cloudUrl = await uploadImageToCloudinary(imageUri, userId);

      const uploadDuration = ((Date.now() - startUploadTime) / 1000).toFixed(2);
      console.log(`⏱️ [FRONTEND] Thời gian upload 1 ảnh: ${uploadDuration} giây`);

      if (!cloudUrl) throw new Error("Không thể tải ảnh lên hệ thống");

      // Lấy BSSID WiFi
      let wifi_bssid = "";
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const bssid = await NetworkInfo.getBSSID();
          wifi_bssid = bssid || "";
          console.log(`\n[CHECK ATTENDANCE - MOBILE] BSSID: ${wifi_bssid}`);
        }
      } catch (e) {
        console.error("Lỗi lấy thông tin WiFi:", e);
      }

      // 6. Gửi 1 URL lên Backend xác thực
      setStatusMessage("Đang xác thực khuôn mặt...");
      const startBackendTime = Date.now();

      // Lưu ý: Đảm bảo API_ENDPOINTS.RECOGNIZE đang trỏ về http://<IP>:3001/api/attendance/checkAttendance
      const API_URL = API_ENDPOINTS.RECOGNIZE;
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Gửi { userId, url, intent: "check-in", lateReason, isOvertime, wifi_bssid }
        body: JSON.stringify({
          userId: userId,
          url: cloudUrl,
          intent: "check-in",
          action: "check_in",
          timestamp: new Date().toISOString(),
          lateReason: lateReason,
          isOvertime: isOvertime,
          wifi_bssid: wifi_bssid
        }),
      });

      const data = await response.json();
      const backendDuration = ((Date.now() - startBackendTime) / 1000).toFixed(2);
      console.log(`⏱️ [FRONTEND] Thời gian AI xử lý và phản hồi: ${backendDuration} giây`);

      // 7. Xử lý kết quả trả về
      if (response.ok && data.success) {
        const currentUserDataStr = await AsyncStorage.getItem("userData");
        if (currentUserDataStr) {
          const userDataObj = JSON.parse(currentUserDataStr);

          // Đảm bảo mảng history tồn tại
          if (!userDataObj.attendance_history) {
            userDataObj.attendance_history = [];
          }

          const today = new Date();
          // Tìm xem hôm nay có record nào chưa (giống logic bên trang Home)
          const todayIndex = userDataObj.attendance_history.findIndex((record: any) => {
            const recordDate = new Date(record.log_date);
            return (
              recordDate.getDate() === today.getDate() &&
              recordDate.getMonth() === today.getMonth() &&
              recordDate.getFullYear() === today.getFullYear()
            );
          });

          // Thêm record mới lên đầu mảng
          userDataObj.attendance_history.unshift({
            log_date: data.data.time, // Lấy mốc thời gian này làm ngày log
            check_in_time: data.data.time,
            check_out_time: null,
            note: isOvertime === "true" ? "Tăng ca" : "",
            status: "present"
          });

          // Lưu đè lại vào AsyncStorage
          await AsyncStorage.setItem("userData", JSON.stringify(userDataObj));
        }

        // Hiển thị tên và thông báo
        const userName = data.data?.fullname || "Nhân viên";

        setCustomAlert({
          visible: true,
          title: "Thành công",
          message: `Chào ${userName}! Bạn đã chấm công vào thành công.`,
          type: "success",
          confirmText: "OK",
          onConfirm: () => {
            setCustomAlert(prev => ({ ...prev, visible: false }));
            router.replace("/(tabs)/home");
          }
        });
      } else {
        // console.error("❌ Nhận diện thất bại:", data); // Hidden as per request
        setCustomAlert({
          visible: true,
          title: "Không khớp",
          message: data.message || "Khuôn mặt này không khớp với hệ thống hoặc bạn đã chấm công vào rồi.",
          type: "error",
          confirmText: "Thử lại",
          cancelText: "Hủy",
          onConfirm: () => {
            setCustomAlert(prev => ({ ...prev, visible: false }));
            resetAttendance();
          },
          onCancel: () => {
            setCustomAlert(prev => ({ ...prev, visible: false }));
            setStatusMessage("Vui lòng thử lại");
          }
        });
        setStatusMessage("Vui lòng thử lại");
      }

    } catch (error) {
      console.error("Lỗi quá trình chấm công:", error);
      setCustomAlert({
        visible: true,
        title: "Lỗi",
        message: "Quá trình xử lý bị gián đoạn. Vui lòng kiểm tra lại mạng.",
        type: "error",
        confirmText: "Thử lại",
        onConfirm: () => {
          setCustomAlert(prev => ({ ...prev, visible: false }));
          resetAttendance();
        }
      });
    }
  };

  if (device == null) return <View style={styles.centered}><Text style={styles.titleText}>Không tìm thấy camera</Text></View>;
  if (!hasPermission) return <View style={styles.centered}><TouchableOpacity onPress={requestPermission}><Text style={styles.statusText}>Cấp quyền Camera</Text></TouchableOpacity></View>;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        photo={true}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />

      <View style={styles.overlay}>
        <FocusFrame color="#10B981" />

        <View style={styles.guideContainer}>
          <Text style={styles.titleText}>CHẤM CÔNG VÀO CA</Text>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        {isProcessing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Đang nhận dạng khuôn mặt...</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
      <CustomAlert {...customAlert} />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  guideContainer: {
    position: "absolute",
    top: 60,
    backgroundColor: "rgba(15, 23, 42, 0.85)", // Slate dark glassmorphism
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    width: "85%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  titleText: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  statusText: {
    color: "#10B981", // Neon green for check-in
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
  },
  backButton: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  backText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});
