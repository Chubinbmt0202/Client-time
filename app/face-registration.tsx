import React, { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

import { FocusFrame } from "../components/FaceRegistration/FocusFrame";
import { GuideOverlay } from "../components/FaceRegistration/GuideOverlay";
import { LoadingOverlay } from "../components/FaceRegistration/LoadingOverlay";
import { useFaceRegistration } from "../hooks/useFaceRegistration";

export default function FaceRegistrationScreen() {
  const router = useRouter();
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null!);
  const isFocused = useIsFocused();

  const {
    step,
    isProcessing,
    capturedImages,
    statusMessage,
    frameProcessor,
    resetRegistration,
  } = useFaceRegistration(cameraRef);

  useFocusEffect(
    React.useCallback(() => {
      resetRegistration();
    }, [])
  );

  if (device == null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Không tìm thấy camera</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
          <Text style={styles.permissionText}>Cấp quyền Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        photo={true}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />

      <View style={styles.overlay}>
        {/* Blue color theme for registration scan */}
        <FocusFrame color="#3B82F6" />

        <GuideOverlay
          step={step}
          statusMessage={statusMessage}
        />

        <LoadingOverlay isVisible={isProcessing} />

        {/* Floating Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorText: {
    color: "#FFF",
    fontSize: 16,
  },
  permissionButton: {
    padding: 15,
    backgroundColor: "#3B82F6",
    borderRadius: 10,
  },
  permissionText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    bottom: 50,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  backText: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 15,
  },
});