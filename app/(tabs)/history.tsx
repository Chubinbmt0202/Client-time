import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "../../constants/api";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  hasOt?: boolean;
  otStartTime?: string | null;
  otExpectedEndTime?: string | null;
  otStatus?: string | null;
  otCheckIn?: string | null;
  otCheckOut?: string | null;
  urlAnhVao?: string | null;
  urlAnhRa?: string | null;
  explanation?: any;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = [2022, 2023, 2024, 2025, 2026, 2027];

  const fetchHistory = async () => {
    try {
      const userStr = await AsyncStorage.getItem("userData");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const userId = user.id_nhan_vien || user.id;

      if (!userId) {
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.ATTENDANCE_HISTORY(userId));
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const records = data.data.map((item: any, index: number) => ({
            id: index.toString(),
            date: item.log_date,
            checkIn: item.check_in_time,
            checkOut: item.check_out_time,
            status: item.status,
            hasOt: item.has_ot,
            otStartTime: item.ot_start_time,
            otExpectedEndTime: item.ot_expected_end_time,
            otStatus: item.ot_status,
            otCheckIn: item.ot_check_in_time,
            otCheckOut: item.ot_check_out_time,
            urlAnhVao: item.url_anh_vao,
            urlAnhRa: item.url_anh_ra,
            explanation: item.explanation
          }));
          setHistory(records);
        }
      }
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử chấm công:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return "--:--";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (e) {
      return "--:--";
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (e) {
      return isoString;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "late":
      case "Late":
      case "Đi muộn":
        return { label: "Đi muộn", color: "#EAB308", bgColor: "#FEF9C3", icon: "time" };
      case "Early":
      case "Về sớm":
        return { label: "Về sớm", color: "#EF4444", bgColor: "#FEE2E2", icon: "walk" };
      case "Missing":
      case "Thiếu giờ ra":
        return { label: "Thiếu giờ ra", color: "#64748B", bgColor: "#F1F5F9", icon: "alert-circle" };
      case "present":
      case "OnTime":
      case "Đúng giờ":
      default:
        return { label: "Đúng giờ", color: "#10B981", bgColor: "#D1FAE5", icon: "checkmark-circle" };
    }
  };

  const renderItem = ({ item }: { item: AttendanceRecord }) => {
    const statusConfig = getStatusConfig(item.status);

    const checkInColor = (item.status === "late" || item.status === "Late" || item.status === "Đi muộn") ? "#EAB308" : "#0F172A";
    const checkOutColor = (item.status === "Missing" || item.status === "Thiếu giờ ra" || !item.checkOut) 
      ? "#94A3B8" 
      : (item.status === "Early" || item.status === "Về sớm" ? "#EF4444" : "#0F172A");

    return (
      <View style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.dateText}>{formatDate(item.date || item.checkIn || "")}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
              <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} style={{ marginRight: 6 }} />
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>
          <Image 
            source={{ uri: "https://i.pravatar.cc/150?img=47" }}
            style={styles.avatarImage}
          />
        </View>

        <View style={styles.timeInfoRow}>
          <View style={styles.timeInfoBlock}>
            <Text style={styles.timeLabel}>Giờ vào</Text>
            <Text style={[styles.timeValue, { color: checkInColor }]}>{formatTime(item.checkIn)}</Text>
            {item.urlAnhVao && (
              <Image source={{ uri: item.urlAnhVao }} style={styles.proofImage} />
            )}
          </View>
          
          <View style={styles.timeInfoBlock}>
            <Text style={styles.timeLabel}>Giờ ra</Text>
            <Text style={[styles.timeValue, { color: checkOutColor }]}>{formatTime(item.checkOut)}</Text>
            {item.urlAnhRa && (
              <Image source={{ uri: item.urlAnhRa }} style={styles.proofImage} />
            )}
          </View>
        </View>

        {item.hasOt && (
          <View style={styles.otContainer}>
            <View style={styles.otHeaderRow}>
              <Ionicons name="time-outline" size={16} color="#4F46E5" style={{ marginRight: 6 }} />
              <Text style={styles.otTitle}>
                Tăng ca: {item.otStartTime?.substring(0, 5)} - {item.otExpectedEndTime?.substring(0, 5)}
              </Text>
              <Text style={[styles.otStatusText, { color: item.otStatus === 'DA_DUYET' ? '#10B981' : item.otStatus === 'CHO_DUYET' ? '#F59E0B' : '#EF4444' }]}>
                {item.otStatus === 'DA_DUYET' ? 'Đã duyệt' : item.otStatus === 'CHO_DUYET' ? 'Chờ duyệt' : 'Từ chối'}
              </Text>
            </View>
            {item.otStatus === 'DA_DUYET' && (
              <View style={[styles.timeInfoRow, { marginTop: 10 }]}>
                <View style={styles.timeInfoBlock}>
                  <Text style={styles.timeLabel}>Vào tăng ca</Text>
                  <Text style={styles.timeValue}>{formatTime(item.otCheckIn ?? null)}</Text>
                </View>
                <View style={styles.timeInfoBlock}>
                  <Text style={styles.timeLabel}>Ra tăng ca</Text>
                  <Text style={styles.timeValue}>{formatTime(item.otCheckOut ?? null)}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const filteredHistory = history.filter((item) => {
    const d = new Date(item.date || item.checkIn || "");
    if (!isNaN(d.getTime())) {
       return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
    }
    return true;
  });

  const calculateHours = (inStr: string | null, outStr: string | null) => {
    if (!inStr || !outStr) return 0;
    try {
       const inD = new Date(inStr);
       const outD = new Date(outStr);
       const diff = (outD.getTime() - inD.getTime()) / (1000 * 60 * 60);
       return diff > 0 ? diff : 0;
    } catch {
       return 0;
    }
  };

  const totalNormalShifts = filteredHistory.filter(i => i.checkIn).length;
  const totalOtShifts = filteredHistory.filter(i => i.otCheckIn).length;
  const totalNormalHours = filteredHistory.reduce((sum, item) => sum + calculateHours(item.checkIn, item.checkOut), 0);
  const totalOtHours = filteredHistory.reduce((sum, item) => sum + calculateHours(item.otCheckIn, item.otCheckOut), 0);
  const lateApproved = filteredHistory.filter(i => (i.status === 'late' || i.status === 'Late' || i.status === 'Đi muộn') && i.explanation?.trang_thai === true).length;
  const lateUnapproved = filteredHistory.filter(i => (i.status === 'late' || i.status === 'Late' || i.status === 'Đi muộn') && i.explanation?.trang_thai !== true).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử Chấm công</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {months.map((m) => (
            <TouchableOpacity 
              key={`M${m}`} 
              style={[styles.filterChip, selectedMonth === m && styles.filterChipActive]}
              onPress={() => setSelectedMonth(m)}
            >
              <Text style={[styles.filterChipText, selectedMonth === m && styles.filterChipTextActive]}>
                Tháng {m}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.filterDivider} />
          {years.map((y) => (
            <TouchableOpacity 
              key={`Y${y}`}
              style={[styles.filterChip, selectedYear === y && styles.filterChipActive]}
              onPress={() => setSelectedYear(y)}
            >
              <Text style={[styles.filterChipText, selectedYear === y && styles.filterChipTextActive]}>
                {y}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Ca thường</Text>
            <Text style={styles.summaryValue}>{totalNormalShifts}</Text>
            <Text style={styles.summarySub}>{totalNormalHours.toFixed(1)} giờ</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Tăng ca</Text>
            <Text style={styles.summaryValue}>{totalOtShifts}</Text>
            <Text style={styles.summarySub}>{totalOtHours.toFixed(1)} giờ</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Trễ có phép</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>{lateApproved}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Trễ không phép</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{lateUnapproved}</Text>
          </View>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1C75FF" />
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>Chưa có dữ liệu trong khoảng thời gian này</Text>
            </View>
          }
        />
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
  },
  filterSection: {
    backgroundColor: "#FFFFFF",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  filterChipActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  filterChipTextActive: {
    color: "#3B82F6",
  },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 4,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: "#F8FAFC",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  summarySub: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  listContent: {
    padding: 20,
    gap: 16,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    textTransform: "capitalize",
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 16,
  },
  timeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInfoBlock: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 6,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#94A3B8",
  },
  otContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  otHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  otTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
    flex: 1,
  },
  otStatusText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  proofImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginTop: 8,
  },
});
