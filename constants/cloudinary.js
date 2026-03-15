// Đường dẫn: src/utils/cloudinary.js

export const uploadImageToCloudinary = async (imageUri) => {
    const cloudName = "dx3snw69p";
    const uploadPreset = "mindcheck_attendance";

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    const formData = new FormData();
    formData.append("file", {
        uri: imageUri,
        type: "image/jpeg",
        name: "attendance_photo.jpg",
    });
    formData.append("upload_preset", uploadPreset);

    // ❌ ĐÃ XÓA DÒNG NÀY: formData.append("transformation", "w_500,q_auto");

    try {
        console.log("Đang tải ảnh lên Cloudinary...");
        const response = await fetch(url, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (data.secure_url) {
            console.log("Upload thành công! URL:", data.secure_url);
            return data.secure_url;
        } else {
            console.error("Lỗi từ Cloudinary:", data);
            return null;
        }
    } catch (error) {
        console.error("Lỗi mạng khi upload Cloudinary:", error);
        return null;
    }
};