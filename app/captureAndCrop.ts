import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { Dimensions } from "react-native";
import { Camera } from "react-native-vision-camera";

interface CropResult {
  uri: string;
  base64: string;
}

export async function captureAndCropFace(
  cameraRef: React.RefObject<Camera>,
): Promise<CropResult | null> {
  if (!cameraRef.current) return null;

  // 2.1 Chụp toàn bộ ảnh hiện tại
  const photo = await cameraRef.current.takePhoto({});

  // Kích thước khung ngắm trên màn hình UI của chúng ta
  const FRAME_SIZE = 260;
  const { width: screenWidth } = Dimensions.get("window");

  // Xử lý xoay ảnh (nếu ảnh gốc bị ngang)
  const isPhotoLandscape = photo.width > photo.height;
  const actualPhotoWidth = isPhotoLandscape ? photo.height : photo.width;
  const actualPhotoHeight = isPhotoLandscape ? photo.width : photo.height;

  // Tính tỷ lệ giữa ảnh thật và màn hình
  const scale = actualPhotoWidth / screenWidth;

  // Tính toán kích thước của vùng cần cắt trên ảnh thật
  const cropSize = FRAME_SIZE * scale;
  const cropX = (actualPhotoWidth - cropSize) / 2;
  const cropY = (actualPhotoHeight - cropSize) / 2;

  // 2.2 Cắt và Resize về chuẩn 112x112 cho MobileFaceNet
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

  // 2.3 Chuyển file thành Base64 để chuẩn bị đẩy vào TFLite (Bước 3)
  const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
    encoding: "base64",
  });

  return {
    uri: manipResult.uri,
    base64: base64,
  };
}
