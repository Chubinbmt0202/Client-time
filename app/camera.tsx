import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";

export default function BasicCameraScreen() {
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();

  if (device == null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Không tìm thấy camera</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.text}>Ứng dụng cần quyền Camera</Text>
        <Text style={styles.linkText} onPress={requestPermission}>
          Cấp quyền Camera
        </Text>
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 20,
  },
  linkText: {
    color: "#1C75FF",
    fontSize: 18,
    fontWeight: "bold",
    padding: 10,
  },
});
