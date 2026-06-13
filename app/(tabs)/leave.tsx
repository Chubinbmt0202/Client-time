import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DrawerActions } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../../constants/api";
import { uploadImageToCloudinary } from "../../constants/cloudinary";

const LEAVE_TYPES = [
  { id: "monthly", label: "Phép hàng tháng", icon: "calendar-check" },
  { id: "sick", label: "Nghỉ ốm", icon: "pill" },
  { id: "personal", label: "Việc riêng", icon: "account-clock" },
];

export default function LeaveScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [selectedType, setSelectedType] = useState(LEAVE_TYPES[0].id);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [reason, setReason] = useState("");
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  const onFromDateChange = (event: any, selectedDate?: Date) => {
    setShowFromPicker(Platform.OS === "ios");
    if (selectedDate) {
      setFromDate(selectedDate);
    }
  };

  const onToDateChange = (event: any, selectedDate?: Date) => {
    setShowToPicker(Platform.OS === "ios");
    if (selectedDate) {
      setToDate(selectedDate);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Lỗi", "Không thể chọn tài liệu");
    }
  };

  const formatApiDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const userDataStr = await AsyncStorage.getItem("userData");
      if (!userDataStr) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
        return;
      }
      const userData = JSON.parse(userDataStr);
      const employeeId = userData.id_nhan_vien || userData.id;
      
      if (!employeeId) {
        Alert.alert("Lỗi", "Không tìm thấy mã nhân viên");
        setLoading(false);
        return;
      }

      let cloudinaryUrl = null;

      // 1. Nếu có file đính kèm, upload lên Cloudinary trước
      if (selectedFile) {
        console.log("📤 [Upload] Bắt đầu upload minh chứng lên Cloudinary...");
        cloudinaryUrl = await uploadImageToCloudinary(selectedFile.uri, employeeId);
        
        if (!cloudinaryUrl) {
          Alert.alert("Lỗi", "Không thể upload minh chứng. Vui lòng thử lại.");
          setLoading(false);
          return;
        }
      }

      // 2. Chuẩn bị dữ liệu gửi về Backend
      const leaveData = {
        id_nhan_vien: employeeId,
        leaveType: LEAVE_TYPES.find((t) => t.id === selectedType)?.label,
        fromDate: formatApiDate(fromDate),
        toDate: formatApiDate(toDate),
        totalDays: "Tạm tính",
        reason: reason || "Không có lý do",
        url_minh_chung: cloudinaryUrl, // Gửi link Cloudinary về backend
        file: selectedFile ? {
          name: selectedFile.name,
          size: selectedFile.size,
          uri: selectedFile.uri,
          mimeType: selectedFile.mimeType
        } : null,
      };

      console.log("=== Đang gửi đơn xin nghỉ phép ===");
      console.log(JSON.stringify(leaveData, null, 2));

      // 3. Gọi API Backend để lưu đơn
      const response = await fetch(API_ENDPOINTS.CREATE_LEAVE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leaveData),
      });

      const result = await response.json();

      if (result.success) {
        // Điều hướng tới trang thành công
        router.push({
          pathname: "/leave-success",
          params: {
            ...leaveData,
            fileName: selectedFile?.name || "",
            file: selectedFile ? JSON.stringify(selectedFile) : "",
            cloudinaryUrl: cloudinaryUrl || "", // Truyền URL sang trang thành công nếu cần
          },
        });
      } else {
        Alert.alert("Lỗi", result.message || "Không thể tạo đơn xin nghỉ phép");
      }
    } catch (error) {
      console.error("Lỗi khi gửi đơn:", error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={{ marginRight: 16 }}>
                <MaterialCommunityIcons name="menu" size={24} color="#1C75FF" />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>Tạo đơn xin nghỉ</Text>
                <Text style={styles.headerSubtitle}>
                  Điền thông tin để gửi phê duyệt
                </Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Chọn loại đơn */}
              <Text style={styles.sectionTitle}>Loại nghỉ phép</Text>
              <View style={styles.typeContainer}>
                {LEAVE_TYPES.map((type) => {
                  const isSelected = selectedType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.typeCard,
                        isSelected && styles.typeCardSelected,
                      ]}
                      onPress={() => setSelectedType(type.id)}
                    >
                      <MaterialCommunityIcons
                        name={type.icon as any}
                        size={24}
                        color={isSelected ? "#1C75FF" : "#64748B"}
                      />
                      <Text
                        style={[
                          styles.typeText,
                          isSelected && styles.typeTextSelected,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Thời gian */}
              <Text style={styles.sectionTitle}>Thời gian nghỉ</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.inputLabel}>Từ ngày</Text>
                  <TouchableOpacity
                    style={styles.inputBox}
                    onPress={() => setShowFromPicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#1C75FF" />
                    <Text style={styles.dateDisplay}>
                      {formatDisplayDate(fromDate)}
                    </Text>
                  </TouchableOpacity>
                  {showFromPicker && (
                    <DateTimePicker
                      value={fromDate}
                      mode="date"
                      display="default"
                      onChange={onFromDateChange}
                    />
                  )}
                </View>

                <View style={{ width: 16 }} />

                <View style={styles.dateInputContainer}>
                  <Text style={styles.inputLabel}>Đến ngày</Text>
                  <TouchableOpacity
                    style={styles.inputBox}
                    onPress={() => setShowToPicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color="#1C75FF" />
                    <Text style={styles.dateDisplay}>
                      {formatDisplayDate(toDate)}
                    </Text>
                  </TouchableOpacity>
                  {showToPicker && (
                    <DateTimePicker
                      value={toDate}
                      mode="date"
                      display="default"
                      onChange={onToDateChange}
                    />
                  )}
                </View>
              </View>

              {/* Lý do */}
              <Text style={styles.sectionTitle}>Lý do nghỉ</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Nhập lý do xin nghỉ phép cụ thể..."
                  placeholderTextColor="#94A3B8"
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Đính kèm file */}
              <Text style={styles.sectionTitle}>Tệp đính kèm</Text>
              <TouchableOpacity
                style={styles.attachmentContainer}
                onPress={pickDocument}
              >
                {selectedFile ? (
                  <View style={styles.fileInfo}>
                    <MaterialCommunityIcons name="file-document" size={24} color="#1C75FF" />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text style={styles.fileSize}>
                        {(selectedFile.size ? selectedFile.size / 1024 : 0).toFixed(1)} KB
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <Ionicons name="cloud-upload-outline" size={24} color="#64748B" />
                    <Text style={styles.uploadText}>Nhấn để đính kèm minh chứng (Ảnh, PDF...)</Text>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.submitButton, loading && { opacity: 0.7 }]}
                onPress={handleSubmit}
                activeOpacity={0.8}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>
                  {loading ? "Đang gửi đơn..." : "Gửi đơn xin phép"}
                </Text>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" style={{ marginLeft: 8 }} />
                ) : (
                  <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F172A",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 12,
    marginTop: 8,
  },
  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  typeCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  typeCardSelected: {
    borderColor: "#1C75FF",
    backgroundColor: "#EEF2FF",
  },
  typeText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
    color: "#64748B",
  },
  typeTextSelected: {
    color: "#1C75FF",
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  dateInputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 6,
    fontWeight: "500",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#0F172A",
  },
  textAreaContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    marginBottom: 24,
    padding: 2,
  },
  textArea: {
    height: 100,
    padding: 12,
    fontSize: 15,
    color: "#0F172A",
  },
  dateDisplay: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#0F172A",
  },
  attachmentContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    borderStyle: "dashed",
    padding: 16,
    marginBottom: 24,
  },
  uploadPlaceholder: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    marginLeft: 8,
    color: "#64748B",
    fontSize: 14,
  },
  fileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  fileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  fileSize: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  approverContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  approverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  approverInitials: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 16,
  },
  approverInfo: {
    flex: 1,
    marginLeft: 12,
  },
  approverName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  approverRole: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  footer: {
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  submitButton: {
    backgroundColor: "#1C75FF",
    flexDirection: "row",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1C75FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
