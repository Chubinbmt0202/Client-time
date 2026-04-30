import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

const LEAVE_TYPES = [
  { id: "annual", label: "Phép năm", icon: "calendar-check" },
  { id: "sick", label: "Nghỉ ốm", icon: "pill" },
  { id: "personal", label: "Việc riêng", icon: "account-clock" },
];

export default function LeaveScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState(LEAVE_TYPES[0].id);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    // Điều hướng tới trang thành công, truyền theo tham số
    router.push({
      pathname: "/leave-success",
      params: {
        leaveType: LEAVE_TYPES.find((t) => t.id === selectedType)?.label,
        fromDate: fromDate || "Hôm nay",
        toDate: toDate || "Hôm nay",
        totalDays: "Tạm tính", // Có thể tính toán số ngày thực tế
        reason: reason || "Không có lý do",
      },
    });
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
              <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                <Ionicons name="arrow-back" size={24} color="#0F172A" />
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
                  <View style={styles.inputBox}>
                    <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
                    <TextInput
                      style={styles.input}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#CBD5E1"
                      value={fromDate}
                      onChangeText={setFromDate}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={{ width: 16 }} />

                <View style={styles.dateInputContainer}>
                  <Text style={styles.inputLabel}>Đến ngày</Text>
                  <View style={styles.inputBox}>
                    <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
                    <TextInput
                      style={styles.input}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor="#CBD5E1"
                      value={toDate}
                      onChangeText={setToDate}
                      keyboardType="numeric"
                    />
                  </View>
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

              {/* Người duyệt */}
              <Text style={styles.sectionTitle}>Người phê duyệt</Text>
              <View style={styles.approverContainer}>
                <View style={styles.approverAvatar}>
                  <Text style={styles.approverInitials}>QL</Text>
                </View>
                <View style={styles.approverInfo}>
                  <Text style={styles.approverName}>Nguyễn Thị Trưởng Phòng</Text>
                  <Text style={styles.approverRole}>Quản lý trực tiếp</Text>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Gửi đơn xin phép</Text>
                <Ionicons name="send" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
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
