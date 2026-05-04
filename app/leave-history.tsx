import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Dữ liệu mẫu (Mock data)
const MOCK_LEAVE_REQUESTS = [
  {
    id: "1",
    type: "annual",
    title: "Nghỉ phép năm",
    createdAt: "12/10/2023",
    dateRange: "15/10 - 17/10",
    days: "3 ngày",
    status: "pending",
  },
  {
    id: "2",
    type: "sick",
    title: "Nghỉ ốm",
    createdAt: "05/09/2023",
    dateRange: "06/09 - 06/09",
    days: "1 ngày",
    status: "approved",
  },
  {
    id: "3",
    type: "personal",
    title: "Nghỉ việc riêng",
    createdAt: "20/08/2023",
    dateRange: "25/08 - 26/08",
    days: "2 ngày",
    status: "rejected",
  },
];

const FILTERS = [
  { id: "all", label: "Tất cả" },
  { id: "pending", label: "Đang chờ" },
  { id: "approved", label: "Đã duyệt" },
  { id: "rejected", label: "Từ chối" },
];

export default function LeaveHistoryScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredData = MOCK_LEAVE_REQUESTS.filter((item) => {
    if (activeFilter === "all") return true;
    return item.status === activeFilter;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "ĐANG CHỜ", bg: "#F1F5F9", color: "#475569" };
      case "approved":
        return { label: "ĐÃ DUYỆT", bg: "#16A34A", color: "#FFFFFF" };
      case "rejected":
        return { label: "TỪ CHỐI", bg: "#FCA5A5", color: "#991B1B" };
      default:
        return { label: "KHÔNG RÕ", bg: "#F1F5F9", color: "#475569" };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "annual":
        return { icon: "umbrella", bg: "#DBEAFE", color: "#2563EB" };
      case "sick":
        return { icon: "medical-bag", bg: "#16A34A", color: "#FFFFFF" };
      case "personal":
        return { icon: "calendar-remove", bg: "#FEE2E2", color: "#991B1B" };
      default:
        return { icon: "calendar", bg: "#F1F5F9", color: "#475569" };
    }
  };

  const renderItem = ({ item }: { item: typeof MOCK_LEAVE_REQUESTS[0] }) => {
    const statusConfig = getStatusConfig(item.status);
    const typeConfig = getTypeConfig(item.type);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={[styles.iconBox, { backgroundColor: typeConfig.bg }]}>
              <MaterialCommunityIcons name={typeConfig.icon as any} size={24} color={typeConfig.color} />
            </View>
            <View style={styles.titleBox}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardSubtitle}>Tạo ngày {item.createdAt}</Text>
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
            <Text style={styles.infoValue}>{item.dateRange}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Số ngày</Text>
            <Text style={styles.infoValue}>{item.days}</Text>
          </View>
        </View>
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
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

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
