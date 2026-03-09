import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
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
      // Note: If running on Android Emulator, you might need to change 'localhost' to '10.0.2.2'
      const loginRes = await fetch("http://192.168.2.45:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: employeeId,
          password: password,
        }),
      });

      const loginData = await loginRes.json();
      console.log("Login Status:", loginRes.status);
      console.log("Login Response:", loginData);
      if (loginRes.ok) {
        // Save auth data to storage
        await AsyncStorage.setItem("userToken", loginData.token);
        await AsyncStorage.setItem("userData", JSON.stringify(loginData.data));
        // Using string "true"/"false" for boolean
        await AsyncStorage.setItem(
          "isFaceUpdated",
          String(loginData.is_face_updated),
        );

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
