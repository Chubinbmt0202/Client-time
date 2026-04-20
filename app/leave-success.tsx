import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LeaveSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Đọc dữ liệu truyền từ trang form, cung cấp giá trị mặc định nếu không có
  const leaveType = params.leaveType || "Nghỉ phép năm";
  const fromDate = params.fromDate || "10/10/2023";
  const toDate = params.toDate || "12/10/2023";
  const totalDays = params.totalDays || "3 ngày";
  const reason = params.reason || "Giải quyết việc gia đình";

  return (
    <View style={styles.container}>
      {/* Nửa trên màu xanh */}
      <View style={styles.topSection}>
        <SafeAreaView edges={["top"]} />
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
        </View>
        <Text style={styles.title}>Đã gửi đơn thành công!</Text>
        <Text style={styles.subtitle}>
          Đơn xin nghỉ của bạn đã được gửi tới Quản lý để phê duyệt.
        </Text>
      </View>

      {/* Badge nổi */}
      <View style={styles.badgeContainer}>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Chờ phê duyệt</Text>
        </View>
      </View>

      {/* Nửa dưới màu xám nhạt */}
      <View style={styles.bottomSection}>
        {/* Card Tóm tắt đơn */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Tóm tắt đơn</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="calendar-text-outline" size={20} color="#64748B" />
              <Text style={styles.rowLabel}>Loại nghỉ</Text>
            </View>
            <Text style={styles.rowValue}>{leaveType}</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="calendar-clock-outline" size={20} color="#64748B" />
              <Text style={styles.rowLabel}>Thời gian</Text>
            </View>
            <Text style={styles.rowValue}>
              {fromDate} - {toDate}
            </Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#64748B" />
              <Text style={styles.rowLabel}>Tổng cộng</Text>
            </View>
            <Text style={styles.rowValueHighlight}>{totalDays}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.reasonSection}>
            <View style={styles.rowLeft}>
              <MaterialCommunityIcons name="text-box-outline" size={20} color="#64748B" />
              <Text style={styles.rowLabel}>Lý do</Text>
            </View>
            <Text style={styles.reasonText}>{reason}</Text>
          </View>
        </View>

        <View style={styles.spacer} />

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/leave-history")}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Xem danh sách đơn</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace("/(tabs)/home")}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={18} color="#1C75FF" />
            <Text style={styles.secondaryButtonText}>Quay lại Trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topSection: {
    backgroundColor: "#0275D8",
    paddingHorizontal: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  successIconContainer: {
    width: 90,
    height: 90,
    backgroundColor: "#FFFFFF",
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  badgeContainer: {
    alignItems: "center",
    marginTop: -20,
    zIndex: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#64748B",
    marginRight: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  bottomSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowLabel: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 10,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F172A",
  },
  rowValueHighlight: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0275D8",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 16,
  },
  reasonSection: {
    marginTop: 4,
  },
  reasonText: {
    fontSize: 14,
    color: "#334155",
    marginTop: 8,
    lineHeight: 20,
    marginLeft: 30,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    paddingBottom: 40,
  },
  primaryButton: {
    backgroundColor: "#0275D8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#0275D8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
  secondaryButton: {
    backgroundColor: "rgba(2, 117, 216, 0.05)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(2, 117, 216, 0.1)",
  },
  secondaryButtonText: {
    color: "#0275D8",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 10,
  },
});
