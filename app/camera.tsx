import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  const cameraRef = useRef<Camera>(null);

  // 1. State lưu trữ thông tin khuôn mặt
  // Đã thêm type <FaceData | null> để fix lỗi gán giá trị
  const [faceData, setFaceData] = useState<FaceData | null>(null);

  // State cho Bước 2
  const [isProcessing, setIsProcessing] = useState(false);
  const [croppedImageBase64, setCroppedImageBase64] = useState<string | null>(
    null,
  );
  const [croppedImageUri, setCroppedImageUri] = useState<string | null>(null);

  // 2. Cấu hình Face Detector
  const { detectFaces } = useFaceDetector({
    performanceMode: "fast", // Ưu tiên tốc độ
    landmarkMode: "all", // Lấy tọa độ
    classificationMode: "all", // Tính xác suất nhắm/mở mắt
  });

  // 3. Hàm chuyển dữ liệu từ luồng Native sang React (JS)
  // Đã định nghĩa type `faces: Face[]` giúp VSCode và TS hiểu rõ cấu trúc
  const handleDetectedFaces = Worklets.createRunOnJS((faces: Face[]) => {
    // Chỉ cập nhật UI faceData khi không đang xử lý ảnh (tránh giật lag)
    if (isProcessing) return;

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

  // --- BƯỚC 2: Chụp ảnh, Crop, Resize ---
  const handleCaptureAndCrop = async () => {
    if (!cameraRef.current || !faceData || isProcessing) return;

    try {
      setIsProcessing(true);

      // 2.1 Chụp toàn bộ ảnh hiện tại
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: "balanced",
      });

      // Kích thước khung ngắm trên màn hình UI của chúng ta
      const FRAME_SIZE = 260;

      // Lấy kích thước màn hình thiết bị
      const { width: screenWidth, height: screenHeight } =
        Dimensions.get("window");

      // Xử lý xoay ảnh (nếu ảnh gốc bị ngang)
      const isPhotoLandscape = photo.width > photo.height;
      const actualPhotoWidth = isPhotoLandscape ? photo.height : photo.width;
      const actualPhotoHeight = isPhotoLandscape ? photo.width : photo.height;

      // Tính tỷ lệ giữa ảnh thật và màn hình
      const scale = actualPhotoWidth / screenWidth;

      // Tính toán kích thước của vùng cần cắt trên ảnh thật
      const cropSize = FRAME_SIZE * scale;

      // Vì khung ngắm nằm chính giữa màn hình, ta lấy chính giữa bức ảnh gốc để cắt
      const cropX = (actualPhotoWidth - cropSize) / 2;
      const cropY = (actualPhotoHeight - cropSize) / 2;

      console.log("Cắt theo khung:", { cropX, cropY, cropSize });

      // Cắt và Resize về chuẩn 112x112 cho MobileFaceNet
      const manipResult = await ImageManipulator.manipulateAsync(
        "file://" + photo.path,
        [
          {
            crop: {
              originX: Math.round(cropX),
              originY: Math.round(cropY),
              width: Math.round(cropSize),
              height: Math.round(cropSize),
            },
          },
          { resize: { width: 112, height: 112 } }, // Bắt buộc về 112x112
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );

      setCroppedImageUri(manipResult.uri);

      // 2.3 Chuyển file thành Base64 để chuẩn bị đẩy vào TFLite (Bước 3)
      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: "base64",
      });

      setCroppedImageBase64(base64);
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
        photo={true} // Bắt buộc bật để xài takePhoto()
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />
      <View style={styles.focusFrame} />

      {/* Giao diện test hiển thị output theo mẫu bạn yêu cầu */}
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

          {/* Button mô phỏng Bước 2 */}
          <TouchableOpacity
            style={styles.btnCapture}
            onPress={handleCaptureAndCrop}
          >
            <Text style={styles.btnText}>Trích xuất mặt (BƯỚC 2)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Hiển thị Loading khi đang cắt ảnh */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#00ff00" />
          <Text style={styles.processingText}>
            Đang cắt & resize 112x112...
          </Text>
        </View>
      )}

      {/* Hiển thị ảnh sau khi đã xử lý xong */}
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
    width: 260, // Kích thước khung (260x260 pixel)
    height: 260,
    marginTop: -130, // Dịch lên một nửa chiều cao để căn giữa
    marginLeft: -130, // Dịch sang trái một nửa chiều rộng để căn giữa
    borderWidth: 3,
    borderColor: "#00FF00",
    borderRadius: 16,
    borderStyle: "dashed", // Viền đứt khúc nhìn cho ngầu
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
  btnCapture: {
    backgroundColor: "#1C75FF",
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },
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
