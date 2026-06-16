import AsyncStorage from "@react-native-async-storage/async-storage";
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { API_ENDPOINTS } from "../constants/api";
import { uploadImageToCloudinary } from "../constants/cloudinary";
import { useFaceDetection } from "./useFaceDetection";

export type RegistrationStep = "STRAIGHT" | "LEFT" | "RIGHT" | "DONE";

export const useFaceRegistration = (cameraRef: React.RefObject<any>) => {
  const router = useRouter();
  const [step, setStep] = useState<RegistrationStep>("STRAIGHT");
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]); ``
  const [statusMessage, setStatusMessage] = useState("Nhìn thẳng vào camera");
  const isCapturing = useRef(false);

  const { faceData, frameProcessor } = useFaceDetection(isProcessing);

  const resetRegistration = () => {
    setStep("STRAIGHT");
    setCapturedImages([]);
    setStatusMessage("Nhìn thẳng vào camera");
    setIsProcessing(false);
    isCapturing.current = false;
  };

  useEffect(() => {
    if (!faceData || isProcessing || step === "DONE") return;

    const { yawAngle, pitchAngle, leftEyeOpenProbability, rightEyeOpenProbability } = faceData;

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

  const handleAutoCapture = async (nextMessage: string, nextStep: RegistrationStep) => {
    if (isCapturing.current || !cameraRef.current) return;
    isCapturing.current = true;
    setIsProcessing(true);
    setStatusMessage("Đang chụp...");

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false
      });

      const originalUri = `file://${photo.path}`;

      const manipResult = await manipulateAsync(
        originalUri,
        [{ resize: { width: 500 } }],
        {
          compress: 0.7,
          format: SaveFormat.JPEG
        }
      );

      const imageUri = manipResult.uri;
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

  const processAndUploadImages = async (imageUris: string[]) => {
    setIsProcessing(true);
    setStatusMessage("Đang đồng bộ dữ liệu");

    try {
      const userDataString = await AsyncStorage.getItem("userData");
      console.log("Data login: ", userDataString);
      if (!userDataString) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin đăng nhập.");
        return;
      }
      const userId = JSON.parse(userDataString).id;

      const startUploadTime = Date.now();
      const uploadPromises = imageUris.map((uri) => uploadImageToCloudinary(uri, userId));

      const results = await Promise.all(uploadPromises);
      const endUploadTime = Date.now();
      console.log(`⏱️ [FRONTEND] Upload 3 ảnh: ${((endUploadTime - startUploadTime) / 1000).toFixed(2)}s`);

      const uploadedUrls = results.filter((url) => url !== null);
      if (uploadedUrls.length !== 3) throw new Error("Chỉ tải lên được một phần ảnh.");

      setStatusMessage("Đang xác thực");
      await sendRegistrationToBackend(userId, uploadedUrls as string[]);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, urls }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await AsyncStorage.setItem("isFaceUpdated", "true");
        const userDataString = await AsyncStorage.getItem("userData");
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          userData.is_face_updated = true;
          userData.hinh_anh = urls[0]; // Cập nhật hình ảnh đại diện bằng hình đầu tiên
          await AsyncStorage.setItem("userData", JSON.stringify(userData));
        }

        Alert.alert("Thành công", "Đã đăng ký khuôn mặt thành công!", [
          { text: "Đồng ý", onPress: () => router.replace("/(tabs)/home") },
        ]);
      } else {
        Alert.alert("Thất bại", data.message || "Vui lòng chụp hình trong môi trường đủ ánh sáng, ...", [
          { text: "Thử lại", onPress: resetRegistration }
        ]);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Lỗi kết nối đến máy chủ Backend!", [
        { text: "Thử lại", onPress: resetRegistration }
      ]);
    }
  };

  return {
    step,
    isProcessing,
    capturedImages,
    statusMessage,
    frameProcessor,
    resetRegistration,
  };
};
