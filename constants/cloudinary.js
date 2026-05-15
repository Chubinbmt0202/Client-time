// Đường dẫn: src/utils/cloudinary.js

// Thêm tham số userId vào hàm
import axios from "axios";

export const uploadImageToCloudinary = async (imageUri, userId) => {
    console.log("🚀 [Cloudinary] Bắt đầu upload (Sử dụng Axios)...");
    console.log("📸 [Cloudinary] Image URI:", imageUri);

    try {
        const data = new FormData();
        data.append("file", {
            uri: imageUri,
            type: "image/jpeg",
            name: `upload_${Date.now()}.jpg`,
        });

        data.append("upload_preset", "mindcheck_attendance");

        if (userId) {
            data.append("folder", `MindCheck/NhanVien_${userId}`);
        } else {
            data.append("folder", `MindCheck/KhachVangLai`);
        }

        const cloudName = "dx3snw69p";
        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

        const response = await axios.post(uploadUrl, data, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            timeout: 30000, // 30 giây
        });

        console.log("✅ [Cloudinary] Upload thành công:", response.data.secure_url);
        return response.data.secure_url;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error("❌ [Cloudinary] Axios Error:");
            console.error("- Status:", error.response?.status);
            console.error("- Message:", error.message);
            console.error("- Data:", error.response?.data);
            if (error.code === 'ECONNABORTED') {
                console.error("💡 Lỗi: Quá thời gian (Timeout).");
            } else if (!error.response) {
                console.error("💡 Lỗi: Không có phản hồi từ server (Có thể do mạng hoặc DNS).");
            }
        } else {
            console.error("❌ [Cloudinary] Unknown Error:", error);
        }
        return null;
    }
};