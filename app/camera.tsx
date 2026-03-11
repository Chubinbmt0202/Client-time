import { Image } from "expo-image";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
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

// Import Bước 1 và Bước 2 vừa tách
import { captureAndCropFace } from "./captureAndCrop";
import { useFaceDetection } from "./useFaceDetection";

export default function BasicCameraScreen() {
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null!);

  // State quản lý tiến trình và kết quả
  const [isProcessing, setIsProcessing] = useState(false);
  const [croppedImageBase64, setCroppedImageBase64] = useState<string | null>(
    null,
  );
  const [croppedImageUri, setCroppedImageUri] = useState<string | null>(null);

  // Gọi Hook xử lý Bước 1
  const { faceData, frameProcessor } = useFaceDetection(isProcessing);

  // Xử lý sự kiện bấm nút (Gọi Bước 2)
  const handleCaptureClick = async () => {
    if (!faceData || isProcessing) return;
    try {
      setIsProcessing(true);

      const result = await captureAndCropFace(cameraRef);
      if (result) {
        setCroppedImageUri(result.uri);
        setCroppedImageBase64(result.base64);
      }
    } catch (error) {
      console.error("Lỗi khi xử lý ảnh:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (device == null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Không tìm thấy camera</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Ứng dụng cần quyền Camera</Text>
        <Text style={styles.linkText} onPress={requestPermission}>
          Cấp quyền Camera
        </Text>
      </View>
    );
  }

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

      {/* Khung ngắm chuẩn 260x260 */}
      <View style={styles.focusFrame} />

      {/* Hiển thị Output khuôn mặt (Bước 1) */}
      {faceData && !isProcessing && (
        <View style={styles.overlayInfo}>
          <Text style={styles.infoText}>BƯỚC 1: Output khuôn mặt</Text>
          <Text style={styles.infoText}>
            Bounds: x: {Math.round(faceData.bounds.x)}, y:{" "}
            {Math.round(faceData.bounds.y)}, w:{" "}
            {Math.round(faceData.bounds.width)}, h:{" "}
            {Math.round(faceData.bounds.height)}
          </Text>
          <Text style={styles.infoText}>
            Yaw Angle: {faceData.yawAngle.toFixed(1)}
          </Text>
          <Text style={styles.infoText}>
            Pitch Angle: {faceData.pitchAngle.toFixed(1)}
          </Text>
          <Text style={styles.infoText}>
            L.Eye Open: {faceData.leftEyeOpenProbability.toFixed(2)}
          </Text>

          <TouchableOpacity
            style={styles.btnCapture}
            onPress={handleCaptureClick}
          >
            <Text style={styles.btnText}>Trích xuất mặt (BƯỚC 2)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading Overlay */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={styles.processingText}>
            Đang cắt & resize 112x112...
          </Text>
        </View>
      )}

      {/* Hiển thị Ảnh Crop (Bước 2) */}
      {croppedImageUri && !isProcessing && (
        <View style={styles.resultOverlay}>
          <Text style={styles.infoText}>BƯỚC 2: Ảnh (112x112)</Text>
          <Image
            source={{ uri: croppedImageUri }}
            style={styles.croppedImage}
          />
          <TouchableOpacity
            style={styles.btnCapture}
            onPress={() => {
              setCroppedImageBase64(null);
              setCroppedImageUri(null);
            }}
          >
            <Text style={styles.btnText}>Làm lại</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  focusFrame: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 260,
    height: 260,
    marginTop: -130,
    marginLeft: -130,
    borderWidth: 3,
    borderColor: "#00FF00",
    borderRadius: 16,
    borderStyle: "dashed",
  },
  text: { color: "#FFF", fontSize: 16, marginBottom: 20 },
  linkText: { color: "#1C75FF", fontSize: 18, fontWeight: "bold", padding: 10 },
  overlayInfo: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 15,
    borderRadius: 10,
  },
  infoText: {
    color: "#00FF00",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  btnCapture: {
    backgroundColor: "#1C75FF",
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  processingText: {
    color: "#00ff00",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  resultOverlay: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  croppedImage: {
    width: 112,
    height: 112,
    borderWidth: 2,
    borderColor: "#00ff00",
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
});
