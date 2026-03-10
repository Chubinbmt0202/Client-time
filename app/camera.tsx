import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
} from "react-native-vision-camera";
import {
  Face,
  useFaceDetector,
} from "react-native-vision-camera-face-detector";
import { Worklets } from "react-native-worklets-core";

// Khai báo type rõ ràng để fix lỗi Typescript
interface FaceData {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  yawAngle: number;
  pitchAngle: number;
  leftEyeOpenProbability: number;
}

export default function BasicCameraScreen() {
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();

  // 1. State lưu trữ thông tin khuôn mặt
  // Đã thêm type <FaceData | null> để fix lỗi gán giá trị
  const [faceData, setFaceData] = useState<FaceData | null>(null);

  // 2. Cấu hình Face Detector
  const { detectFaces } = useFaceDetector({
    performanceMode: "fast", // Ưu tiên tốc độ
    landmarkMode: "all", // Lấy tọa độ
    classificationMode: "all", // Tính xác suất nhắm/mở mắt
  });

  // 3. Hàm chuyển dữ liệu từ luồng Native sang React (JS)
  // Đã định nghĩa type `faces: Face[]` giúp VSCode và TS hiểu rõ cấu trúc
  const handleDetectedFaces = Worklets.createRunOnJS((faces: Face[]) => {
    if (faces && faces.length > 0) {
      const face = faces[0];
      setFaceData({
        bounds: {
          x: face.bounds.x,
          y: face.bounds.y,
          width: face.bounds.width,
          height: face.bounds.height,
        },
        yawAngle: face.yawAngle ?? 0,
        pitchAngle: face.pitchAngle ?? 0,
        leftEyeOpenProbability: face.leftEyeOpenProbability ?? 0,
      });
    } else {
      setFaceData(null);
    }
  });

  // 4. Frame Processor: Chạy liên tục xử lý frame ảnh realtime
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      const faces = detectFaces(frame);
      // @ts-ignore: Worklet đôi khi báo lỗi truyền array nên dùng ts-ignore
      handleDetectedFaces(faces);
    },
    [detectFaces, handleDetectedFaces],
  );

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
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />

      {/* Giao diện test hiển thị output theo mẫu bạn yêu cầu */}
      {faceData && (
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
  text: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 20,
  },
  linkText: {
    color: "#1C75FF",
    fontSize: 18,
    fontWeight: "bold",
    padding: 10,
  },
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
});
