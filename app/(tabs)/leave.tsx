import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DrawerActions } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
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
import { CustomAlert, CustomAlertState } from "../../components/CustomAlert";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_ENDPOINTS } from "../../constants/api";
import { uploadImageToCloudinary } from "../../constants/cloudinary";

export default function LeaveScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [reason, setReason] = useState("");
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [customAlert, setCustomAlert] = useState<CustomAlertState>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const fetchLeaveTypes = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem("userData");
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const employeeId = userData.id_nhan_vien || userData.id;
        
        const response = await fetch(API_ENDPOINTS.GET_LEAVE_SUMMARY(employeeId));
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          setLeaveTypes(result.data);
          setSelectedType(result.data[0].id_loai_phep);
        }
      }
    } catch (error) {
      console.error("Lỗi lấy danh sách phép:", error);
    } finally {
      setInitialLoading(false);
    }
  };

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
      setCustomAlert({
        visible: true,
        title: "Lỗi",
        message: "Không thể chọn tài liệu",
        type: "error",
        confirmText: "Đã hiểu",
        onConfirm: () => setCustomAlert((prev) => ({ ...prev, visible: false })),
      });
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
      if (!selectedType) {
        return;
      }
      
      const start = new Date(fromDate);
      start.setHours(0,0,0,0);
      const end = new Date(toDate);
      end.setHours(0,0,0,0);
      const requestedDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (requestedDays <= 0) {
        setCustomAlert({
            visible: true,
            title: "Lỗi",
            message: "Ngày kết thúc không được nhỏ hơn ngày bắt đầu",
            type: "error",
            confirmText: "Đã hiểu",
            onConfirm: () => setCustomAlert((prev) => ({ ...prev, visible: false })),
        });
        return;
      }
      
      const leaveInfo = leaveTypes.find(t => t.id_loai_phep === selectedType);
      if (leaveInfo && leaveInfo.max_month > 0 && requestedDays > leaveInfo.remaining_month) {
        setCustomAlert({
            visible: true,
            title: "Vượt quá hạn mức",
            message: `Bạn chỉ còn ${leaveInfo.remaining_month} ngày phép này trong tháng, nhưng đang xin nghỉ ${requestedDays} ngày.`,
            type: "error",
            confirmText: "Đã hiểu",
            onConfirm: () => setCustomAlert((prev) => ({ ...prev, visible: false })),
        });
        return;
      }

      setLoading(true);

      const userDataStr = await AsyncStorage.getItem("userData");
      if (!userDataStr) {
        setCustomAlert({
          visible: true,
          title: "Lỗi",
          message: "Vui lòng đăng nhập lại",
          type: "error",
          confirmText: "Đã hiểu",
          onConfirm: () => setCustomAlert((prev) => ({ ...prev, visible: false })),
        });
        return;
      }
      const userData = JSON.parse(userDataStr);
      const employeeId = userData.id_nhan_vien || userData.id;

      if (!employeeId) {
        setCustomAlert({
          visible: true,
          title: "Lỗi",
          message: "Không tìm thấy mã nhân viên",
          type: "error",
          confirmText: "Đã hiểu",
          onConfirm: () => setCustomAlert((prev) => ({ ...prev, visible: false })),
        });
        setLoading(false);
        return;
      }

      let cloudinaryUrl = null;

      // 1. Nếu có file đính kèm, upload lên Cloudinary trước
      if (selectedFile) {
        console.log("📤 [Upload] Bắt đầu upload minh chứng lên Cloudinary...");
        cloudinaryUrl = await uploadImageToCloudinary(selectedFile.uri, employeeId);

        if (!cloudinaryUrl) {
          setCustomAlert({
            visible: true,
            title: "Lỗi",
            message: "Không thể upload minh chứng. Vui lòng thử lại.",
            type: "error",
            confirmText: "Đã hiểu",
            onConfirm: () => setCustomAlert((prev) => ({ ...prev, visible: false })),
          });
          setLoading(false);
          return;
        }
      }

      // 2. Chuẩn bị dữ liệu gửi về Backend
      const leaveData = {
        id_nhan_vien: employeeId,
        leaveType: leaveInfo?.ten_phep || "",
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
        setCustomAlert({
          visible: true,
          title: "Thành công",
          message: "Đã gửi đơn xin nghỉ phép thành công!",
          type: "success",
          confirmText: "Đồng ý",
          onConfirm: () => {
            setCustomAlert((prev) => ({ ...prev, visible: false }));
            setSelectedFile(null);
            setReason("");
            router.replace("/(tabs)/home");
          }
        });
      } else {
        setCustomAlert({
          visible: true,
          title: "Lỗi",
          message: result.message || "Không thể tạo đơn xin nghỉ phép",
          type: "error",
          confirmText: "Đã hiểu",
          onConfirm: () => setCustomAlert((prev) => ({ ...prev, visible: false })),
        });
      }
    } catch (error) {
      console.error("Lỗi khi gửi đơn:", error);
      setCustomAlert({
        visible: true,
        title: "Lỗi",
        message: "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
        type: "error",
        confirmText: "Đã hiểu",
        onConfirm: () => setCustomAlert((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getIconForLeaveType = (id: string, name: string) => {
      const lowerName = name.toLowerCase();
      if (lowerName.includes("ốm")) return "pill";
      if (lowerName.includes("riêng")) return "account-clock";
      if (lowerName.includes("thai sản")) return "baby-carriage";
      if (lowerName.includes("không lương")) return "cash-remove";
      return "calendar-check";
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

            {initialLoading ? (
               <View style={{flex: 1, justifyContent: "center", alignItems: "center"}}>
                   <ActivityIndicator size="large" color="#1C75FF" />
               </View>
            ) : (
                <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                >
                {/* Chọn loại đơn */}
                <Text style={styles.sectionTitle}>Loại nghỉ phép</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeContainerScroll}>
                    {leaveTypes.map((type) => {
                    const isSelected = selectedType === type.id_loai_phep;
                    return (
                        <TouchableOpacity
                        key={type.id_loai_phep}
                        style={[
                            styles.typeCard,
                            isSelected && styles.typeCardSelected,
                        ]}
                        onPress={() => setSelectedType(type.id_loai_phep)}
                        >
                        <MaterialCommunityIcons
                            name={getIconForLeaveType(type.id_loai_phep, type.ten_phep)}
                            size={24}
                            color={isSelected ? "#1C75FF" : "#64748B"}
                        />
                        <Text
                            style={[
                            styles.typeText,
                            isSelected && styles.typeTextSelected,
                            ]}
                        >
                            {type.ten_phep}
                        </Text>
                        {type.max_month > 0 && (
                            <View style={[styles.badge, isSelected && styles.badgeSelected]}>
                                <Text style={[styles.badgeText, isSelected && styles.badgeTextSelected]}>
                                    Còn: {type.remaining_month} / {type.max_month}
                                </Text>
                            </View>
                        )}
                        </TouchableOpacity>
                    );
                    })}
                </ScrollView>
                
                {selectedType && leaveTypes.find(t => t.id_loai_phep === selectedType)?.max_month > 0 && (
                    <View style={styles.limitInfoBox}>
                        <Ionicons name="information-circle" size={20} color="#0284c7" />
                        <Text style={styles.limitInfoText}>
                            Bạn còn <Text style={{fontWeight: "bold"}}>{leaveTypes.find(t => t.id_loai_phep === selectedType)?.remaining_month}</Text> ngày phép này trong tháng. Các đơn chờ duyệt đã được khấu trừ.
                        </Text>
                    </View>
                )}

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
                <Text style={styles.sectionTitle}>Tệp đính kèm (Tùy chọn)</Text>
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
            )}

            {/* Submit Button */}
            {!initialLoading && (
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
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <CustomAlert {...customAlert} />
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
  typeContainerScroll: {
    flexDirection: "row",
    marginBottom: 8,
  },
  typeCard: {
    width: 140,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: "center",
    marginRight: 12,
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
    textAlign: "center"
  },
  typeTextSelected: {
    color: "#1C75FF",
    fontWeight: "600",
  },
  badge: {
      marginTop: 8,
      backgroundColor: "#F1F5F9",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12
  },
  badgeSelected: {
      backgroundColor: "#DBEAFE"
  },
  badgeText: {
      fontSize: 11,
      color: "#64748B",
      fontWeight: "600"
  },
  badgeTextSelected: {
      color: "#1D4ED8"
  },
  limitInfoBox: {
      flexDirection: "row",
      backgroundColor: "#e0f2fe",
      padding: 12,
      borderRadius: 8,
      alignItems: "center",
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: "#0284c7"
  },
  limitInfoText: {
      marginLeft: 8,
      color: "#0369a1",
      fontSize: 13,
      flex: 1
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
