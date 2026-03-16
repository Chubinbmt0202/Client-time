// Đường dẫn: src/utils/cloudinary.js

// Thêm tham số userId vào hàm
export const uploadImageToCloudinary = async (imageUri, userId) => {
    try {
        const data = new FormData();
        data.append("file", {
            uri: imageUri,
            type: "image/jpeg",
            name: "upload.jpg",
        });

        // Tên preset unsigned của bạn
        data.append("upload_preset", "mindcheck_attendance");

        // 🚀 ĐIỂM ĂN TIỀN LÀ ĐÂY: Tạo thư mục theo ID nhân viên
        if (userId) {
            // Ảnh sẽ bay vào thư mục: MindCheck/NhanVien_5/...
            data.append("folder", `MindCheck/NhanVien_${userId}`);
        } else {
            data.append("folder", `MindCheck/KhachVangLai`);
        }

        const cloudName = "dx3snw69p"; // Đổi lại đúng tên cloud của bạn
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: "POST",
                body: data,
                headers: { "Content-Type": "multipart/form-data" },
            }
        );

        const result = await response.json();
        return result.secure_url;
    } catch (error) {
        console.error("Lỗi upload Cloudinary:", error);
        return null;
    }
};