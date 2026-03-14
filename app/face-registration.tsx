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
import { captureAndCropFace } from "./captureAndCrop";
import { useFaceDetection } from "./useFaceDetection";
import { useFaceEmbedding } from "./useFaceEmbedding";

type RegistrationStep = "STRAIGHT" | "LEFT" | "RIGHT" | "DONE";

export default function FaceRegistrationScreen() {
  const router = useRouter();
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null!);

  const [step, setStep] = useState<RegistrationStep>("STRAIGHT");
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]); // Base64 strings
  const [statusMessage, setStatusMessage] = useState("Nhìn thẳng vào camera");
  const isCapturing = useRef(false);

  const { faceData, frameProcessor } = useFaceDetection(isProcessing);
  const { isModelReady, getEmbedding } = useFaceEmbedding();

  const resetRegistration = () => {
    setStep("STRAIGHT");
    setCapturedImages([]);
    setStatusMessage("Nhìn thẳng vào camera");
    setIsProcessing(false);
  };

  // Logic tự động chụp
  useEffect(() => {
    if (!faceData || isProcessing || !isModelReady || step === "DONE") return;

    const { yawAngle, pitchAngle, rollAngle, leftEyeOpenProbability, rightEyeOpenProbability } = faceData;

    // Yêu cầu bắt buộc: Mắt phải mở
    const eyesOpen = leftEyeOpenProbability > 0.5 && rightEyeOpenProbability > 0.5;
    if (!eyesOpen) {
      setStatusMessage("Vui lòng mở mắt");
      return;
    }

    const isStraight = Math.abs(yawAngle) < 10 && Math.abs(pitchAngle) < 15;
    const isLeft = yawAngle > 20;
    const isRight = yawAngle < -20;

    if (step === "STRAIGHT" && isStraight && !isCapturing.current) {
      handleAutoCapture("Nhìn thẳng thành công! Quay sang trái", "LEFT");
    } else if (step === "LEFT" && isLeft && !isCapturing.current) {
      handleAutoCapture("Quay trái thành công! Quay sang phải", "RIGHT");
    } else if (step === "RIGHT" && isRight && !isCapturing.current) {
      handleAutoCapture("Quay phải thành công!", "DONE");
    } else {
      // Hướng dẫn người dùng
      if (step === "STRAIGHT") setStatusMessage("Nhìn thẳng");
      else if (step === "LEFT") setStatusMessage("Quay sang trái");
      else if (step === "RIGHT") setStatusMessage("Quay sang phải");
    }
  }, [faceData, step, isProcessing, isModelReady]);

  const handleAutoCapture = async (nextMessage: string, nextStep: RegistrationStep) => {
    if (isCapturing.current) return;
    isCapturing.current = true;
    setIsProcessing(true);
    setStatusMessage("Đang chụp...");

    try {
      // Đợi một chút để camera ổn định
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await captureAndCropFace(cameraRef);
      if (result) {
        const newImages = [...capturedImages, result.base64];
        setCapturedImages(newImages);
        setStatusMessage(nextMessage);

        if (nextStep === "DONE") {
          await processFinalEmbeddings(newImages);
        } else {
          setStep(nextStep);
        }
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
      // isCapturing.current is handled specifically based on flow
      if (nextStep !== "DONE") {
        isCapturing.current = false;
      }
    }
  };

  const processFinalEmbeddings = async (images: string[]) => {
    setIsProcessing(true);
    setStatusMessage("Đang xử lý vector khuôn mặt...");
    try {
      const vectors = [];
      for (const base64 of images) {
        const vector = await getEmbedding(base64);
        if (vector) {
          vectors.push(vector);
        }
      }

      console.log("--- KẾT QUẢ ĐĂNG KÝ ---");
      console.log("Số lượng vector:", vectors.length);
      console.log("Dữ liệu đóng gói:", JSON.stringify(vectors));

      // BƯỚC CUỐI: Gửi lên Backend
      const userDataString = await AsyncStorage.getItem("userData");

      if (!userDataString) {
        Alert.alert(
          "Lỗi",
          "Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại!",
        );
        return;
      }
      const userData = JSON.parse(userDataString);
      const currentUserId = userData.id;

      await sendEmbeddingToBackend(currentUserId, vectors as any);

      setStep("DONE");
    } catch (error) {
      console.error("Lỗi khi xử lý vector:", error);
      Alert.alert("Lỗi", "Không thể xử lý vector khuôn mặt.");
    } finally {
      setIsProcessing(false);
      isCapturing.current = false;
    }
  };

  const sendEmbeddingToBackend = async (
    userId: string,
    embeddingVector: number[],
  ) => {
    try {
      const API_URL = API_ENDPOINTS.UPLOAD_FACE;

      console.log("Số lượng phần tử trong vector: ", embeddingVector.length);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userId,
          embedding: embeddingVector,
        }),
      });

      const data = await response.json();

      if (response.ok) {
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
        Alert.alert("Thất bại", data.message || "Không thể xác thực", [
          { text: "Thử lại", onPress: resetRegistration }
        ]);
      }
    } catch (error) {
      console.error("Lỗi kết nối mạng:", error);
      Alert.alert("Lỗi", "Lỗi kết nối đến máy chủ!", [
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
    borderRadius: 140, // Hình tròn cho giống app hiện đại
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
