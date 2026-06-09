import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Dữ liệu mô phỏng bảng lương theo tháng
const MOCK_PAYROLL_DATA: any = {
  "06/2026": {
    month: "Tháng 06/2026",
    status: "Đã thanh toán",
    paymentDate: "05/06/2026",
    bankName: "Techcombank",
    bankAccount: "********8899",
    netSalary: 14780000,
    baseSalary: 12500000,
    otHours: 12,
    otSalary: 1950000,
    mealAllowance: 660000,
    travelAllowance: 400000,
    insuranceDeduction: 1312500, // 10.5% lương cơ bản
    taxDeduction: 417500,
  },
  "05/2026": {
    month: "Tháng 05/2026",
    status: "Đã thanh toán",
    paymentDate: "05/05/2026",
    bankName: "Techcombank",
    bankAccount: "********8899",
    netSalary: 13850000,
    baseSalary: 12500000,
    otHours: 6,
    otSalary: 975000,
    mealAllowance: 660000,
    travelAllowance: 400000,
    insuranceDeduction: 1312500,
    taxDeduction: 372500,
  },
  "04/2026": {
    month: "Tháng 04/2026",
    status: "Đã thanh toán",
    paymentDate: "05/04/2026",
    bankName: "Techcombank",
    bankAccount: "********8899",
    netSalary: 15430000,
    baseSalary: 12500000,
    otHours: 16,
    otSalary: 2600000,
    mealAllowance: 660000,
    travelAllowance: 400000,
    insuranceDeduction: 1312500,
    taxDeduction: 417500,
  },
  "03/2026": {
    month: "Tháng 03/2026",
    status: "Đã thanh toán",
    paymentDate: "05/03/2026",
    bankName: "Techcombank",
    bankAccount: "********8899",
    netSalary: 12247500,
    baseSalary: 12500000,
    otHours: 0,
    otSalary: 0,
    mealAllowance: 660000,
    travelAllowance: 400000,
    insuranceDeduction: 1312500,
    taxDeduction: 0,
  },
};

export default function PayrollScreen() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState("06/2026");
  const [employeeInfo, setEmployeeInfo] = useState<any>({ name: "", id: "", department: "Phòng Kỹ Thuật" });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem("userData");
        if (userDataStr) {
          const user = JSON.parse(userDataStr);
          setEmployeeInfo({
            name: user.ho_va_ten || "Người dùng",
            id: user.id_nhan_vien || "NV001",
            department: user.ten_phong_ban || "Phòng Kỹ Thuật",
          });
        }
      } catch (error) {
        console.error("Lỗi khi đọc dữ liệu người dùng:", error);
      }
    };
    fetchUserData();
  }, []);

  const data = MOCK_PAYROLL_DATA[selectedMonth] || MOCK_PAYROLL_DATA["06/2026"];

  const formatCurrency = (value: number) => {
    return value.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  };

  const handleDownloadPDF = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      Alert.alert(
        "Tải xuống thành công",
        `Phiếu lương chi tiết ${data.month} của nhân viên ${employeeInfo.name} đã được lưu về thiết bị dưới dạng file PDF.`,
        [{ text: "Đã hiểu", style: "default" }]
      );
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/(tabs)/home")}>
          <Ionicons name="arrow-back" size={24} color="#1C75FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phiếu lương chi tiết</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Info Mini Card */}
        <View style={styles.profileCard}>
          <View>
            <Text style={styles.employeeName}>{employeeInfo.name}</Text>
            <Text style={styles.employeeDetails}>Mã NV: {employeeInfo.id}  •  {employeeInfo.department}</Text>
          </View>
          <MaterialCommunityIcons name="card-account-details-outline" size={28} color="#64748B" />
        </View>

        {/* Main Salary Card */}
        <View style={styles.salaryCard}>
          <Text style={styles.salaryCardLabel}>Lương thực nhận ({selectedMonth})</Text>
          <Text style={styles.salaryAmount}>{formatCurrency(data.netSalary)}</Text>
          
          <View style={styles.badgeRow}>
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
              <Text style={styles.statusBadgeText}>{data.status}</Text>
            </View>
            <Text style={styles.paymentDateText}>Ngày nhận: {data.paymentDate}</Text>
          </View>

          <View style={styles.cardDivider} />

          <View style={styles.bankRow}>
            <Ionicons name="card-outline" size={20} color="#E2E8F0" />
            <Text style={styles.bankText}>
              Nhận qua: <Text style={styles.bankHighlight}>{data.bankName}</Text> ({data.bankAccount})
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.downloadButton, downloading && { opacity: 0.8 }]} 
          onPress={handleDownloadPDF}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Feather name="download" size={18} color="#FFFFFF" />
              <Text style={styles.downloadButtonText}>Tải phiếu lương PDF</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Breakdown Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chi tiết thu nhập & Khấu trừ</Text>
        </View>

        <View style={styles.breakdownCard}>
          {/* INCOMES */}
          <Text style={styles.breakdownGroupTitle}>Các khoản thu nhập</Text>
          
          <View style={styles.breakdownRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: "#EEF2FF" }]}>
                <Ionicons name="cash-outline" size={18} color="#4F46E5" />
              </View>
              <Text style={styles.rowLabel}>Lương cơ bản</Text>
            </View>
            <Text style={[styles.rowValue, styles.incomeValue]}>{formatCurrency(data.baseSalary)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="time-outline" size={18} color="#D97706" />
              </View>
              <View>
                <Text style={styles.rowLabel}>Lương tăng ca (OT)</Text>
                <Text style={styles.rowSubLabel}>{data.otHours} giờ làm việc</Text>
              </View>
            </View>
            <Text style={[styles.rowValue, styles.incomeValue]}>+{formatCurrency(data.otSalary)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: "#E0F2FE" }]}>
                <MaterialCommunityIcons name="food-fork-drink" size={18} color="#0284C7" />
              </View>
              <Text style={styles.rowLabel}>Phụ cấp ăn trưa</Text>
            </View>
            <Text style={[styles.rowValue, styles.incomeValue]}>+{formatCurrency(data.mealAllowance)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: "#E2E8F0" }]}>
                <MaterialCommunityIcons name="car-outline" size={18} color="#475569" />
              </View>
              <Text style={styles.rowLabel}>Phụ cấp đi lại & điện thoại</Text>
            </View>
            <Text style={[styles.rowValue, styles.incomeValue]}>+{formatCurrency(data.travelAllowance)}</Text>
          </View>

          <View style={styles.cardDivider2} />

          {/* DEDUCTIONS */}
          <Text style={[styles.breakdownGroupTitle, { marginTop: 12 }]}>Các khoản khấu trừ</Text>

          <View style={styles.breakdownRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: "#FEE2E2" }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.rowLabel}>Đóng BHXH, BHYT, BHTN</Text>
                <Text style={styles.rowSubLabel}>Khấu trừ 10.5%</Text>
              </View>
            </View>
            <Text style={[styles.rowValue, styles.deductionValue]}>-{formatCurrency(data.insuranceDeduction)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconWrapper, { backgroundColor: "#FEE2E2" }]}>
                <Ionicons name="calculator-outline" size={18} color="#DC2626" />
              </View>
              <Text style={styles.rowLabel}>Thuế thu nhập cá nhân (TNCN)</Text>
            </View>
            <Text style={[styles.rowValue, styles.deductionValue]}>-{formatCurrency(data.taxDeduction)}</Text>
          </View>
        </View>

        {/* History Switcher Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lịch sử nhận lương</Text>
        </View>

        <View style={styles.historyList}>
          {Object.keys(MOCK_PAYROLL_DATA).map((monthKey) => {
            const hData = MOCK_PAYROLL_DATA[monthKey];
            const isSelected = selectedMonth === monthKey;
            return (
              <TouchableOpacity
                key={monthKey}
                style={[styles.historyCard, isSelected && styles.historyCardSelected]}
                onPress={() => setSelectedMonth(monthKey)}
              >
                <View style={styles.historyLeft}>
                  <View style={[styles.historyMonthIcon, isSelected && styles.historyMonthIconSelected]}>
                    <Text style={[styles.historyMonthText, isSelected && styles.historyMonthTextSelected]}>
                      {monthKey.split("/")[0]}
                    </Text>
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.historyMonthLabel}>{hData.month}</Text>
                    <Text style={styles.historyDateLabel}>Ngày chi trả: {hData.paymentDate}</Text>
                  </View>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.historySalary, isSelected && styles.historySalarySelected]}>
                    {formatCurrency(hData.netSalary)}
                  </Text>
                  <Text style={styles.historyStatus}>Đã chuyển</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  employeeDetails: {
    fontSize: 12,
    color: "#64748B",
  },
  salaryCard: {
    backgroundColor: "#1C75FF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#1C75FF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 16,
  },
  salaryCardLabel: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 8,
  },
  salaryAmount: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  paymentDateText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 12,
    fontWeight: "500",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginVertical: 16,
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  bankText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    marginLeft: 8,
  },
  bankHighlight: {
    fontWeight: "700",
    color: "#FFFFFF",
  },
  downloadButton: {
    backgroundColor: "#0F172A",
    height: 52,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  breakdownCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 24,
  },
  breakdownGroupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  rowSubLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "700",
  },
  incomeValue: {
    color: "#0F172A",
  },
  deductionValue: {
    color: "#EF4444",
  },
  cardDivider2: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  historyList: {
    gap: 12,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  historyCardSelected: {
    borderColor: "#1C75FF",
    backgroundColor: "#F0F7FF",
    borderWidth: 1.5,
  },
  historyLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyMonthIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  historyMonthIconSelected: {
    backgroundColor: "#1C75FF",
  },
  historyMonthText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  historyMonthTextSelected: {
    color: "#FFFFFF",
  },
  historyMonthLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 2,
  },
  historyDateLabel: {
    fontSize: 11,
    color: "#94A3B8",
  },
  historySalary: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 4,
  },
  historySalarySelected: {
    color: "#1C75FF",
  },
  historyStatus: {
    fontSize: 11,
    color: "#22C55E",
    fontWeight: "600",
  },
});
