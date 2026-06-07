import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import { NetworkInfo } from 'react-native-network-info';
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync, savePushTokenToBackend } from "../utils/notifications";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { API_ENDPOINTS } from "../constants/api";
import { styles } from "./index.styles";

export default function LoginScreen() {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLogged, setKeepLogged] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!employeeId || !password) {
      Alert.alert("Lỗi", "Vui lòng nhập Employee ID và Password");
      return;
    }

    setIsLoading(true);
    try {
      // Lấy thông tin WiFi BSSID
      let wifi_bssid = "";
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const bssid = await NetworkInfo.getBSSID();
          wifi_bssid = bssid || "";
          console.log(`\n[LOGIN ATTEMPT - MOBILE] BSSID: ${wifi_bssid}`);
        }
      } catch (e) {
        console.error("Lỗi lấy thông tin WiFi:", e);
      }

      // Note: If running on Android Emulator, you might need to change 'localhost' to '10.0.2.2'
      const loginRes = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: employeeId,
          password: password,
          wifi_bssid: wifi_bssid,
          device_info: {
            model_name: Device.modelName || "Thiết bị không xác định",
            os_name: Device.osName || "Hệ điều hành không rõ",
            os_version: Device.osVersion || "Phiên bản không rõ"
          }
        }),
      });

      const loginData = await loginRes.json();
      console.log("Login Status:", loginRes.status);
      console.log("Login Response:", loginData);
      if (loginRes.ok) {
        // Fetch dashboard data
        const id_nhan_vien = loginData.data.id_nhan_vien;
        let attendance_history = [];
        try {
          const dashboardRes = await fetch(API_ENDPOINTS.DASHBOARD(id_nhan_vien));
          const dashboardData = await dashboardRes.json();
          if (dashboardRes.ok && dashboardData.success) {
             // Map backend format to frontend format
             attendance_history = dashboardData.data.recent_attendance_history.map((record: any) => ({
                log_date: record.gio_vao,
                check_in_time: record.gio_vao,
                check_out_time: record.gio_ra,
                note: record.ghi_chu,
                status: record.gio_ra ? "checked_out" : "present"
             }));
          }
        } catch (e) {
          console.error("Lỗi lấy dashboard:", e);
        }

        // Save auth data to storage
        const userDataToSave = {
          ...loginData.data,
          id: id_nhan_vien,
          is_face_updated: loginData.is_face_updated,
          attendance_history: attendance_history
        };
        await AsyncStorage.setItem("userData", JSON.stringify(userDataToSave));
        await AsyncStorage.setItem("isFaceUpdated", String(loginData.is_face_updated));

        // Đăng ký quyền và lưu Expo Push Token
        try {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            await savePushTokenToBackend(id_nhan_vien, pushToken);
          }
        } catch (pushErr) {
          console.error("Lỗi đăng ký push token khi đăng nhập:", pushErr);
        }

        Alert.alert("Thành công", "Đăng nhập thành công!");
        // @ts-ignore
        router.replace("/(tabs)/home");
      } else {
        Alert.alert(
          "Đăng nhập thất bại",
          loginData.message || "Kiểm tra lại thông tin đăng nhập",
        );
      }
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Lỗi kết nối", "Không thể kết nối đến server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <StatusBar style="dark" />

            {/* Logo Section */}
            <View style={styles.logoContainer}>
              <View style={styles.iconWrapper}>
                <Ionicons name="happy-outline" size={40} color="#1C75FF" />
              </View>
              <Text style={styles.appName}>FaceCheck</Text>
              <Text style={styles.subtitle}>
                Efficient attendance, simplified.
              </Text>
            </View>

            {/* Login Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Employee ID</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="badge-account-horizontal-outline"
                    size={20}
                    color="#94A3B8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="EMP-0000"
                    placeholderTextColor="#94A3B8"
                    value={employeeId}
                    onChangeText={setEmployeeId}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.passwordHeader}>
                  <Text style={styles.label}>Password</Text>
                  <TouchableOpacity>
                    <Text style={styles.forgotPassword}>Forgot?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputContainer}>
                  <Feather
                    name="lock"
                    size={20}
                    color="#94A3B8"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Feather
                      name={showPassword ? "eye" : "eye-off"}
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setKeepLogged(!keepLogged)}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      keepLogged && styles.checkboxBoxActive,
                    ]}
                  >
                    {keepLogged && (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>Keep me logged in</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.signInButton}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.signInButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New employee? </Text>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Contact HR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
