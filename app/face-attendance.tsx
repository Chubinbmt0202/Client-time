import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";
import { API_ENDPOINTS } from "../constants/api";

import { useFaceDetection } from "./useFaceDetection";
// 1. IMPORT HÀM CLOUDINARY
import { uploadImageToCloudinary } from "../constants/cloudinary";

// 🚀 THÊM IMPORT THƯ VIỆN ÉP CÂN ẢNH Ở ĐÂY
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export default function AttendanceScreen() {
  const router = useRouter();
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null!);
  const [isReady, setIsReady] = useState(false);
  // 🚀 Đếm 1.5 giây sau khi mở màn hình mới cho phép AI bắt đầu canh chụp
  const [statusMessage, setStatusMessage] = useState("Đang khởi động");
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
      setStatusMessage("Nhìn thẳng để chấm công");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const [isProcessing, setIsProcessing] = useState(false);

  const isCapturing = useRef(false);

  // 2. CHỈ CẦN DETECT KHUÔN MẶT ĐỂ TỰ ĐỘNG CHỤP (Bỏ useFaceEmbedding)
  const { faceData, frameProcessor } = useFaceDetection(isProcessing);

  const resetAttendance = () => {
    isCapturing.current = false;
    setIsProcessing(false);
    setStatusMessage("Nhìn thẳng để chấm công");
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
    setStatusMessage("Đang chụp ảnh...");

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
        Alert.alert("Lỗi", "Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.");
        resetAttendance();
        return;
      }
      const userId = JSON.parse(userDataString).id;
      setStatusMessage("Đang đồng bộ dữ liệu...");

      const cloudUrl = await uploadImageToCloudinary(imageUri, userId);

      const uploadDuration = ((Date.now() - startUploadTime) / 1000).toFixed(2);
      console.log(`⏱️ [FRONTEND] Thời gian upload 1 ảnh: ${uploadDuration} giây`);

      if (!cloudUrl) throw new Error("Không thể tải ảnh lên hệ thống");

      // 6. Gửi 1 URL lên Backend xác thực
      setStatusMessage("Đang xác thực khuôn mặt...");
      const startBackendTime = Date.now();

      // Lưu ý: Đảm bảo API_ENDPOINTS.RECOGNIZE đang trỏ về http://<IP>:3001/api/attendance/checkAttendance
      const API_URL = API_ENDPOINTS.RECOGNIZE;
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Gửi { userId, url } thay vì embedding
        body: JSON.stringify({ userId: userId, url: cloudUrl }),
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

          // API trả về data.data.type là "Check-in" hoặc "Check-out" (mà ta đã viết bên Node.js)
          if (data.data?.type === "Check-in") {
            // Thêm record mới lên đầu mảng
            userDataObj.attendance_history.unshift({
              log_date: data.data.time, // Lấy mốc thời gian này làm ngày log
              check_in_time: data.data.time,
              check_out_time: null,
              status: "present"
            });
          } else if (data.data?.type === "Check-out" && todayIndex !== -1) {
            // Cập nhật giờ check-out cho record hôm nay
            userDataObj.attendance_history[todayIndex].check_out_time = data.data.time;
          }

          // Lưu đè lại vào AsyncStorage
          await AsyncStorage.setItem("userData", JSON.stringify(userDataObj));
        }

        // Hiển thị tên và thông báo
        const userName = data.data?.fullname || "Nhân viên";
        const actionType = data.data?.type === "Check-in" ? "vào" : "ra";

        Alert.alert(
          "Thành công",
          `Chào ${userName}! Bạn đã chấm công ${actionType} thành công.`,
          [
            // Mẹo: Dùng router.replace để thay thế hẳn màn hình, không bị xếp chồng trang
            { text: "OK", onPress: () => router.replace("/(tabs)/home") }
          ]
        );
      } else {
        console.error("❌ Nhận diện thất bại:", data);
        Alert.alert("Không khớp", data.message || "Khuôn mặt này không khớp với hệ thống.", [
          { text: "Thử lại", onPress: resetAttendance },
          { text: "Hủy", style: "cancel" }
        ]);
        setStatusMessage("Vui lòng thử lại");
      }

    } catch (error) {
      console.error("Lỗi quá trình chấm công:", error);
      Alert.alert("Lỗi", "Quá trình xử lý bị gián đoạn. Vui lòng kiểm tra lại mạng.", [
        { text: "Thử lại", onPress: resetAttendance }
      ]);
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
        isActive={true}
        photo={true}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />

      <View style={styles.overlay}>
        <View style={styles.focusFrame} />

        <View style={styles.guideContainer}>
          <Text style={styles.titleText}>ĐIỂM DANH KHUÔN MẶT</Text>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        {isProcessing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#00FF00" />
            <Text style={styles.loadingText}>Đang xử lý dữ liệu...</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  focusFrame: {
    width: 260,
    height: 260,
    borderWidth: 3,
    borderColor: "#00FF00",
    borderRadius: 130,
    backgroundColor: "transparent",
  },
  guideContainer: {
    position: "absolute",
    top: 60,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    width: "85%",
  },
  titleText: { color: "#FFF", fontSize: 14, fontWeight: "bold", opacity: 0.8 },
  statusText: { color: "#00FF00", fontSize: 20, fontWeight: "bold", textAlign: "center", marginTop: 5 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#00FF00", marginTop: 10, fontSize: 16, fontWeight: "bold" },
  backButton: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  backText: { color: "#FFF", fontWeight: "bold" },
});