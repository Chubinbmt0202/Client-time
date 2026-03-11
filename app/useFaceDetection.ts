import { useState } from "react";
import { useFrameProcessor } from "react-native-vision-camera";
import {
    Face,
    useFaceDetector,
} from "react-native-vision-camera-face-detector";
import { Worklets } from "react-native-worklets-core";

export interface FaceData {
  bounds: { x: number; y: number; width: number; height: number };
  yawAngle: number;
  pitchAngle: number;
  leftEyeOpenProbability: number;
}

export function useFaceDetection(isProcessing: boolean) {
  const [faceData, setFaceData] = useState<FaceData | null>(null);

  // Cấu hình Face Detector
  const { detectFaces } = useFaceDetector({
    performanceMode: "fast",
    landmarkMode: "all",
    classificationMode: "all",
  });

  // Hàm chuyển dữ liệu từ luồng Native sang React (JS)
  const handleDetectedFaces = Worklets.createRunOnJS((faces: Face[]) => {
    // Tạm dừng cập nhật UI nếu đang xử lý ảnh để tránh lag
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

  // Frame Processor chạy liên tục
  const frameProcessor = useFrameProcessor(
    (frame) => {
      "worklet";
      const faces = detectFaces(frame);
      // @ts-ignore
      handleDetectedFaces(faces);
    },
    [detectFaces, handleDetectedFaces],
  );

  return { faceData, frameProcessor };
}
