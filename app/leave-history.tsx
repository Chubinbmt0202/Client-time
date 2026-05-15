import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "../constants/api";

const FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Đang chờ" },
  { id: "approved", label: "Đã duyệt" },
  { id: "rejected", label: "Từ chối" },
];

export default function LeaveHistoryScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaveHistory = async () => {
    try {
      const userDataStr = await AsyncStorage.getItem("userData");
      if (!userDataStr) return;

      const userData = JSON.parse(userDataStr);
      const employeeId = userData.id_nhan_vien || "NV897728";

      const response = await fetch(API_ENDPOINTS.LEAVE_HISTORY(employeeId));
      const result = await response.json();

      console.log(`=== Tải dữ liệu cho NV: ${employeeId} ===`);
      console.log(JSON.stringify(result, null, 4));

      if (result.success) {
        setLeaveRequests(result.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy lịch sử nghỉ phép:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchLeaveHistory();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaveHistory();
  }, []);

  const filteredData = leaveRequests.filter((item) => {
    if (activeFilter === "all") return true;
    const statusMap: any = {
      pending: null,
      approved: true,
      rejected: false,
    };
    return item.trang_thai === statusMap[activeFilter];
  });

  const getStatusConfig = (status: boolean | null) => {
    if (status === null)
      return { label: "ĐANG CHỜ", bg: "#F1F5F9", color: "#475569" };
    if (status === true)
      return { label: "ĐÃ DUYỆT", bg: "#22C55E", color: "#FFFFFF" };
    if (status === false)
      return { label: "TỪ CHỐI", bg: "#EF4444", color: "#FFFFFF" };
    return { label: "KHÔNG RÕ", bg: "#F1F5F9", color: "#475569" };
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${diff} ngày`;
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusConfig = getStatusConfig(item.trang_thai);
    const icon = item.id_loai_phep === "LP001" ? "umbrella" : item.id_loai_phep === "LP002" ? "medical-bag" : "calendar-remove";
    const iconBg = item.id_loai_phep === "LP001" ? "#DBEAFE" : item.id_loai_phep === "LP002" ? "#D1FAE5" : "#FEE2E2";
    const iconColor = item.id_loai_phep === "LP001" ? "#2563EB" : item.id_loai_phep === "LP002" ? "#059669" : "#991B1B";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
              <MaterialCommunityIcons name={icon as any} size={24} color={iconColor} />
            </View>
            <View style={styles.titleBox}>
              <Text style={styles.cardTitle}>{item.ten_phep}</Text>
              <Text style={styles.cardSubtitle}>Tạo ngày {formatDate(item.ngay_tao)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardBody}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Thời gian</Text>
            <Text style={styles.infoValue}>
              {formatDate(item.ngay_bat_dau)} - {formatDate(item.ngay_ket_thuc)}
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Số ngày</Text>
            <Text style={styles.infoValue}>{calculateDays(item.ngay_bat_dau, item.ngay_ket_thuc)}</Text>
          </View>
        </View>
        {item.ghi_chu && (
          <View style={{ marginTop: 12 }}>
            <Text style={[styles.infoLabel, { marginBottom: 2 }]}>Ghi chú:</Text>
            <Text style={[styles.infoValue, { fontSize: 13, color: "#64748B", fontStyle: "italic" }]}>
              "{item.ghi_chu}"
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push("/(tabs)/home")}>
          <Ionicons name="arrow-back" size={24} color="#1C75FF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn xin nghỉ phép</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterButton, isActive && styles.filterButtonActive]}
                onPress={() => setActiveFilter(filter.id)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#1C75FF" />
          <Text style={{ marginTop: 12, color: "#64748B" }}>Đang tải danh sách...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id_don_xin_nghi}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#1C75FF"]} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 100 }}>
              <MaterialCommunityIcons name="calendar-blank" size={64} color="#CBD5E1" />
              <Text style={{ marginTop: 16, color: "#64748B", fontSize: 16 }}>Không có đơn nghỉ phép nào</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => router.push("/(tabs)/leave")}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
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
    fontWeight: "600",
    color: "#1C75FF",
  },
  filterContainer: {
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  filterButtonActive: {
    backgroundColor: "#0275D8",
    borderColor: "#0275D8",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  filterTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Để không bị che bởi FAB
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  titleBox: {
    marginLeft: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 16,
  },
  cardBody: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  infoBlock: {
    marginRight: 40,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#0F172A",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});
