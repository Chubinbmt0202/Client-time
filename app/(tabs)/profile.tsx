import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface UserData {
  ho_va_ten?: string;
  full_name?: string;
  id_nhan_vien?: string;
  id?: string;
  ten_vai_tro?: string;
  vai_tro?: string;
  role?: string;
  hinh_anh?: string;
  so_dien_thoai?: string;
  ngay_sinh?: string;
  dia_chi?: string;
  email?: string;
  ten_phong_ban?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // States quản lý hiển thị các Modal
  const [modalType, setModalType] = useState<"none" | "personal" | "security" | "notifications" | "support" | "about">("none");

  // Form states cho thông tin cá nhân
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDob, setEditDob] = useState("");

  // Form states cho đổi mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // States cho cài đặt thông báo
  const [notiAttendance, setNotiAttendance] = useState(true);
  const [notiLeave, setNotiLeave] = useState(true);
  const [notiOvertime, setNotiOvertime] = useState(true);
  const [notiSystem, setNotiSystem] = useState(false);

  const fetchUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem("userData");
      if (storedData) {
        const parsed: UserData = JSON.parse(storedData);
        setUserData(parsed);
        // Điền dữ liệu vào form chỉnh sửa
        setEditName(parsed.ho_va_ten || parsed.full_name || "");
        setEditPhone(parsed.so_dien_thoai || "0901234567");
        setEditAddress(parsed.dia_chi || "123 Nguyễn Văn Cừ, Quận 5, TP.HCM");
        setEditEmail(parsed.email || `${parsed.id_nhan_vien?.toLowerCase() || "nv001"}@company.com`);
        setEditDob(parsed.ngay_sinh ? new Date(parsed.ngay_sinh).toLocaleDateString("vi-VN") : "15/05/1995");
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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

  // Lưu thông tin cá nhân mới
  const handleSavePersonalInfo = async () => {
    if (!editName.trim()) {
      Alert.alert("Lỗi", "Họ và tên không được để trống.");
      return;
    }

    setIsLoading(true);
    try {
      const updatedData = {
        ...userData,
        ho_va_ten: editName.trim(),
        full_name: editName.trim(),
        so_dien_thoai: editPhone.trim(),
        dia_chi: editAddress.trim(),
        email: editEmail.trim(),
      };
      
      await AsyncStorage.setItem("userData", JSON.stringify(updatedData));
      setUserData(updatedData);
      setModalType("none");
      
      Alert.alert("Thành công", "Đã cập nhật thông tin cá nhân của bạn.");
    } catch (err) {
      console.error("Lỗi khi lưu thông tin cá nhân:", err);
      Alert.alert("Thất bại", "Không thể lưu thông tin. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Đổi mật khẩu
  const handleUpdatePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ tất cả các trường mật khẩu.");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu mới phải chứa ít nhất 6 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới và mật khẩu xác nhận không trùng khớp.");
      return;
    }

    setUpdatingPassword(true);
    // Giả lập thay đổi mật khẩu
    setTimeout(() => {
      setUpdatingPassword(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setModalType("none");
      Alert.alert("Thành công", "Mật khẩu của bạn đã được thay đổi thành công.");
    }, 1500);
  };

  const menuGroups = [
    {
      title: "Tài khoản",
      items: [
        { icon: "account-outline", label: "Thông tin cá nhân", color: "#1C75FF", action: () => setModalType("personal") },
        { icon: "face-recognition", label: "Cập nhật khuôn mặt", color: "#8B5CF6", action: () => router.push("/face-registration") },
        { icon: "shield-lock-outline", label: "Bảo mật & Mật khẩu", color: "#10B981", action: () => setModalType("security") },
      ],
    },
    {
      title: "Khác",
      items: [
        { icon: "bell-outline", label: "Cài đặt thông báo", color: "#F59E0B", action: () => setModalType("notifications") },
        { icon: "help-circle-outline", label: "Trợ giúp & Hỗ trợ", color: "#64748B", action: () => setModalType("support") },
        { icon: "information-outline", label: "Về ứng dụng", color: "#64748B", action: () => setModalType("about") },
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
              source={{ uri: userData?.hinh_anh || "https://randomuser.me/api/portraits/men/32.jpg" }}
              style={styles.avatar}
            />
            <TouchableOpacity 
              style={styles.editAvatarBtn}
              onPress={() => Alert.alert("Thông báo", "Tính năng thay đổi ảnh đại diện đang được phát triển.")}
            >
              <MaterialIcons name="camera-alt" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>
            {userData?.ho_va_ten || userData?.full_name || "Người dùng"}
          </Text>
          <Text style={styles.userId}>
            Mã NV: {userData?.id_nhan_vien || userData?.id || "NV000"}
          </Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {userData?.ten_vai_tro || userData?.role || "Nhân viên"}
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
                      onPress={item.action}
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

      {/* ========================================================================= */}
      // MODAL 1: THÔNG TIN CÁ NHÂN CHI TIẾT
      {/* ========================================================================= */}
      <Modal
        visible={modalType === "personal"}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalType("none")}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông tin cá nhân</Text>
              <TouchableOpacity onPress={() => setModalType("none")}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={styles.inputLabel}>Họ và tên</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nhập họ và tên..."
              />

              <Text style={styles.inputLabel}>Mã nhân viên (Không thể sửa)</Text>
              <TextInput
                style={[styles.textInput, styles.disabledInput]}
                value={userData?.id_nhan_vien || userData?.id}
                editable={false}
              />

              <Text style={styles.inputLabel}>Phòng ban</Text>
              <TextInput
                style={[styles.textInput, styles.disabledInput]}
                value={userData?.ten_phong_ban || "Phòng Kỹ Thuật"}
                editable={false}
              />

              <Text style={styles.inputLabel}>Ngày sinh</Text>
              <TextInput
                style={[styles.textInput, styles.disabledInput]}
                value={editDob}
                editable={false}
              />

              <Text style={styles.inputLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.textInput}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="Nhập số điện thoại..."
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Nhập email..."
              />

              <Text style={styles.inputLabel}>Địa chỉ thường trú</Text>
              <TextInput
                style={[styles.textInput, { height: 70 }]}
                value={editAddress}
                onChangeText={setEditAddress}
                multiline={true}
                numberOfLines={2}
                placeholder="Nhập địa chỉ..."
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.btnSecondary, { flex: 1 }]} 
                onPress={() => setModalType("none")}
              >
                <Text style={styles.btnSecondaryText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.btnPrimary, { flex: 1, marginLeft: 12 }]} 
                onPress={handleSavePersonalInfo}
              >
                <Text style={styles.btnPrimaryText}>Lưu thay đổi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      // MODAL 2: BẢO MẬT & MẬT KHẨU
      {/* ========================================================================= */}
      <Modal
        visible={modalType === "security"}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalType("none")}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity onPress={() => setModalType("none")}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
              <TextInput
                style={styles.textInput}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={true}
                placeholder="Nhập mật khẩu hiện tại..."
              />

              <Text style={styles.inputLabel}>Mật khẩu mới</Text>
              <TextInput
                style={styles.textInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={true}
                placeholder="Tối thiểu 6 ký tự..."
              />

              <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
              <TextInput
                style={styles.textInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={true}
                placeholder="Nhập lại mật khẩu mới..."
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.btnSecondary, { flex: 1 }]} 
                onPress={() => setModalType("none")}
              >
                <Text style={styles.btnSecondaryText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.btnPrimary, { flex: 1, marginLeft: 12 }]} 
                onPress={handleUpdatePassword}
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Đổi mật khẩu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ========================================================================= */}
      // MODAL 3: CÀI ĐẶT THÔNG BÁO
      {/* ========================================================================= */}
      <Modal
        visible={modalType === "notifications"}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalType("none")}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cài đặt thông báo</Text>
              <TouchableOpacity onPress={() => setModalType("none")}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={styles.switchLabel}>Thông báo chấm công</Text>
                  <Text style={styles.switchSubLabel}>Báo động khi chấm công thành công / đi trễ</Text>
                </View>
                <Switch
                  value={notiAttendance}
                  onValueChange={setNotiAttendance}
                  trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                  thumbColor={notiAttendance ? "#1C75FF" : "#CBD5E1"}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={styles.switchLabel}>Thông báo nghỉ phép</Text>
                  <Text style={styles.switchSubLabel}>Cập nhật trạng thái duyệt đơn xin phép nghỉ</Text>
                </View>
                <Switch
                  value={notiLeave}
                  onValueChange={setNotiLeave}
                  trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                  thumbColor={notiLeave ? "#1C75FF" : "#CBD5E1"}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={styles.switchLabel}>Thông báo tăng ca (OT)</Text>
                  <Text style={styles.switchSubLabel}>Cập nhật trạng thái phê duyệt đơn OT</Text>
                </View>
                <Switch
                  value={notiOvertime}
                  onValueChange={setNotiOvertime}
                  trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                  thumbColor={notiOvertime ? "#1C75FF" : "#CBD5E1"}
                />
              </View>

              <View style={styles.switchRow}>
                <View style={styles.switchLabelCol}>
                  <Text style={styles.switchLabel}>Tin tức hệ thống</Text>
                  <Text style={styles.switchSubLabel}>Các sự kiện, thông báo chung từ công ty</Text>
                </View>
                <Switch
                  value={notiSystem}
                  onValueChange={setNotiSystem}
                  trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                  thumbColor={notiSystem ? "#1C75FF" : "#CBD5E1"}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.btnPrimary, { width: "100%" }]} 
                onPress={() => {
                  setModalType("none");
                  Alert.alert("Thành công", "Cài đặt thông báo đã được lưu lại.");
                }}
              >
                <Text style={styles.btnPrimaryText}>Đồng ý</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      // MODAL 4: TRỢ GIÚP & HỖ TRỢ
      {/* ========================================================================= */}
      <Modal
        visible={modalType === "support"}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalType("none")}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trợ giúp & Hỗ trợ</Text>
              <TouchableOpacity onPress={() => setModalType("none")}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.supportDesc}>
                Nếu bạn gặp bất kỳ vấn đề gì liên quan đến phần cứng chấm công, lỗi app hoặc sai lệch giờ công, xin liên hệ bộ phận Kỹ thuật / Nhân sự qua các kênh dưới đây:
              </Text>

              <View style={styles.supportCard}>
                <View style={styles.supportItem}>
                  <Ionicons name="call-outline" size={20} color="#1C75FF" />
                  <Text style={styles.supportLabel}>Hotline Nhân sự:</Text>
                  <Text style={styles.supportValue}>1900 6868 (Ext 102)</Text>
                </View>
                
                <View style={[styles.supportItem, { marginTop: 16 }]}>
                  <Ionicons name="mail-outline" size={20} color="#1C75FF" />
                  <Text style={styles.supportLabel}>Email Hỗ trợ:</Text>
                  <Text style={styles.supportValue}>it.support@company.com</Text>
                </View>

                <View style={[styles.supportItem, { marginTop: 16 }]}>
                  <Ionicons name="globe-outline" size={20} color="#1C75FF" />
                  <Text style={styles.supportLabel}>Website Portal:</Text>
                  <Text style={styles.supportValue}>portal.company.com</Text>
                </View>
              </View>

              <Text style={styles.workingTimeText}>
                * Thời gian hỗ trợ trực tuyến: 8:00 - 17:30 (Thứ 2 - Thứ 6)
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.btnPrimary, { width: "100%" }]} 
                onPress={() => setModalType("none")}
              >
                <Text style={styles.btnPrimaryText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      // MODAL 5: VỀ ỨNG DỤNG
      {/* ========================================================================= */}
      <Modal
        visible={modalType === "about"}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalType("none")}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Về ứng dụng</Text>
              <TouchableOpacity onPress={() => setModalType("none")}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={[styles.modalBody, { alignItems: "center" }]}>
              <View style={styles.appLogoWrapper}>
                <MaterialCommunityIcons name="face-recognition" size={60} color="#1C75FF" />
              </View>
              
              <Text style={styles.appName}>FaceID Attendance Client</Text>
              <Text style={styles.appVersion}>Phiên bản 2.4.0 (Build 240609)</Text>
              
              <View style={styles.infoBlockText}>
                <Text style={styles.aboutParagraph}>
                  Hệ thống chấm công bằng khuôn mặt (FaceID) ứng dụng công nghệ AI trích xuất vector đặc trưng DeepFace. Giải pháp tích hợp nhận diện vị trí WiFi / GPS văn phòng, đăng ký nghỉ phép và tăng ca tự động đồng bộ thời gian thực.
                </Text>
                <Text style={styles.aboutCopyright}>
                  © 2026 Developer Team. All rights reserved.
                </Text>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.btnPrimary, { width: "100%" }]} 
                onPress={() => setModalType("none")}
              >
                <Text style={styles.btnPrimaryText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  modalBody: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 15,
    color: "#0F172A",
  },
  disabledInput: {
    color: "#94A3B8",
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  btnPrimary: {
    backgroundColor: "#1C75FF",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  btnSecondary: {
    backgroundColor: "#F1F5F9",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  btnSecondaryText: {
    color: "#475569",
    fontSize: 15,
    fontWeight: "600",
  },
  // Switch & Notification styles
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  switchLabelCol: {
    flex: 1,
    paddingRight: 16,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 4,
  },
  switchSubLabel: {
    fontSize: 12,
    color: "#64748B",
  },
  // Support Styles
  supportDesc: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 20,
  },
  supportCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  supportLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginLeft: 10,
    flex: 1,
  },
  supportValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  workingTimeText: {
    fontSize: 11,
    color: "#94A3B8",
    fontStyle: "italic",
    marginTop: 16,
  },
  // About Styles
  appLogoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 8,
  },
  aboutParagraph: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  aboutCopyright: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    fontWeight: "500",
  },
  infoBlockText: {
    paddingHorizontal: 10,
    marginTop: 12,
  },
});
