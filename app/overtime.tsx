import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { DrawerActions } from "@react-navigation/native";
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
import { API_ENDPOINTS } from "../constants/api";

export default function OvertimeScreen() {
  const router = useRouter();
  const navigation = useNavigation();

  const [otDate, setOtDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(17, 30, 0, 0)));
  const [expectedEndTime, setExpectedEndTime] = useState(new Date(new Date().setHours(20, 30, 0, 0)));
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setOtDate(selectedDate);
  };

  const onStartTimeChange = (event: any, selectedDate?: Date) => {
    setShowStartTimePicker(Platform.OS === "ios");
    if (selectedDate) setStartTime(selectedDate);
  };

  const onEndTimeChange = (event: any, selectedDate?: Date) => {
    setShowEndTimePicker(Platform.OS === "ios");
    if (selectedDate) setExpectedEndTime(selectedDate);
  };

  const formatDate = (date: Date) => date.toLocaleDateString("vi-VN");
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };
  
  // Format to YYYY-MM-DD for backend
  const formatBackendDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async () => {
    try {
      if (!reason.trim()) {
        Alert.alert("Lỗi", "Vui lòng nhập lý do tăng ca");
        return;
      }

      setLoading(true);
      
      const userDataStr = await AsyncStorage.getItem("userData");
      if (!userDataStr) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
        return;
      }
      const userData = JSON.parse(userDataStr);
      const employeeId = userData.id_nhan_vien || userData.id;

      const payload = {
        employeeId: employeeId,
        otDate: formatBackendDate(otDate),
        startTime: formatTime(startTime),
        expectedEndTime: formatTime(expectedEndTime),
        reason: reason.trim(),
      };

      console.log("=== Đang gửi đơn đăng ký tăng ca ===");
      console.log(JSON.stringify(payload, null, 2));

      const response = await fetch(API_ENDPOINTS.CREATE_OT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert("Thành công", "Đã gửi đơn đăng ký tăng ca", [
          {
            text: "OK",
            onPress: () => router.push("/(tabs)/home"),
          },
        ]);
      } else {
        Alert.alert("Lỗi", result.message || "Không thể tạo đơn đăng ký tăng ca");
      }
    } catch (error) {
      console.error("Lỗi khi gửi đơn OT:", error);
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
                <Text style={styles.headerTitle}>Đăng ký tăng ca</Text>
                <Text style={styles.headerSubtitle}>
                  Điền thông tin để gửi phê duyệt
                </Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Ngày tăng ca */}
              <Text style={styles.sectionTitle}>Ngày tăng ca</Text>
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  style={styles.inputBox}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#1C75FF" />
                  <Text style={styles.dateDisplay}>
                    {formatDate(otDate)}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={otDate}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                  />
                )}
              </View>

              {/* Thời gian */}
              <Text style={styles.sectionTitle}>Thời gian làm việc</Text>
              <View style={styles.dateRow}>
                <View style={styles.dateInputContainer}>
                  <Text style={styles.inputLabel}>Từ giờ</Text>
                  <TouchableOpacity
                    style={styles.inputBox}
                    onPress={() => setShowStartTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={20} color="#1C75FF" />
                    <Text style={styles.dateDisplay}>
                      {formatTime(startTime)}
                    </Text>
                  </TouchableOpacity>
                  {showStartTimePicker && (
                    <DateTimePicker
                      value={startTime}
                      mode="time"
                      display="default"
                      is24Hour={true}
                      onChange={onStartTimeChange}
                    />
                  )}
                </View>

                <View style={{ width: 16 }} />

                <View style={styles.dateInputContainer}>
                  <Text style={styles.inputLabel}>Đến giờ (Dự kiến)</Text>
                  <TouchableOpacity
                    style={styles.inputBox}
                    onPress={() => setShowEndTimePicker(true)}
                  >
                    <Ionicons name="time-outline" size={20} color="#1C75FF" />
                    <Text style={styles.dateDisplay}>
                      {formatTime(expectedEndTime)}
                    </Text>
                  </TouchableOpacity>
                  {showEndTimePicker && (
                    <DateTimePicker
                      value={expectedEndTime}
                      mode="time"
                      display="default"
                      is24Hour={true}
                      onChange={onEndTimeChange}
                    />
                  )}
                </View>
              </View>

              {/* Lý do */}
              <Text style={styles.sectionTitle}>Lý do tăng ca</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Nhập lý do chi tiết..."
                  placeholderTextColor="#94A3B8"
                  value={reason}
                  onChangeText={setReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

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
                  {loading ? "Đang gửi đơn..." : "Gửi đăng ký"}
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
  inputContainer: {
    marginBottom: 16,
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
  dateDisplay: {
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
