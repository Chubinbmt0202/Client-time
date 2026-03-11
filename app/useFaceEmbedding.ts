import { Buffer } from "buffer";
import * as jpeg from "jpeg-js";
import { useEffect, useState } from "react";
import { useTensorflowModel } from "react-native-fast-tflite";

export function useFaceEmbedding() {
  // 1. Load model từ thư mục assets
  const plugin = useTensorflowModel(require("../assets/mobilefacenet.tflite"));
  const [isModelReady, setIsModelReady] = useState(false);

  useEffect(() => {
    if (plugin.state === "loaded") {
      setIsModelReady(true);
      console.log("✅ TFLite Model MobileFaceNet đã tải thành công!");
    }
  }, [plugin.state]);

  // 2. Hàm trích xuất 128 đặc trưng từ chuỗi Base64
  const getEmbedding = async (
    base64Image: string,
  ): Promise<number[] | null> => {
    if (!plugin.model) {
      console.warn("Model chưa sẵn sàng để chạy.");
      return null;
    }

    try {
      // --- BƯỚC A: Giải mã Base64 (JPEG) thành Raw Pixels ---
      // 1. Biến chuỗi text base64 thành dữ liệu nhị phân (Buffer)
      const buffer = Buffer.from(base64Image, "base64");

      // 2. Decode JPEG lấy mảng [R, G, B, A, R, G, B, A, ...]
      const rawImageData = jpeg.decode(buffer, { useTArray: true });

      // --- BƯỚC B: Chuẩn hóa dữ liệu cho Model [-1, 1] ---
      // Model yêu cầu mảng 1D độ dài: 112 * 112 * 3 (chỉ R, G, B) = 37632
      const inputSize = 112 * 112 * 3;
      const inputFloatArray = new Float32Array(inputSize);

      let dataIndex = 0;
      for (let i = 0; i < rawImageData.data.length; i += 4) {
        // Lấy màu R, G, B (bỏ qua kênh A ở vị trí i+3)
        const r = rawImageData.data[i];
        const g = rawImageData.data[i + 1];
        const b = rawImageData.data[i + 2];

        // Công thức chuẩn hóa: (pixel / 127.5) - 1
        inputFloatArray[dataIndex] = r / 127.5 - 1.0;
        inputFloatArray[dataIndex + 1] = g / 127.5 - 1.0;
        inputFloatArray[dataIndex + 2] = b / 127.5 - 1.0;

        dataIndex += 3;
      }

      // --- BƯỚC C: Chạy Inference (Dự đoán) ---
      const output = await plugin.model.run([inputFloatArray]);

      // --- BƯỚC D: Lấy Output ---
      // Output là một mảng chứa tensor kết quả, ta ép kiểu về Array bình thường
      const embeddingVector = Array.from(output[0] as Float32Array);

      return embeddingVector; // Trả về mảng 128 số
    } catch (error) {
      console.error("Lỗi khi chạy FaceNet model:", error);
      return null;
    }
  };

  return { isModelReady, getEmbedding };
}
