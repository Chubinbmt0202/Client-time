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
            status: item.status
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
      case "Late":
      case "Đi muộn":
        return { label: "Đi muộn", color: "#EAB308", bgColor: "#FEF9C3", icon: "time" };
      case "Early":
      case "Về sớm":
        return { label: "Về sớm", color: "#EF4444", bgColor: "#FEE2E2", icon: "walk" };
      case "Missing":
      case "Thiếu giờ ra":
        return { label: "Thiếu giờ ra", color: "#64748B", bgColor: "#F1F5F9", icon: "alert-circle" };
      case "OnTime":
      case "Đúng giờ":
      default:
        return { label: "Đúng giờ", color: "#10B981", bgColor: "#D1FAE5", icon: "checkmark-circle" };
    }
  };

  const renderItem = ({ item }: { item: AttendanceRecord }) => {
    const statusConfig = getStatusConfig(item.status);

    const checkInColor = (item.status === "Late" || item.status === "Đi muộn") ? "#EAB308" : "#0F172A";
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
          </View>
          
          <View style={styles.timeInfoBlock}>
            <Text style={styles.timeLabel}>Giờ ra</Text>
            <Text style={[styles.timeValue, { color: checkOutColor }]}>{formatTime(item.checkOut)}</Text>
          </View>
        </View>
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
});
