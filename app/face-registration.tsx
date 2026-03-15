import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../constants/api";
import { useFaceDetection } from "./useFaceDetection";

// IMPORT HÀM CLOUDINARY
import { uploadImageToCloudinary } from "../constants/cloudinary";

type RegistrationStep = "STRAIGHT" | "LEFT" | "RIGHT" | "DONE";

export default function FaceRegistrationScreen() {
  const router = useRouter();
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null!);

  const [step, setStep] = useState<RegistrationStep>("STRAIGHT");
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]); // Lưu URI của ảnh
  const [statusMessage, setStatusMessage] = useState("Nhìn thẳng vào camera");
  const isCapturing = useRef(false);

  const { faceData, frameProcessor } = useFaceDetection(isProcessing);

  const resetRegistration = () => {
    setStep("STRAIGHT");
    setCapturedImages([]);
    setStatusMessage("Nhìn thẳng vào camera");
    setIsProcessing(false);
  };

  // Logic tự động chụp (Giữ nguyên logic góc quay của bạn)
  useEffect(() => {
    if (!faceData || isProcessing || step === "DONE") return;

    const { yawAngle, pitchAngle, leftEyeOpenProbability, rightEyeOpenProbability } = faceData;

    // Yêu cầu bắt buộc: Mắt phải mở
    const eyesOpen = leftEyeOpenProbability > 0.5 && rightEyeOpenProbability > 0.5;
    if (!eyesOpen) {
      setStatusMessage("Vui lòng mở mắt");
      return;
    }

    const isStraight = Math.abs(yawAngle) < 10 && Math.abs(pitchAngle) < 15;
    const isLeft = yawAngle > 10;
    const isRight = yawAngle < -10;

    if (step === "STRAIGHT" && isStraight && !isCapturing.current) {
      handleAutoCapture("Nhìn thẳng thành công! Quay sang trái", "LEFT");
    } else if (step === "LEFT" && isLeft && !isCapturing.current) {
      handleAutoCapture("Quay trái thành công! Quay sang phải", "RIGHT");
    } else if (step === "RIGHT" && isRight && !isCapturing.current) {
      handleAutoCapture("Quay phải thành công!", "DONE");
    } else {
      if (step === "STRAIGHT") setStatusMessage("Nhìn thẳng");
      else if (step === "LEFT") setStatusMessage("Quay sang trái");
      else if (step === "RIGHT") setStatusMessage("Quay sang phải");
    }
  }, [faceData, step, isProcessing]);

  // THAY ĐỔI Ở ĐÂY: DÙNG HÀM CHỤP GỐC CỦA VISION CAMERA
  const handleAutoCapture = async (nextMessage: string, nextStep: RegistrationStep) => {
    if (isCapturing.current || !cameraRef.current) return;
    isCapturing.current = true;
    setIsProcessing(true);
    setStatusMessage("Đang chụp...");

    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Đợi camera lấy nét

      // Chụp toàn màn hình thay vì dùng hàm crop
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false
      });

      // Tạo đường dẫn file nội bộ (chèn thêm file:// để react native nhận diện chuẩn)
      const imageUri = `file://${photo.path}`;

      const newImages = [...capturedImages, imageUri];
      setCapturedImages(newImages);
      setStatusMessage(nextMessage);

      if (nextStep === "DONE") {
        await processAndUploadImages(newImages);
      } else {
        setStep(nextStep);
      }

    } catch (error) {
      console.error("Lỗi khi tự động chụp:", error);
      Alert.alert("Lỗi", "Không thể chụp ảnh tự động. Vui lòng thử lại.", [
        { text: "Đăng ký lại", onPress: resetRegistration },
        { text: "Bỏ qua", style: "cancel" }
      ]);
      isCapturing.current = false;
    } finally {
      setIsProcessing(false);
      if (nextStep !== "DONE") {
        isCapturing.current = false;
      }
    }
  };

  // 🚀 HÀM ĐÃ ĐƯỢC TỐI ƯU TỐC ĐỘ: UPLOAD SONG SONG 3 ẢNH
  // 🚀 HÀM ĐÃ ĐƯỢC TỐI ƯU TỐC ĐỘ + ĐO THỜI GIAN
  const processAndUploadImages = async (imageUris: string[]) => {
    setIsProcessing(true);
    setStatusMessage("Đang đồng bộ dữ liệu (Siêu tốc)...");

    try {
      // BẮT ĐẦU BẤM GIỜ UPLOAD CLOUDINARY
      const startUploadTime = Date.now();

      // 1. Tạo ra 3 luồng upload chạy cùng lúc
      const uploadPromises = imageUris.map((uri) => uploadImageToCloudinary(uri));

      // 2. Chờ cả 3 luồng hoàn thành cùng 1 thời điểm
      const results = await Promise.all(uploadPromises);

      // KẾT THÚC BẤM GIỜ UPLOAD CLOUDINARY
      const endUploadTime = Date.now();
      const uploadDuration = ((endUploadTime - startUploadTime) / 1000).toFixed(2);

      // In ra console thời gian upload
      console.log(`⏱️ [FRONTEND] Thời gian upload 3 ảnh lên Cloudinary: ${uploadDuration} giây`);

      // 3. Lọc ra các URL thành công
      const uploadedUrls = results.filter((url) => url !== null);

      if (uploadedUrls.length !== 3) {
        throw new Error(`Chỉ tải lên được ${uploadedUrls.length}/3 ảnh. Vui lòng thử lại.`);
      }

      console.log("--- 3 URL ĐÃ TẢI LÊN SONG SONG ---", uploadedUrls);
      setStatusMessage("Đang xác thực với máy chủ AI...");

      const userDataString = await AsyncStorage.getItem("userData");
      if (!userDataString) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin đăng nhập.");
        return;
      }

      const userData = JSON.parse(userDataString);

      // BẮT ĐẦU BẤM GIỜ GỌI BACKEND
      const startBackendTime = Date.now();

      // Gửi 3 URL cho Node.js Backend
      await sendRegistrationToBackend(userData.id, uploadedUrls);

      // KẾT THÚC BẤM GIỜ GỌI BACKEND
      const endBackendTime = Date.now();
      const backendDuration = ((endBackendTime - startBackendTime) / 1000).toFixed(2);
      console.log(`⏱️ [FRONTEND] Thời gian chờ Backend & AI xử lý xong: ${backendDuration} giây`);

      setStep("DONE");
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      Alert.alert("Lỗi", "Quá trình tải ảnh bị gián đoạn. Vui lòng thử lại.");
      resetRegistration();
    } finally {
      setIsProcessing(false);
      isCapturing.current = false;
    }
  };

  const sendRegistrationToBackend = async (userId: string, urls: string[]) => {
    try {
      const API_URL = API_ENDPOINTS.UPLOAD_FACE;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          urls: urls,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("✅ Server trả về thành công:", data);
        await AsyncStorage.setItem("isFaceUpdated", "true");

        Alert.alert("Thành công", "Đã đăng ký khuôn mặt thành công!", [
          {
            text: "Đồng ý",
            onPress: () => router.replace("/(tabs)/home"),
          },
        ]);
      } else {
        console.error("❌ Lỗi từ server:", data);
        Alert.alert("Thất bại", data.message || "Không thể xác thực khuôn mặt", [
          { text: "Thử lại", onPress: resetRegistration }
        ]);
      }
    } catch (error) {
      console.error("Lỗi kết nối mạng:", error);
      Alert.alert("Lỗi", "Lỗi kết nối đến máy chủ Backend!", [
        { text: "Thử lại", onPress: resetRegistration }
      ]);
    }
  };

  if (device == null) return <View style={styles.centered}><Text>Không tìm thấy camera</Text></View>;
  if (!hasPermission) return <View style={styles.centered}><TouchableOpacity onPress={requestPermission}><Text>Cấp quyền Camera</Text></TouchableOpacity></View>;

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
        {/* Mình vẫn giữ cái khung tròn ở đây để người dùng biết căn giữa mặt, nhưng ảnh chụp thực tế sẽ là toàn màn hình */}
        <View style={styles.focusFrame} />

        <View style={styles.guideContainer}>
          <Text style={styles.stepText}>
            {step === "DONE" ? "Hoàn tất" : `Bước: ${capturedImages.length + 1}/3`}
          </Text>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>

        {isProcessing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#00FF00" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
  focusFrame: {
    width: 280,
    height: 280,
    borderWidth: 2,
    borderColor: "#00FF00",
    borderRadius: 140,
    backgroundColor: "transparent",
  },
  guideContainer: {
    position: "absolute",
    top: 60,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    width: "80%",
  },
  stepText: { color: "#FFF", fontSize: 14, fontWeight: "bold", opacity: 0.8 },
  statusText: { color: "#00FF00", fontSize: 22, fontWeight: "bold", textAlign: "center", marginTop: 5 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});