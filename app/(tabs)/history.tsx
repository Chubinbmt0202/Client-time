import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
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
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const userStr = await AsyncStorage.getItem("userData");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const userId = user.username;

      const response = await fetch(API_ENDPOINTS.ATTENDANCE(userId));
      if (response.ok) {
        const data = await response.json();
        // Assuming data is an array of records or contains an array
        // We might need to transform it depending on the actual API response
        // For now, assume it's an array for demonstration, or wrap single result if that's all there is
        const records = Array.isArray(data) ? data : (data.history || [data]);
        setHistory(records);
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
        hour12: true,
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

  const renderItem = ({ item }: { item: AttendanceRecord }) => (
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.dateText}>{formatDate(item.date || item.checkIn || "")}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.status === "Late" ? "#FEF2F2" : "#F0FDF4" },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              { color: item.status === "Late" ? "#EF4444" : "#16A34A" },
            ]}
          >
            {item.status === "Late" ? "Muộn" : "Đúng giờ"}
          </Text>
        </View>
      </View>

      <View style={styles.timeInfoRow}>
        <View style={styles.timeInfoBlock}>
          <View style={styles.timeLabelRow}>
            <Ionicons name="enter-outline" size={16} color="#1C75FF" />
            <Text style={styles.timeLabel}>Vào</Text>
          </View>
          <Text style={styles.timeValue}>{formatTime(item.checkIn)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.timeInfoBlock}>
          <View style={styles.timeLabelRow}>
            <Ionicons name="exit-outline" size={16} color="#64748B" />
            <Text style={styles.timeLabel}>Ra</Text>
          </View>
          <Text style={styles.timeValue}>{formatTime(item.checkOut)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lịch sử chấm công</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1C75FF" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyText}>Chưa có dữ liệu chấm công</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  historyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    textTransform: "capitalize",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  timeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInfoBlock: {
    flex: 1,
  },
  timeLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: "#94A3B8",
  },
  timeValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 16,
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
