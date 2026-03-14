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

import { captureAndCropFace } from "./captureAndCrop";
import { useFaceDetection } from "./useFaceDetection";
import { useFaceEmbedding } from "./useFaceEmbedding";

export default function AttendanceScreen() {
  const router = useRouter();
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null!);

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Nhìn thẳng để chấm công");

  // Dùng ref để chống chụp liên tục nhiều lần
  const isCapturing = useRef(false);

  const { faceData, frameProcessor } = useFaceDetection(isProcessing);
  const { isModelReady, getEmbedding } = useFaceEmbedding();

  const resetAttendance = () => {
    isCapturing.current = false;
    setIsProcessing(false);
    setStatusMessage("Nhìn thẳng để chấm công");
  };

  // Logic tự động chụp khi nhìn thẳng
  useEffect(() => {
    if (!faceData || isProcessing || !isModelReady) return;

    const { yawAngle, pitchAngle, leftEyeOpenProbability, rightEyeOpenProbability } = faceData;

    const eyesOpen = leftEyeOpenProbability > 0.5 && rightEyeOpenProbability > 0.5;
    const isStraight = Math.abs(yawAngle) < 10 && Math.abs(pitchAngle) < 15;

    if (eyesOpen && isStraight && !isCapturing.current) {
      handleAttendance();
    } else if (!eyesOpen) {
      setStatusMessage("Vui lòng mở mắt");
    } else if (!isStraight) {
      setStatusMessage("Nhìn thẳng vào camera");
    }
  }, [faceData, isProcessing, isModelReady]);

  // Gộp chung logic xử lý ảnh và gọi API vào một hàm duy nhất
  const handleAttendance = async () => {
    if (isCapturing.current) return;
    isCapturing.current = true;
    setIsProcessing(true);
    setStatusMessage("Đang nhận diện...");

    try {
      // 1. Chờ camera ổn định
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. Chụp và cắt ảnh
      const result = await captureAndCropFace(cameraRef);
      if (!result) throw new Error("Không thể chụp ảnh từ camera");

      // 3. Trích xuất mảng 128 số
      const vector = await getEmbedding(result.base64);
      if (!vector) throw new Error("Lỗi khi trích xuất vector khuôn mặt");

      // 4. Lấy UserID từ Storage
      const userDataString = await AsyncStorage.getItem("userData");
      if (!userDataString) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.");
        resetAttendance();
        return;
      }
      const userId = JSON.parse(userDataString).id;

      // 5. Gửi lên Backend xác thực
      const API_URL = API_ENDPOINTS.RECOGNIZE;
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, embedding: vector }),
      });

      const data = await response.json();

      // 6. Xử lý kết quả trả về
      if (response.ok && data.success) {
        console.log("✅ Nhận diện thành công:", data);

        // SỬA LỖI: Lấy tên từ data.data (do Backend trả về object { data: { full_name: ... } })
        const userName = data.data?.full_name || "Nhân viên";

        Alert.alert("Thành công", `Chào ${userName}! Chấm công thành công.`, [
          { text: "OK", onPress: () => router.replace("/(tabs)/home") }
        ]);
      } else {
        console.error("❌ Nhận diện thất bại:", data);
        Alert.alert("Không khớp", data.message || "Khuôn mặt này chưa được đăng ký trong hệ thống.", [
          { text: "Thử lại", onPress: resetAttendance },
          { text: "Đăng ký mới", onPress: () => router.push("/face-registration") }
        ]);
        setStatusMessage("Vui lòng thử lại hoặc đăng ký lại");
      }

    } catch (error) {
      console.error("Lỗi quá trình chấm công:", error);
      Alert.alert("Lỗi", "Quá trình xử lý bị gián đoạn. Vui lòng kiểm tra lại mạng hoặc camera.", [
        { text: "Thử lại", onPress: resetAttendance }
      ]);
    }
    // Chú ý: Không set `isCapturing.current = false` ở finally nếu thành công, 
    // vì ta muốn chuyển trang (router.replace). Chỉ reset khi người dùng bấm "Thử lại".
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