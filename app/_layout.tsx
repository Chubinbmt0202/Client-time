import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useNavigation,
  usePathname,
  useRouter,
  useSegments,
} from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Alert,
  Image,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function CustomDrawerContent(props: any) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              "userToken",
              "userData",
              "isFaceUpdated",
            ]);
            console.log("Đăng xuất thành công");
          } catch (error) {
            console.error("Lỗi khi xóa storage:", error);
          } finally {
            if (props?.navigation?.closeDrawer) {
              props.navigation.closeDrawer();
            }
            setTimeout(() => {
              router.push("/");
            }, 100);
          }
        },
        style: "destructive",
      },
    ]);
  };

  const menuItems = [
    {
      icon: (
        <MaterialCommunityIcons
          name="home-variant"
          size={24}
          color={pathname === "/(tabs)/home" ? "#1C75FF" : "#475569"}
        />
      ),
      label: "Trang chủ",
      route: "/(tabs)/home",
    },
    {
      icon: (
        <MaterialCommunityIcons
          name="face-recognition"
          size={24}
          color="#475569"
        />
      ),
      label: "Chấm công",
      route: "",
    },
    {
      icon: <MaterialCommunityIcons name="history" size={24} color="#475569" />,
      label: "Lịch sử chấm công",
      route: "/(tabs)/history",
    },
    {
      icon: <Ionicons name="document-text-outline" size={24} color="#475569" />,
      label: "Đơn từ",
      route: "/(tabs)/leave",
    },
    {
      icon: (
        <MaterialCommunityIcons
          name="cash-multiple"
          size={24}
          color="#475569"
        />
      ),
      label: "Bảng lương",
      route: "",
    },
    {
      icon: (
        <MaterialIcons name="notifications-none" size={24} color="#475569" />
      ),
      label: "Thông báo",
      route: "",
      badge: 3,
    },
    {
      icon: <MaterialIcons name="person-outline" size={24} color="#475569" />,
      label: "Cá nhân",
      route: "/(tabs)/profile",
    },
  ];

  return (
    <View style={styles.drawerContainer}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/men/32.jpg" }}
            style={styles.avatar}
          />
          <View style={styles.onlineDot} />
        </View>
        <View style={styles.profileTextContainer}>
          <Text style={styles.profileName}>Nguyễn Văn A</Text>
          <Text style={styles.profileId}>Mã NV: NV001</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>NHÂN VIÊN CHÍNH THỨC</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Menu List */}
      <ScrollView
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item, index) => {
          const isActive = pathname === item.route;
          return (
            <React.Fragment key={index}>
              <TouchableOpacity
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => item.route && router.push(item.route as any)}
              >
                <View style={styles.menuItemLeft}>
                  {item.icon}
                  <Text
                    style={[
                      styles.menuItemLabel,
                      isActive && styles.menuItemLabelActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                {item.badge && (
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Add a divider after certain items if needed to match design groups */}
              {item.label === "Bảng lương" && (
                <View style={styles.dividerSmall} />
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footerContainer}>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={styles.appInfoContainer}>
          <Text style={styles.appVersion}>FACEID ATTENDANCE V2.4.0</Text>
          <View style={styles.linksContainer}>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Chính sách bảo mật</Text>
            </TouchableOpacity>
            <Text style={styles.linkSeparator}> </Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Hỗ trợ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const navigation = useNavigation();
  const segments = useSegments();

  useEffect(() => {
    console.log("=============================================");
    console.log(
      `[Navigation] Screen: ${segments.length > 0 ? segments[segments.length - 1] : "index"}`,
    );
    console.log(`[Navigation] Path: ${pathname}`);
    console.log("=============================================");
  }, [pathname, segments]);

  const inactivityTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const performLogout = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        "userToken",
        "userData",
        "isFaceUpdated",
      ]);
    } catch (error) {
      console.error("Lỗi khi xóa session:", error);
    } finally {
      Alert.alert(
        "Hết phiên đăng nhập",
        "Bạn đã không hoạt động trong một thời gian. Vui lòng đăng nhập lại.",
        [
          {
            text: "OK",
            onPress: () => {
              router.push("/");
            },
          },
        ],
      );
    }
  }, [router]);

  const resetInactivityTimer = React.useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Không áp dụng cho màn hình login
    if (pathname === "/") return;

    // 5 phút = 5 * 60 * 1000 = 300000 ms (đang test dùng 5000 ms)
    inactivityTimerRef.current = setTimeout(performLogout, 300000);
  }, [pathname, performLogout]);

  // Khởi tạo và cleanup timer khi vào ra trang
  useEffect(() => {
    resetInactivityTimer();
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  const resetInactivityTimerRef = React.useRef(resetInactivityTimer);
  useEffect(() => {
    resetInactivityTimerRef.current = resetInactivityTimer;
  }, [resetInactivityTimer]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetInactivityTimerRef.current(); // ← luôn gọi phiên bản mới nhất
        return false;
      },
    }),
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            drawerStyle: {
              width: 300, // chỉnh độ rộng drawer
            },
          }}
        >
          <Drawer.Screen
            name="index"
            options={{
              title: "Đăng nhập",
              headerShown: false,
              swipeEnabled: false,
            }}
          />
          <Drawer.Screen
            name="(tabs)"
            options={{ headerShown: false, swipeEnabled: true }}
          />
          <Drawer.Screen
            name="camera"
            options={{ headerShown: false, swipeEnabled: false }}
          />
        </Drawer>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 50,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  profileId: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4F46E5",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    width: "100%",
  },
  dividerSmall: {
    height: 1,
    backgroundColor: "#F8FAFC",
    width: "80%",
    alignSelf: "center",
    marginVertical: 8,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: "#EEF2FF",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#334155",
    marginLeft: 16,
  },
  menuItemLabelActive: {
    color: "#1C75FF",
    fontWeight: "600",
  },
  badgeContainer: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  footerContainer: {
    paddingBottom: 30,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  logoutText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  appInfoContainer: {
    alignItems: "center",
  },
  appVersion: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 8,
  },
  linksContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerLink: {
    fontSize: 12,
    color: "#94A3B8",
    textDecorationLine: "underline",
  },
  linkSeparator: {
    fontSize: 12,
    color: "#CBD5E1",
  },
});
