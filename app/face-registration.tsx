import React, { useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { useIsFocused, useFocusEffect } from "@react-navigation/native";

import { FocusFrame } from "../components/FaceRegistration/FocusFrame";
import { GuideOverlay } from "../components/FaceRegistration/GuideOverlay";
import { LoadingOverlay } from "../components/FaceRegistration/LoadingOverlay";
import { useFaceRegistration } from "../hooks/useFaceRegistration";

export default function FaceRegistrationScreen() {
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
        <FocusFrame />

        <GuideOverlay
          stepText={step === "DONE" ? "Hoàn tất" : `Bước: ${capturedImages.length + 1}/3`}
          statusMessage={statusMessage}
        />

        <LoadingOverlay isVisible={isProcessing} />
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
    backgroundColor: "#00FF00",
    borderRadius: 10,
  },
  permissionText: {
    color: "#000",
    fontWeight: "bold",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
});