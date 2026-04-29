import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserData {
  ho_va_ten: string;
  id_nhan_vien: string;
  ten_vai_tro: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedData = await AsyncStorage.getItem("userData");
        if (storedData) {
          setUserData(JSON.parse(storedData));
        }
      } catch (error) {
        console.error("Lỗi khi tải thông tin user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, []);

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "userToken",
            "userData",
            "isFaceUpdated",
          ]);
          router.replace("/");
        },
      },
    ]);
  };

  const menuGroups = [
    {
      title: "Tài khoản",
      items: [
        { icon: "account-outline", label: "Thông tin cá nhân", color: "#1C75FF" },
        { icon: "face-recognition", label: "Cập nhật khuôn mặt", color: "#8B5CF6", route: "/face-registration" },
        { icon: "shield-lock-outline", label: "Bảo mật & Mật khẩu", color: "#10B981" },
      ],
    },
    {
      title: "Khác",
      items: [
        { icon: "bell-outline", label: "Cài đặt thông báo", color: "#F59E0B" },
        { icon: "help-circle-outline", label: "Trợ giúp & Hỗ trợ", color: "#64748B" },
        { icon: "information-outline", label: "Về ứng dụng", color: "#64748B" },
      ],
    },
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1C75FF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Background */}
        <View style={styles.headerBackground}>
          <Text style={styles.headerTitle}>Hồ sơ của tôi</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
              style={styles.avatar}
            />
            <View style={styles.editAvatarBtn}>
              <MaterialIcons name="camera-alt" size={14} color="#FFF" />
            </View>
          </View>
          <Text style={styles.userName}>
            {userData?.ho_va_ten || "Người dùng"}
          </Text>
          <Text style={styles.userId}>
            Mã NV: {userData?.id_nhan_vien || "NV000"}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {userData?.ten_vai_tro || "Nhân viên"}
            </Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Ngày phép</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Chuyên cần</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Khen thưởng</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuWrapper}>
          {menuGroups.map((group, groupIndex) => (
            <View key={groupIndex} style={styles.menuGroup}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.groupCard}>
                {group.items.map((item, index) => (
                  <React.Fragment key={index}>
                    <TouchableOpacity 
                      style={styles.menuRow}
                      onPress={() => item.route && router.push(item.route as any)}
                    >
                      <View style={[styles.iconBox, { backgroundColor: item.color + "15" }]}>
                        <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
                      </View>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                    {index < group.items.length - 1 && <View style={styles.rowDivider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={22} color="#EF4444" />
            <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  headerBackground: {
    backgroundColor: "#1C75FF",
    height: 120,
    paddingTop: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: -40,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  editAvatarBtn: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#1C75FF",
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 10,
  },
  roleBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    color: "#1C75FF",
    fontSize: 12,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#F1F5F9",
    height: "80%",
    alignSelf: "center",
  },
  menuWrapper: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  menuGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 10,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  groupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#334155",
  },
  rowDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 66,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
  },
  logoutText: {
    color: "#EF4444",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
});
